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
function normalizeItinerary(itinerary, startDate, parsedBudget, activeCurrency, daysCount) {
  if (!itinerary) return null;

  const destName = itinerary.destination || 'Destination';
  const days = itinerary.days || [];
  
  const estCostVal = itinerary.estimatedTotalCost?.value || parsedBudget || 15000;
  const estCostCurr = itinerary.estimatedTotalCost?.currency || activeCurrency || 'INR';

  const baseDate = startDate ? new Date(startDate) : new Date();

  const normalizedDays = days.map((day, idx) => {
    let dateStr = day.date;
    if (!dateStr) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + idx);
      dateStr = d.toISOString().split('T')[0];
    }

    const blocks = (day.blocks || []).map(block => {
      const timeSlot = block.timeSlot || block.timeWindow || '09:00 - 11:00';
      const placeName = block.placeName || block.title || 'Sightseeing Spot';
      const area = block.areaOrNeighborhood || block.location || 'Local Area';
      const activity = block.activity || block.description || 'Visit attractions and walk around.';
      
      let costValue = 0;
      let costCurrency = estCostCurr;
      
      if (block.approxCost && typeof block.approxCost === 'object') {
        costValue = Number(block.approxCost.value) || 0;
        costCurrency = block.approxCost.currency || estCostCurr;
      } else if (block.approxCost) {
        const cleanCost = String(block.approxCost).replace(/[^0-9.]/g, '');
        costValue = Number(cleanCost) || 0;
        const matched = String(block.approxCost).match(/[A-Z]{3}/i);
        if (matched) costCurrency = matched[0].toUpperCase();
      }
      
      let type = 'activity';
      const text = `${placeName} ${activity}`.toLowerCase();
      if (text.includes('hotel') || text.includes('stay') || text.includes('hostel') || text.includes('check-in') || text.includes('check in') || text.includes('overnight') || text.includes('lodging')) {
        type = 'stay';
      } else if (text.includes('transit') || text.includes('travel') || text.includes('board') || text.includes('bus') || text.includes('train') || text.includes('flight') || text.includes('airport') || text.includes('cab') || text.includes('taxi') || text.includes('metro') || text.includes('drive')) {
        type = 'travel';
      } else if (text.includes('food') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast') || text.includes('cafe') || text.includes('restaurant') || text.includes('delicacies') || text.includes('tasting') || text.includes('bistro') || text.includes('barbecue') || text.includes('eat')) {
        type = 'food';
      } else if (text.includes('relax') || text.includes('free time') || text.includes('leisure') || text.includes('chill') || text.includes('unwind')) {
        type = 'free_time';
      }

      return {
        timeSlot,
        placeName,
        areaOrNeighborhood: area,
        activity,
        approxCost: {
          value: costValue,
          currency: costCurrency
        },
        type,
        title: placeName,
        description: activity,
        timeWindow: timeSlot,
        approxCostStr: `${costValue} ${costCurrency}`
      };
    });

    const dayNumber = day.dayNumber || (idx + 1);
    const location = day.location || day.title || (blocks[0] ? blocks[0].areaOrNeighborhood : destName);

    return {
      date: dateStr,
      title: day.title || `Day ${dayNumber}: Explore ${location}`,
      blocks,
      dayNumber,
      location
    };
  });

  let totalTransport = 0;
  let totalStay = 0;
  let totalFood = 0;
  let totalActivity = 0;
  let grandTotal = 0;

  normalizedDays.forEach(day => {
    day.blocks.forEach(block => {
      const val = block.approxCost.value;
      grandTotal += val;
      if (block.type === 'travel') totalTransport += val;
      else if (block.type === 'stay') totalStay += val;
      else if (block.type === 'food') totalFood += val;
      else totalActivity += val;
    });
  });

  let transportPercent = 25;
  let stayPercent = 35;
  let foodPercent = 20;
  let activitiesPercent = 20;

  if (grandTotal > 0) {
    transportPercent = Math.round((totalTransport / grandTotal) * 100);
    stayPercent = Math.round((totalStay / grandTotal) * 100);
    foodPercent = Math.round((totalFood / grandTotal) * 100);
    activitiesPercent = 100 - (transportPercent + stayPercent + foodPercent);
  }

  const summary = {
    destination: destName,
    totalDays: normalizedDays.length,
    approxTotalCost: estCostVal,
    currency: estCostCurr,
    dailyAverageCost: Math.round(estCostVal / normalizedDays.length)
  };

  const budgetBreakdown = {
    transportPercent,
    stayPercent,
    foodPercent,
    activitiesPercent
  };

  return {
    destination: destName,
    days: normalizedDays,
    estimatedTotalCost: {
      value: estCostVal,
      currency: estCostCurr
    },
    localCurrencyNote: itinerary.localCurrencyNote || null,
    summary,
    budgetBreakdown
  };
}

