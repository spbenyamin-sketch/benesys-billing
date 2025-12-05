#!/usr/bin/env node
// Simple Node.js script to create PostgreSQL database
// Uses ES modules with import syntax

import pg from 'pg';

const { Client } = pg;

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
    try {
      // Try to create database (PostgreSQL doesn't support IF NOT EXISTS for CREATE DATABASE)
      await client.query('CREATE DATABASE billing_system');
      console.log('✓ Database created successfully!');
    } catch (createError) {
      // Check if database already exists (error code 42P04)
      if (createError.code === '42P04') {
        console.log('✓ Database already exists (OK)');
      } else {
        throw createError;
      }
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ ERROR:', error.message);
    process.exit(1);
  }
}

createDatabase();
