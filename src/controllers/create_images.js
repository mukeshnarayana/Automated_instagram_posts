const fs = require('fs');
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.project_id,
  location: "us-central1",
  googleAuthOptions: {
        credentials: {
            client_email: process.env.client_email,
            private_key: process.env.private_key ? process.env.private_key.replace(/\\n/g, '\n') : undefined
        }
    }
});
// Initialize the Imagen model
// Initialize the model ID
const MODEL_ID = "imagen-3.0-generate-001";

//Image generation function using gcp vertex model
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
            
            const response = await ai.models.generateImages({
                model: MODEL_ID,
                prompt: prompts[i]
            });
            
            if (response.generatedImages && response.generatedImages.length > 0) {
                const imageData = Buffer.from(response.generatedImages[0].image.imageBytes, 'base64');
                generatedImages.push(imageData);
            } else {
                console.error(`No image generated for prompt ${i + 1}`, response);
            }
        }

        console.log(`Successfully generated ${generatedImages.length} images.`);
        return generatedImages;

    } catch (error) {
        console.error("Error generating images:", error);
        throw error;
    }
} 








//using hugging face
// async function generateImages(generatedText) {
//     if (!generatedText) {
//         throw new Error("No prompt provided to generateImages");
//     }
//     try {
//         console.log(" Starting image generation process...");
        
//         // 2. Extract the actual "AI Image Prompt" parts from the text
//         // This regex looks for "AI Image Prompt X: " and captures the text after it
//         const promptRegex = /AI Image Prompt \d*:\s*([\s\S]*?)(?=Optional Reel Caption|AI Image Prompt \d*|$)/gi;
//         const prompts = [];
//         let match;
        
//         while ((match = promptRegex.exec(generatedText)) !== null) {
//             const extractedPrompt = match[1].trim();
//             if (extractedPrompt) {
//                 prompts.push(extractedPrompt);
//             }
//         }

//         // Fallback if the text doesn't follow the "AI Image Prompt X:" format
//         if (prompts.length === 0) {
//             console.log("Using full generated text as prompt (no specific numbered prompts found).");
//             prompts.push(generatedText);
//         }

//         console.log(`Found ${prompts.length} prompts. Generating images now...`);

//         const generatedFilenames = [];

//         // 3. Generate images for each prompt found
//         for (let i = 0; i < prompts.length; i++) {
//             // Wait 65 seconds if it's not the first image (to respect quota)
//             if (i > 0) {
//                 console.log("Waiting 65 seconds to respect API quota...");
//                 await new Promise(resolve => setTimeout(resolve, 65000));
//             }

//             console.log(`Generating image ${i + 1}/${prompts.length}...`);
            
//             const callHF = async (prompt) => {
//                 const response = await fetch(
//                     "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0/v1/text-to-image",
//                     {
//                         method: "POST",
//                         headers: {
//                             "Authorization": `Bearer ${process.env.Hf_token}`,
//                             "Content-Type": "application/json"
//                         },
//                         body: JSON.stringify({
//                             inputs: prompt
//                         })
//                     }
//                 );

//                 if (!response.ok) {
//                     let errorMessage = `HF Error ${response.status}: ${response.statusText}`;
//                     try {
//                         const contentType = response.headers.get("content-type");
//                         if (contentType && contentType.includes("application/json")) {
//                             const err = await response.json();
//                             // Model loading — wait and retry
//                             if (err.error?.includes("loading")) {
//                                 console.log("Model loading, waiting 30s...");
//                                 await new Promise(r => setTimeout(r, 30000));
//                                 return callHF(prompt); // retry
//                             }
//                             errorMessage = `HF Error: ${err.error || JSON.stringify(err)}`;
//                         } else {
//                             const text = await response.text();
//                             errorMessage = `HF Error ${response.status}: ${text.slice(0, 200)}`;
//                         }
//                     } catch (e) {
//                         errorMessage = `HF Error ${response.status}: Could not parse error response`;
//                     }
//                     throw new Error(errorMessage);
//                 }
//                 return response;
//             };

//             const response = await callHF(prompts[i]);

//             // Save image
//             const buffer = Buffer.from(await response.arrayBuffer());
//             const filename = `image_${Date.now()}.jpg`;
            
//             if (!fs.existsSync('./outputs')) {
//                 fs.mkdirSync('./outputs');
//             }
//             fs.writeFileSync(`./outputs/${filename}`, buffer);
            
//             console.log(`Image saved: ${filename}`);
//             generatedFilenames.push(filename);
//         }

//         console.log(`Successfully generated ${generatedFilenames.length} images.`);
//         return generatedFilenames;

//     } catch (error) {
//         console.error("Error generating images:", error);
//         throw error;
//     }
// } 


// const API_KEY = process.env.STABILITY_API_KEY; 

// async function generateImages(generatedText) {
//     if (!generatedText) {
//         throw new Error("No prompt provided to generateImages");
//     }
//     try {
//         console.log(" Starting image generation process via Stability AI...");
        
//         // 2. Extract the actual "AI Image Prompt" parts from the text
//         const promptRegex = /AI Image Prompt \d*:\s*([\s\S]*?)(?=Optional Reel Caption|AI Image Prompt \d*|$)/gi;
//         const prompts = [];
//         let match;
        
//         while ((match = promptRegex.exec(generatedText)) !== null) {
//             const extractedPrompt = match[1].trim();
//             if (extractedPrompt) {
//                 prompts.push(extractedPrompt);
//             }
//         }

//         // Fallback if the text doesn't follow the "AI Image Prompt X:" format
//         if (prompts.length === 0) {
//             console.log("Using full generated text as prompt (no specific numbered prompts found).");
//             prompts.push(generatedText);
//         }

//         console.log(`Found ${prompts.length} prompts. Generating images now...`);

//         const generatedImages = [];
        
//         // 3. Generate images for each prompt found
//         for (let i = 0; i < prompts.length; i++) {
//             // Wait 65 seconds if it's not the first image (to respect quota)
//             // if (i > 0) {
//             //     console.log("Waiting 65 seconds to respect API quota...");
//             //     await new Promise(resolve => setTimeout(resolve, 65000));
//             // }

//             console.log(`Generating image ${i + 1}/${prompts.length}...`);

//             const formData = new FormData();
//             formData.append("prompt", prompts[i]);
//             formData.append("output_format", "jpeg");

//             const response = await fetch(
//                 "https://api.stability.ai/v2beta/stable-image/generate/core",
//                 {
//                     method: "POST",
//                     headers: {
//                         "Authorization": `Bearer ${API_KEY}`,
//                         "Accept": "image/*"
//                     },
//                     body: formData
//                 }
//             );

//             if (!response.ok) {
//                 const err = await response.json().catch(() => ({ error: "Could not parse error response" }));
//                 throw new Error(`Stability AI Error ${response.status}: ${JSON.stringify(err)}`);
//             }

//             const buffer = await response.arrayBuffer();
//             generatedImages.push(Buffer.from(buffer));
//         }
//         console.log(generateImages)
//         console.log(`Successfully generated ${generatedImages.length} images.`);
//         return generatedImages;
//     }
//     catch(error){
//         console.error("Error generating images:", error);
//         throw error;
//     }
// }

module.exports = { generateImages };
