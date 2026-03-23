import "dotenv/config";
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { logger } from "./logger";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,                      // max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost') && !process.env.DATABASE_URL?.includes('127.0.0.1')) ? { rejectUnauthorized: false } : false,
});

// Handle pool connection errors
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle DB client');
});

export const db = drizzle({ client: pool, schema });

// Run migrations automatically on startup
export async function runMigrations() {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    
    const migrationsPath = path.resolve(process.cwd(), './migrations');
    const migrationsFolderExists = fs.existsSync(migrationsPath);
    
    if (!migrationsFolderExists) {
      logger.info('No migrations folder found — schema created on first use');
      try {
        await db.execute('SELECT 1');
        logger.info('Database connection verified');
      } catch (dbError) {
        logger.error({ err: dbError }, 'Database connection failed');
        throw dbError;
      }
      return;
    }

    logger.info('Running database migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    logger.info('Migrations completed successfully');
  } catch (error: any) {
    logger.warn({ msg: error.message }, 'Migration warning — continuing startup');
  }
}
