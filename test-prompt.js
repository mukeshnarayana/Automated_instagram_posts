const { createPrompt } = require("./src/controllers/create_prompt");
const {generateImages} = require("./src/controllers/create_images");

async function test() {
    try {
        console.log("Starting test...");
        const result = await createPrompt();
        console.log("Generated Prompt:\n", result);

        const images = await generateImages(result); 
        console.log("Generated Images:\n", images);
        console.log(images.length);
        console.log("\n--- TEST SUCCESSFUL ---");
        console.log("------------------------\n");
    } catch (error) {
        console.error("\n--- TEST FAILED ---");
        console.error(error.message);
        console.log("--------------------\n");
    }
}

test();
