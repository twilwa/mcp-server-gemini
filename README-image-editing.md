# MCP Image Editing Test

This server now supports image editing via the MCP protocol! This means you can send images to the server along with a text prompt, and the Gemini model will process and potentially modify the image.

## Testing Image Editing

To test the image editing capability:

1. **Prepare an image**: Use the provided `gemini-native-image.png` in the root directory of the project, or place another image file there.

2. **Run the test client in edit mode**:
   ```bash
   ./start-simple-client.sh edit
   ```

3. **Check the results**: If successful, a new image file will be created in the current directory with the edited version of your image.

## How It Works

The client sends a request with both text and image data:

```json
{
  "method": "generate",
  "params": {
    "prompt": {
      "text": "Transform this image to add a sunset in the background",
      "images": [
        {
          "data": "BASE64_IMAGE_DATA",
          "mimeType": "image/jpeg"
        }
      ]
    },
    "model": "gemini-1.5-pro-vision",
    "responseModalities": ["Text", "Image"]
  }
}
```

The server processes this multimodal request and returns a response with both text and possibly an edited image.

## Supported Image Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

## Compatible MCP Clients

The following MCP clients can use this image editing capability:

- Claude Desktop
- Cursor
- Cline
- Any client that supports the MCP multimodal content format 