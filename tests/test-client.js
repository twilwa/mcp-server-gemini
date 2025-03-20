import WebSocket from 'ws';
import fs from 'node:fs';

/*
 * Test client for MCP server with Gemini API
 * You can customize the models used by setting environment variables:
 * 
 * # Using different models:
 * TEXT_MODEL=gemini-1.5-flash IMAGE_MODEL=gemini-1.5-flash-latest DEFAULT_MODEL=gemini-1.5-flash pnpm start
 *
 * # Enable debug logs:
 * DEBUG=true pnpm start
 */

// Connect to the MCP server
const ws = new WebSocket('ws://localhost:3005');

// Track if we've processed the initialization response
let initialized = false;
// Track which requests have been sent
const sentRequests = new Set();
// Flag to prevent closing on errors
const IGNORE_ERRORS = true;

// Set up event handlers
ws.on('open', () => {
  console.log('Connected to MCP server');
  
  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize'
  };
  console.log('Sending initialize request:', JSON.stringify(initRequest, null, 2));
  ws.send(JSON.stringify(initRequest));
  sentRequests.add(1);
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Received response:', JSON.stringify(response, null, 2));
  
  // After initialization, send an image generation request
  if (response.id === 1 && response.result && !initialized) {
    initialized = true;
    console.log('\nServer initialized successfully');
    console.log('Server capabilities:', JSON.stringify(response.result.capabilities, null, 2));
    console.log('\nWaiting 2000ms before sending image generation request...');
    
    // Add a longer delay to ensure the server has fully processed the initialization
    setTimeout(() => {
      console.log('Server initialized. Sending image generation request...');
      
      const imageGenerationRequest = {
        id: 2,
        jsonrpc: '2.0',
        method: 'generate',
        params: {
          prompt: 'Generate an image of a cute cat playing with yarn',
          model: 'gemini-2.0-flash-exp-image-generation',
          responseModalities: ['TEXT', 'IMAGE']
        }
      };
      
      console.log('Request:', JSON.stringify(imageGenerationRequest, null, 2));
      ws.send(JSON.stringify(imageGenerationRequest));
      sentRequests.add(2);
      
      // Set a 30 second timeout - image generation can take time
      console.log('Waiting up to 30 seconds for image generation to complete...');
      setTimeout(() => {
        if (sentRequests.has(2)) {
          console.log('No response received for image generation after 30 seconds. Moving to text generation.');
          sendTextGenerationRequest();
        }
      }, 30000);
    }, 2000); // 2 second delay
  }
  
  // Handle the image generation response
  if (response.id === 2) {
    sentRequests.delete(2);
    
    if (response.result) {
      console.log('\nReceived image generation response:');
      console.log('Content type:', response.result.contentType);
      console.log('Metadata:', JSON.stringify(response.result.metadata, null, 2));
      
      // Check if we got mixed content with an image
      if (response.result.contentType === 'mixed' && Array.isArray(response.result.content)) {
        const textParts = response.result.content.filter(part => part.text);
        const imageParts = response.result.content.filter(part => part.inlineData);
        
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
            // Save image to a file
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            const extension = mimeType.split('/')[1] || 'png';
            const filename = `test-image-${index}.${extension}`;
            
            fs.writeFileSync(filename, Buffer.from(imageData, 'base64'));
            console.log(`Saved image to ${filename}`);
          });
        }
      } else if (response.result.contentType === 'text' || typeof response.result.content === 'string') {
        console.log('\nText-only response:');
        console.log(response.result.content);
      }
    } else if (response.error) {
      console.error('\nError in image generation:');
      console.error(`Code: ${response.error.code}`);
      console.error(`Message: ${response.error.message}`);
      console.error('Continuing with text generation...');
    }
    
    // After processing the image response (or error), move to text generation
    console.log('\nWaiting 2 seconds before sending text generation request...');
    setTimeout(sendTextGenerationRequest, 2000);
  }
  
  // Handle the text generation response
  if (response.id === 3) {
    sentRequests.delete(3);
    
    if (response.result) {
      console.log('\nReceived text generation response:');
      console.log('Content type:', response.result.contentType);
      console.log('Metadata:', JSON.stringify(response.result.metadata, null, 2));
      console.log('\nText content:');
      console.log(response.result.content);
    } else if (response.error) {
      console.error('\nError in text generation:');
      console.error(`Code: ${response.error.code}`);
      console.error(`Message: ${response.error.message}`);
    }
    
    // Close the connection after both requests are processed
    console.log('\nTest completed. Closing connection.');
    ws.close();
  }
  
  // Handle errors differently now - don't immediately close connection
  if (response.error && !IGNORE_ERRORS) {
    console.error('\nError response received:');
    console.error(`Code: ${response.error.code}`);
    console.error(`Message: ${response.error.message}`);
    console.error('Closing connection.');
    ws.close();
  }
});

function sendTextGenerationRequest() {
  const textGenerationRequest = {
    id: 3,
    jsonrpc: '2.0',
    method: 'generate',
    params: {
      prompt: 'Tell me a short story about a cat',
      model: 'gemini-1.5-flash'  // Use the text model
    }
  };
  
  console.log('Text generation request:', JSON.stringify(textGenerationRequest, null, 2));
  ws.send(JSON.stringify(textGenerationRequest));
  sentRequests.add(3);
  
  // Set a 30 second timeout
  setTimeout(() => {
    if (sentRequests.has(3)) {
      console.log('No response received for text generation after 30 seconds. Closing connection.');
      ws.close();
    }
  }, 30000);
}

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Connection closed');
});