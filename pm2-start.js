#!/usr/bin/env node

// PM2 Production Start Wrapper - Windows Compatible
// This wrapper properly loads the production server with NODE_ENV set

process.env.NODE_ENV = 'production';

// Load environment variables
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch (e) {
  console.log('dotenv not available, skipping .env loading');
}

// Start the production server
require('./dist/index.js');
