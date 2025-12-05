#!/usr/bin/env node

// PM2 Production Start Wrapper - Windows Compatible
// Ensures proper environment setup for production server

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

// Set default PORT if not already set
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

// Load .env file if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using environment variables');
}

// Start the production server
// The server will bind to 0.0.0.0:5000 for all interfaces
require('./dist/index.js');
