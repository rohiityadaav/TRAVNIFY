/*
 * File Path: server/controllers/discoverController.js
 * Environment Variable: GEMINI_API_KEY
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const db = require('../db');
const authController = require('./authController');

// Initialize Gemini if key is provided
let genAI = null;
if (config.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    console.log('Gemini AI Engine for Discovery Initialized Successfully.');
  } catch (err) {
    console.error('Error initializing Gemini AI Engine for Discovery:', err);
  }
} else {
  console.warn('WARNING: Required GEMINI_API_KEY environment variable is missing on server startup. Discovery features will return service unavailable.');
}

// POST /api/discover/hidden-gems
exports.getHiddenGems = async (req, res) => {
  const user = req.userId ? db.users.findById(req.userId) : null;
  const query = req.body.query || req.query.query;

  console.log(`[POST /api/discover/hidden-gems] Received search query: "${query}"`);

  if (!query) {
    return res.status(400).json({ error: 'Missing query in request body or parameters' });
  }

  // Premium gate check
  if (!user || !user.isPremium) {
    console.log(`[Premium Gate] User is not premium. Denying access to hidden gems.`);
    return res.status(403).json({ 
      code: 'PREMIUM_REQUIRED',
      error: 'Upgrade to TRAVNIFY Premium to unlock Hidden gems.' 
    });
  }

  // Initialize Gemini dynamically if not already done
  if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
    try {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    } catch (err) {
      console.error('Error initializing Gemini AI Engine dynamically:', err);
    }
  }

  // Check if Gemini API key is missing
  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY.trim() === '' || !genAI) {
    console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server.');
    return res.status(500).json({ error: 'AI service configuration error: GEMINI_API_KEY is missing on the server. Please configure the environment variable.' });
  }

  const preferredCurrency = req.body.preferredCurrency || (user && user.preferredCurrency) || 'USD';

  const prompt = `You are an expert travel guide. Return a JSON array of hidden-gem destinations that match the user’s query: "${query}".
Return between 3 and 4 places (CRITICAL for fast generation speed). For each destination, you must strictly return a JSON object with these EXACT keys:
- name (string)
- countryOrRegion (string)
- shortDescription (string, max 10 words. Be extremely concise.)
- bestTimeToVisit (string)
- typicalBudgetLevel (string: "cheap" | "moderate" | "expensive" — based on costs in ${preferredCurrency})

Ensure your output is pure, valid JSON with absolutely no markdown wrapper blocks, no code fences (do NOT use \`\`\`json), no leading or trailing text, and no conversational explanation. Only output a valid JSON array of objects.`;

  const startTime = Date.now();
  try {
    let text = "";
    try {
      console.log(`[POST /api/discover/hidden-gems] Starting Gemini API call at ${new Date().toISOString()} with model gemini-2.5-flash...`);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const apiCallPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI discovery request timed out after 45 seconds')), 45000)
      );
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      const response = await result.response;
      text = response.text();
    } catch (primaryError) {
      console.warn(`[POST /api/discover/hidden-gems] Primary model (gemini-2.5-flash) failed: ${primaryError.message}. Trying fallback model (gemini-2.5-flash-lite)...`);
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const fallbackCallPromise = fallbackModel.generateContent(prompt);
      const fallbackTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fallback AI discovery request timed out after 45 seconds')), 45000)
      );
      const fallbackResult = await Promise.race([fallbackCallPromise, fallbackTimeout]);
      const response = await fallbackResult.response;
      text = response.text();
    }

    console.log('[Gemini Raw Response]:', text);

    // Clean markdown code blocks if any
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const places = JSON.parse(cleaned);

    if (!Array.isArray(places) || places.length === 0) {
      throw new Error('Gemini response did not contain a non-empty array of places');
    }

    const duration = Date.now() - startTime;
    console.log(`[Gemini API Success] Successfully loaded ${places.length} hidden gems in ${duration}ms.`);
    return res.json({ places });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Gemini call failed after ${duration}ms with error details:`, err);
    return res.status(500).json({ error: err.message || 'AI service temporarily unavailable. Please contact support.' });
  }
};

// POST /api/discover/best-for-activity
const staticActivities = {
  "go karting": [
    { name: "Yas Marina Circuit", countryOrRegion: "Abu Dhabi, UAE", whyItIsGreat: "World-class Formula 1 track with an elite outdoor karting zone.", bestSeason: "October to April", approxCostBand: "expensive" },
    { name: "K1 Speed", countryOrRegion: "California, USA", whyItIsGreat: "Premium indoor electric go-karting with high-speed pro karts.", bestSeason: "Year-round", approxCostBand: "moderate" },
    { name: "Kartodromo Internacional Lucas Guerrero", countryOrRegion: "Valencia, Spain", whyItIsGreat: "Amazing professional outdoor track popular for world championships.", bestSeason: "April to October", approxCostBand: "moderate" },
    { name: "TeamSport Go Karting", countryOrRegion: "London, UK", whyItIsGreat: "Multi-level indoor track with electric karts in the heart of London.", bestSeason: "Year-round", approxCostBand: "moderate" }
  ],
  "scuba diving": [
    { name: "Great Barrier Reef", countryOrRegion: "Queensland, Australia", whyItIsGreat: "World's largest coral reef system with breathtaking marine life.", bestSeason: "June to October", approxCostBand: "expensive" },
    { name: "Blue Hole", countryOrRegion: "Belize", whyItIsGreat: "Iconic giant marine sinkhole perfect for advanced divers.", bestSeason: "Year-round", approxCostBand: "expensive" },
    { name: "Raja Ampat", countryOrRegion: "West Papua, Indonesia", whyItIsGreat: "Global epicenter of marine biodiversity and pristine coral reefs.", bestSeason: "October to April", approxCostBand: "expensive" },
    { name: "Cozumel", countryOrRegion: "Mexico", whyItIsGreat: "Incredible drift diving with vibrant reef walls and visibility.", bestSeason: "December to April", approxCostBand: "cheap" }
  ],
  "skydiving": [
    { name: "Palm Jumeirah", countryOrRegion: "Dubai, UAE", whyItIsGreat: "Preeminent skydive zone overlooking the famous palm island.", bestSeason: "November to March", approxCostBand: "expensive" },
    { name: "Queenstown", countryOrRegion: "New Zealand", whyItIsGreat: "Stunning alpine vistas and birthplace of extreme adventure sports.", bestSeason: "December to February", approxCostBand: "expensive" },
    { name: "Interlaken", countryOrRegion: "Switzerland", whyItIsGreat: "Thrilling jump over the Swiss Alps with stunning lake views.", bestSeason: "May to October", approxCostBand: "expensive" },
    { name: "Skydive Hawaii", countryOrRegion: "Oahu, Hawaii", whyItIsGreat: "Jump from up to 14,000 feet with beautiful ocean and island views.", bestSeason: "Year-round", approxCostBand: "expensive" }
  ],
  "camping": [
    { name: "Yosemite National Park", countryOrRegion: "California, USA", whyItIsGreat: "Unrivaled wilderness camping among giant sequoias and granite cliffs.", bestSeason: "May to September", approxCostBand: "cheap" },
    { name: "Lake District", countryOrRegion: "Cumbria, UK", whyItIsGreat: "Scenic lakeside camping spots amidst lush green fells.", bestSeason: "June to August", approxCostBand: "cheap" },
    { name: "Jasper National Park", countryOrRegion: "Alberta, Canada", whyItIsGreat: "Magnificent mountain camping in the heart of the Canadian Rockies.", bestSeason: "June to September", approxCostBand: "moderate" },
    { name: "Rishikesh Riverside", countryOrRegion: "Uttarakhand, India", whyItIsGreat: "Budget camping by the Ganges with river rafting adventures.", bestSeason: "October to April", approxCostBand: "cheap" }
  ],
  "street food tour": [
    { name: "Bangkok Street Food Markets", countryOrRegion: "Bangkok, Thailand", whyItIsGreat: "Vibrant night markets serving world-famous pad thai and mango sticky rice.", bestSeason: "November to February", approxCostBand: "cheap" },
    { name: "Chandni Chowk", countryOrRegion: "Delhi, India", whyItIsGreat: "Historic narrow lanes offering legendary street foods, chaat, and jalebis.", bestSeason: "October to March", approxCostBand: "cheap" },
    { name: "Penang Street Markets", countryOrRegion: "Penang, Malaysia", whyItIsGreat: "World-famous culinary destination for char kway teow and laksa.", bestSeason: "Year-round", approxCostBand: "cheap" },
    { name: "Oaxaca Centro", countryOrRegion: "Oaxaca, Mexico", whyItIsGreat: "Traditional markets offering rich moles, tlayudas, and mezcal.", bestSeason: "October to May", approxCostBand: "cheap" }
  ],
  "paintball": [
    { name: "Paintball Park at Camp Pendleton", countryOrRegion: "California, USA", whyItIsGreat: "Renowned massive outdoor tactical fields with military props.", bestSeason: "Year-round", approxCostBand: "moderate" },
    { name: "Hollywood Sports Park", countryOrRegion: "California, USA", whyItIsGreat: "Scenarios inspired by movie sets like Mad Max and Starship Troopers.", bestSeason: "Year-round", approxCostBand: "moderate" },
    { name: "Bawtry Paintball Fields", countryOrRegion: "Doncaster, UK", whyItIsGreat: "Europe's biggest paintball center with themed movie arenas.", bestSeason: "Year-round", approxCostBand: "moderate" },
    { name: "Action Star Games Paintball", countryOrRegion: "California, USA", whyItIsGreat: "Fast-paced outdoor tournament fields for speedball fans.", bestSeason: "Year-round", approxCostBand: "moderate" }
  ],
  "snorkeling": [
    { name: "Hanauma Bay", countryOrRegion: "Oahu, Hawaii", whyItIsGreat: "Protected marine life conservation area with calm, crystal clear waters.", bestSeason: "Year-round", approxCostBand: "moderate" },
    { name: "Silfra Fissure", countryOrRegion: "Thingvellir, Iceland", whyItIsGreat: "Unique snorkel between tectonic plates with unparalleled visibility.", bestSeason: "June to August", approxCostBand: "expensive" },
    { name: "Galapagos Islands", countryOrRegion: "Ecuador", whyItIsGreat: "Snorkel alongside sea lions, marine iguanas, and penguins.", bestSeason: "December to May", approxCostBand: "expensive" },
    { name: "Great Blue Hole Reefs", countryOrRegion: "Belize", whyItIsGreat: "Shallow coral gardens and clear turquoise waters near the cayes.", bestSeason: "Year-round", approxCostBand: "moderate" }
  ]
};

function isLikelyNonsense(str) {
  if (typeof str !== 'string') return true;
  const clean = str.trim().toLowerCase();
  if (clean.length < 3) return true;
  if (!/[a-z0-9]/.test(clean)) return true;
  if (/(.)\1{4,}/.test(clean)) return true;
  if (!/[aeiou]/.test(clean) && clean.length > 4) return true;
  if (clean.includes('asdf') || clean.includes('qwerty') || clean.includes('zxcv')) return true;
  return false;
}

function findStaticMatch(query) {
  const q = query.toLowerCase().trim();
  if (q.includes('kart') || q.includes('gokart')) return staticActivities['go karting'];
  if (q.includes('scuba') || (q.includes('div') && !q.includes('sky'))) return staticActivities['scuba diving'];
  if (q.includes('skydive') || q.includes('sky div') || q.includes('sky-div')) return staticActivities['skydiving'];
  if (q.includes('camp')) return staticActivities['camping'];
  if (q.includes('street food') || q.includes('food tour') || q.includes('culinary tour')) return staticActivities['street food tour'];
  if (q.includes('paintball') || q.includes('paint ball')) return staticActivities['paintball'];
  if (q.includes('snorkel')) return staticActivities['snorkeling'];

  for (const key of Object.keys(staticActivities)) {
    if (key.includes(q) || q.includes(key)) {
      return staticActivities[key];
    }
  }
  return null;
}

function generateDynamicFallbackPlaces(query, preferredCurrency = 'INR') {
  const formatted = query.charAt(0).toUpperCase() + query.slice(1);
  return [
    {
      name: `${formatted} Indoor Hub`,
      countryOrRegion: "Global Cities",
      whyItIsGreat: `Experience ${query} in a state-of-the-art urban facility.`,
      bestSeason: "Year-round",
      approxCostBand: "moderate"
    },
    {
      name: `${formatted} Adventure Park`,
      countryOrRegion: "Adventure Hubs",
      whyItIsGreat: `Exciting outdoor arenas with full safety gear and rental.`,
      bestSeason: "Spring to Autumn",
      approxCostBand: "cheap"
    },
    {
      name: `${formatted} Center`,
      countryOrRegion: "Scenic Locations",
      whyItIsGreat: `Enjoy premium sessions of ${query} with scenic backdrop.`,
      bestSeason: "Year-round",
      approxCostBand: "expensive"
    }
  ];
}

// POST /api/discover/best-for-activity
exports.getBestForActivity = async (req, res) => {
  const query = req.body.query || req.query.query;

  console.log(`[POST /api/discover/best-for-activity] Received search query: "${query}"`);

  if (!query) {
    return res.status(400).json({ error: 'Missing query in request body or parameters' });
  }

  // Heuristic check for nonsense query
  if (isLikelyNonsense(query)) {
    console.log(`[POST /api/discover/best-for-activity] Nonsense query detected: "${query}". Returning empty array.`);
    const activeUser = req.userId ? db.users.findById(req.userId) : null;
    return res.json({
      places: [],
      user: authController.formatUserProfile(activeUser)
    });
  }

  // Consume credit before processing
  let activeUser = req.userId ? db.users.findById(req.userId) : null;
  if (req.userId) {
    const creditStatus = db.users.consumeCredit(req.userId);
    if (!creditStatus.allowed) {
      console.log(`[POST /api/discover/best-for-activity] User credits exhausted for ID ${req.userId}`);
      const freshUser = db.users.findById(req.userId);
      return res.status(403).json({
        code: 'FREE_LIMIT_REACHED',
        error: 'You have used your 5 free credits for today. Upgrade to Premium for unlimited AI planning and explorer features!',
        user: authController.formatUserProfile(freshUser)
      });
    }
    // Refresh user state after consumption
    activeUser = db.users.findById(req.userId);
  }

  const preferredCurrency = req.body.preferredCurrency || (activeUser && activeUser.preferredCurrency) || 'INR';
  const limit = activeUser && activeUser.isPremium ? 6 : 2;

  // 1. Try fuzzy match on static list first
  const staticMatch = findStaticMatch(query);
  if (staticMatch) {
    console.log(`[POST /api/discover/best-for-activity] Static match found for: "${query}"`);
    const formattedUser = authController.formatUserProfile(activeUser);
    if (limit === 2) {
      return res.json({
        places: staticMatch.slice(0, 2),
        premiumUpsell: true,
        user: formattedUser
      });
    }
    return res.json({
      places: staticMatch,
      user: formattedUser
    });
  }

  // 2. LLM fallback
  // Initialize Gemini dynamically if not already done
  if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
    try {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    } catch (err) {
      console.error('Error initializing Gemini AI Engine dynamically:', err);
    }
  }

  // If Gemini API key is missing, go straight to dynamic fallback generator instead of 500 error!
  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY.trim() === '' || !genAI) {
    console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server. Falling back to dynamic generator.');
    const places = generateDynamicFallbackPlaces(query, preferredCurrency);
    const formattedUser = authController.formatUserProfile(activeUser);
    if (limit === 2) {
      return res.json({
        places: places.slice(0, 2),
        premiumUpsell: true,
        user: formattedUser
      });
    }
    return res.json({
      places,
      user: formattedUser
    });
  }

  const prompt = `You are an expert travel guide. Provide a JSON array of the top travel destinations in the world for the activity described: "${query}".
Return a list of ${limit === 2 ? '2' : '3 to 4'} items (CRITICAL for fast generation speed).
Interpret the activity name(s) semantically. Show ways to do this activity in different contexts (e.g. indoor vs outdoor, city vs nature, budget vs luxury).
For each destination, you must strictly return a JSON object with these EXACT keys:
- name (string)
- countryOrRegion (string)
- whyItIsGreat (string, max 60 characters. Be extremely concise, mentioning the context like indoor/outdoor or budget/luxury.)
- bestSeason (string)
- approxCostBand (string: "cheap" | "moderate" | "expensive" — based on costs in ${preferredCurrency})

Ensure your output is pure, valid JSON with absolutely no markdown wrapper blocks, no code fences (do NOT use \`\`\`json), no leading or trailing text, and no conversational explanation. Only output a valid JSON array of objects.`;

  const startTime = Date.now();
  try {
    let text = "";
    try {
      console.log(`[POST /api/discover/best-for-activity] Starting Gemini API call at ${new Date().toISOString()} with model gemini-2.5-flash...`);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const apiCallPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI activity search request timed out')), 25000)
      );
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      const response = await result.response;
      text = response.text();
    } catch (primaryError) {
      console.warn(`[POST /api/discover/best-for-activity] Primary model (gemini-2.5-flash) failed: ${primaryError.message}. Trying fallback model (gemini-2.5-flash-lite)...`);
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const fallbackCallPromise = fallbackModel.generateContent(prompt);
      const fallbackTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fallback AI activity search request timed out')), 25000)
      );
      const fallbackResult = await Promise.race([fallbackCallPromise, fallbackTimeout]);
      const response = await fallbackResult.response;
      text = response.text();
    }

    console.log('[Gemini Raw Response]:', text);

    // Clean markdown code blocks if any
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const places = JSON.parse(cleaned);

    if (!Array.isArray(places) || places.length === 0) {
      throw new Error('Gemini response did not contain a non-empty array of places');
    }

    const duration = Date.now() - startTime;
    console.log(`[Gemini API Success] Successfully loaded ${places.length} activity recommendations in ${duration}ms.`);

    const formattedUser = authController.formatUserProfile(activeUser);
    if (limit === 2) {
      return res.json({
        places: places.slice(0, 2),
        premiumUpsell: true,
        user: formattedUser
      });
    }
    return res.json({
      places,
      user: formattedUser
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Gemini call failed after ${duration}ms with error details:`, err, `. Falling back to dynamic generator.`);
    
    // Fall back to dynamic generator to guarantee we always return something meaningful!
    const places = generateDynamicFallbackPlaces(query, preferredCurrency);
    const formattedUser = authController.formatUserProfile(activeUser);
    if (limit === 2) {
      return res.json({
        places: places.slice(0, 2),
        premiumUpsell: true,
        user: formattedUser
      });
    }
    return res.json({
      places,
      user: formattedUser
    });
  }
};
