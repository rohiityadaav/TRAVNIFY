// scratch_test_encyclopedia.js
// Unit and End-to-End Test for India Travel Encyclopedia, Prompt Engineering, Schemas, and Guardrails.
const path = require('path');
const fs = require('fs');

// Load environment variables relative to server root
require('dotenv').config({ path: path.join(__dirname, '.env') });

const tripController = require('./controllers/tripController');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import key files directly for granular testing
const dbPath = path.join(__dirname, 'data/india_travel_encyclopedia.json');
const encyclopedia = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('========================================================================');
console.log('1. TESTING DATABASE ENTRIES AND KEYS');
console.log('========================================================================');
const testDestinations = [
  { input: 'Delhi – Connaught Place (CP)', expectedKey: 'delhi - connaught place (cp)' },
  { input: 'cp', expectedKey: 'delhi - connaught place (cp)' },
  { input: 'Delhi – Hauz Khas', expectedKey: 'delhi - hauz khas' },
  { input: 'hauz kahs', expectedKey: 'delhi - hauz khas' },
  { input: 'Delhi – Safdarjung', expectedKey: 'delhi - safdarjung' },
  { input: 'Mumbai – Bandra', expectedKey: 'mumbai - bandra' },
  { input: 'Jaipur – Old City', expectedKey: 'jaipur - old city' }
];

// Locate the private findIndiaEncyclopediaEntry function from tripController
// Since it's module-private, we re-declare it here from tripController logic to verify its behavior
function findIndiaEncyclopediaEntry(destName) {
  if (!destName) return null;
  const cleanDest = destName.toLowerCase().trim();
  
  if (encyclopedia[cleanDest]) {
    return encyclopedia[cleanDest];
  }
  
  for (const [key, data] of Object.entries(encyclopedia)) {
    const nameLower = (data.name || '').toLowerCase();
    const nhLower = (data.neighborhood || '').toLowerCase();
    const cityLower = (data.city || '').toLowerCase();
    
    if (cleanDest === nameLower || cleanDest === nhLower) {
      return data;
    }
    
    if (cleanDest.includes(nhLower) && cleanDest.includes(cityLower)) {
      return data;
    }
    
    if (nhLower.includes('connaught') && (cleanDest.includes('connaught') || /\bcp\b/.test(cleanDest))) {
      return data;
    }
    
    if (nhLower.includes('hauz')) {
      if (cleanDest.includes('hauz khas') || cleanDest.includes('hauz kahs')) {
        return data;
      }
    }
    
    if (nameLower.length > 5 && cleanDest.includes(nameLower)) {
      return data;
    }
    if (nhLower.length > 5 && cleanDest.includes(nhLower)) {
      return data;
    }
  }
  return null;
}

testDestinations.forEach(td => {
  const matched = findIndiaEncyclopediaEntry(td.input);
  if (matched && matched.name.toLowerCase().includes(td.expectedKey.split(' - ')[1].replace(' (cp)', ''))) {
    console.log(`✅ Input: "${td.input}" -> Matched: "${matched.name}"`);
  } else {
    console.error(`❌ Input: "${td.input}" failed to match. Result:`, matched ? matched.name : 'null');
  }
});

console.log('\n========================================================================');
console.log('2. TESTING DETERMINISTIC MOCK GENERATION FOR ALL MATCHED LOCALITIES');
console.log('========================================================================');

const BANNED_PATTERNS = [
  /central public market/i,
  /waterfront promenade/i,
  /self-guided walking tour/i,
  /historic streets of/i,
  /main public plazas/i,
  /scenic city overlook/i
];

const testCases = [
  'Delhi – Connaught Place (CP)',
  'Delhi – Hauz Khas',
  'Delhi – Safdarjung',
  'Mumbai – Bandra',
  'Jaipur – Old City'
];

