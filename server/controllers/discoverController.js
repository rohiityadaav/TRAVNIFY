/*
 * File Path: server/controllers/discoverController.js
 * Environment Variable: GEMINI_API_KEY
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const db = require('../db');

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

  const prompt = `You are an expert travel guide. Return a JSON array of hidden-gem destinations that match the user’s query: "${query}".
Return between 3 and 4 places (CRITICAL for fast generation speed). For each destination, you must strictly return a JSON object with these EXACT keys:
- name (string)
- countryOrRegion (string)
- shortDescription (string, max 10 words. Be extremely concise.)
- bestTimeToVisit (string)
- typicalBudgetLevel (string: "cheap" | "moderate" | "expensive")

Ensure your output is pure, valid JSON with absolutely no markdown wrapper blocks, no code fences (do NOT use \`\`\`json), no leading or trailing text, and no conversational explanation. Only output a valid JSON array of objects.`;

  const startTime = Date.now();
  try {
    console.log(`[POST /api/discover/hidden-gems] Starting Gemini API call at ${new Date().toISOString()} with model gemini-1.5-flash...`);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    // API Call with 45 seconds timeout
    const apiCallPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI discovery request timed out after 45 seconds')), 45000)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

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
exports.getBestForActivity = async (req, res) => {
  const user = req.userId ? db.users.findById(req.userId) : null;
  const query = req.body.query || req.query.query;

  console.log(`[POST /api/discover/best-for-activity] Received search query: "${query}"`);

  if (!query) {
    return res.status(400).json({ error: 'Missing query in request body or parameters' });
  }

  // Check user daily credits limit if logged in
  if (req.userId) {
    const creditStatus = db.users.consumeCredit(req.userId);
    if (!creditStatus.allowed) {
      return res.status(403).json({
        code: 'FREE_LIMIT_REACHED',
        error: 'You have used your 5 free credits for today. Upgrade to Premium for unlimited AI planning and explorer features!'
      });
    }
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

  // Non-premium users are limited to 2 results, premium has unlimited (typically 5)
  const limit = user && user.isPremium ? 6 : 2;

  const prompt = `You are an expert travel guide. Provide a JSON array of the top travel destinations in the world for the activity described: "${query}".
Return a list of ${limit === 2 ? '2' : '3 to 4'} items (CRITICAL for fast generation speed). For each destination, you must strictly return a JSON object with these EXACT keys:
- name (string)
- countryOrRegion (string)
- whyItIsGreat (string, max 50 characters. Be extremely concise.)
- bestSeason (string)
- approxCostBand (string: "cheap" | "moderate" | "expensive")

Ensure your output is pure, valid JSON with absolutely no markdown wrapper blocks, no code fences (do NOT use \`\`\`json), no leading or trailing text, and no conversational explanation. Only output a valid JSON array of objects.`;

  const startTime = Date.now();
  try {
    console.log(`[POST /api/discover/best-for-activity] Starting Gemini API call at ${new Date().toISOString()} with model gemini-1.5-flash...`);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    // API Call with 45 seconds timeout
    const apiCallPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI activity search request timed out after 45 seconds')), 45000)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

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

    if (limit === 2) {
      return res.json({ places: places.slice(0, 2), premiumUpsell: true });
    }
    return res.json({ places });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Gemini call failed after ${duration}ms with error details:`, err);
    return res.status(500).json({ error: err.message || 'AI service temporarily unavailable. Please contact support.' });
  }
};
