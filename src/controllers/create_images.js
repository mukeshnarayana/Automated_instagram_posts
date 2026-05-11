const { VertexAI } = require('@google-cloud/vertexai');
const { createPrompt } = require('./create_prompt');
require('dotenv').config();

const vertexAI = new VertexAI({
    project: process.env.project_id,
    location:  "us-central1",
    googleAuthOptions: {
        credentials: {
            client_email: process.env.client_email,
            private_key: process.env.private_key ? process.env.private_key.replace(/\\n/g, '\n') : undefined
        }
    }
});

// Initialize the Imagen model
// const model = vertexAI.getGenerativeModel({model: "imagen-3.0-generate-001"});
const model = vertexAI.getGenerativeModel({model: "imagegeneration@005"});

// Image generation function
async function generateImages(generatedText) {
    if (!generatedText) {
        throw new Error("No prompt provided to generateImages");
    }
    try {
        console.log(" Starting image generation process...");
        
        // 2. Extract the actual "AI Image Prompt" parts from the text
        // This regex looks for "AI Image Prompt X: " and captures the text after it
        const promptRegex = /AI Image Prompt \d*:\s*([\s\S]*?)(?=Optional Reel Caption|AI Image Prompt \d*|$)/gi;
        const prompts = [];
        let match;
        
        while ((match = promptRegex.exec(generatedText)) !== null) {
            const extractedPrompt = match[1].trim();
            if (extractedPrompt) {
                prompts.push(extractedPrompt);
            }
        }

        // Fallback if the text doesn't follow the "AI Image Prompt X:" format
        if (prompts.length === 0) {
            console.log("Using full generated text as prompt (no specific numbered prompts found).");
            prompts.push(generatedText);
        }

        console.log(`Found ${prompts.length} prompts. Generating images now...`);

        const generatedImages = [];

        // 3. Generate images for each prompt found
        for (let i = 0; i < prompts.length; i++) {
            // Wait 65 seconds if it's not the first image (to respect quota)
            if (i > 0) {
                console.log("Waiting 65 seconds to respect API quota...");
                await new Promise(resolve => setTimeout(resolve, 65000));
            }

            console.log(`Generating image ${i + 1}/${prompts.length}...`);
            
            const response = await model.generateContent({
                contents: [{ parts: [{ text: prompts[i] }] }]
            });
            
            const vertexAIResponse = response.response;

            if (vertexAIResponse.candidates && vertexAIResponse.candidates[0].content.parts.length > 0) {
                const imageData = vertexAIResponse.candidates[0].content.parts[0].inlineData.data;
                generatedImages.push(imageData);
            } else {
                console.error(`No image generated for prompt ${i + 1}`);
            }
        }

        console.log(`Successfully generated ${generatedImages.length} images.`);
        return generatedImages;

    } catch (error) {
        console.error("Error generating images:", error);
        throw error;
    }
}

module.exports = { generateImages };
