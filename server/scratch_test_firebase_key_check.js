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
  const jsUrl = 'https://travnify-ghns.vercel.app/assets/index-wJ4xe8C9.js';
  console.log(`Downloading JS bundle from ${jsUrl}...`);
  const js = await getUrlContent(jsUrl);

  console.log('\nSearching for Google/Firebase API Keys (starting with "AIzaSy")...');
  
  // Find all matches for API keys
  const regex = /AIzaSy[a-zA-Z0-9_\-]{33}/g;
  const matches = js.match(regex) || [];
  
  console.log(`Found ${matches.length} matches:`);
  
  // Exclude known local keys if any to see if there is another key
  const knownKeys = {
    'AIzaSyAMjTDce2g2KCqP-vJ5w8_CsWRI4mCtlRc': 'Gemini API Key',
    'AIzaSyARuty_5PUWfyenuxxZ0YGjJnwb8vUlOP4': 'Google Places API Key'
  };

  let firebaseKeyFound = false;
  for (const match of matches) {
    const label = knownKeys[match] || 'Unknown Key (Likely Firebase API Key)';
    console.log(`- ${match} (${label})`);
    if (!knownKeys[match]) {
      firebaseKeyFound = true;
    }
  }

  if (firebaseKeyFound) {
    console.log('\n🎉 SUCCESS: A valid Firebase API Key is successfully compiled into the production bundle!');
  } else {
    console.log('\n❌ ERROR: No Firebase API Key found in the bundle! The bundle might crash on launch.');
  }
}

run().catch(console.error);
