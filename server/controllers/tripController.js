const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');
const config = require('../config');
const authController = require('./authController');
const fs = require('fs');
const path = require('path');

// Load known cities database
let knownCitiesDb = { cities: {}, regions: {} };
try {
  const dbPath = path.join(__dirname, '../data/known_cities.json');
  if (fs.existsSync(dbPath)) {
    knownCitiesDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log(`Loaded known cities database: ${Object.keys(knownCitiesDb.cities || {}).length} cities, ${Object.keys(knownCitiesDb.regions || {}).length} regions.`);
  } else {
    console.warn(`WARNING: known_cities.json not found at ${dbPath}.`);
  }
} catch (err) {
  console.error('Failed to load known cities database:', err);
}

function getKnownCitiesDb() {
  if (!knownCitiesDb || !knownCitiesDb.cities || Object.keys(knownCitiesDb.cities).length === 0) {
    try {
      const dbPath = path.join(__dirname, '../data/known_cities.json');
      if (fs.existsSync(dbPath)) {
        knownCitiesDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      }
    } catch (err) {
      console.error('Failed to reload known cities database:', err);
    }
  }
  return knownCitiesDb;
}

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

  const tripSummary = itinerary.tripSummary || {};
  const destination = tripSummary.destination || itinerary.destination || 'Destination';
  const totalDays = Number(tripSummary.totalDays) || itinerary.days?.length || daysCount || 3;
  const travelStyle = tripSummary.travelStyle || 'mixed';
  const bestTimeAdvice = tripSummary.bestTimeAdvice || 'Anytime is a great time to visit!';
  
  const estCostAmount = Number(tripSummary.estimatedTotalCost?.amount || tripSummary.estimatedTotalCost?.value || itinerary.estimatedTotalCost?.value || parsedBudget || 15000);
  const estCostCurrency = tripSummary.estimatedTotalCost?.currency || itinerary.estimatedTotalCost?.currency || activeCurrency || 'INR';

  const baseDate = startDate ? new Date(startDate) : new Date();
  const rawDays = itinerary.dayByDayPlan || itinerary.days || [];
  
  let totalTransport = 0;
  let totalStay = 0;
  let totalFood = 0;
  let totalActivity = 0;
  let grandTotal = 0;

  const dayByDayPlan = [];
  for (let idx = 0; idx < totalDays; idx++) {
    const rawDay = rawDays[idx] || {};
    const dayNumber = Number(rawDay.dayNumber || rawDay.dayIndex || (idx + 1));
    const title = rawDay.title || `Day ${dayNumber}: Explore ${destination}`;
    const theme = rawDay.theme || 'Sightseeing';
    
    let rawMorning = rawDay.morning || {};
    let rawAfternoon = rawDay.afternoon || {};
    let rawEvening = rawDay.evening || {};

    if (rawDay.blocks && Array.isArray(rawDay.blocks)) {
      rawMorning = rawDay.blocks[0] || {};
      rawAfternoon = rawDay.blocks[1] || {};
      rawEvening = rawDay.blocks[2] || {};
    }

    const processBlock = (block, defaultDesc) => {
      const description = block.description || block.activity || defaultDesc;
      let amount = 0;
      let currency = estCostCurrency;

      if (block.estimatedCost && typeof block.estimatedCost === 'object') {
        amount = Number(block.estimatedCost.amount || block.estimatedCost.value) || 0;
        currency = block.estimatedCost.currency || estCostCurrency;
      } else if (block.approxCost && typeof block.approxCost === 'object') {
        amount = Number(block.approxCost.value || block.approxCost.amount) || 0;
        currency = block.approxCost.currency || estCostCurrency;
      } else if (block.estimatedCost || block.approxCost) {
        const clean = String(block.estimatedCost || block.approxCost).replace(/[^0-9.]/g, '');
        amount = Number(clean) || 0;
        const matched = String(block.estimatedCost || block.approxCost).match(/[A-Z]{3}/i);
        if (matched) currency = matched[0].toUpperCase();
      }

      let type = 'activity';
      const text = `${description}`.toLowerCase();
      if (text.includes('hotel') || text.includes('stay') || text.includes('hostel') || text.includes('check-in') || text.includes('check in') || text.includes('overnight') || text.includes('lodging')) {
        type = 'stay';
        totalStay += amount;
      } else if (text.includes('transit') || text.includes('travel') || text.includes('board') || text.includes('bus') || text.includes('train') || text.includes('flight') || text.includes('airport') || text.includes('cab') || text.includes('taxi') || text.includes('metro') || text.includes('drive')) {
        type = 'travel';
        totalTransport += amount;
      } else if (text.includes('food') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast') || text.includes('cafe') || text.includes('restaurant') || text.includes('delicacies') || text.includes('tasting') || text.includes('bistro') || text.includes('barbecue') || text.includes('eat')) {
        type = 'food';
        totalFood += amount;
      } else {
        totalActivity += amount;
      }
      grandTotal += amount;

      return {
        description,
        estimatedCost: { amount, currency },
        type
      };
    };

    const morning = processBlock(rawMorning, 'Morning sightseeing and exploring.');
    const afternoon = processBlock(rawAfternoon, 'Afternoon local lunch and walk.');
    const evening = processBlock(rawEvening, 'Evening dinner and relaxation.');

    const d = new Date(baseDate);
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];

    const notes = Array.isArray(rawDay.notes) ? rawDay.notes : (rawDay.notes ? [rawDay.notes] : ['Wear comfortable walking shoes.']);

    dayByDayPlan.push({
      dayNumber,
      date: dateStr,
      title,
      theme,
      morning,
      afternoon,
      evening,
      notes
    });
  }

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

  const budgetBreakdown = {
    transportPercent,
    stayPercent,
    foodPercent,
    activitiesPercent
  };

  const rawSL = itinerary.safetyAndLogistics || {};
  const safetyAndLogistics = {
    localTransportTips: rawSL.localTransportTips || 'Use authorized local taxis or public transit.',
    areaSafetyNotes: rawSL.areaSafetyNotes || 'Keep your belongings secure in crowded spots.',
    moneySavingTips: rawSL.moneySavingTips || 'Look for combo passes for entry tickets.'
  };

  const localCurrencyNote = itinerary.localCurrencyNote || null;

  return {
    tripSummary: {
      destination,
      totalDays,
      travelStyle,
      estimatedTotalCost: {
        amount: estCostAmount,
        currency: estCostCurrency
      },
      bestTimeAdvice
    },
    dayByDayPlan,
    safetyAndLogistics,
    localCurrencyNote,
    budgetBreakdown,
    destination,
    days: dayByDayPlan.map(day => ({
      dayNumber: day.dayNumber,
      date: day.date,
      title: day.title,
      location: destination,
      theme: day.theme,
      notes: day.notes,
      blocks: [
        {
          timeWindow: 'Morning (09:00 - 12:00)',
          timeSlot: 'Morning (09:00 - 12:00)',
          title: '☀️ Morning',
          placeName: '☀️ Morning Plan',
          description: day.morning.description,
          activity: day.morning.description,
          areaOrNeighborhood: destination,
          approxCost: {
            value: day.morning.estimatedCost.amount,
            currency: day.morning.estimatedCost.currency
          },
          type: day.morning.type
        },
        {
          timeWindow: 'Afternoon (13:00 - 17:00)',
          timeSlot: 'Afternoon (13:00 - 17:00)',
          title: '🌤️ Afternoon',
          placeName: '🌤️ Afternoon Plan',
          description: day.afternoon.description,
          activity: day.afternoon.description,
          areaOrNeighborhood: destination,
          approxCost: {
            value: day.afternoon.estimatedCost.amount,
            currency: day.afternoon.estimatedCost.currency
          },
          type: day.afternoon.type
        },
        {
          timeWindow: 'Evening (18:00 - 22:00)',
          timeSlot: 'Evening (18:00 - 22:00)',
          title: '🌙 Evening',
          placeName: '🌙 Evening Plan',
          description: day.evening.description,
          activity: day.evening.description,
          areaOrNeighborhood: destination,
          approxCost: {
            value: day.evening.estimatedCost.amount,
            currency: day.evening.estimatedCost.currency
          },
          type: day.evening.type
        }
      ]
    })),
    estimatedTotalCost: {
      value: estCostAmount,
      currency: estCostCurrency
    },
    summary: {
      destination,
      totalDays,
      approxTotalCost: estCostAmount,
      currency: estCostCurrency,
      dailyAverageCost: Math.round(estCostAmount / totalDays)
    }
  };
}

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[m][n];
}

