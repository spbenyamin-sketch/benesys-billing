#!/usr/bin/env node

// Production startup script for PM2
// Sets environment and imports the production server

process.env.NODE_ENV = 'production';

// Add dotenv to load .env file
import('dotenv').then(dotenv => {
  dotenv.default.config();
}).catch(() => {
  console.log('dotenv not available, continuing without .env');
});

// Import and start the server
import('./dist/index.js').then(() => {
  console.log('✓ Application started successfully');
}).catch((error) => {
  console.error('✗ Failed to start application:');
  console.error(error);
  process.exit(1);
});
