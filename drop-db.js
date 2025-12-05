#!/usr/bin/env node
// Drop and recreate PostgreSQL database
// Uses ES modules with import syntax

import pg from 'pg';

const { Client } = pg;

async function dropDatabase() {
  const client = new Client({
    user: 'postgres',
    password: 'ABC123',
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to postgres to drop/create
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected!');

    // Terminate all connections to billing_system database
    console.log('Terminating all connections to billing_system...');
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'billing_system'
      AND pid <> pg_backend_pid();
    `);

    // Drop database
    console.log('Dropping database: billing_system');
    try {
      await client.query('DROP DATABASE billing_system');
      console.log('✓ Database dropped');
    } catch (dropError) {
      if (dropError.code === '3D000') {
        console.log('✓ Database does not exist (OK)');
      } else {
        throw dropError;
      }
    }

    // Create fresh database
    console.log('Creating fresh database: billing_system');
    await client.query('CREATE DATABASE billing_system');
    console.log('✓ Database created successfully!');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ ERROR:', error.message);
    process.exit(1);
  }
}

dropDatabase();
