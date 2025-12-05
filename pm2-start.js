#!/usr/bin/env node

// PM2 Production Start Wrapper - Windows Compatible
// Uses dynamic import for ES module support

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

// Set default PORT if not already set
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

// Dynamic import to load ES module
import('./dist/index.js')
  .then(() => {
    // Server started successfully
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
