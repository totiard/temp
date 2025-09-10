export default {
  async fetch(request, env, ctx) {
    // GANTI DENGAN PLACE ID BISNIS ANDA
    const PLACE_ID = 'ChIJ3S-pM0-uQS4R4QAS2LpAl4A'; 

    // API Key diambil dari secret yang sudah kita set
    const API_KEY = env.GOOGLE_API_KEY;

    // URL untuk mengambil detail tempat, termasuk ulasan (reviews)
    // language=id agar ulasan seperti "a month ago" menjadi "sebulan yang lalu"
    const GOOGLE_API_URL = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${PLACE_ID}&fields=name,rating,reviews&key=${API_KEY}&language=id`;

    // Menggunakan Cache API dari Cloudflare untuk efisiensi
    const cache = caches.default;
    let response = await cache.match(request);

    if (!response) {
      console.log('Cache miss. Fetching from Google API...');
      const googleResponse = await fetch(GOOGLE_API_URL);

      if (!googleResponse.ok) {
        return new Response('Failed to fetch from Google API', { status: googleResponse.status });
      }

      const data = await googleResponse.json();
      
      // Mengambil hanya bagian ulasan dari data
      const reviews = data.result.reviews;

      // Membuat response baru untuk dikirim ke frontend
      response = new Response(JSON.stringify(reviews), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Ganti '*' dengan domain Anda untuk keamanan
          // Cache di browser selama 5 menit, dan di Edge Cloudflare selama 12 jam
          'Cache-Control': 'public, max-age=300, s-maxage=43200', 
        },
      });

      // Simpan response ke cache agar permintaan selanjutnya lebih cepat
      ctx.waitUntil(cache.put(request, response.clone()));
    } else {
      console.log('Cache hit. Serving from cache.');
    }
    
    return response;
  },
};
