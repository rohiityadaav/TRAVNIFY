// scratch_test_encyclopedia.js
// Global Unit and End-to-End Test for World Travel Encyclopedia, Prompt Engineering, Schemas, and Guardrails.
const path = require('path');
const fs = require('fs');

// Load environment variables relative to server root
require('dotenv').config({ path: path.join(__dirname, '.env') });

const tripController = require('./controllers/tripController');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load the world travel encyclopedia
const encPath = path.join(__dirname, 'data/world_travel_encyclopedia.json');
const encyclopedia = JSON.parse(fs.readFileSync(encPath, 'utf8'));

console.log('========================================================================');
console.log('1. TESTING WORLD TRAVEL ENCYCLOPEDIA STRUCTURE');
console.log('========================================================================');

const continents = Object.keys(encyclopedia.continents || {});
console.log(`  Found ${continents.length} continents:`, continents.join(', '));

let totalAreas = 0;
let totalPlaces = 0;
for (const [contKey, cont] of Object.entries(encyclopedia.continents || {})) {
  for (const [countKey, country] of Object.entries(cont.countries || {})) {
    for (const [stateKey, state] of Object.entries(country.statesOrRegions || {})) {
      for (const [cityKey, city] of Object.entries(state.cities || {})) {
        for (const [areaKey, area] of Object.entries(city.areas || {})) {
          totalAreas++;
          totalPlaces += (area.places || []).length;
        }
      }
    }
  }
}
console.log(`  Found ${totalAreas} areas / neighborhoods with ${totalPlaces} curated places.`);

console.log('\n========================================================================');
console.log('2. TESTING findGlobalDestination MATCHING');
console.log('========================================================================');

const testDestinations = [
  { input: 'Delhi – Connaught Place (CP)', expected: 'Connaught Place' },
  { input: 'cp', expected: 'Connaught Place' },
  { input: 'Delhi – Hauz Khas', expected: 'Hauz Khas' },
  { input: 'hauz kahs', expected: 'Hauz Khas' },
  { input: 'Mumbai – Bandra', expected: 'Bandra' },
  { input: 'Jaipur', expected: 'Jaipur' },
  { input: 'Paris', expected: 'Paris' },
  { input: 'Montmartre', expected: 'Montmartre' },
  { input: 'Tokyo', expected: 'Tokyo' },
  { input: 'Shibuya', expected: 'Shibuya' },
  { input: 'New York City', expected: 'New York' },
  { input: 'Times Square', expected: 'Times Square' },
  { input: 'Brooklyn', expected: 'Brooklyn' }
];

testDestinations.forEach(td => {
  const matched = tripController.findGlobalDestinationPublic(td.input);
  if (matched) {
    const nameInc = (matched.name || '').toLowerCase().includes(td.expected.toLowerCase()) ||
      (matched.neighborhood || '').toLowerCase().includes(td.expected.toLowerCase()) ||
      (matched.city || '').toLowerCase().includes(td.expected.toLowerCase());
    if (nameInc) {
      console.log(`  ✅ Input: "${td.input}" -> Matched: "${matched.name || matched.city}" (${matched.matchType})`);
    } else {
      console.warn(`  ⚠️  Input: "${td.input}" -> Matched but unexpected: "${matched.name || matched.city}" (expected: ${td.expected})`);
    }
  } else {
    console.error(`  ❌ Input: "${td.input}" -> No match found (expected: ${td.expected})`);
  }
});

console.log('\n========================================================================');
console.log('3. TESTING MOCK ITINERARY GENERATION FOR ALL ENCYCLOPEDIA DESTINATIONS');
console.log('========================================================================');

const BANNED_PATTERNS = [
  /central public market/i,
  /waterfront promenade/i,
  /self-guided walking tour/i,
  /historic streets of/i,
  /main public plazas/i,
  /scenic city overlook/i
];

const mockTestCases = [
  { dest: 'Delhi – Connaught Place (CP)', currency: 'INR', budget: 1500 },
  { dest: 'Delhi – Hauz Khas', currency: 'INR', budget: 2000 },
  { dest: 'Mumbai – Bandra', currency: 'INR', budget: 3000 },
  { dest: 'Paris', currency: 'EUR', budget: 300 },
  { dest: 'Tokyo – Shibuya', currency: 'JPY', budget: 15000 },
  { dest: 'New York City', currency: 'USD', budget: 200 }
];

mockTestCases.forEach(tc => {
  console.log(`\n--- Generating Mock Itinerary for "${tc.dest}" (${tc.currency}) ---`);
  const itinerary = tripController.generateMockItinerary(tc.dest, tc.budget, tc.currency, 1, ['sightseeing'], '2026-06-24');

  if (!itinerary) {
    console.error('  ❌ Failed to generate itinerary.');
    return;
  }

  console.log(`  Summary Destination: ${itinerary.summary.destination}`);
  console.log(`  Total Cost: ${itinerary.summary.approxTotalCost} ${itinerary.summary.currency}`);

  const day = itinerary.days[0];
  if (day) {
    console.log(`  Day Title: ${day.title}`);
    if (day.blocks && day.blocks[0]) {
      console.log(`  Morning: ${day.blocks[0].title}`);
      const mPlaces = (day.blocks[0].places || []).map(p => p.name).join(', ');
      if (mPlaces) console.log(`    Places: ${mPlaces}`);
    }
    if (day.blocks && day.blocks[1]) {
      console.log(`  Afternoon: ${day.blocks[1].title}`);
    }
    if (day.blocks && day.blocks[2]) {
      console.log(`  Evening: ${day.blocks[2].title}`);
    }
  }

  // Check for banned patterns
  const fullText = JSON.stringify(itinerary);
  let hasBanned = false;
  BANNED_PATTERNS.forEach(pat => {
    if (pat.test(fullText)) {
      console.error(`  ❌ Banned generic pattern found: ${pat}`);
      hasBanned = true;
    }
  });
  if (!hasBanned) {
    console.log('  ✅ No banned generic patterns found!');
  }
});

