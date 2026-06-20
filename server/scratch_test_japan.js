const https = require('https');

const RENDER_BASE = 'https://travnify.onrender.com';

function httpsRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Fetching JWT token...');
  const sync = await httpsRequest(`${RENDER_BASE}/api/auth/firebase-sync`, 'POST', {
    email: 'rajdeepyadavv125@gmail.com',
    name: 'raj',
    country: 'IN',
    emailVerified: true,
  });

  if (!sync.body.token) {
    console.error('Failed to get token');
    return;
  }
  const token = sync.body.token;

  console.log('Generating trip for Japan...');
  const res = await httpsRequest(`${RENDER_BASE}/api/generateTrip`, 'POST', {
    prompt: 'Japan trip, budget 200000 JPY, 4 days, interests: food, culture',
    destination: 'Japan',
    budget: 200000,
    currency: 'JPY',
    startDate: '2026-07-01',
    endDate: '2026-07-04',
    interests: ['food', 'culture']
  }, {
    Authorization: `Bearer ${token}`
  });

  console.log('Status:', res.status);
  console.log('Itinerary Response:\n', JSON.stringify(res.body.itinerary, null, 2));
}

run().catch(console.error);
