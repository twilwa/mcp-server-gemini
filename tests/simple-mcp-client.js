import WebSocket from 'ws';
import fs from 'node:fs';

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
  const response = JSON.parse(data.toString());
  console.log('Received response:', JSON.stringify(response, null, 2));
  
  // Handle server notifications
  if (!response.id && response.method) {
    console.log(`Received notification: ${response.method}`);
    return;
  }
  
  // After initialization is complete
  if (!initialized && response.result && 'capabilities' in response.result) {
    initialized = true;
    console.log('\nServer initialized successfully');
    console.log('Server capabilities:', JSON.stringify(response.result.capabilities, null, 2));
    
    // Wait before sending image generation request
    console.log('\nWaiting 2 seconds before sending image generation request...');
    setTimeout(sendImageGenerationRequest, 2000);
    return;
  }
  
  // Handle image generation response
  if (response.result && response.result.type === 'completion') {
    if (response.result.contentType === 'mixed' && Array.isArray(response.result.content)) {
      handleMixedContent(response.result);
    } else if (response.result.contentType === 'text') {
      console.log('\nText content:');
      console.log(response.result.content);
    }
    
    // If this was the image generation request, follow up with text generation
    if (response.id === 2) {
      console.log('\nWaiting 2 seconds before sending text generation request...');
      setTimeout(sendTextGenerationRequest, 2000);
    } else if (response.id === 3) {
      // If this was the text generation, we're done
      console.log('\nTest completed. Closing connection in 1 second.');
      setTimeout(() => ws.close(), 1000);
    }
  }
  
  // Handle errors
  if (response.error) {
    console.error('\nError response received:');
    console.error(`Code: ${response.error.code}`);
    console.error(`Message: ${response.error.message}`);
    
    // Even with an error, continue with the next request
    if (response.id === 2) {
      console.log('\nContinuing with text generation despite error...');
      setTimeout(sendTextGenerationRequest, 2000);
    } else if (response.id !== 3) {
      console.log('\nError in initialize request. Attempting to continue anyway...');
      initialized = true;
      setTimeout(sendImageGenerationRequest, 2000);
    } else {
      console.log('\nClosing connection due to errors.');
      setTimeout(() => ws.close(), 1000);
    }
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

function sendImageGenerationRequest() {
  console.log('Server initialized. Sending image generation request...');
  
  const imageGenerationRequest = {
    id: 2, // Fixed ID to recognize the response
    jsonrpc: '2.0',
    method: 'generate',
    params: {
      prompt: 'Generate an image of a cute cat playing with yarn',
      model: 'gemini-2.0-flash-exp-image-generation',
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.7,
      maxTokens: 800
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