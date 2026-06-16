const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');
const config = require('../config');

// Helper to generate unique ID
function generateId(prefix = 'trip') {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

// Initialize Gemini if key is provided
let genAI = null;
if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
  genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  console.log('Gemini AI Engine Initialized Successfully.');
} else {
  console.warn('WARNING: Required GEMINI_API_KEY environment variable is missing on server startup. AI features will return service unavailable.');
}

// ----------------------------------------------------
// SMART MOCK TRIP GENERATION FALLBACK ENGINE
// ----------------------------------------------------
function generateMockItinerary(destination, budget, currency, daysCount, interests) {
  const destName = destination || 'Goa, India';
  const totalDays = daysCount || 3;
  const totalBudget = budget || 15000;
  const curr = currency || 'INR';
  const avgDaily = Math.round(totalBudget / totalDays);

  const transportPercent = 25;
  const stayPercent = 35;
  const foodPercent = 20;
  const activitiesPercent = 20;

  const mockActivities = {
    beach: [
      'Relaxing walk on beach, sunbathing, water sports',
      'Beachside sunset views and refreshing mocktails',
      'Sea shell collecting and local speed boat ride',
      'Beach volleyball and exploring shoreline shacks'
    ],
    trek: [
      'Scenic nature trek with local panoramic vistas',
      'Exploring mountain paths, photography at summit',
      'Forest path walking, bird watching, crisp fresh air',
      'Hiking to local waterfall, relaxing beside riverbank'
    ],
    nightlife: [
      'Visiting top rated lounge, checking local DJ beats',
      'Dancing at beachside club, enjoying pub food',
      'Exploring late night bazaar, music and neon lights',
      'Socializing at a vibrant local music cafe'
    ],
    food: [
      'Food tasting tour of local street shops and stalls',
      'Fine dining at traditional regional heritage kitchen',
      'Breakfast at classic historical bakery shop',
      'Enjoying local sea-food or traditional thali dinner'
    ],
    shopping: [
      'Strolling through local flea market, bargaining items',
      'Exploring local shopping street for handicrafts',
      'Browsing spice market and traditional boutique shops',
      'Checking regional souvenirs and handmade clothing stalls'
    ],
    culture: [
      'Guided walkthrough of historical fort or museum',
      'Visiting local heritage village, learning craftsmanship',
      'Walking tour of old town colonial architecture temples',
      'Watching a traditional local dance or art show'
    ],
    general: [
      'Sightseeing at prominent central city landmarks',
      'Casual strolling in central garden or marketplace',
      'Relaxing in local park, people watching and coffee',
      'Guided history walk through the oldest neighborhood'
    ]
  };

  const days = [];
  for (let i = 1; i <= totalDays; i++) {
    const activeInterest = interests && interests.length > 0
      ? interests[(i - 1) % interests.length]
      : 'general';
    const activityPool = mockActivities[activeInterest] || mockActivities['general'];

    const act1 = activityPool[(i * 0) % activityPool.length];
    const act2 = activityPool[(i * 1) % activityPool.length];
    const act3 = activityPool[(i * 2) % activityPool.length];

    days.push({
      dayNumber: i,
      location: `${destName} (Central Area)`,
      blocks: [
        {
          type: 'travel',
          title: `Day ${i} Morning Transit & Check-in`,
          description: `Board local auto/cab to explore the area. Check in at your pre-booked cozy stay near the city center.`,
          timeWindow: '09:00 - 11:30',
          approxCost: `${Math.round(avgDaily * 0.15)} ${curr}`
        },
        {
          type: 'food',
          title: `Local Flavors & Lunch`,
          description: `Head out to highly recommended street shops to try local delicacies like regional curries and refreshing custom beverages.`,
          timeWindow: '12:30 - 14:00',
          approxCost: `${Math.round(avgDaily * 0.2)} ${curr}`
        },
        {
          type: 'activity',
          title: `Discover ${destName}`,
          description: `${act1}. Take plenty of photographs and enjoy local sightseeing with guide tips.`,
          timeWindow: '15:00 - 18:00',
          approxCost: `${Math.round(avgDaily * 0.25)} ${curr}`
        },
        {
          type: 'activity',
          title: `Evening Highlight: ${activeInterest.toUpperCase()} vibe`,
          description: `${act2}. Meet other solo travelers or groups and appreciate the rich local culture.`,
          timeWindow: '19:00 - 21:30',
          approxCost: `${Math.round(avgDaily * 0.25)} ${curr}`
        },
        {
          type: 'stay',
          title: `Overnight Rest`,
          description: `Wind down at a local boutique hotel or homestay located in a peaceful street away from high traffic sounds.`,
          timeWindow: '22:00 onwards',
          approxCost: `${Math.round(avgDaily * 0.15)} ${curr}`
        }
      ]
    });
  }

  return {
    summary: {
      destination: destName,
      totalDays: totalDays,
      approxTotalCost: totalBudget,
      currency: curr,
      dailyAverageCost: avgDaily
    },
    budgetBreakdown: {
      transportPercent,
      stayPercent,
      foodPercent,
      activitiesPercent
    },
    days
  };
}

