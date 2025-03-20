#!/usr/bin/env node
import 'dotenv/config';
import { MCPServer } from './server.js';

// Get API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const port = Number.parseInt(process.env.PORT || '3005', 10);

// Start the server
console.log(`Starting MCP server on port ${port}`);
console.log(`Debug mode: ${process.env.DEBUG === 'true' ? 'enabled' : 'disabled'}`);
console.log('Press Ctrl+C to stop the server');

// Note: Debug is handled internally by the MCPServer class
new MCPServer(apiKey, port);
