#!/usr/bin/env node
// Check if database and schema are already set up
// Exits with 0 if setup complete, 1 if setup needed

import pg from 'pg';

const { Client } = pg;

async function checkSetup() {
  const client = new Client({
    user: 'postgres',
    password: 'ABC123',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
  });

  try {
    await client.connect();

    // Check if billing_system database exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'billing_system'`
    );

    if (dbCheck.rows.length === 0) {
      console.log('DATABASE_NOT_FOUND');
      await client.end();
      process.exit(1);
    }

    // Connect to billing_system to check schema
    await client.end();
    
    const appClient = new Client({
      user: 'postgres',
      password: 'ABC123',
      host: 'localhost',
      port: 5432,
      database: 'billing_system',
    });

    await appClient.connect();

    // Check if key tables exist
    const tableCheck = await appClient.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'companies')
    `);

    if (tableCheck.rows[0].count < 2) {
      console.log('SCHEMA_NOT_COMPLETE');
      await appClient.end();
      process.exit(1);
    }

    console.log('SETUP_COMPLETE');
    await appClient.end();
    process.exit(0);
  } catch (error) {
    console.log('SETUP_ERROR');
    process.exit(1);
  }
}

checkSetup();
