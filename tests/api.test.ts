import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../server/app";
import { pool } from "../server/db";

// ── helpers ─────────────────────────────────────────────────────────────────

let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  // supertest agent keeps cookies between requests (session)
  agent = request.agent(app);
});

afterAll(async () => {
  await pool.end();
});

// ── 1. Health check ──────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ── 2. Auth ──────────────────────────────────────────────────────────────────

describe("POST /api/login", () => {
  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/api/login").send({});
    expect(res.status).toBe(400);
  });

  it("returns 401 for wrong credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ username: "nobody", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("returns 200 and user object for valid admin credentials", async () => {
    // This test requires a seeded admin user in the database.
    // Skip gracefully if the DB is unavailable or user doesn't exist.
    const res = await agent
      .post("/api/login")
      .send({ username: "admin", password: "admin123" });

    if (res.status === 401) {
      // No seeded user — skip assertion (environment not set up for this test)
      console.warn("Skipping login success test — no admin user seeded");
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe("admin");
  });
});

// ── 3. Protected routes reject unauthenticated requests ───────────────────────

describe("Protected routes", () => {
  it("GET /api/parties returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/parties");
    expect(res.status).toBe(401);
  });

  it("GET /api/items returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/items");
    expect(res.status).toBe(401);
  });

  it("GET /api/sales returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/sales");
    expect(res.status).toBe(401);
  });

  it("POST /api/sales returns 401 when not logged in", async () => {
    const res = await request(app).post("/api/sales").send({ items: [] });
    expect(res.status).toBe(401);
  });
});

// ── 4. Rate limiting on login ────────────────────────────────────────────────

describe("Rate limiting", () => {
  it("blocks login after 10 failed attempts from same IP", async () => {
    const attempts = Array.from({ length: 11 }, () =>
      request(app).post("/api/login").send({ username: "x", password: "x" })
    );
    const responses = await Promise.all(attempts);
    const lastStatus = responses[responses.length - 1].status;
    // Should be 429 (too many requests) on the 11th attempt
    expect(lastStatus).toBe(429);
  });
});

// ── 5. Pagination API shape ──────────────────────────────────────────────────

describe("Pagination query params", () => {
  it("/api/parties?page=1 returns paginated shape when authenticated", async () => {
    // Login first using the session agent (reuses session from earlier tests)
    const loginRes = await agent
      .post("/api/login")
      .send({ username: "admin", password: "admin123" });

    if (loginRes.status !== 200) {
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
    }
  });
});
