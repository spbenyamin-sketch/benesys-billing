import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

export async function ensureSessionsTable() {
  try {
    const { pool } = await import("./db");
    // Create sessions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        PRIMARY KEY (sid)
      ) WITH (OIDS=FALSE);
      
      CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" on "sessions" ("expire");
    `);
    console.log("✅ Sessions table ready");
  } catch (error) {
    console.error("⚠️  Warning: Could not ensure sessions table:", error);
    // Don't fail startup - sessions might still work
  }
}

export function getSession() {
  // Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: SESSION_SECRET environment variable is required in production");
      process.exit(1);
    }
    // Development fallback with warning
    console.warn("⚠️  WARNING: SESSION_SECRET not set. Using insecure fallback for development only.");
    console.warn("⚠️  Set SESSION_SECRET environment variable for production deployment.");
  }
  
  const secret = sessionSecret || "dev-insecure-secret-change-in-production";
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  // Ensure sessions table exists first
  await ensureSessionsTable();
  
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(null, false);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout error" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Check auth status
  app.get("/api/check-setup", async (req, res) => {
    try {
      const needsSetup = await storage.needsInitialSetup();
      res.json({ needsSetup });
    } catch (error) {
      res.status(500).json({ message: "Error checking setup status" });
    }
  });

  // Initial setup route (create first admin user)
  app.post("/api/setup", async (req, res) => {
    try {
      const needsSetup = await storage.needsInitialSetup();
      
      if (!needsSetup) {
        return res.status(400).json({ message: "Setup already completed" });
      }

      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        passwordHash,
        role: "admin",
        firstName: "Admin",
        lastName: "User",
      });

      // Auto-login after setup
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Setup successful but login failed" });
        }
        return res.json({ user });
      });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ message: "Setup failed" });
    }
  });

  // Reset database (clear all users to force setup again)
  app.post("/api/reset-db", async (req, res) => {
    try {
      const { pool } = await import("./db");
      await pool.query("DELETE FROM users;");
      await pool.query("DELETE FROM sessions;");
      console.log("✅ Database reset - setup required");
      res.json({ message: "Database reset successfully. Please run setup again." });
    } catch (error) {
      console.error("Reset error:", error);
      res.status(500).json({ message: "Reset failed" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
