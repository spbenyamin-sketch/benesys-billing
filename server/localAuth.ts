import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { logger } from "./logger";

// Max 10 login attempts per 15 minutes per IP
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

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
    logger.info("Sessions table ready");
  } catch (error) {
    logger.warn({ error }, "Could not ensure sessions table");
    // Don't fail startup - sessions might still work
  }
}

export function getSession() {
  // Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    if (process.env.NODE_ENV === "production") {
      logger.fatal("SESSION_SECRET env var is not set in production — exiting");
      process.exit(1);
    }
    logger.warn("SESSION_SECRET not set — using insecure dev fallback. Set it for production.");
  }
  
  const secret = sessionSecret || "dev-insecure-secret-change-in-production";
  const sessionTtl = 8 * 60 * 60 * 1000; // 8 hours
  const pgStore = connectPg(session);
  const isLocalDb = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
    ssl: (!isLocalDb && process.env.NODE_ENV === 'production') ? { rejectUnauthorized: false } : false,
  });
  // Enable secure cookies only in production with non-localhost (requires HTTPS)
  const shouldUseSecureCookies = process.env.NODE_ENV === 'production' && !isLocalDb;
  
  logger.info({ env: process.env.NODE_ENV, secureCookies: shouldUseSecureCookies }, "Session initialized");
  
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: shouldUseSecureCookies,
      sameSite: "lax",
      maxAge: sessionTtl,
      path: "/",
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
  app.post("/api/login", loginRateLimit, (req, res, next) => {
    if (!req.body?.username || !req.body?.password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        logger.error({ err }, "Authentication error");
        return res.status(500).json({ message: "Login error" });
      }
      if (!user) {
        logger.debug({ username: req.body?.username }, "Login failed — invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // Check company expiry for non-superadmin users
      if (user.role !== 'superadmin') {
        try {
          const userCompanies = await storage.getUserCompanies(user.id);
          const now = new Date();
          const hasValidCompany = userCompanies.some(uc => {
            const expiryDate = new Date(uc.company.expiryDate);
            return expiryDate > now;
          });

          if (!hasValidCompany) {
            logger.info({ username: user.username }, "Login denied — company license expired");
            return res.status(403).json({ message: "Company license has expired. Please recharge to login." });
          }
        } catch (error) {
          logger.error({ error }, "Error checking company expiry during login");
          return res.status(500).json({ message: "Error checking company status" });
        }
      }

      req.login(user, (err) => {
        if (err) {
          logger.error({ err }, "Session creation error");
          return res.status(500).json({ message: "Login error" });
        }
        logger.info({ username: user.username }, "Login successful");
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

}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const isAuth = req.isAuthenticated();
  if (!isAuth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // For non-superadmin users, check if their company has expired
  const user = req.user as any;
  if (user?.role !== 'superadmin') {
    try {
      const userCompanies = await storage.getUserCompanies(user.id);
      const now = new Date();
      const hasValidCompany = userCompanies.some(uc => {
        const expiryDate = new Date(uc.company.expiryDate);
        return expiryDate > now;
      });
      
      if (!hasValidCompany) {
        logger.info({ username: user.username }, "Session rejected — company license expired");
        req.logout((err) => {
          if (err) {
            logger.error({ err }, "Error logging out expired user");
          }
          return res.status(403).json({ 
            message: "Company license has expired. Please recharge to login.",
            expired: true 
          });
        });
        return;
      }
    } catch (error) {
      logger.error({ error }, "Error checking company expiry in session middleware");
      // Allow access even if check fails - don't block legitimate users
      return next();
    }
  }
  
  return next();
};
