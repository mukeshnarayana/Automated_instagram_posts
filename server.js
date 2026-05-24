const express = require("express");
const cron = require("node-cron");
const app = express();
const { dbConnnection } = require("./src/config/dbconfig");
require("dotenv").config();

// Import controllers for automation
const { createPrompt } = require("./src/controllers/create_prompt");
const { generateImages } = require("./src/controllers/create_images");
const { uploadAllImages } = require("./src/controllers/store_raw_images");
const { postimages } = require("./src/controllers/post_in_insta");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Main Automation Logic
 * Grouped into a single function to be called by the cron job
 */
async function runDailyAutomation() {
    console.log(`[${new Date().toLocaleString()}] Starting scheduled daily automation...`);
    try {
        // 1. Create Prompt
        console.log("Step 1: Creating AI Prompt...");
        const promptResult = await createPrompt();
        console.log("Prompt generated successfully.");

        // 2. Generate Images
        console.log("Step 2: Generating Images...");
        const imageBuffers = await generateImages(promptResult);
        console.log(`Generated ${imageBuffers.length} images.`);

        // 3. Upload to GCS
        console.log("Step 3: Uploading to Cloud Storage...");
        const publicUrls = await uploadAllImages(imageBuffers);
        console.log("Images uploaded to GCS.");

        // 4. Post to Instagram
        console.log("Step 4: Posting to Instagram...");
        const postResult = await postimages(publicUrls);
        
        if (postResult && postResult.success) {
            console.log(`[${new Date().toLocaleString()}] Daily automation completed successfully! Media ID: ${postResult.mediaId}`);
        } else {
            console.error(`[${new Date().toLocaleString()}] Automation finished with warnings:`, postResult?.error);
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Daily automation FAILED:`, error.message);
        console.error(error);
    }
}

// ─── CRON JOB ────────────────────────────────────────────────────────────────
// Schedule: 6:55 AM and 11:55 PM daily
cron.schedule("55 6,23 * * *", () => {
    runDailyAutomation();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Based on IST
});

console.log("⏰ Daily automation cron job scheduled for 6:55 AM and 11:55 PM.");

app.get("/", (req, res) => {
    res.send("Instagram Automation Server is running. Cron job scheduled for 6:55 AM and 11:55 PM daily.");
});

// Manual trigger for testing (optional, can be removed)
app.get("/trigger-now", async (req, res) => {
    runDailyAutomation();
    res.send("Automation triggered manually. Check console for logs.");
});

dbConnnection()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port http://localhost:${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    });