// ----------------------------------------------------
// AI TRIP GENERATION CONTROLLER
// ----------------------------------------------------
async function generateTrip(req, res) {
  const startTime = Date.now();
  console.log(`[AI Trip Generation] Start processing request at ${new Date().toISOString()}`);
  try {
    const { prompt, destination, budget, currency, startDate, endDate, interests } = req.body;

    // Check user limit if logged in
    let activeUser = null;
    if (req.userId) {
      activeUser = db.users.findById(req.userId);
      const creditStatus = db.users.consumeCredit(req.userId);
      if (!creditStatus.allowed) {
        return res.status(403).json({
          code: 'FREE_LIMIT_REACHED',
          error: 'You have used your 5 free credits for today. Upgrade to Premium for unlimited AI planning and explorer features!'
        });
      }
    }

    // Determine total days
    let daysCount = 3;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (!isNaN(diffDays) && diffDays > 0) {
        daysCount = diffDays;
      }
    }

    let parsedBudget = Number(budget) || 15000;
    let activeCurrency = currency || 'INR';

    // Initialize Gemini dynamically if not already done
    if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }

    // If Gemini API Key is missing, return configuration error (500)
    if (!genAI) {
      console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server.');
      return res.status(500).json({ error: 'AI service configuration error: GEMINI_API_KEY is missing on the server. Please configure the environment variable.' });
    }

    // Call Gemini SDK
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const systemPrompt = `You are TRAVNIFY, a premium AI travel assistant.
Your job is to parse the user's travel request and output a highly detailed, budget-aware day-by-day trip plan.

USER PARAMETERS:
- Free prompt request: "${prompt || 'none'}"
- Destination: "${destination || 'Goa, India'}"
- Total Budget: ${parsedBudget} ${activeCurrency}
- Duration: ${daysCount} Days
- Interests: ${interests && interests.length > 0 ? interests.join(', ') : 'sightseeing, food, relaxing'}

YOUR OUTPUT INSTRUCTIONS:
Generate a valid JSON object matching the exact schema below.
- Do NOT output any markdown tags (like \`\`\`json). Return ONLY the raw JSON string starting with { and ending with }.
- Do NOT invent specific hotel or restaurant brand names. Use generic types, like "3-star boutique hotel near center" or "vibrant beach shack".
- Price segments should be in "${activeCurrency}".
- Budget percentages in budgetBreakdown must add up to 100%.
- CRITICAL FOR SPEED: Be extremely concise. Keep descriptions under 15 words. Limit each day to exactly 3 blocks (Morning, Afternoon, Evening).

JSON Schema structure:
{
  "summary": {
    "destination": "Name of Destination",
    "totalDays": ${daysCount},
    "approxTotalCost": ${parsedBudget},
    "currency": "${activeCurrency}",
    "dailyAverageCost": ${Math.round(parsedBudget / daysCount)}
  },
  "budgetBreakdown": {
    "transportPercent": 25,
    "stayPercent": 35,
    "foodPercent": 20,
    "activitiesPercent": 20
  },
  "days": [
    {
      "dayNumber": 1,
      "location": "Area name in destination",
      "blocks": [
        {
          "type": "travel" | "stay" | "food" | "activity" | "free_time",
          "title": "Title of event",
          "description": "Brief description, maximum 15 words.",
          "timeWindow": "09:00 - 11:00",
          "approxCost": "Value ${activeCurrency}"
        }
      ]
    }
  ]
}`;

    // API Call with 15 seconds timeout
    const apiCallPromise = model.generateContent(systemPrompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 15 seconds')), 15000)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const textResponse = result.response.text().trim();
    
    // Clean up any accidental markdown blocks that Gemini sometimes appends
    let cleanedText = textResponse;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    let itinerary = null;
    try {
      itinerary = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini output as JSON. Fallback to mock data.', parseError);
      console.log('Raw text was:', textResponse);
      itinerary = generateMockItinerary(destination, parsedBudget, activeCurrency, daysCount, interests);
    }

    // Increment user usage counter
    if (activeUser && !activeUser.isPremium) {
      db.users.update(activeUser.id, { freeTripsGenerated: activeUser.freeTripsGenerated + 1 });
    }

    const duration = Date.now() - startTime;
    console.log(`[AI Trip Generation] Successfully generated trip in ${duration}ms`);
    return res.json({ itinerary });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Trip Generation] Failed after ${duration}ms with error:`, error);
    return res.status(500).json({ error: error.message || 'AI service temporarily unavailable. Please contact support.' });
  }
}

// ----------------------------------------------------
// AI REFINEMENT CONTROLLER
// ----------------------------------------------------
async function refineTrip(req, res) {
  try {
    const { originalItinerary, action } = req.body;

    if (!originalItinerary || !action) {
      return res.status(400).json({ error: 'Original itinerary and refinement action are required.' });
    }

    // Only Premium users can use refinement
    const activeUser = db.users.findById(req.userId);
    if (!activeUser || !activeUser.isPremium) {
      return res.status(403).json({ 
        code: 'PREMIUM_REQUIRED',
        error: 'Premium subscription required to refine plans!' 
      });
    }

    const actionText = action === 'cheaper'
      ? 'cheaper (choose cheaper transport, budget stay options, decrease paid ticket items, save money)'
      : action === 'more_fun'
      ? 'more fun (add adventure activities, nightlife, music clubs, sightseeing landmarks, reduce sleeping slots)'
      : 'more relaxed (add more free time gaps, longer rest times, scenic beach strolls, remove rushed tight schedules)';

    // Initialize Gemini dynamically if not already done
    if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }

    // If Gemini key missing, return configuration error (500)
    if (!genAI) {
      console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server during refinement.');
      return res.status(500).json({ error: 'AI service configuration error: GEMINI_API_KEY is missing on the server. Please configure the environment variable.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const refinementPrompt = `You are TRAVNIFY, an expert AI Travel Planner.