function isFuzzyMatch(s1, s2) {
  const len = Math.max(s1.length, s2.length);
  if (len < 4) return s1 === s2;
  const dist = levenshteinDistance(s1, s2);
  const threshold = len > 8 ? 2 : 1;
  return dist <= threshold;
}

function matchDestinationInDb(destName) {
  const dbInstance = getKnownCitiesDb();
  const cities = dbInstance.cities || {};
  const regions = dbInstance.regions || {};

  const cleanDest = destName.toLowerCase().trim();
  const primaryToken = cleanDest.split(',')[0].trim();

  function destinationMatches(key, dest) {
    if (key === dest) return true;
    if (key.length < 4) return false;
    const keyEscaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fwdTest = new RegExp(`(^|[\\s,])${keyEscaped}([\\s,]|$)`).test(dest);
    if (fwdTest) return true;
    if (primaryToken.length >= 4) {
      const primEscaped = primaryToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const revTest = new RegExp(`(^|[\\s,])${primEscaped}([\\s,]|$)`).test(key);
      if (revTest) return true;
    }
    // Fuzzy match for minor typos (e.g. "edinburg" -> "edinburgh")
    if (isFuzzyMatch(key, dest)) return true;
    return false;
  }

  // Try to find matching city FIRST (more specific)
  let matchedCity = null;
  for (const [key, ct] of Object.entries(cities)) {
    if (destinationMatches(key, primaryToken)) {
      matchedCity = ct;
      break;
    }
  }

  // Try to find matching region only if no city was matched
  let matchedRegion = null;
  if (!matchedCity) {
    for (const [key, reg] of Object.entries(regions)) {
      if (destinationMatches(key, primaryToken)) {
        matchedRegion = reg;
        break;
      }
    }
  }

  return { matchedCity, matchedRegion };
}