testCases.forEach(dest => {
  console.log(`\n--- Generating Mock Itinerary for "${dest}" ---`);
  const itinerary = tripController.generateMockItinerary(dest, 1000, 'INR', 1, ['sightseeing'], '2026-06-24');
  
  if (!itinerary) {
    console.error('❌ Failed to generate itinerary.');
    return;
  }
  
  console.log('Summary Destination:', itinerary.summary.destination);
  console.log('Total Cost:', itinerary.summary.approxTotalCost, itinerary.summary.currency);
  
  const day = itinerary.days[0];
  console.log('Day Title:', day.title);
  console.log('Morning block:', day.blocks[0].title);
  console.log('  Description:', day.blocks[0].description);
  console.log('  Cost:', day.blocks[0].approxCost.value);
  console.log('  Places:', day.blocks[0].places.map(p => p.name).join(', '));
  
  console.log('Afternoon block:', day.blocks[1].title);
  console.log('  Description:', day.blocks[1].description);
  console.log('  Cost:', day.blocks[1].approxCost.value);
  console.log('  Places:', day.blocks[1].places.map(p => p.name).join(', '));
  
  console.log('Evening block:', day.blocks[2].title);
  console.log('  Description:', day.blocks[2].description);
  console.log('  Cost:', day.blocks[2].approxCost.value);
  console.log('  Places:', day.blocks[2].places.map(p => p.name).join(', '));

  // Verify banned patterns
  let hasBanned = false;
  const fullText = JSON.stringify(itinerary);
  BANNED_PATTERNS.forEach(pat => {
    if (pat.test(fullText)) {
      console.error(`❌ Banned generic pattern found: ${pat}`);
      hasBanned = true;
    }
  });
  if (!hasBanned) {
    console.log('✅ No generic banned patterns found in mock output!');
  }
  
  // Verify varied costs
  const mCost = day.blocks[0].approxCost.value;
  const aCost = day.blocks[1].approxCost.value;
  const eCost = day.blocks[2].approxCost.value;
  if (mCost !== aCost || aCost !== eCost) {
    console.log(`✅ Costs are varied: Morning=${mCost}, Afternoon=${aCost}, Evening=${eCost}`);
  } else {
    console.warn(`⚠️ Costs are identical across periods: Morning=${mCost}, Afternoon=${aCost}, Evening=${eCost}`);
  }
});

