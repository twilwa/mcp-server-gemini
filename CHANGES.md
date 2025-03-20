# MCP Server Interleaved Image Generation Support

## Overview of Changes

We've implemented support for Gemini's interleaved image generation capabilities in the MCP server. This allows Claude Desktop to request image generation through the MCP protocol and receive both text and images in a single response.

## Key Changes

### 1. Type Definitions
- Added `InlineData` and `ContentPart` interfaces for representing mixed content (text and images)
- Extended request interfaces to support model selection and response modalities
- Added content type indicators to track whether responses contain text-only or mixed content
- Created proper typing for protocol manager interface

### 2. Model Support
- Added support for the `gemini-2.0-flash-exp-image-generation` model
- Implemented multi-model selection through the API request parameters
- Updated server initialization to create both text and image models

### 3. Server Capabilities
- Added experimental capabilities: `imageGeneration` and `interleaved`
- Updated protocol initialization to advertise these capabilities
- Implemented proper content type detection and handling

### 4. Request Processing
- Added model selection in request handlers
- Updated parameter handling to support responseModalities 
- Made handlers backwards compatible for text-only requests

### 5. Response Handling
- Implemented processing of interleaved content from Gemini API
- Added support for base64-encoded images in responses
- Updated the streaming handler to support both text and images

### 6. Documentation
- Updated README with information about image generation
- Added examples of using image generation in the documentation
- Added implementation notes for interleaved content

## Implementation Details

### Server Initialization
The server now creates two models at initialization:
- `gemini-1.5-flash` for text generation
- `gemini-2.0-flash-exp-image-generation` for image generation

### Model Selection
Models can be selected via the `model` parameter in requests:
```json
{
  "method": "generate",
  "params": {
    "prompt": "Create an image of a futuristic city with flying cars",
    "model": "gemini-2.0-flash-exp-image-generation"
  }
}
```

### Response Format
For image generation, responses now use a mixed content format:
```json
{
  "result": {
    "type": "completion",
    "contentType": "mixed",
    "content": [
      { "text": "Here's an image of a futuristic city:" },
      { 
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64EncodedImageData..."
        }
      },
      { "text": "As you can see, the city features flying cars..." }
    ]
  }
}
```

### Streaming
Streaming support has been updated to emit mixed content chunks, allowing real-time rendering of both text and images in Claude Desktop.

## Technical Notes
- The implementation preserves backward compatibility with text-only requests
- All image data includes SynthID watermarking from Google
- Error handling has been enhanced to properly report image generation issues
- The protocol manager interface now supports capabilities discovery

## Testing
To test image generation:
1. Ensure your Gemini API key has access to the image generation model
2. Configure Claude Desktop to use the MCP server
3. Request an image by specifying the image generation model
4. Verify that both text and images are displayed in Claude Desktop 