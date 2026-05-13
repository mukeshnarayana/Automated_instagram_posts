const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  projectId: process.env.project_id,
  credentials: {
    client_email: process.env.client_email,
    private_key: process.env.private_key ? process.env.private_key.replace(/\\n/g, '\n') : undefined,
  }
});

const BUCKET_NAME = "automate_insta";

async function uploadToGCS(buffer, index) {
  const filename = `rawimages/image_${Date.now()}_${index + 1}.jpg`;
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType: "image/jpeg" }
  });

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
  console.log(`✅ Uploaded: ${publicUrl}`);
  return publicUrl;
}

// Upload all buffers
async function uploadAllImages(buffers) {
  const urls = [];
  for (let i = 0; i < buffers.length; i++) {
    const url = await uploadToGCS(buffers[i], i);
    urls.push(url);
  }
  return urls;
}

async function getallimages() {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    // Fetch all files with the 'rawimages/' prefix
    const [files] = await bucket.getFiles({ prefix: 'rawimages/' });
    
    // Map files to their public URLs
    const urls = files
      .filter(file => !file.name.endsWith('/')) // Filter out folder placeholders
      .map(file => {
        return `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`;
      });

    console.log(`Successfully fetched ${urls.length} images from GCS.`);
    return urls;
  } catch (error) {
    console.error("Error fetching images from GCS:", error);
    throw error;
  }
}

module.exports = { uploadAllImages, getallimages }

// // Use it
// const urls = await uploadAllImages(generatedImages);
// console.log("Public URLs:", urls);