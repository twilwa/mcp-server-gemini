import fs from 'node:fs';

// Check if we're running in ESM mode
const isESM = typeof require === 'undefined';
let MCPClient;

// Dynamic import for ESM compatibility
async function initialize() {
  try {
    if (isESM) {
      // ESM import
      const sdk = await import('@modelcontextprotocol/sdk');
      MCPClient = sdk.MCPClient;
    } else {
      // CommonJS require
      MCPClient = require('@modelcontextprotocol/sdk').MCPClient;
    }

    console.log('MCP SDK loaded successfully');
    runClient();
  } catch (error) {
    console.error('Error loading MCP SDK:', error);
    console.error('Please ensure @modelcontextprotocol/sdk is installed:');
    console.error('npm install @modelcontextprotocol/sdk');
    process.exit(1);
  }
}

async function runClient() {
  console.log('Starting MCP client test with SDK');
  
  // Create a new client with the proper MCP protocols
  const client = new MCPClient({
    transport: {
      type: 'websocket',
      url: 'ws://localhost:3005',
    },
    // Logger to see what's happening
    logger: {
      level: 'debug'
    }
  });

  try {
    // Connect and initialize in one step
    console.log('Connecting to server and initializing...');
    await client.initialize();
    console.log('Connected and initialized successfully');
    
    // Get capabilities
    const capabilities = client.getCapabilities();
    console.log('Server capabilities:', JSON.stringify(capabilities, null, 2));
    
    // Wait for a moment to ensure server is ready
    console.log('Waiting 2 seconds before sending image generation request...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate an image with proper MCP parameters
    console.log('Sending image generation request...');
    const imagePrompt = 'Generate an image of a cute cat playing with yarn';
    
    try {
      const imageResult = await client.generate({
        prompt: imagePrompt,
        model: 'gemini-2.0-flash-exp-image-generation',
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.7,
        maxTokens: 800
      });
      
      console.log('\nReceived image generation response:');
      console.log('Content type:', imageResult.contentType);
      console.log('Metadata:', JSON.stringify(imageResult.metadata, null, 2));
      
      // Process mixed content response
      if (imageResult.contentType === 'mixed' && Array.isArray(imageResult.content)) {
        const textParts = imageResult.content.filter(part => part.text);
        const imageParts = imageResult.content.filter(part => part.inlineData);
        
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
            const filename = `mcp-test-image-${index}.${extension}`;
            
            fs.writeFileSync(filename, Buffer.from(imageData, 'base64'));
            console.log(`Saved image to ${filename}`);
          });
        }
      } else if (imageResult.contentType === 'text') {
        console.log('\nText-only response:');
        console.log(imageResult.content);
      }
    } catch (error) {
      console.error('Error during image generation:');
      console.error(error.message || error);
      console.error('Continuing with text generation...');
    }
    
    // Wait a moment before sending text generation
    console.log('\nWaiting 2 seconds before sending text generation request...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate text with standard MCP parameters
    console.log('Sending text generation request...');
    const textPrompt = 'Tell me a short story about a cat';
    
    try {
      const textResult = await client.generate({
        prompt: textPrompt,
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 500
      });
      
      console.log('\nReceived text generation response:');
      console.log('Content type:', textResult.contentType);
      console.log('Metadata:', JSON.stringify(textResult.metadata, null, 2));
      
      console.log('\nText content:');
      console.log(textResult.content);
    } catch (error) {
      console.error('Error during text generation:');
      console.error(error.message || error);
    }
    
  } catch (error) {
    console.error('Error during connection or initialization:');
    console.error(error.message || error);
  } finally {
    // Clean up and exit
    console.log('\nShutting down client...');
    try {
      await client.shutdown();
      console.log('Client shutdown successfully');
    } catch (shutdownError) {
      console.error('Error during shutdown:', shutdownError);
    }
  }
}

// Start the initialization process
initialize(); 