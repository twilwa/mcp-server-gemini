// Test script for image editing based on the @google/genai SDK
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Initialize the API with your API key (read from environment variable)
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

async function editImage() {
  console.log('Starting image editing test...');
  
  try {
    // Read the sample image file
    const imageFile = 'gemini-native-image.png';
    console.log(`Reading image from ${imageFile}`);
    const imageData = fs.readFileSync(imageFile);
    const base64Image = imageData.toString('base64');
    
    // Create prompt content with text and image parts
    const contents = [
      { text: "Transform this image to add more dramatic colors and make it look like a sunset" },
      { inlineData: { 
          data: base64Image,
          mimeType: 'image/png'
        }
      }
    ];
    
    // Configure the model
    console.log('Configuring model...');
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ['Text', 'Image']
      }
    });
    
    // Send request to the API
    console.log('Sending request to Gemini API...');
    const response = await model.generateContent(contents);
    
    console.log('Response received:', response);
    console.log('Response structure:', JSON.stringify(Object.keys(response), null, 2));
    
    // Process the response
    console.log('Checking for candidates...');
    const candidates = response.response?.candidates || [];
    
    if (candidates.length > 0) {
      console.log(`Found ${candidates.length} candidates`);
      
      const parts = candidates[0].content?.parts || [];
      console.log(`Found ${parts.length} content parts`);
      
      // Process each part
      for (const part of parts) {
        if (part.text) {
          console.log('Text response:', part.text);
        } else if (part.inlineData) {
          console.log(`Image response (${part.inlineData.mimeType})`);
          
          // Save the image
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync('edited-image.jpg', buffer);
          console.log('Image saved as edited-image.jpg');
        } else {
          console.log('Unknown part type:', part);
        }
      }
    } else {
      console.log('No candidates in the response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API error details:', JSON.stringify(error.response, null, 2));
    }
  }
}

// Run the test
editImage(); 