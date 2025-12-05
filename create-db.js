#!/usr/bin/env node
// Simple Node.js script to create PostgreSQL database
// Uses pg driver that's already installed

const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    user: 'postgres',
    password: 'ABC123',
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to postgres to create new database
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected!');

    console.log('Creating database: billing_system');
    await client.query('CREATE DATABASE IF NOT EXISTS billing_system');
    console.log('✓ Database created successfully!');

    await client.end();
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Database already exists');
      await client.end();
      process.exit(0);
    }
    console.error('✗ ERROR:', error.message);
    process.exit(1);
  }
}

createDatabase();