function generateMockItinerary(destination, budget, currency, daysCount, interests, startDate) {
  const destName = destination || 'Selected Destination';
  const totalDays = Number(daysCount) || 3;
  const totalBudget = Number(budget) || 15000;
  const curr = currency || 'INR';
  const avgDaily = Math.round(totalBudget / totalDays);
  const baseDate = startDate ? new Date(startDate) : new Date();

  const { matchedCity, matchedRegion } = matchDestinationInDb(destName);
  const dbInstance = getKnownCitiesDb();
  const cities = dbInstance.cities || {};

  // If a region was matched, we resolve to 2-3 cities and structure the itinerary around them
  let resolvedCities = [];
  if (matchedRegion) {
    resolvedCities = matchedRegion.cities.map(name => {
      const key = name.toLowerCase().trim();
      return cities[key] || { name, country: matchedRegion.country, landmarks: [], neighborhoods: [], food: [], activities: [], shopping: [], culture: [] };
    });
  } else if (matchedCity) {
    resolvedCities = [matchedCity];
  }

  // Filter and provide fallbacks to make sure we always have enough items
  resolvedCities = resolvedCities.map(c => {
    return {
      name: c.name,
      country: c.country,
      landmarks: Array.isArray(c.landmarks) && c.landmarks.length > 0 ? c.landmarks : [`the historic landmarks of ${c.name}`],
      neighborhoods: Array.isArray(c.neighborhoods) && c.neighborhoods.length > 0 ? c.neighborhoods : [c.name],
      food: Array.isArray(c.food) && c.food.length > 0 ? c.food : [`traditional dishes in ${c.name}`],
      activities: Array.isArray(c.activities) && c.activities.length > 0 ? c.activities : [`exploring ${c.name}`],
      shopping: Array.isArray(c.shopping) && c.shopping.length > 0 ? c.shopping : [`local markets in ${c.name}`],
      culture: Array.isArray(c.culture) && c.culture.length > 0 ? c.culture : [`the local heritage sites of ${c.name}`]
    };
  });

  const dayByDayPlan = [];
  const safeInterests = Array.isArray(interests) && interests.length > 0 ? interests : ['landmarks', 'culture', 'nature', 'shopping', 'food', 'nightlife'];

  for (let i = 0; i < totalDays; i++) {
    const activeInterest = safeInterests[i % safeInterests.length];
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    if (resolvedCities.length > 0) {
      // Pick a city for this day (rotate through resolved cities)
      const city = resolvedCities[i % resolvedCities.length];
      
      // Select index based on day to make sure different places are mentioned each day
      const lmIdx1 = (i * 2) % city.landmarks.length;
      const lmIdx2 = (i * 2 + 1) % city.landmarks.length;
      const nhIdx1 = i % city.neighborhoods.length;
      const nhIdx2 = (i + 1) % city.neighborhoods.length;
      const foodIdx = i % city.food.length;
      const actIdx = i % city.activities.length;
      const shopIdx = i % city.shopping.length;
      const cultIdx = i % city.culture.length;

      const morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} and taking a guided stroll around the historic ${city.neighborhoods[nhIdx1]} neighborhood. Visit the nearby cultural site of ${city.culture[cultIdx]}.`;
      const afternoonDesc = `Head to the vibrant ${city.shopping[shopIdx]} area for shopping and sightseeing. Have a delicious local lunch tasting ${city.food[foodIdx]} at a well-rated local diner.`;
      const eveningDesc = `Enjoy the evening activity of ${city.activities[actIdx]}. Afterwards, relax and dine at a cozy restaurant in the lively ${city.neighborhoods[nhIdx2]} district.`;

      const notesPool = [
        `Use authorized local transport or walking to explore the unique corners of ${city.name}.`,
        `Wear comfortable walking shoes for the day's sightseeing across ${city.name}.`,
        `Check local entry times and carry some cash for street purchases in ${city.name}.`,
        `Ask the locals for the best hidden viewpoints and local eateries in ${city.name}.`,
        `Dress respectfully when visiting religious and heritage sites in ${city.name}.`
      ];

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: `Explore ${city.name} - Day ${i + 1}`,
        theme: activeInterest.toUpperCase(),
        morning: {
          description: morningDesc,
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        afternoon: {
          description: afternoonDesc,
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        evening: {
          description: eveningDesc,
          estimatedCost: { amount: Math.round(avgDaily * 0.4), currency: curr }
        },
        notes: [
          notesPool[i % notesPool.length],
          notesPool[(i + 2) % notesPool.length]
        ]
      });
    } else {
      // LAST-RESORT SMART SYNTHETIC: Use geographically-varied, realistic-sounding place descriptions WITHOUT fake landmark names
      const syntheticPlans = [
        {
          morning: `Explore the old historic quarter of ${destName}, visiting the central heritage market street, the ancient stone church or temple, and a scenic viewpoint nearby.`,
          afternoon: `Head to the bustling riverside or waterfront district of ${destName}. Have a traditional local lunch at a family-run restaurant near the town square.`,
          evening: `Walk along the main evening promenade of ${destName}, visit the illuminated central square, and dine at a local eatery serving regional specialties.`
        },
        {
          morning: `Start with a guided walking tour through ${destName}'s historic streets, visiting the municipal museum, the local market hall, and a scenic overlook.`,
          afternoon: `Browse the artisan craft workshops and souvenir stalls in the old quarter of ${destName}. Enjoy lunch at a courtyard café known for its regional recipes.`,
          evening: `Experience the local night scene at a popular street or cultural center in ${destName}. Try regional desserts and evening street food at the night market area.`
        },
        {
          morning: `Visit a scenic nature reserve or local heritage site near ${destName} — known for its trails, viewpoints, and peaceful atmosphere.`,
          afternoon: `Relax in a central neighborhood of ${destName} — browse local boutique shops, visit an art gallery, and have a traditional lunch.`,
          evening: `Attend a local cultural event or evening ceremony in ${destName}. Dine at a rooftop restaurant with a panoramic view of the skyline.`
        }
      ];

      const plan = syntheticPlans[i % syntheticPlans.length];
      const notesPool = [
        `Use authorized local transport or walk to get the most authentic feel of ${destName}.`,
        `Keep small changes in local currency handy for street shopping in ${destName}.`,
        `Dress respectfully when visiting religious and heritage sites in ${destName}.`,
        `Ask locals for food recommendations; they know the best hidden culinary spots in ${destName}.`,
        `Start your days early in ${destName} to beat the mid-day crowd at popular spots.`,
        `Keep a water bottle and comfortable walking shoes ready for exploring ${destName}.`
      ];

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: `Discover ${destName} - Day ${i + 1}`,
        theme: activeInterest.toUpperCase(),
        morning: {
          description: plan.morning,
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        afternoon: {
          description: plan.afternoon,
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        evening: {
          description: plan.evening,
          estimatedCost: { amount: Math.round(avgDaily * 0.4), currency: curr }
        },
        notes: [
          notesPool[i % notesPool.length],
          notesPool[(i + 3) % notesPool.length]
        ]
      });
    }
  }

  const rawMock = {
    tripSummary: {
      destination: destName,
      totalDays: totalDays,
      travelStyle: 'mixed',
      estimatedTotalCost: {
        amount: totalBudget,
        currency: curr
      },
      bestTimeAdvice: `Generally, visiting ${destName} during the dry season offers the best climate.`
    },
    dayByDayPlan,
    safetyAndLogistics: {
      localTransportTips: `Taxis, public transport, and walking are the best ways to get around ${destName}.`,
      areaSafetyNotes: `Keep your belongings secure in crowded spots and markets around ${destName}.`,
      moneySavingTips: `Look for local food joints and free entry parks in ${destName} to save costs.`
    }
  };

  return normalizeItinerary(rawMock, startDate, totalBudget, curr, totalDays);
}

