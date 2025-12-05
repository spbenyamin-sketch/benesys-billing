#!/usr/bin/env node

// Production startup script for PM2
process.env.NODE_ENV = 'production';

require('./dist/index.js');
