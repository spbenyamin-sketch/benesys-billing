import { type Server } from "node:http";

import compression from "compression";
import helmet from "helmet";
import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

// ── CSRF protection ───────────────────────────────────────────────────────────
// Verifies that mutating requests (POST/PUT/PATCH/DELETE) originate from the
// same host.  Cross-origin requests from malicious sites carry a different
// Origin header, so this blocks forged submissions without any token round-trip.
function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  // Public endpoints that must work before a session exists
  const publicPaths = ["/api/login", "/api/logout", "/api/health", "/api/check-setup", "/api/setup"];
  if (publicPaths.some(p => req.path === p || req.path.startsWith("/api/setup"))) return next();

  const host = req.headers.host;
  if (!host) return next(); // can't validate — allow (no host = internal request)

  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;

  let reqHost: string | null = null;
  if (origin) {
    try { reqHost = new URL(origin).host; } catch { /* ignore */ }
  } else if (referer) {
    try { reqHost = new URL(referer).host; } catch { /* ignore */ }
  }

  // If we can determine the request host and it doesn't match — reject
  if (reqHost && reqHost !== host) {
    return res.status(403).json({ message: "Invalid request origin" });
  }

  next();
}

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
const isProd = process.env.NODE_ENV === "production";
// Set SECURE_COOKIES=true when running behind an HTTPS proxy (web server).
// Leave unset for plain HTTP local deployments.
const isHttps = process.env.SECURE_COOKIES === "true";

if (isProd && !process.env.SESSION_SECRET) {
  // Must use process.stderr before logger is wired up
  process.stderr.write("FATAL: SESSION_SECRET env var is not set in production. Exiting.\n");
  process.exit(1);
}

app.use(helmet({
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          workerSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          // upgrade-insecure-requests: enabled on HTTPS web, disabled on HTTP local
          ...(isHttps ? {} : { upgradeInsecureRequests: null }),
        },
      }
    : false, // dev: CSP off for Vite HMR
  // HSTS: enabled on HTTPS web (1 year), disabled on HTTP local
  strictTransportSecurity: isHttps
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  crossOriginOpenerPolicy: false, // disable COOP — causes browser warnings over plain HTTP
}));
app.use(compression());
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(csrfProtection);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Production: Bind to 0.0.0.0 to accept connections from all interfaces
  // This is required for PM2 on Windows to work properly
  server.listen(port, '0.0.0.0', () => {
    log(`serving on http://0.0.0.0:${port}`);
  });

  // Keep HTTP connections alive to avoid reconnect overhead on every request
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Graceful shutdown — drain in-flight requests before exiting.
  // Railway sends SIGTERM before restarting; without this, active DB writes
  // get killed mid-transaction and users see errors on legitimate saves.
  const shutdown = () => {
    log("Received shutdown signal — closing server gracefully");
    server.close(async () => {
      const { pool } = await import("./db");
      await pool.end();
      log("Server closed — exiting");
      process.exit(0);
    });

    // Force-exit after 10 s if requests are stuck
    setTimeout(() => {
      log("Graceful shutdown timeout — forcing exit");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