// ----------------------------------------------------
// AI TRIP GENERATION CONTROLLER
// ----------------------------------------------------
function preprocessInputs(inputs) {
  let { prompt, destination, budget, currency, startDate, endDate, interests, mustDo, mustAvoid } = inputs;
  
  // 1. Default empty interests to a balanced all-round set
  let safeInterests = Array.isArray(interests) ? interests : [];
  if (safeInterests.length === 0) {
    safeInterests = ['landmarks', 'culture', 'nature', 'shopping', 'food', 'nightlife'];
  }

  // 2. Group/condense interests if > 6 items
  if (safeInterests.length > 6) {
    const groups = {
      nature: ['nature', 'trek', 'hiking', 'mountain', 'wildlife', 'national park', 'scenic', 'outdoors', 'hills', 'lake', 'river', 'forest'],
      culture: ['culture', 'history', 'temple', 'museum', 'monument', 'art', 'heritage', 'local life', 'palace', 'fort', 'historical'],
      food: ['food', 'dining', 'street food', 'cooking', 'restaurant', 'tasting', 'drinks', 'bar', 'cafe', 'culinary'],
      adventure: ['adventure', 'trek', 'water sports', 'climbing', 'active', 'sports', 'rafting', 'scuba', 'skydiving'],
      relaxation: ['chill', 'relax', 'beach', 'spa', 'resort', 'leisure', 'slow-paced', 'unwind'],
      shopping: ['shopping', 'market', 'flea market', 'mall', 'souvenir', 'bazaar']
    };
    
    const matchedGroups = new Set();
    const unmatched = [];
    
    for (const interest of safeInterests) {
      let matched = false;
      const lower = String(interest).toLowerCase();
      for (const [groupName, keywords] of Object.entries(groups)) {
        if (keywords.some(kw => lower.includes(kw))) {
          matchedGroups.add(groupName);
          matched = true;
          break;
        }
      }
      if (!matched) {
        unmatched.push(interest);
      }
    }
    
    safeInterests = Array.from(matchedGroups);
    if (unmatched.length > 0) {
      safeInterests.push(...unmatched.slice(0, 3));
    }
  }

  // 3. Truncate/condense long inputs
  const maxTextLength = 600;
  if (prompt && prompt.length > maxTextLength) {
    prompt = prompt.substring(0, 400) + '... [summarized for context length] ...' + prompt.substring(prompt.length - 150);
  }
  
  if (mustDo && mustDo.length > 300) {
    mustDo = mustDo.substring(0, 200) + '... [summarized] ...' + mustDo.substring(mustDo.length - 80);
  }
  
  if (mustAvoid && mustAvoid.length > 300) {
    mustAvoid = mustAvoid.substring(0, 200) + '... [summarized] ...' + mustAvoid.substring(mustAvoid.length - 80);
  }
  
  return {
    prompt,
    destination,
    budget,
    currency,
    startDate,
    endDate,
    interests: safeInterests,
    mustDo,
    mustAvoid
  };
}

