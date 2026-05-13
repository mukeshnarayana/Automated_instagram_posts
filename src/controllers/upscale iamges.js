const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execPromise = promisify(exec);

// Path to the Real-ESRGAN binary and models
const projectRoot = path.join(__dirname, '../../');
const binaryPath = path.join(projectRoot, 'src/realesrgan/realesrgan-ncnn-vulkan');
const modelsPath = path.join(projectRoot, 'src/realesrgan/models');

/**
 * Upscales an array of image buffers using Real-ESRGAN
 * @param {Buffer[]} buffers - Array of image buffers to upscale
 * @returns {Promise<Buffer[]>} - Array of upscaled image buffers
 */
async function upscaleAllImages(buffers) {
    if (!buffers || buffers.length === 0) {
        console.warn("No buffers provided for upscaling. Skipping.");
        return [];
    }

    const upscaledBuffers = [];
    const tempDir = path.join(projectRoot, 'temp_upscale');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`🚀 Starting upscaling of ${buffers.length} images...`);

    for (let i = 0; i < buffers.length; i++) {
        const timestamp = Date.now();
        const inputPath = path.join(tempDir, `input_${timestamp}_${i}.jpg`);
        const outputPath = path.join(tempDir, `output_${timestamp}_${i}.jpg`);

        try {
            // 1. Write buffer to temp file
            fs.writeFileSync(inputPath, buffers[i]);

            // 2. Run Real-ESRGAN
            // We use 'realesr-animevideov3' because it is MUCH faster on CPU-only environments.
            // Even though it says 'anime', it works very well for general images and photos.
            const command = `"${binaryPath}" -i "${inputPath}" -o "${outputPath}" -n realesr-animevideov3 -s 2 -f jpg -m "${modelsPath}"`;
            
            console.log(`Upscaling image ${i + 1}/${buffers.length} (using fast CPU-friendly model)...`);
            
            // Execute with a 10-minute timeout to prevent hanging forever
            await execPromise(command, { timeout: 600000 });

            // 3. Read upscaled file back to buffer
            if (fs.existsSync(outputPath)) {
                const upscaledBuffer = fs.readFileSync(outputPath);
                upscaledBuffers.push(upscaledBuffer);
                console.log(`✅ Image ${i + 1} upscaled successfully.`);
            } else {
                console.error(`❌ Upscaled file not found for image ${i + 1}. Using original.`);
                upscaledBuffers.push(buffers[i]);
            }
        } catch (error) {
            console.error(`Error upscaling image ${i + 1}:`, error.message);
            console.log("Falling back to original image buffer.");
            upscaledBuffers.push(buffers[i]);
        } finally {
            // 4. Cleanup
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (cleanupError) {
                console.error("Error during cleanup:", cleanupError.message);
            }
        }
    }

    console.log(`✨ Upscaling process completed. ${upscaledBuffers.length} images processed.`);
    return upscaledBuffers;
}

module.exports = { upscaleAllImages };
