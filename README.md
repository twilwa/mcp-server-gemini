# Gemini MCP Server

Model Context Protocol (MCP) server implementation that enables Claude Desktop to interact with Google's Gemini AI models.

## Features

- Full MCP protocol support
- Real-time response streaming
- Secure API key handling
- Configurable model parameters
- TypeScript implementation
- **Interleaved image generation support**

## Models Supported


2. **gemini-1.5-flash-latest**: Text and image generation model (latest official name)
3. **gemini-2.0-flash-exp-image-generation**: Legacy name for image generation support

## Quick Start

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Configure Claude Desktop**
   - Locate your config file:
     ```
     Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
     Windows: %APPDATA%\Claude\claude_desktop_config.json
     Linux: ~/.config/Claude/claude_desktop_config.json
     ```
   - Add Gemini configuration:
     ```json
     {
       "mcpServers": {
         "gemini": {
           "command": "npx",
           "args": ["-y", "github:aliargun/mcp-server-gemini"],
           "env": {
             "GEMINI_API_KEY": "your_api_key_here",
             "DEBUG": "true",
             "TEXT_MODEL": "gemini-1.5-flash",
             "IMAGE_MODEL": "gemini-1.5-flash-latest",
             "DEFAULT_MODEL": "gemini-1.5-flash"
           }
         }
       }
     }
     ```

3. **Restart Claude Desktop**

## Environment Variables

This server supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `PORT` | Port to run the server on | `3005` |
| `DEBUG` | Enable debug logging | `false` |
| `TEXT_MODEL` | Text generation model name | `gemini-1.5-flash` |
| `IMAGE_MODEL` | Image generation model name | `gemini-1.5-flash-latest` |
| `DEFAULT_MODEL` | Default model used when not specified | `gemini-1.5-flash` |

## Image Generation Examples

To generate images with text, specify the image generation model:

```json
{
  "method": "generate",
  "params": {
    "prompt": "Create an image of a futuristic city with flying cars",
    "model": "gemini-1.5-flash-latest"
  }
}
```

You can also explicitly set response modalities:

```json
{
  "method": "generate",
  "params": {
    "prompt": "Create an image of a fluffy cat",
    "model": "gemini-2.0-flash-exp-image-generation",
    "responseModalities": ["Text", "Image"]
  }
}
```

## Documentation

- [Claude Desktop Setup Guide](docs/claude-desktop-setup.md) - Detailed setup instructions
- [Examples and Usage](docs/examples.md) - Usage examples and advanced configuration
- [Implementation Notes](docs/implementation-notes.md) - Technical implementation details
- [Development Guide](docs/development-guide.md) - Guide for developers
- [Troubleshooting Guide](docs/troubleshooting.md) - Common issues and solutions

## Local Development

```bash
# Clone repository
git clone https://github.com/aliargun/mcp-server-gemini.git
cd mcp-server-gemini

# Install dependencies
npm install

# Start development server
npm run dev
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## Common Issues

1. **Connection Issues**
   - Check if port 3005 is available
   - Verify internet connection
   - See [Troubleshooting Guide](docs/troubleshooting.md)

2. **API Key Problems**
   - Verify API key is correct
   - Check permissions
   - See [Setup Guide](docs/claude-desktop-setup.md)

## Security

- API keys are handled via environment variables only
- No sensitive data is logged or stored
- Regular security updates

## License

MIT