async function generateTrip(req, res) {
  const startTime = Date.now();
  console.log(`[AI Trip Generation] Start processing request at ${new Date().toISOString()}`);
  
  try {
    const { prompt, destination, budget, currency, startDate, endDate, interests, preferredCurrency, simplified } = req.body;

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

    // Check user premium status
    let activeUser = null;
    let isPremium = false;
    if (req.userId) {
      activeUser = db.users.findById(req.userId);
      if (activeUser && activeUser.isPremium) {
        isPremium = true;
      }
    }

    // Premium Check: If trip length is more than 3 months (> 92 days)
    if (daysCount > 92 && !isPremium) {
      console.log(`[AI Trip Generation] Long trip premium restriction: ${daysCount} days requested.`);
      return res.status(403).json({
        errorCode: "NEED_PREMIUM_FOR_LONG_TRIP",
        code: "NEED_PREMIUM_FOR_LONG_TRIP",
        error: "Premium subscription required for trips longer than 3 months (92 days)."
      });
    }

    // Check user limit if logged in (free user)
    if (activeUser && !isPremium) {
      const creditStatus = db.users.consumeCredit(req.userId);
      if (!creditStatus.allowed) {
        return res.status(403).json({
          code: 'FREE_LIMIT_REACHED',
          error: 'You have used your 5 free credits for today. Upgrade to Premium for unlimited AI planning and explorer features!'
        });
      }
    }

    const parsedBudget = Number(budget) || 15000;
    const activeCurrency = currency || 'INR';
    const displayCurrency = preferredCurrency || activeCurrency || 'INR';

    const fallbackResponse = () => {
      console.log('[AI Trip Generation] Fallback triggered. Generating server-side mock itinerary.');
      const safeInterests = Array.isArray(interests) ? interests : [];
      const itinerary = generateMockItinerary(destination, parsedBudget, activeCurrency, daysCount, safeInterests, startDate);
      
      if (activeUser && !isPremium) {
        db.users.update(activeUser.id, { freeTripsGenerated: activeUser.freeTripsGenerated + 1 });
      }
      const freshUser = activeUser ? db.users.findById(activeUser.id) : null;
      return res.json({ itinerary, user: authController.formatUserProfile(freshUser) });
    };

    // Initialize Gemini dynamically if not already done
    if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }

    if (!genAI) {
      console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server.');
      return fallbackResponse();
    }

    // Try primary model first, fallback to a higher-quota secondary model
    const primaryModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    // Preprocessing step
    const preprocessed = preprocessInputs({
      prompt,
      destination,
      budget,
      currency,
      startDate,
      endDate,
      interests,
      mustDo: req.body.mustDo || '',
      mustAvoid: req.body.mustAvoid || ''
    });

    const userName = activeUser ? activeUser.name : 'Traveler';
    const origin = req.body.origin || (activeUser ? activeUser.country : '');

    let simplifiedInstruction = "";
    if (simplified) {
      simplifiedInstruction = "\n- SIMPLIFIED MODE ACTIVATED: Keep all descriptions under 10 words. Propose simple, well-known locations only. Minimize nesting complexity.";
    }

    // --- Resolve destination against known cities database for Gemini prompt augmentation ---
    let destinationDataBlock = '';
    const { matchedCity: matchedDbCity, matchedRegion: matchedDbRegion } = matchDestinationInDb(preprocessed.destination);

    // Build destination data block for Gemini prompt
    if (matchedDbRegion) {
      const dbInstance = getKnownCitiesDb();
      const dbCities = dbInstance.cities || {};
      const regionCities = matchedDbRegion.cities.map(name => {
        const key = name.toLowerCase().trim();
        return dbCities[key] || null;
      }).filter(Boolean);

      if (regionCities.length > 0) {
        destinationDataBlock = `\n\nDESTINATION DATABASE MATCH (Region: ${matchedDbRegion.name}, ${matchedDbRegion.country}):\nThis is a known region. You MUST structure the itinerary around these real cities within it: ${matchedDbRegion.cities.join(', ')}.\n`;
        for (const ct of regionCities.slice(0, 3)) {
          destinationDataBlock += `\n--- ${ct.name} ---\n`;
          destinationDataBlock += `Real Landmarks: ${(ct.landmarks || []).join(', ')}\n`;
          destinationDataBlock += `Real Neighborhoods: ${(ct.neighborhoods || []).join(', ')}\n`;
          destinationDataBlock += `Real Food/Dining: ${(ct.food || []).join(', ')}\n`;
          destinationDataBlock += `Real Activities: ${(ct.activities || []).join(', ')}\n`;
          destinationDataBlock += `Real Shopping: ${(ct.shopping || []).join(', ')}\n`;
          destinationDataBlock += `Real Culture: ${(ct.culture || []).join(', ')}\n`;
        }
        destinationDataBlock += `\nCRITICAL: Use ONLY real-world, physically existing landmarks and places (like the ones listed above). Do not invent or make up any place names.`;
      }
    } else if (matchedDbCity) {
      destinationDataBlock = `\n\nDESTINATION DATABASE MATCH (City: ${matchedDbCity.name}, ${matchedDbCity.country}):\n`;
      destinationDataBlock += `Real Landmarks: ${(matchedDbCity.landmarks || []).join(', ')}\n`;
      destinationDataBlock += `Real Neighborhoods: ${(matchedDbCity.neighborhoods || []).join(', ')}\n`;
      destinationDataBlock += `Real Food/Dining: ${(matchedDbCity.food || []).join(', ')}\n`;
      destinationDataBlock += `Real Activities: ${(matchedDbCity.activities || []).join(', ')}\n`;
      destinationDataBlock += `Real Shopping: ${(matchedDbCity.shopping || []).join(', ')}\n`;
      destinationDataBlock += `Real Culture: ${(matchedDbCity.culture || []).join(', ')}\n`;
      destinationDataBlock += `\nCRITICAL: Use ONLY real-world, physically existing landmarks and places (like the ones listed above). Do not invent or make up any place names. You may add other real places you know about this city beyond this list, but never fabricate place names.`;
    }

    const systemPrompt = `You are an expert travel planner and local guide who creates highly detailed, realistic, destination-aware itineraries that feel like a personal travel coach telling the user exactly what to do each day.

Your goals:
- Always return a complete, day‑by‑day itinerary.
- Never refuse or say it is not possible; if budget or time is tight, still propose the best possible plan within constraints.
- Optimize for enjoyment, realism, local culture, safety, and efficient routing.
- Respect the user's budget and preferences as much as possible.

Required output format:
Reply in JSON only, no extra text.

JSON structure:
{
  "tripSummary": {
    "destination": "string",
    "totalDays": number,
    "travelStyle": "chill/adventure/luxury/budget/mixed",
    "estimatedTotalCost": {
      "amount": number,
      "currency": "${displayCurrency}"
    },
    "bestTimeAdvice": "string"
  },
  "dayByDayPlan": [
    {
      "dayNumber": 1,
      "title": "Short title for the day",
      "theme": "string",
      "morning": {
        "description": "Detailed step‑by‑step plan for morning (subah kya karein) with SPECIFIC named locations and what to eat/do there.",
        "estimatedCost": {
          "amount": number,
          "currency": "${displayCurrency}"
        }
      },
      "afternoon": {
        "description": "Detailed step‑by‑step plan for afternoon (dopahar kya karein) with SPECIFIC named markets, sights, or cafes.",
        "estimatedCost": {
          "amount": number,
          "currency": "${displayCurrency}"
        }
      },
      "evening": {
        "description": "Detailed step‑by‑step plan for evening (shaam kya karein) with SPECIFIC named restaurants, street food stalls, or nightlife clubs/bars.",
        "estimatedCost": {
          "amount": number,
          "currency": "${displayCurrency}"
        }
      },
      "notes": [
        "short practical tip 1",
        "short practical tip 2"
      ]
    }
  ],
  "safetyAndLogistics": {
    "localTransportTips": "string",
    "areaSafetyNotes": "string",
    "moneySavingTips": "string"
  }
}

Style & Constraint Rules:
- REAL PLACE NAMES ONLY: For any well-known city, country, or region in the world (e.g., Paris, New York, Tokyo, Edinburgh, Rome, London, Bangkok, Delhi, etc.), you MUST use REAL, verifiable place names — real landmarks, real neighborhoods, real restaurants, real markets, real museums, real parks, real cultural venues. Do NOT invent, fabricate, or make up fake place names. Every place name you output must be a real place that exists in the real world. If you do not know real landmarks or restaurants for a destination, use generic descriptions of the activities (e.g., "visit a local museum", "dine at a traditional restaurant") instead of inventing specific place names.
- DESTINATION AWARENESS: For any destination in the world, always use real local places (monuments, areas, markets, parks, beaches, museums, streets, local food spots, cafes, etc.) that actually exist there. Never use generic placeholders like "explore local markets", "visit attractions", "nearby cafe", or "eat regional cuisine". Always name specific places, markets, local food/eateries, and nightlife spots for each day.
  - State/Region/Country Query Rule: If the destination is a state, country, or large region (e.g., "Bihar", "Himachal Pradesh", "Rajasthan", "Japan", "Italy", "California", "Bavaria"), you MUST internally pick 1 to 3 key real cities/towns within that region (e.g., Patna, Bodh Gaya, and Nalanda for Bihar; Shimla, Manali, and Dharamshala for Himachal Pradesh; Tokyo, Kyoto, and Osaka for Japan) and structure the day-by-day plan around them.
  - Concrete Naming Rule: For EVERY single day and EVERY time block (morning, afternoon, evening), you MUST mention at least 2 to 3 concrete place names (cities, neighborhoods, monuments, temples, ghats, lakes, beaches, parks, markets, restaurants, cafes, clubs) that fit the destination.
  - No Vague Placeholders: You must NEVER output vague, generic, or template-like filler phrases. Every description must contain real, specific, and actual names of places (such as naming a specific street, neighborhood, restaurant, temple, park, or monument). For example, do not write "a local temple" or "the main riverbank" without specifying its actual name (e.g., "Mahabodhi Temple" or "Gandhi Ghat").
  - Day-by-Day Variety: Do not repeat similar sentences or structures across days. Each day must feel unique, showcasing a different selection of neighborhoods, landmarks, local eats, and activities.
  - Never fall back to a single generic template repeated across multiple days. Make each day unique and interesting, presenting a diverse mix of sightseeing, food, shopping, and nightlife.
- INTERESTS & VIBES: Strongly align the daily plans with the traveler's interests (e.g. party, shopping, food, culture, nature).
  - If "party" is selected, recommend specific real clubs, pubs, or lounge bars active in the night.
  - If "shopping" is selected, name specific real flea markets, shopping streets, or malls.
  - If "food" is selected, name specific popular street food lanes or heritage restaurants.
  - If no specific interests are selected, show the best of everything: a balanced mix of landmarks, culture, nature, food, shopping, and nightlife — showcase what the destination is most famous for.
- BUDGET DISCIPLINE: Keep the sum of all estimated costs within the user's budget.
  - If the budget is low, prioritize free or very cheap activities (public parks, monuments, street walking, cheap street food) and explicitly note money-saving tips.
  - If the budget is high, include premium experiences (fine dining, private tours, upscale lounges) but keep it balanced.
- Plan every single day with specific activities for morning, afternoon, and evening (like "subah yeh karo, dopahar yeh, shaam yeh").
- If the trip is long (over 14 days), you can repeat patterns, but still give each day its own description/plan.
- If the trip is very long (up to 92 days), you must still return an entry in dayByDayPlan for every single day, but make the descriptions and plans short and concise (e.g. 5-15 words per time slot) to prevent timeouts and token length issues.
${simplifiedInstruction}
${destinationDataBlock}

User details for the trip:
Name (optional): ${userName}
Origin city/country: ${origin || 'Traveler Location'}
Main destination(s): ${preprocessed.destination || 'Selected Destination'}
Start date: ${preprocessed.startDate || 'today'}
End date: ${preprocessed.endDate || 'tomorrow'}
Total days (if known): ${daysCount}
Group type: ${req.body.groupType || 'solo/couple/friends/family'}
Approx budget in ${displayCurrency}: ${preprocessed.budget || parsedBudget}
Vibes / interests: ${preprocessed.interests.join(', ') || 'sightseeing, local life, relaxing'}
Must‑do things: ${preprocessed.mustDo || 'none'}
Must‑avoid things: ${preprocessed.mustAvoid || 'none'}

User's raw text description (as they typed it in their language):
"""
${preprocessed.prompt || ''}
"""

Based on all this, generate the best possible trip itinerary following the JSON format and rules above.`;

    const aiStartTime = Date.now();
    console.log(`[AI LLM Request Payload]:\n${systemPrompt}`);
    
    // API Call with 45 seconds timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 45 seconds')), 45000)
    );

    let textResponse = "";
    try {
      const primaryCallPromise = primaryModel.generateContent(systemPrompt);
      const result = await Promise.race([primaryCallPromise, timeoutPromise]);
      textResponse = result.response.text().trim();
      console.log(`[AI LLM Raw Response (gemini-2.5-flash)]:\n${textResponse}`);
    } catch (primaryError) {
      console.warn(`[AI Trip Generation] Primary model (gemini-2.5-flash) failed: ${primaryError.message}. Trying fallback model (gemini-2.5-flash-lite)...`);
      // Try fallback model (gemini-2.5-flash-lite has higher free quota)
      try {
        const fallbackCallPromise = fallbackModel.generateContent(systemPrompt);
        const fallbackTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback AI request timed out after 45 seconds')), 45000)
        );
        const fallbackResult = await Promise.race([fallbackCallPromise, fallbackTimeout]);
        textResponse = fallbackResult.response.text().trim();
        console.log(`[AI LLM Raw Response (gemini-2.5-flash-lite fallback)]:\n${textResponse}`);
      } catch (fallbackError) {
        console.error(`[AI Trip Generation] Both models failed. Primary: ${primaryError.message}. Fallback: ${fallbackError.message}. Using mock itinerary.`);
        return fallbackResponse();
      }
    }

    let parsedJson = null;
    const cleanText = (txt) => {
      let cleaned = txt.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }
      return cleaned;
    };

    try {
      parsedJson = JSON.parse(cleanText(textResponse));
    } catch (parseError) {
      console.warn('[AI Trip Generation] First JSON parse attempt failed. Attempting reformat retry with LLM...');
      
      const reformatPrompt = `You are a strict JSON formatter. I asked you to generate a travel itinerary in a specific JSON structure, but your response was not valid JSON.
     
Here is the original instruction:
${systemPrompt}

Here is your previous response:
${textResponse}

Please reformat the last answer into the required JSON schema only. Respond with ONLY the raw JSON string starting with { and ending with }. Do NOT include any markdown code blocks, explanation or additional text.`;

      console.log(`[AI Re-asking LLM for Reformat Payload]:\n${reformatPrompt}`);
      try {
        const reformatCallPromise = model.generateContent(reformatPrompt);
        const reformatResult = await Promise.race([reformatCallPromise, timeoutPromise]);
        const reformatText = reformatResult.response.text().trim();
        console.log(`[AI LLM Reformat Raw Response]:\n${reformatText}`);
        
        parsedJson = JSON.parse(cleanText(reformatText));
      } catch (retryError) {
        console.error('[AI Trip Generation] Reformatting attempt failed or timed out. Falling back.', retryError.message);
        return fallbackResponse();
      }
    }

    const itinerary = normalizeItinerary(parsedJson, startDate, parsedBudget, activeCurrency, daysCount);
    if (!itinerary) {
      return fallbackResponse();
    }

    if (activeUser && !isPremium) {
      db.users.update(activeUser.id, { freeTripsGenerated: activeUser.freeTripsGenerated + 1 });
    }

    const duration = Date.now() - startTime;
    console.log(`[AI Trip Generation Success] Total endpoint latency: ${duration}ms`);
    const freshUser = activeUser ? db.users.findById(activeUser.id) : null;
    return res.json({ itinerary, user: authController.formatUserProfile(freshUser) });

  } catch (error) {
    console.error(`[AI Trip Generation Fatal Error] Error:`, error);
    return fallbackResponse();
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
  downloadTripPDF,
  generateMockItinerary
};
