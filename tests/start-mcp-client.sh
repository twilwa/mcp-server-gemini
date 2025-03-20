#!/bin/bash
echo "Starting MCP test client with the MCP SDK..."
# Use node if available, or try pnpm
if command -v node &> /dev/null; then
  node mcp-test-client.js
elif command -v pnpm &> /dev/null; then
  pnpm exec node mcp-test-client.js
else
  echo "Error: Neither node nor pnpm are available. Please ensure Node.js is installed."
  exit 1
fi 