console.log('\n========================================================================');
console.log('4. TESTING LIVE GEMINI LLM GENERATION (If API key exists)');
console.log('========================================================================');

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey || geminiKey.trim() === '') {
  console.log('  ⚠️ GEMINI_API_KEY not set. Skipping live LLM test.');
} else {
  console.log('  Configured GEMINI_API_KEY found. Testing with "Montmartre, Paris"...');

  const genAI = new GoogleGenerativeAI(geminiKey);
  const primaryModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Simulate the global encyclopedia context build
  let dataBlock = '\n\nWORLD TRAVEL ENCYCLOPEDIA CONTEXT (Destination: Paris - Montmartre):\n';
  const cont = encyclopedia.continents.europe;
  if (cont) {
    const france = cont.countries.france;
    if (france) {
      const ile = france.statesOrRegions['ile-de-france'];
      if (ile) {
        const paris = ile.cities.paris;
        if (paris && paris.areas && paris.areas.montmartre) {
          paris.areas.montmartre.places.forEach(p => {
            dataBlock += `- Name: "${p.name}" | Type: "${p.type}" | Cost: ${p.approx_cost} ${p.currency} | ${p.description}\n`;
          });
        }
      }
    }
  }

  const systemPrompt = `You are a professional global travel planner and local expert.
Generate a 1-day itinerary for Montmartre, Paris.
${dataBlock}
CRITICAL: Use ONLY the listed real venues above. Do NOT use generic text like "central public market" or "self-guided walking tour".
Output ONLY raw JSON following this schema:
{
  "tripSummary": { "destination": "Paris - Montmartre", "totalDays": 1, "travelStyle": "budget", "estimatedTotalCost": { "amount": 60, "currency": "EUR" }, "bestTimeAdvice": "Spring or Autumn" },
  "howToReach": { "recommendedMode": "metro", "summary": "Take Metro Line 2 to Abbesses station.", "nearestStartTerminal": "Paris city center", "nearestEndTerminal": "Abbesses Metro", "details": "The Abbesses Metro station on Line 2 drops you right in Montmartre.", "estimatedCost": { "amount": 2, "currency": "EUR" } },
  "dayByDayPlan": [{
    "dayNumber": 1, "title": "Day in Montmartre", "theme": "CULTURE",
    "morning": { "title": "Sacre-Coeur and Place du Tertre", "description": "Detailed morning plan.", "places": [{ "name": "Sacré-Cœur Basilica", "type": "attraction", "area": "Montmartre", "approx_cost": 0 }], "notes": "Go early to avoid crowds." },
    "afternoon": { "title": "Café des Deux Moulins lunch", "description": "Detailed afternoon plan.", "places": [{ "name": "Café des Deux Moulins", "type": "cafe", "area": "Montmartre", "approx_cost": 12 }], "notes": "" },
    "evening": { "title": "La Cigale evening show", "description": "Detailed evening plan.", "places": [{ "name": "La Cigale", "type": "nightlife", "area": "Montmartre", "approx_cost": 45 }], "notes": "" },
    "notes": ["Wear comfortable shoes for cobblestone streets."]
  }],
  "safetyAndLogistics": { "localTransportTips": "Use Paris Metro.", "areaSafetyNotes": "Keep belongings safe.", "moneySavingTips": "Visit Sacre-Coeur for free." }
}
Budget: 60 EUR | Interests: culture, cafes | Trip: 1 day in Montmartre.
Generate the full itinerary now.`;

  primaryModel.generateContent(systemPrompt).then(res => {
    let rawText = res.response.text().trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    try {
      const parsed = JSON.parse(rawText);
      console.log('  ✅ Successful JSON parse from live LLM!');
      console.log('  Destination:', parsed.tripSummary?.destination);
      console.log('  Day 1 morning:', parsed.dayByDayPlan?.[0]?.morning?.title);
      const places = parsed.dayByDayPlan?.[0]?.morning?.places?.map(p => p.name).join(', ');
      console.log('  Places (morning):', places);

      let hasBanned = false;
      BANNED_PATTERNS.forEach(pat => {
        if (pat.test(rawText)) {
          console.error(`  ❌ Live output contains banned pattern: ${pat}`);
          hasBanned = true;
        }
      });
      if (!hasBanned) {
        console.log('  ✅ Live output passed all guardrails!');
      }
    } catch (err) {
      console.error('  ❌ Failed to parse live JSON:', err.message);
      console.log('  Raw response (first 500 chars):', rawText.substring(0, 500));
    }
  }).catch(err => {
    console.error('  ❌ Live LLM call failed:', err.message);
  });
}
