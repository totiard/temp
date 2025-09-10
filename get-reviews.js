// File: functions/get-reviews.js

export async function onRequest(context) {
  // 1. KONFIGURASI
  // GANTI DENGAN PLACE ID BISNIS ANDA
  const PLACE_ID = 'ChIJEblRIl3xaS4R9plyZzp4I5k'; 

  // API Key akan diambil dari environment variable yang kita set di dashboard
  const API_KEY = context.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    return new Response('API key is not set', { status: 500 });
  }

  // URL API Google. Kita minta field nama, rating, dan ulasan.
  const GOOGLE_API_URL = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${PLACE_ID}&fields=name,rating,reviews&key=${API_KEY}&language=id`;
  
  try {
    // 2. MENGAMBIL DATA DARI GOOGLE
    const googleResponse = await fetch(GOOGLE_API_URL);
    if (!googleResponse.ok) {
      throw new Error(`Google API responded with status: ${googleResponse.status}`);
    }
    const data = await googleResponse.json();
    const reviews = data.result.reviews || [];

    // 3. MENGIRIMKAN DATA KE FRONTEND
    // Data ulasan dikirim sebagai JSON.
    // Header Cache-Control penting untuk efisiensi dan penghematan biaya.
    return new Response(JSON.stringify(reviews), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=43200' // Cache 5 menit di browser, 12 jam di server Cloudflare
      },
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response('Failed to fetch reviews', { status: 500 });
  }
}
