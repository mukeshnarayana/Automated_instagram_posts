// npm install dotenv
require('dotenv').config();
const { prompt } = require("../prompts/creation_image_prompt");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates a cinematic Kalamkari wallpaper prompt using the Gemini API.
 * @returns {Promise<string>} The generated prompt text.
 * @throws {Error} If the API key is missing, the request fails, or the response format is invalid.
 */

// async function createPrompt() {
//     console.log(API_KEY);
//     console.log(API_KEY?.length);
//     if (!API_KEY) {
//         throw new Error("GEMINI_API_KEY is missing in environment variables.");
//     }

//     try {
//         const genAI = new GoogleGenerativeAI({ apiKey: API_KEY });

//         console.log("Generating prompt via Gemini API (google/generative-ai SDK)...");

//         // Select the model
//         const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//         // Generate content using the SDK
//         const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] });

//         // Extract the response
//         const generatedText = result.response.text();

//         if (!generatedText) {
//             console.error("Empty response from Gemini API");
//             throw new Error("Failed to generate prompt: Empty response from Gemini API");
//         }

//         console.log("Prompt generated successfully.");
//         return generatedText;

//     } catch (error) {
//         console.error("Error in createPrompt controller:", error.message);
//         throw error;
//     }
// }

async function enhancePrompt(userPrompt) {
    if (!userPrompt) return "";
    //const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const promptRegex = /AI Image Prompt \d*:\s*([\s\S]*?)(?=Optional Reel Caption|AI Image Prompt \d*|$)/gi;
    
    const prompts = [];
    let match;
    
    // Reset regex index
    promptRegex.lastIndex = 0;
    while ((match = promptRegex.exec(userPrompt)) !== null) {
        const extractedPrompt = match[1].trim();
        if (extractedPrompt) {
            prompts.push(extractedPrompt);
        }
    }

    const enhancedPrompts = [];
    for (let i = 0; i < prompts.length; i++) {
         if (i > 0) {
                console.log("Waiting 65 seconds to respect API quota...");
                await new Promise(resolve => setTimeout(resolve, 65000));
            }
        console.log(`Enhancing prompt ${i + 1}/${prompts.length}...`);
        const result = await model.generateContent(`
                You are DALL-E 3's internal prompt rewriter.
                Rewrite the user's idea exactly how DALL-E 3 would internally 
                expand it for photorealistic output.
                
                Style rules:
                - Real photography, not illustration or digital art
                - Shot on Canon 5D, 85mm, f/1.8
                - Golden hour or soft natural light
                - Warm cinematic color grade
                - Real skin, real textures, imperfections
                - Shallow depth of field
                - 9:16 portrait ratio composition
                - Never mention "digital art", "illustration", "render", "3D"
                
                Return ONLY the rewritten prompt. No explanation.
                
                User idea: "${prompts[i]}"
        `);
        enhancedPrompts.push(result.response.text().trim());
    }

    let resultText = userPrompt;
    let index = 0;
    promptRegex.lastIndex = 0;
    resultText = resultText.replace(promptRegex, (fullMatch) => {
        const prefix = fullMatch.split(":")[0] + ": ";
        const enhanced = enhancedPrompts[index++];
        return `${prefix}${enhanced}\n`;
    });

    return resultText;
}

async function createPrompt() {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    try {
        console.log("Generating prompt via Gemini API...");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`Gemini API Error (${response.status}): ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
            console.error("Invalid API Response Structure:", JSON.stringify(data, null, 2));
            throw new Error("Failed to generate prompt: Unexpected API response format or safety filter blocked the content.");
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        // console.log("Initial prompt generated. Enhancing individual image prompts...");
        
        // const finalPrompt = await enhancePrompt(generatedText);
        
        // console.log("Prompt generated and enhanced successfully.");
        return generatedText;

    } catch (error) {
        console.error("Error in createPrompt controller:", error.message);
        throw error; // Re-throw so the caller can handle the failure (e.g., stop the process)
    }
}

module.exports = { createPrompt };
