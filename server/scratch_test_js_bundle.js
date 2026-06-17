const https = require('https');

function getUrlContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const htmlUrl = 'https://travnify-ghns.vercel.app/';
  console.log(`Fetching HTML from ${htmlUrl}...`);
  const html = await getUrlContent(htmlUrl);

  const match = html.match(/src="(\/assets\/index-[a-zA-Z0-9_\-]+\.js)"/);
  if (!match) {
    console.error('Could not find index JS bundle in HTML!');
    console.log(html);
    return;
  }

  const jsUrl = `${htmlUrl.slice(0, -1)}${match[1]}`;
  console.log(`Found index JS bundle URL: ${jsUrl}`);
  console.log('Downloading JS bundle...');
  const js = await getUrlContent(jsUrl);

  console.log('\nScanning JS bundle for multi-currency elements...');
  
  const checks = [
    { name: 'preferredCurrency', pattern: /preferredCurrency/ },
    { name: 'Currency auto-set string', pattern: /Currency auto-set to/ },
    { name: 'Charged in string', pattern: /Charged in.*via Razorpay/ },
    { name: 'Approx price string', pattern: /Approx.*month/i }
  ];

  let allOk = true;
  for (const check of checks) {
    const found = check.pattern.test(js);
    console.log(`- ${check.name}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (!found) allOk = false;
  }

  if (allOk) {
    console.log('\n🎉 SUCCESS: The live Vercel production deployment has our latest code!');
  } else {
    console.log('\n⚠️ WARNING: The live Vercel production deployment does NOT yet have the latest code. Build/deploy might still be in progress on Vercel.');
  }
}

run().catch(console.error);
