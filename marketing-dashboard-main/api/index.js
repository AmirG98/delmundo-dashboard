/**
 * Vercel Serverless Function Entry Point
 * This file handles all API requests in Vercel's serverless environment
 */

// Load environment variables
require('dotenv').config();

// Use tsx to load TypeScript files
require('tsx/cjs');

// Import the Express app
const { createApp } = require('../server/_core/app.ts');

// Create the Express app
const app = createApp();

// Export for Vercel
module.exports = app;
