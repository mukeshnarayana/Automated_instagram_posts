const { createPrompt } = require("./src/controllers/create_prompt");
const { generateImages } = require("./src/controllers/create_images");
const { uploadAllImages } = require("./src/controllers/store_raw_images");
const { postimages } = require("./src/controllers/post_in_insta")
async function test() {
    try {
        console.log("Starting test...");
        const result = await createPrompt();
        console.log("Generated Prompt:\n", result);

        const images = await generateImages(result); 
        console.log(images)
        console.log(`Generated ${images.length} images.`);
        
        console.log("Uploading upscaled images...");
        const store = await uploadAllImages(images);

        console.log("posting the images") 
        const post = await postimages(store)
        
        console.log("\n--- TEST SUCCESSFUL ---");
        console.log("Public URLs:", store);
        console.log("images posted successfully")
        console.log("------------------------\n");
    } catch (error) {
        console.error("\n--- TEST FAILED ---");
        console.error(error);
        console.log("--------------------\n");
    }
}

test();
