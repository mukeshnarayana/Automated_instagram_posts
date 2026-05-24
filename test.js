const path = require('path');

// Try absolute path first (correct location)
require('dotenv').config({ path: 'C:\\personal\\automate_instagrsm\\.env' });

// Fallback to relative (in case __dirname is weird)
if (!process.env.page_access_token) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

console.log('ENV PATH:', path.join(__dirname, '../../.env'));
console.log('TOKEN:', process.env.page_access_token ? 'FOUND' : 'NOT FOUND');

async function test() {
  try {
    const baseUrl = `https://graph.facebook.com/v25.0`;
    const instaid = process.env.instaid;
    const token = process.env.page_access_token;

    console.log('1. Creating child container 1...');
    const res1 = await fetch(`${baseUrl}/${instaid}/media?image_url=https://storage.googleapis.com/automate_insta/rawimages/image_1779628813543_1.jpg&is_carousel_item=true&access_token=${token}`, { method: 'POST' });
    const d1 = await res1.json();
    console.log('Child 1 Response:', d1);

    console.log('2. Creating child container 2...');
    const res2 = await fetch(`${baseUrl}/${instaid}/media?image_url=https://storage.googleapis.com/automate_insta/rawimages/image_1779628814289_2.jpg&is_carousel_item=true&access_token=${token}`, { method: 'POST' });
    const d2 = await res2.json();
    console.log('Child 2 Response:', d2);

    if (!d1.id || !d2.id) {
      console.log('Failed to create child containers. Stopping.');
      return;
    }

    console.log('3. Waiting 5 seconds for child containers to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('4. Creating parent carousel container...');
    const carouselUrl = `${baseUrl}/${instaid}/media`;
    const carouselParams = new URLSearchParams({
      media_type: 'CAROUSEL',
      children: `${d1.id},${d2.id}`,
      caption: 'Test Carousel Posting with simple delay!',
      access_token: token,
    });
    const carouselRes = await fetch(`${carouselUrl}?${carouselParams}`, { method: 'POST' });
    const carouselData = await carouselRes.json();
    console.log('Carousel Container Response:', carouselData);

    if (!carouselData.id) {
      console.log('Failed to create carousel container.');
      return;
    }

    console.log('5. Waiting 5 seconds for carousel container to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('6. Publishing carousel container...');
    const publishUrl = `${baseUrl}/${instaid}/media_publish`;
    const publishParams = new URLSearchParams({
      creation_id: carouselData.id,
      access_token: token,
    });
    const publishRes = await fetch(`${publishUrl}?${publishParams}`, { method: 'POST' });
    const publishData = await publishRes.json();
    console.log('Publish Response:', publishData);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();