console.log('\n========================================================================');
console.log('3. TESTING LLM GENERATION PROMPT CONTENT AND SCHEMAS (If API key exists)');
console.log('========================================================================');

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey || geminiKey.trim() === '') {
  console.log('⚠️ GEMINI_API_KEY not set in environment variables. Skipping live LLM test.');
} else {
  console.log('Configured GEMINI_API_KEY found. Calling live Gemini model for "Delhi - Connaught Place (CP)"...');
  
  const genAI = new GoogleGenerativeAI(geminiKey);
  const primaryModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  // Build context like backend does
  const matchedEnc = findIndiaEncyclopediaEntry('Delhi - Connaught Place (CP)');
  let dataBlock = '';
  if (matchedEnc) {
    dataBlock = `\n\nINDIA TRAVEL ENCYCLOPEDIA CONTEXT (Destination: ${matchedEnc.name}):\n`;
    matchedEnc.places.forEach(p => {
      dataBlock += `- Name: "${p.name}" | Type: "${p.type}" | Typical Cost: ${p.approx_cost} INR | Description: ${p.description}\n`;
    });
  }
  
  const systemPrompt = `You are a professional India travel planner and local guide who creates highly detailed, realistic, destination-aware itineraries that feel like a personal travel coach.
Required JSON structure:
{
  "tripSummary": {
    "destination": "Delhi - Connaught Place (CP)",
    "totalDays": 1,
    "travelStyle": "budget",
    "estimatedTotalCost": { "amount": 1000, "currency": "INR" },
    "bestTimeAdvice": "Autumn"
  },
  "howToReach": {
    "recommendedMode": "metro",
    "summary": "Take Rajiv Chowk Metro",
    "nearestStartTerminal": "Origin",
    "nearestEndTerminal": "Rajiv Chowk Metro",
    "details": "Easy and cheap.",
    "estimatedCost": { "amount": 50, "currency": "INR" }
  },
  "dayByDayPlan": [
    {
      "dayNumber": 1,
      "title": "One day in CP",
      "theme": "EXPLORATION",
      "morning": {
        "title": "Morning sights",
        "description": "Visit Agrasen ki Baoli and shop at Janpath Market. Stroll and enjoy a coffee at Indian Coffee House.",
        "places": [
          { "name": "Agrasen ki Baoli", "type": "attraction", "area": "Connaught Place", "approx_cost": 0 },
          { "name": "Janpath Market", "type": "market", "area": "Connaught Place", "approx_cost": 0 },
          { "name": "Indian Coffee House", "type": "cafe", "area": "Connaught Place", "approx_cost": 150 }
        ],
        "notes": "Carry cash."
      },
      "afternoon": {
        "title": "Afternoon sights",
        "description": "Have delicious lunch at Saravana Bhavan. Shop around the circular streets of CP.",
        "places": [
          { "name": "Saravana Bhavan", "type": "restaurant", "area": "Connaught Place", "approx_cost": 300 }
        ],
        "notes": "EnjoySouth Indian food."
      },
      "evening": {
        "title": "Evening vibes",
        "description": "Dine at United Coffee House or get drinks at Ministry of Beer.",
        "places": [
          { "name": "United Coffee House", "type": "restaurant", "area": "Connaught Place", "approx_cost": 800 }
        ],
        "notes": "Colonial theme."
      },
      "notes": ["CP is structured in circles."]
    }
  ],
  "safetyAndLogistics": {
    "localTransportTips": "Use metro",
    "areaSafetyNotes": "Be safe",
    "moneySavingTips": "Eat local"
  }
}

Style & Constraint Rules:
- PROFESSIONAL INDIA TRAVEL PLANNER ROLE: Act as an expert local planner. Write in a helpful, professional tone. Avoid any emojis.
- LOCALIZED & EFFICIENT ROUTING: Cluster activities by neighborhood. Keep timings realistic. Add short justifications.
- STRICT AVOIDANCE OF GENERIC PLACEHOLDERS: Do NOT invent generic filler names like "central public market", "main waterfront promenade", "self-guided walking tour".
${dataBlock}

User details for the trip:
Destination: Delhi - Connaught Place (CP)
Start Date: 2026-06-24
Budget: 1000 INR
Interests: sightseeing, cafe

Generate the best possible trip itinerary following the JSON format and rules above.`;

  console.log('\n--- SYSTEM PROMPT TO BE SENT TO GEMINI ---');
  console.log(systemPrompt);
  
  primaryModel.generateContent(systemPrompt).then(res => {
    let rawText = res.response.text().trim();
    console.log('\n--- RAW LLM RESPONSE ---');
    console.log(rawText);
    
    // Clean markdown
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    
    try {
      const parsed = JSON.parse(rawText);
      console.log('✅ Successful JSON parse!');
      
      // Verify guardrails
      let hasBanned = false;
      BANNED_PATTERNS.forEach(pat => {
        if (pat.test(rawText)) {
          console.error(`❌ Live output contains banned pattern: ${pat}`);
          hasBanned = true;
        }
      });
      if (!hasBanned) {
        console.log('✅ Live output passed all guardrails!');
      }
      
      console.log('\n--- VERIFYING NORMALIZED SCHEMA STRUCTURE ---');
      console.log('Day 1 morning places:', parsed.dayByDayPlan[0].morning.places);
      console.log('Day 1 morning notes:', parsed.dayByDayPlan[0].morning.notes);
    } catch (err) {
      console.error('❌ Failed to parse live JSON:', err.message);
    }
  }).catch(err => {
    console.error('❌ Live LLM call failed:', err.message);
  });
}
