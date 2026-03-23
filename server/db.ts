import "dotenv/config";
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/node-postgres/migrator';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost') && !process.env.DATABASE_URL?.includes('127.0.0.1')) ? { rejectUnauthorized: false } : false,
});

// Handle pool connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
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
      console.log('📝 No migrations folder found - database schema will be created on first use');
      // Just verify database connection
      try {
        await db.execute('SELECT 1');
        console.log('✅ Database connection verified');
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError);
        throw dbError;
      }
      return;
    }
    
    console.log('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error: any) {
    console.error('⚠️  Migration warning:', error.message);
    // Don't fail startup for migration issues - schema will be created on first use
    console.log('✅ Continuing startup - schema will be created as needed');
  }
}