function generateMockItinerary(destination, budget, currency, daysCount, interests, startDate) {
  const destName = destination || 'Goa, India';
  const totalDays = daysCount || 3;
  const totalBudget = budget || 15000;
  const curr = currency || 'INR';
  const avgDaily = Math.round(totalBudget / totalDays);

  const baseDate = startDate ? new Date(startDate) : new Date();

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
  for (let i = 0; i < totalDays; i++) {
    const activeInterest = interests && interests.length > 0
      ? interests[i % interests.length]
      : 'general';
    const activityPool = mockActivities[activeInterest] || mockActivities['general'];

    const act1 = activityPool[(i * 1) % activityPool.length];
    const act2 = activityPool[(i * 2) % activityPool.length];

    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      title: `Day ${i + 1}: Discover ${destName}`,
      blocks: [
        {
          timeSlot: '09:00 - 11:30',
          placeName: `${destName} Central Transit`,
          areaOrNeighborhood: 'Central Area',
          activity: 'Transit check-in and cozy stay setup.',
          approxCost: {
            value: Math.round(avgDaily * 0.15),
            currency: curr
          }
        },
        {
          timeSlot: '12:30 - 14:00',
          placeName: 'Local Heritage Kitchen',
          areaOrNeighborhood: 'Old Town',
          activity: 'Taste popular street foods and regional lunch delicacies.',
          approxCost: {
            value: Math.round(avgDaily * 0.2),
            currency: curr
          }
        },
        {
          timeSlot: '15:00 - 18:00',
          placeName: `${destName} Cultural Landmarks`,
          areaOrNeighborhood: 'Historic Center',
          activity: `${act1}. Take photos and sightseeing.`,
          approxCost: {
            value: Math.round(avgDaily * 0.25),
            currency: curr
          }
        },
        {
          timeSlot: '19:00 - 21:30',
          placeName: `${activeInterest.toUpperCase()} Hub`,
          areaOrNeighborhood: 'Vibrant Quarter',
          activity: `${act2}. Meet travelers and enjoy evening atmosphere.`,
          approxCost: {
            value: Math.round(avgDaily * 0.25),
            currency: curr
          }
        },
        {
          timeSlot: '22:00 onwards',
          placeName: 'Boutique Hotel Stay',
          areaOrNeighborhood: 'Peaceful District',
          activity: 'Wind down and enjoy quiet rest.',
          approxCost: {
            value: Math.round(avgDaily * 0.15),
            currency: curr
          }
        }
      ]
    });
  }

  const rawMock = {
    destination: destName,
    days,
    estimatedTotalCost: {
      value: totalBudget,
      currency: curr
    }
  };

  return normalizeItinerary(rawMock, startDate, totalBudget, curr, totalDays);
}

