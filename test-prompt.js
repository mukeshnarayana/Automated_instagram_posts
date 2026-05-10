const { createPrompt } = require("./src/controllers/create_prompt");

async function test() {
    try {
        console.log("Starting test...");
        const result = await createPrompt();
        console.log("\n--- TEST SUCCESSFUL ---");
        console.log("Generated Prompt:\n", result);
        console.log("------------------------\n");
    } catch (error) {
        console.error("\n--- TEST FAILED ---");
        console.error(error.message);
        console.log("--------------------\n");
    }
}

test();
