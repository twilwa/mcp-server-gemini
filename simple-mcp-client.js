import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

console.log('Starting simple MCP client (no SDK dependency)');

// Connect to the MCP server
const ws = new WebSocket('ws://localhost:3005');

// Track state
let initialized = false;
let requestId = 1;

// Helper to create unique request IDs
const getNextId = () => requestId++;

// Set up event handlers
ws.on('open', () => {
  console.log('Connected to MCP server');
  
  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: getNextId(),
    method: 'initialize'
  };
  console.log('Sending initialize request:', JSON.stringify(initRequest, null, 2));
  ws.send(JSON.stringify(initRequest));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('Received message:', message);
    
    // Handle server notifications
    if (!message.id && message.method) {
      console.log(`Received notification: ${message.method}`);
      return;
    }
    
    // After initialization is complete
    if (!initialized && message.result && 'capabilities' in message.result) {
      initialized = true;
      console.log('\nServer initialized successfully');
      console.log('Server capabilities:', JSON.stringify(message.result.capabilities, null, 2));
      
      // Choose which test to run
      const testToRun = process.env.TEST_MODE || 'generate';
      
      if (testToRun === 'edit') {
        // Run image editing test
        console.log('\nWaiting 2 seconds before sending image editing request...');
        setTimeout(sendImageEditRequest, 2000);
      } else {
        // Run image generation test
        console.log('\nWaiting 2 seconds before sending image generation request...');
        setTimeout(sendImageGenerationRequest, 2000);
      }
      return;
    }
    
    // Handle image editing response
    if (message.id === 4 && message.result) {
      console.log('Received response:', JSON.stringify(message, null, 2));
      
      if (message.result.contentType === 'text') {
        console.log('\nText content:');
        console.log(message.result.content);
      }
      
      // Check if response has mixed content with images
      if (message.result.contentType === 'mixed' && Array.isArray(message.result.content)) {
        console.log('\nMixed content detected with', message.result.content.length, 'parts');
        
        // Process each content part
        message.result.content.forEach((part, index) => {
          if (part.text) {
            console.log(`Text part ${index}:`, part.text);
          }
          
          if (part.inlineData) {
            console.log(`Image part ${index} (${part.inlineData.mimeType})`);
            
            // Save image to file
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            const extension = part.inlineData.mimeType.split('/')[1] || 'png';
            const filename = `returned-img-${index}.${extension}`;
            
            fs.writeFileSync(filename, imageBuffer);
            console.log(`Saved image to ${filename}`);
          }
        });
      } else {
        console.log('No image data found in the response - model only returned text');
      }
      
      // Continue with test completion
      setTimeout(() => {
        console.log('Test completed. Closing connection in 1 second.');
        setTimeout(() => ws.close(), 1000);
      }, 1000);
    }
    
    // Handle image generation response
    if (message.result && message.result.type === 'completion') {
      if (message.result.contentType === 'mixed' && Array.isArray(message.result.content)) {
        handleMixedContent(message.result);
      } else if (message.result.contentType === 'text') {
        console.log('\nText content:');
        console.log(message.result.content);
      }
      
      // If this was the image generation request, follow up with text generation
      if (message.id === 2) {
        console.log('\nWaiting 2 seconds before sending text generation request...');
        setTimeout(sendTextGenerationRequest, 2000);
      } else if (message.id === 3 || message.id === 4) {
        // If this was the text generation or image edit, we're done
        console.log('\nTest completed. Closing connection in 1 second.');
        setTimeout(() => ws.close(), 1000);
      }
    }
    
    // Handle errors
    if (message.error) {
      console.error('\nError response received:');
      console.error(`Code: ${message.error.code}`);
      console.error(`Message: ${message.error.message}`);
      
      // Even with an error, continue with the next request
      if (message.id === 2) {
        console.log('\nContinuing with text generation despite error...');
        setTimeout(sendTextGenerationRequest, 2000);
      } else if (message.id === 4) {
        // This was the image edit request
        console.log('\nClosing connection due to image editing error.');
        setTimeout(() => ws.close(), 1000);
      } else if (message.id !== 3) {
        console.log('\nError in initialize request. Attempting to continue anyway...');
        initialized = true;
        
        const testToRun = process.env.TEST_MODE || 'generate';
        if (testToRun === 'edit') {
          setTimeout(sendImageEditRequest, 2000);
        } else {
          setTimeout(sendImageGenerationRequest, 2000);
        }
      } else {
        console.log('\nClosing connection due to errors.');
        setTimeout(() => ws.close(), 1000);
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

function handleMixedContent(result) {
  const textParts = result.content.filter(part => part.text);
  const imageParts = result.content.filter(part => part.inlineData);
  
  console.log(`Found ${textParts.length} text parts and ${imageParts.length} image parts`);
  
  // Print text content
  if (textParts.length > 0) {
    console.log('\nText content:');
    textParts.forEach((part, index) => {
      console.log(`[${index}] ${part.text}`);
    });
  }
  
  // Save images if any
  if (imageParts.length > 0) {
    console.log(`\nFound ${imageParts.length} images in the response`);
    
    imageParts.forEach((part, index) => {
      try {
        // Save image to a file
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        const extension = mimeType.split('/')[1] || 'png';
        const filename = `simple-test-image-${index}.${extension}`;
        
        fs.writeFileSync(filename, Buffer.from(imageData, 'base64'));
        console.log(`Saved image to ${filename}`);
      } catch (err) {
        console.error(`Error saving image: ${err.message}`);
      }
    });
  }
}

// Helper function to read an image file and convert to base64
function readImageAsBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeTypeFromExtension(path.extname(filePath));
    return { data: base64Image, mimeType };
  } catch (error) {
    console.error(`Error reading image file: ${error.message}`);
    // Return placeholder image data if file can't be read
    return { 
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
      mimeType: 'image/png' 
    };
  }
}

// Helper to determine MIME type from file extension
function getMimeTypeFromExtension(extension) {
  const ext = extension.toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
}

function sendImageEditRequest() {
  console.log('Server initialized. Sending image editing request...');
  
  // Try to read image from gemini-native-image.png
  const imagePath = 'gemini-native-image.png';
  console.log(`Attempting to read image from: ${imagePath}`);
  const imageData = readImageAsBase64(imagePath);
  
  const imageEditRequest = {
    id: 4, // Fixed ID to recognize the response
    jsonrpc: '2.0',
    method: 'generate',
    params: {
      prompt: {
        text: "Transform this image to add a sunset in the background and make it look more dramatic",
        images: [imageData]
      },
      model: 'gemini-2.0-flash-exp-image-generation',
      responseModalities: ['text', 'image'],
      temperature: 0.8,
      maxTokens: 1024
    }
  };
  
  console.log('Request:', JSON.stringify({
    ...imageEditRequest,
    params: {
      ...imageEditRequest.params,
      prompt: {
        text: imageEditRequest.params.prompt.text,
        images: [{...imageData, data: '[BASE64_IMAGE_DATA]'}]
      }
    }
  }, null, 2));
  
  ws.send(JSON.stringify(imageEditRequest));
}

function sendImageGenerationRequest() {
  console.log('Server initialized. Sending image generation request...');
  
  const imageGenerationRequest = {
    id: 2, // Fixed ID to recognize the response
    jsonrpc: '2.0',
    method: 'generate',
    params: {
      prompt: "Generate a 3d rendered image of a pig with wings and a top hat flying over a happy futuristic scifi city with lots of greenery",
      model: 'gemini-2.0-flash-exp-image-generation',
      responseModalities: ['Text', 'Image'], // Use title case to match curl
      temperature: 0.8,
      maxTokens: 1024
    }
  };
  
  console.log('Request:', JSON.stringify(imageGenerationRequest, null, 2));
  ws.send(JSON.stringify(imageGenerationRequest));
}

function sendTextGenerationRequest() {
  console.log('Sending text generation request...');
  
  const textGenerationRequest = {
    id: 3, // Fixed ID to recognize the response
    jsonrpc: '2.0',
    method: 'generate',
    params: {
      prompt: 'Tell me a short story about a cat',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 500
    }
  };
  
  console.log('Text generation request:', JSON.stringify(textGenerationRequest, null, 2));
  ws.send(JSON.stringify(textGenerationRequest));
}

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Connection closed');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Interrupted. Closing connection.');
  ws.close();
  process.exit(0);
}); 