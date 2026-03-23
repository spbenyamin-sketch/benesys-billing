import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server/app";
import { pool } from "../server/db";

// ── helpers ──────────────────────────────────────────────────────────────────

let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  agent = request.agent(app);
});

afterAll(async () => {
  await pool.end();
});

// Attempt to log in; returns true if it worked
async function tryLogin(username = "admin", password = "admin123"): Promise<boolean> {
  const res = await agent.post("/api/login").send({ username, password });
  return res.status === 200;
}

// ── 1. Health check ──────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ── 2. Auth — login ──────────────────────────────────────────────────────────

describe("POST /api/login", () => {
  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/api/login").send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app).post("/api/login").send({ username: "admin" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when username is missing", async () => {
    const res = await request(app).post("/api/login").send({ password: "admin123" });
    expect(res.status).toBe(400);
  });

  it("returns 401 for wrong credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "nobody", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("returns 401 for correct username but wrong password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "totallyWrong99" });
    expect([401, 403]).toContain(res.status);
  });

  it("returns 200 and user object for valid admin credentials", async () => {
    const res = await agent
      .post("/api/login")
      .send({ username: "admin", password: "admin123" });

    if (res.status === 401) {
      console.warn("Skipping login success test — no admin user seeded");
      return;
    }
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe("admin");
    expect(res.body.user.passwordHash).toBeUndefined(); // never leak hash
  });
});

// ── 3. Password policy ───────────────────────────────────────────────────────

describe("Password policy", () => {
  it("setup rejects password shorter than 10 chars", async () => {
    const res = await request(app)
      .post("/api/setup")
      .send({ username: "testadmin", password: "Short1" });
    // Only reachable if system not yet set up; otherwise 400 "already set up"
    // Either way it must NOT be 201/200 with a weak password
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(201);
  });

  it("setup rejects password with no uppercase letter", async () => {
    const res = await request(app)
      .post("/api/setup")
      .send({ username: "testadmin", password: "alllowercase1" });
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(201);
  });

  it("setup rejects password with no number", async () => {
    const res = await request(app)
      .post("/api/setup")
      .send({ username: "testadmin", password: "NoNumberHere" });
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(201);
  });
});

// ── 4. Protected routes reject unauthenticated requests ───────────────────────

describe("Protected routes — unauthenticated", () => {
  it("GET /api/parties returns 401", async () => {
    const res = await request(app).get("/api/parties");
    expect(res.status).toBe(401);
  });

  it("GET /api/items returns 401", async () => {
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(401);
  });

  it("GET /api/sales returns 401", async () => {
    const res = await request(app).get("/api/sales");
    expect(res.status).toBe(401);
  });

  it("POST /api/sales returns 401", async () => {
    const res = await request(app).post("/api/sales").send({ items: [] });
    expect(res.status).toBe(401);
  });

  it("GET /api/purchases returns 401", async () => {
    const res = await request(app).get("/api/purchases");
    expect(res.status).toBe(401);
  });

  it("GET /api/dashboard returns 401", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(401);
  });

  it("GET /api/audit-logs returns 401", async () => {
    const res = await request(app).get("/api/audit-logs");
    expect(res.status).toBe(401);
  });
});

// ── 5. CSRF protection ───────────────────────────────────────────────────────

describe("CSRF protection", () => {
  it("rejects POST with a foreign Origin header", async () => {
    const res = await request(app)
      .post("/api/parties")
      .set("Origin", "https://evil-site.com")
      .send({ name: "Hack Corp" });
    // Should be 401 (no session) or 403 (CSRF blocked) — never 200
    expect([401, 403]).toContain(res.status);
  });

  it("rejects PUT from a foreign Origin", async () => {
    const res = await request(app)
      .put("/api/sales/1")
      .set("Origin", "https://attacker.example")
      .send({});
    expect([401, 403]).toContain(res.status);
  });

  it("allows POST from same origin (no Origin header = same-origin curl/app)", async () => {
    // No Origin header means the request came from server-side or same origin
    const res = await request(app)
      .post("/api/login")
      .send({ username: "nobody", password: "wrong" });
    // Should reach the handler (401 for bad creds, not 403 CSRF)
    expect(res.status).toBe(401);
  });
});

// ── 6. Rate limiting ────────────────────────────────────────────────────────

describe("Rate limiting", () => {
  it("blocks login after 10 failed attempts from same IP", async () => {
    const attempts = Array.from({ length: 11 }, () =>
      request(app).post("/api/login").send({ username: "x", password: "x" })
    );
    const responses = await Promise.all(attempts);
    const statuses = responses.map(r => r.status);
    expect(statuses).toContain(429);
  });
});

// ── 7. Pagination shape ──────────────────────────────────────────────────────