// ----------------------------------------------------
// AI TRIP GENERATION CONTROLLER
// ----------------------------------------------------
async function generateTrip(req, res) {
  const startTime = Date.now();
  console.log(`[AI Trip Generation] Start processing request at ${new Date().toISOString()}`);
  try {
    const { prompt, destination, budget, currency, startDate, endDate, interests, preferredCurrency } = req.body;

    // Silently trim interests to first 3 if more are provided (validation.js also does this,
    // but guard here too in case of direct API calls)
    const safeInterests = (interests && Array.isArray(interests))
      ? interests.slice(0, 3)
      : (interests ? [interests] : []);
    if (interests && Array.isArray(interests) && interests.length > 3) {
      console.log(`[AI Trip Generation] Trimmed ${interests.length} interests to 3: ${safeInterests.join(', ')}`);
    }

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
    // Preferred display currency for the user (may differ from budget input currency)
    const displayCurrency = preferredCurrency || activeCurrency || 'INR';

    // Initialize Gemini dynamically if not already done
    if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }

    // If Gemini API Key is missing, return configuration error (500)
    if (!genAI) {
      console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server.');
      return res.status(500).json({ error: 'AI service configuration error: GEMINI_API_KEY is missing on the server. Please configure the environment variable.' });
    }

    // Call Gemini SDK — gemini-3.5-flash is the correct fast model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    // Optimized Prompt: specify exactly 3 blocks per day, keep text instructions brief
    const systemPrompt = `You are TRAVNIFY, a premium AI travel assistant.
Your job is to parse the user's travel request and output a highly detailed, budget-aware day-by-day trip plan.

USER PARAMETERS:
- Free prompt request: "${prompt || 'none'}"
- Destination: "${destination || 'Goa, India'}"
- Total Budget: ${parsedBudget} ${activeCurrency}
- Start Date: ${startDate || 'today'}
- Duration: ${daysCount} Days
- Interests: ${safeInterests.length > 0 ? safeInterests.join(', ') : 'sightseeing, food, relaxing'}
- User Preferred Currency: ${displayCurrency}

YOUR OUTPUT INSTRUCTIONS:
Generate a valid JSON object matching the exact schema below.
- Do NOT output any markdown tags (like \`\`\`json). Return ONLY the raw JSON string starting with { and ending with }.
- Do NOT invent specific hotel or restaurant brand names. Use generic types, like "3-star boutique hotel near center".
- Location understanding (worldwide): Choose sensible cities/areas/districts inside the destination for each day (e.g. Rome/Florence/Venice for Italy).
- Date and Day Count: Generate exactly ${daysCount} days in the "days" array, with dates starting on ${startDate || 'today'} and incrementing by 1 day per step (format: YYYY-MM-DD).
- Day Structure: For each day, include EXACTLY 3 blocks (Morning, Afternoon, Evening) for fast response times.
- Budget Awareness: Plan within the total budget of ${parsedBudget} ${activeCurrency}. Keep the sum of approxCost values roughly matching this total budget.
- IMPORTANT — Currency Output: All approxCost values and the estimatedTotalCost MUST be output in the user's preferred currency: ${displayCurrency}. Convert all costs to ${displayCurrency}. Do NOT use the destination's local currency.
- If the destination's local currency is different from ${displayCurrency}, you MAY add a short note like: "Local currency: THB, but estimates are shown in ${displayCurrency} (your chosen currency)." as a field "localCurrencyNote" at the root level of the JSON.
- Adjust style based on budget: If budget is low, prioritize free sights, parks, and street food. If budget is high, prioritize paid activities and fine dining.
- Interest-based planning: Prioritize activities matching user interests. Use real, well-known locations.

JSON Schema structure:
{
  "destination": "Name of the destination",
  "localCurrencyNote": "(optional) e.g. Local currency: THB, but estimates are shown in USD (your chosen currency).",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "Short summary of the day",
      "blocks": [
        {
          "timeSlot": "09:00-11:30",
          "placeName": "Specific attraction name",
          "areaOrNeighborhood": "District or neighborhood name",
          "activity": "Activity description (maximum 10 words for fast generation)",
          "approxCost": {
            "value": 40,
            "currency": "${displayCurrency}"
          }
        }
      ]
    }
  ],
  "estimatedTotalCost": {
    "value": 750,
    "currency": "${displayCurrency}"
  }
}`;

    const aiStartTime = Date.now();
    // API Call with 45 seconds timeout
    const apiCallPromise = model.generateContent(systemPrompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 45 seconds')), 45000)
    );

    let itinerary = null;
    let aiDuration = 0;
    try {
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      aiDuration = Date.now() - aiStartTime;
      const textResponse = result.response.text().trim();
      
      try {
        // Clean markdown code blocks if any
        let cleaned = textResponse;
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }
        
        const parsed = JSON.parse(cleaned);
        itinerary = normalizeItinerary(parsed, startDate, parsedBudget, activeCurrency, daysCount);
      } catch (parseError) {
        console.error('[AI Trip Generation] Failed to parse Gemini output as JSON, using mock fallback.', parseError.message);
        console.log('[AI Trip Generation] Raw AI text was:', textResponse.substring(0, 300));
        itinerary = generateMockItinerary(destination, parsedBudget, activeCurrency, daysCount, safeInterests, startDate);
      }
    } catch (aiError) {
      aiDuration = Date.now() - aiStartTime;
      // Gemini call itself failed (wrong model, quota, network, timeout) — fall back to mock
      console.error('[AI Trip Generation] Gemini API call failed, using mock fallback. Error:', aiError.message);
      itinerary = generateMockItinerary(destination, parsedBudget, activeCurrency, daysCount, safeInterests, startDate);
    }

    // Increment user usage counter
    if (activeUser && !activeUser.isPremium) {
      db.users.update(activeUser.id, { freeTripsGenerated: activeUser.freeTripsGenerated + 1 });
    }

    const duration = Date.now() - startTime;
    console.log(`[AI Trip Generation Success] Gemini duration: ${aiDuration}ms, Total endpoint latency: ${duration}ms`);
    return res.json({ itinerary });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AI Trip Generation Error] Failed request payload:', {
      prompt: req.body.prompt,
      destination: req.body.destination,
      budget: req.body.budget,
      currency: req.body.currency,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      interests: req.body.interests
    });
    console.error(`[AI Trip Generation Error] Failed after ${duration}ms with error:`, error);
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

