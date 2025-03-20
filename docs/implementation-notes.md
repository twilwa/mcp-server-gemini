# Implementation Notes

## Overview

This MCP server implements the Model Context Protocol for Google's Gemini API. It provides a standardized way for Claude Desktop to interact with Gemini models, including support for text generation and interleaved image generation.

## Supported Models

1. **gemini-pro**: Standard text generation model
2. **gemini-2.0-flash-exp-image-generation**: Text and image generation model with interleaved content support

## Protocol Implementation

### Initialization Flow
```typescript
// Client sends initialize request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize"
}

// Server responds with capabilities
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "experimental": {
        "imageGeneration": true,
        "interleaved": true
      },
      // Other capabilities
    }
  }
}
```

### Content Generation
```typescript
// Client sends text generation request
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "generate",
  "params": {
    "prompt": "Hello, world!",
    "model": "gemini-pro"
  }
}

// Server responds with generated text
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "type": "completion",
    "content": "Generated text...",
    "contentType": "text",
    "metadata": {
      "model": "gemini-pro",
      "provider": "google"
    }
  }
}
```

### Image Generation
```typescript
// Client sends image generation request
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "generate",
  "params": {
    "prompt": "A cat wearing a top hat",
    "model": "gemini-2.0-flash-exp-image-generation",
    "responseModalities": ["Text", "Image"]
  }
}

// Server responds with interleaved content
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "type": "completion",
    "contentType": "mixed",
    "content": [
      { "text": "Here's an image of a cat wearing a top hat:" },
      { 
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64EncodedImageData..."
        }
      },
      { "text": "The image shows a cat with a black top hat perched on its head." }
    ],
    "metadata": {
      "model": "gemini-2.0-flash-exp-image-generation",
      "provider": "google"
    }
  }
}
```

## Key Components

1. WebSocket Server
   - Handles client connections
   - Manages message routing
   - Implements protocol lifecycle

2. Gemini Integration
   - Multiple model support
   - Content generation
   - Image generation
   - Error handling

3. Message Processing
   - JSON-RPC parsing
   - Protocol validation
   - Response formatting
   - Mixed content handling

## Security Considerations

1. API Key Handling
   - Environment variables only
   - No logging of sensitive data
   - Secure key rotation support

2. Input Validation
   - Request format validation
   - Parameter sanitization
   - Error boundary handling

## Performance

1. Connection Management
   - Single WebSocket connection
   - Efficient message routing
   - Resource cleanup

2. Error Handling
   - Graceful error recovery
   - Detailed error messages
   - Proper status codes

## Interleaved Content Handling

The server can return mixed content (text and images) in a single response:

1. **Content Parts**: Each response can contain multiple content parts, each being either text or an inline image.
2. **Inline Data**: Images are returned as base64-encoded data with appropriate MIME types.
3. **Content Type**: Responses include a `contentType` field indicating whether the content is plain text or mixed.

Claude Desktop knows how to interpret these mixed content responses and render them appropriately with text and inline images.
