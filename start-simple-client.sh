#!/bin/bash
echo "Starting simple MCP client (no SDK dependency)..."

# Check if we want to run in image edit mode
if [ "$1" == "edit" ]; then
  echo "Running in IMAGE EDITING mode"
  export TEST_MODE=edit
else
  echo "Running in IMAGE GENERATION mode"
  export TEST_MODE=generate
fi

# Try running with node directly
if command -v node &> /dev/null; then
  node simple-mcp-client.js
# Or try using pnpm
elif command -v pnpm &> /dev/null; then
  pnpm exec node simple-mcp-client.js
# Or try using npm
elif command -v npm &> /dev/null; then
  npm exec -- node simple-mcp-client.js
else
  echo "Error: Could not find node, pnpm, or npm. Please ensure Node.js is installed."
  exit 1
fi 