You MUST output your response ONLY as a single valid JSON object following the exact schema:
{
  "destination": "Name of the destination",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "Short summary of the day",
      "blocks": [
        {
          "timeSlot": "09:00-11:30",
          "placeName": "Specific attraction, market, beach, temple, museum, or spot name",
          "areaOrNeighborhood": "District, neighborhood, or city name within destination",
          "activity": "What to do there (maximum 15 words)",
          "approxCost": {
            "value": 40,
            "currency": "EUR"
          }
        }
      ]
    }
  ],
  "estimatedTotalCost": {
    "value": 750,
    "currency": "EUR"
  }
}

- Do NOT output any markdown tags (like \`\`\`json). Return ONLY the raw JSON string starting with { and ending with }.
- Keep all costs approximate and generic.
- CRITICAL FOR SPEED: Keep all activity/block descriptions very concise, under 15 words.`;

    // API Call with 35 seconds timeout
    const apiCallPromise = model.generateContent(refinementPrompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI refinement request timed out after 35 seconds')), 35000)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const textResponse = result.response.text().trim();

    let cleanedText = textResponse;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    if (cleanedText.includes('```')) {
      cleanedText = cleanedText.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim();
    }

    let refinedItinerary = null;
    try {
      const rawRefined = JSON.parse(cleanedText);
      const extractedStartDate = originalItinerary.days?.[0]?.date || new Date().toISOString().split('T')[0];
      const extractedBudget = originalItinerary.estimatedTotalCost?.value || originalItinerary.summary?.approxTotalCost || 15000;
      const extractedCurrency = originalItinerary.estimatedTotalCost?.currency || originalItinerary.summary?.currency || 'INR';
      const extractedDaysCount = originalItinerary.days?.length || 3;

      refinedItinerary = normalizeItinerary(
        rawRefined,
        extractedStartDate,
        extractedBudget,
        extractedCurrency,
        extractedDaysCount
      );
    } catch (parseError) {
      console.error('Failed to parse Gemini refined itinerary.', parseError);
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
