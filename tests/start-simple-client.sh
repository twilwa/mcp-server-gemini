#!/bin/bash
echo "Starting simple MCP client (no SDK dependency)..."
# Use node if available, or try pnpm
if command -v node &> /dev/null; then
  node simple-mcp-client.js
elif command -v pnpm &> /dev/null; then
  pnpm exec node simple-mcp-client.js
else
  echo "Error: Neither node nor pnpm are available. Please ensure Node.js is installed."
  exit 1
fi 