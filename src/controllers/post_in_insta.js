const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
// const { getallimages } = require('./store_raw_images');

console.log("Checking environment variables...");
console.log("page_access_token exists:", !!process.env.page_access_token);
console.log("instaid exists:", !!process.env.instaid);

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const IG_CONFIG = {
  pageAccessToken: process.env.page_access_token,
  instagramAccountId: process.env.instaid, // Instagram Business Account ID
  apiVersion: 'v19.0',
  baseUrl: 'https://graph.facebook.com',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Step 1: Create a media container on Instagram
 */
async function createMediaContainer(imageUrl, isCarouselItem = false, caption = '') {
  const url = `${IG_CONFIG.baseUrl}/${IG_CONFIG.apiVersion}/${IG_CONFIG.instagramAccountId}/media`;

  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: IG_CONFIG.pageAccessToken,
  });

  if (isCarouselItem) {
    params.append('is_carousel_item', 'true');
  } else if (caption) {
    params.append('caption', caption);
  }

  const response = await fetch(`${url}?${params}`, { method: 'POST' });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Container creation failed: ${data.error.message}`);
  }

  return data.id; // creation_id
}

/**
 * Step 1.5: Create a Carousel container
 */
async function createCarouselContainer(childrenIds, caption = '') {
  const url = `${IG_CONFIG.baseUrl}/${IG_CONFIG.apiVersion}/${IG_CONFIG.instagramAccountId}/media`;

  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: IG_CONFIG.pageAccessToken,
  });

  const response = await fetch(`${url}?${params}`, { method: 'POST' });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Carousel container creation failed: ${data.error.message}`);
  }

  return data.id; // creation_id
}

/**
 * Step 2: Check container status (wait until it's ready)
 */
async function waitForContainer(creationId, maxRetries = 15, delayMs = 5000) {
  const url = `${IG_CONFIG.baseUrl}/${IG_CONFIG.apiVersion}/${creationId}`;

  for (let i = 0; i < maxRetries; i++) {
    const params = new URLSearchParams({
      fields: 'status_code,status',
      access_token: IG_CONFIG.pageAccessToken,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    console.log(`  Container status: ${data.status_code}`);

    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') throw new Error(`Container error: ${data.status}`);

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('Container did not become ready in time');
}

/**
 * Step 3: Publish the media container
 */
async function publishMedia(creationId) {
  const url = `${IG_CONFIG.baseUrl}/${IG_CONFIG.apiVersion}/${IG_CONFIG.instagramAccountId}/media_publish`;

  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: IG_CONFIG.pageAccessToken,
  });

  const response = await fetch(`${url}?${params}`, { method: 'POST' });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Publish failed: ${data.error.message}`);
  }

  return data.id; // Published media ID
}

/**
 * Post a Carousel of images to Instagram
 */
async function postCarousel(imageUrls, caption = '') {
  console.log(`\nCreating Carousel with ${imageUrls.length} images...`);

  const itemIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`  → Processing item ${i + 1}/${imageUrls.length}: ${imageUrls[i]}`);
    const itemId = await createMediaContainer(imageUrls[i], true);
    await waitForContainer(itemId);
    itemIds.push(itemId);
  }

  console.log('  → Creating carousel container...');
  const carouselId = await createCarouselContainer(itemIds, caption);
  
  console.log('  → Waiting for carousel container to be ready...');
  await waitForContainer(carouselId);

  console.log('  → Publishing carousel...');
  const mediaId = await publishMedia(carouselId);
  console.log(`✨ Carousel Posted! Media ID: ${mediaId}`);

  return mediaId;
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

/**
 * @param {string[]} store - Array of public URLs for the images
 */
async function postimages(store) {
  console.log('Starting Instagram posting (Carousel Mode)...\n');

  // 1. Validate config
  if (!IG_CONFIG.pageAccessToken) {
      throw new Error('IG_PAGE_ACCESS_TOKEN is not set in .env');
  }
  if (!IG_CONFIG.instagramAccountId) throw new Error('IG_ACCOUNT_ID is not set in .env');

  // 2. Validate input
  if (!store || !store.length) {
    console.log('No images to post.');
    return;
  }

  console.log(`Found ${store.length} images to post.`);

  try {
    const mediaId = await postCarousel(store, 'New handcrafted Indian Kalamkari art wallpapers! #Kalamkari #Art #Wallpapers');
    return { success: true, mediaId };
  } catch (err) {
    console.error(`Failed to post carousel: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { postimages };

// Run directly only if this is the main module
if (require.main === module) {
    // If running directly, we'd need some URLs. 
    // For now, we'll just log that it should be called via test-prompt.js or with args.
    console.log("Post script loaded. Call postimages(urls) to publish.");
}