Your task is to refine the following day-by-day travel itinerary.
INSTRUCTION: Adjust this itinerary to be ${actionText}. Maintain the overall destinations but shift budget allocations and activity schedules as requested.

Original Itinerary:
${JSON.stringify(originalItinerary)}

You MUST output your response ONLY as a single valid JSON object following the exact same schema structure as the input.
- Do NOT output any markdown tags (like \`\`\`json). Return ONLY the raw JSON string starting with { and ending with }.
- Keep all costs approximate and generic.
- CRITICAL FOR SPEED: Keep all activity/block descriptions very concise, under 15 words.`;

    // API Call with 15 seconds timeout
    const apiCallPromise = model.generateContent(refinementPrompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI refinement request timed out after 15 seconds')), 15000)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const textResponse = result.response.text().trim();

    let cleanedText = textResponse;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    let refinedItinerary = null;
    try {
      refinedItinerary = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini refined itinerary. Returning mock refined.', parseError);
      return res.status(500).json({ error: 'AI failed to adjust this trip cleanly. Please try again.' });
    }

    return res.json({ itinerary: refinedItinerary });
  } catch (error) {
    console.error('Refine trip error:', error);
    return res.status(500).json({ error: error.message || 'AI service temporarily unavailable. Please contact support.' });
  }
}

// ----------------------------------------------------
// DATABASE CRUD CONTROLLERS
// ----------------------------------------------------
async function getSavedTrips(req, res) {
  try {
    const saved = db.trips.findByUserId(req.userId);
    return res.json(saved);
  } catch (error) {
    console.error('Get trips error:', error);
    return res.status(500).json({ error: 'An error occurred fetching your saved trips.' });
  }
}

async function saveTrip(req, res) {
  try {
    const { destination, budget, currency, startDate, endDate, interests, itinerary } = req.body;

    if (!destination || !itinerary) {
      return res.status(400).json({ error: 'Destination and itinerary JSON are required.' });
    }

    const newTrip = {
      id: generateId('trp'),
      userId: req.userId,
      destination,
      budget: Number(budget) || itinerary.summary.approxTotalCost || 15000,
      currency: currency || itinerary.summary.currency || 'INR',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interests: interests || [],
      itinerary,
      createdAt: new Date().toISOString()
    };

    const saved = db.trips.create(newTrip);
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Save trip error:', error);
    return res.status(500).json({ error: 'An error occurred saving your trip.' });
  }
}

async function deleteTrip(req, res) {
  try {
    const tripId = req.params.id;
    const trip = db.trips.findById(tripId);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Verify ownership
    if (trip.userId !== req.userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this trip.' });
    }

    db.trips.delete(tripId);
    return res.json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    console.error('Delete trip error:', error);
    return res.status(500).json({ error: 'An error occurred deleting your trip.' });
  }
}

async function downloadTripPDF(req, res) {
  try {
    const activeUser = db.users.findById(req.userId);
    if (!activeUser || !activeUser.isPremium) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        message: 'PDF download is available only for Premium users.'
      });
    }
    return res.json({ success: true, message: 'PDF download authorized.' });
  } catch (error) {
    console.error('Verify PDF download error:', error);
    return res.status(500).json({ error: 'An error occurred verifying PDF download permission.' });
  }
}

module.exports = {
  generateTrip,
  refineTrip,
  getSavedTrips,
  saveTrip,
  deleteTrip,
  downloadTripPDF
};
