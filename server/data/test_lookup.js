const db = require('./known_cities.json');
const cities = db.cities;
const regions = db.regions;

function destinationMatches(key, dest) {
  if (key === dest) return true;
  if (key.length < 4) return false;
  const keyEscaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fwdTest = new RegExp('(^|[\\s,])' + keyEscaped + '([\\s,]|$)').test(dest);
  if (fwdTest) return true;
  if (dest.length >= 4) {
    const primEscaped = dest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[\\s,])' + primEscaped + '([\\s,]|$)').test(key);
  }
  return false;
}

function testLookup(dest) {
  const primaryToken = dest.toLowerCase().split(',')[0].trim();
  let found = null, type = '';
  for (const [key, ct] of Object.entries(cities)) {
    if (destinationMatches(key, primaryToken)) { found = ct; type = 'city'; break; }
  }
  if (!found) {
    for (const [key, reg] of Object.entries(regions)) {
      if (destinationMatches(key, primaryToken)) { found = reg; type = 'region'; break; }
    }
  }
  if (found) {
    if (type === 'city') {
      console.log('CITY   OK:', dest, '->', found.name, '|', found.landmarks.slice(0,2).join(', '));
    } else {
      console.log('REGION OK:', dest, '->', found.name, '| cities:', (found.cities||[]).slice(0,3).join(', '));
    }
  } else {
    console.log('FALLBACK  :', dest, '(generic descriptions)');
  }
}

const tests = [
  'Marrakech, Morocco', 'Kyiv, Ukraine', 'Cusco, Peru', 'Doha, Qatar',
  'Manila, Philippines', 'Oslo, Norway', 'Valletta, Malta', 'Samarkand, Uzbekistan',
  'Tunis, Tunisia', 'Kigali, Rwanda', 'Victoria Falls, Zimbabwe', 'Lahore, Pakistan',
  'Port of Spain, Trinidad', 'Kampala, Uganda', 'Bagan, Myanmar',
  'Ulaanbaatar, Mongolia', 'Edinburgh, Scotland', 'Paris, France', 'Tokyo, Japan',
  'New York, USA', 'Bihar, India', 'Punjab, India', 'Rajasthan, India',
  'Scotland', 'Tuscany', 'Morocco', 'Norway', 'Wakanda', 'Lagos, Nigeria',
  'Krakow, Poland', 'Warsaw, Poland', 'Bucharest, Romania', 'Muscat, Oman',
  'Nukualofa, Tonga', 'Caracas, Venezuela', 'Montevideo, Uruguay',
  'Port Vila, Vanuatu', 'Paramaribo, Suriname', 'Skopje', 'Freetown',
];
console.log('Testing', tests.length, 'destinations...\n');
tests.forEach(testLookup);
