#!/usr/bin/env node

// PM2 Production Start Wrapper - Windows Compatible
// Uses child_process to spawn Node with proper ES module support

const { spawn } = require('child_process');
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

// Spawn the production server with Node directly
const server = spawn('node', [path.join(__dirname, 'dist/index.js')], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'production' }
});

// Handle process termination
server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