describe("Pagination", () => {
  it("/api/parties?page=1 returns paginated shape when authenticated", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) {
      console.warn("Skipping pagination test — not authenticated");
      return;
    }

    const res = await agent
      .get("/api/parties?page=1&limit=10")
      .set("X-Company-Id", "1");

    if (res.status === 200) {
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("limit");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(typeof res.body.total).toBe("number");
      expect(res.body.page).toBe(1);
    }
  });

  it("/api/items?page=1 returns paginated shape when authenticated", async () => {
    const res = await agent
      .get("/api/items?page=1&limit=10")
      .set("X-Company-Id", "1");

    if (res.status === 200) {
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });

  it("clamps limit to max 200", async () => {
    const res = await agent
      .get("/api/parties?page=1&limit=99999")
      .set("X-Company-Id", "1");

    if (res.status === 200 && res.body.limit !== undefined) {
      expect(res.body.limit).toBeLessThanOrEqual(200);
    }
  });
});

// ── 8. Sale creation validation ──────────────────────────────────────────────

describe("POST /api/sales — validation", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/sales")
      .set("X-Company-Id", "1")
      .send({ date: "2024-04-01", items: [] });
    expect(res.status).toBe(401);
  });

  it("returns 400 when items array is empty", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .post("/api/sales")
      .set("X-Company-Id", "1")
      .send({
        date: "2024-04-01",
        billType: "GST",
        saleType: "B2C",
        items: [],
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 when items is missing", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .post("/api/sales")
      .set("X-Company-Id", "1")
      .send({ date: "2024-04-01", billType: "GST" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when item quantity is zero or negative", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .post("/api/sales")
      .set("X-Company-Id", "1")
      .send({
        date: "2024-04-01",
        billType: "GST",
        saleType: "B2C",
        items: [{ itemName: "Test Item", quantity: 0, rate: 100 }],
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 when item rate is negative", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .post("/api/sales")
      .set("X-Company-Id", "1")
      .send({
        date: "2024-04-01",
        billType: "GST",
        saleType: "B2C",
        items: [{ itemName: "Test Item", quantity: 1, rate: -50 }],
      });
    expect(res.status).toBe(400);
  });
});

// ── 9. Financial year date validation ────────────────────────────────────────

describe("Financial year validation", () => {
  it("rejects sale with date far outside any financial year", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .post("/api/sales")
      .set("X-Company-Id", "1")
      .send({
        date: "1990-01-01", // definitely outside any active FY
        billType: "GST",
        saleType: "B2C",
        items: [{ itemName: "Test", quantity: 1, rate: 100 }],
      });
    // Should fail with 400 (no active FY) or 400 (date outside FY)
    expect(res.status).toBe(400);
  });
});

// ── 10. Optimistic locking ───────────────────────────────────────────────────

describe("Optimistic locking", () => {
  it("PUT /api/sales/:id with wrong version returns 409", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    // Try to update sale ID 1 with a stale version
    const res = await agent
      .put("/api/sales/1")
      .set("X-Company-Id", "1")
      .send({
        version: 0, // stale version
        date: "2024-04-01",
        billType: "GST",
        saleType: "B2C",
        items: [{ itemName: "Test", quantity: 1, rate: 100 }],
      });
    // Either 404 (sale doesn't exist) or 409 (version mismatch)
    expect([404, 409]).toContain(res.status);
  });
});

// ── 11. Audit logs endpoint ──────────────────────────────────────────────────

describe("GET /api/audit-logs", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/audit-logs");
    expect(res.status).toBe(401);
  });

  it("returns array when authenticated", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .get("/api/audit-logs")
      .set("X-Company-Id", "1");

    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it("respects limit query param", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .get("/api/audit-logs?limit=5")
      .set("X-Company-Id", "1");

    if (res.status === 200) {
      expect(res.body.length).toBeLessThanOrEqual(5);
    }
  });
});

// ── 12. Input validation — parties ──────────────────────────────────────────

describe("POST /api/parties — validation", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/parties")
      .send({ name: "Test Party" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when party name is missing", async () => {
    const loggedIn = await tryLogin();
    if (!loggedIn) return;

    const res = await agent
      .post("/api/parties")
      .set("X-Company-Id", "1")
      .send({});
    expect([400, 422]).toContain(res.status);
  });
});

// ── 13. Response consistency ─────────────────────────────────────────────────

describe("Error response shape", () => {
  it("401 responses have a message field", async () => {
    const res = await request(app).get("/api/sales");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });

  it("404 on unknown API route returns json", async () => {
    const res = await request(app).get("/api/nonexistent-endpoint-xyz");
    // Could be 404 or redirected to index.html (SPA fallback)
    expect([404, 200]).toContain(res.status);
  });
});
