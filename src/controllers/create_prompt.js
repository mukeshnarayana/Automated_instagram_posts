// npm install dotenv
require('dotenv').config();
const { prompt } = require("../prompts/creation_image_prompt");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

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

async function createPrompt() {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    try {
        console.log("Generating prompt via Gemini API...");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
        console.log("Prompt generated successfully.");
        return generatedText;

    } catch (error) {
        console.error("Error in createPrompt controller:", error.message);
        throw error; // Re-throw so the caller can handle the failure (e.g., stop the process)
    }
}

module.exports = { createPrompt };
