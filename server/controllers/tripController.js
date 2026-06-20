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

  // If no city matches directly, check if the input matches any landmark of a city!
  if (!matchedCity) {
    for (const [key, ct] of Object.entries(cities)) {
      const landmarks = ct.landmarks || [];
      const matchedLandmark = landmarks.find(lm => {
        const cleanLm = lm.toLowerCase().trim();
        return cleanLm.includes(primaryToken) || primaryToken.includes(cleanLm) || isFuzzyMatch(cleanLm, primaryToken);
      });
      if (matchedLandmark) {
        matchedCity = ct;
        break;
      }
    }
  }

  // Try to find matching region only if no city (direct or landmark) was matched
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

const INR_TO_CURRENCY = {
  INR: 1,       USD: 0.012,   EUR: 0.011,   GBP: 0.0094,
  AUD: 0.0183,  CAD: 0.0164,  SGD: 0.0162,  AED: 0.044,
  JPY: 1.85,    CHF: 0.0106,  HKD: 0.0937,  NZD: 0.0198,
  SEK: 0.126,   NOK: 0.129,   DKK: 0.082,   CNY: 0.087,
  KRW: 16.5,    THB: 0.43,    IDR: 193,      MYR: 0.056,
  PHP: 0.69,    VND: 300,      BDT: 1.32,    PKR: 3.38,
  LKR: 3.85,    NPR: 1.6,     SAR: 0.045,   QAR: 0.044,
  KWD: 0.0037,  BHD: 0.0045,  OMR: 0.0046,  JOD: 0.0085,
  EGP: 0.59,    ZAR: 0.22,    NGN: 19.5,    KES: 1.56,
  GHS: 0.18,    TZS: 31.5,    BRL: 0.063,   MXN: 0.21,
  ARS: 12.0,    COP: 49.5,    CLP: 11.5,    PEN: 0.045,
  TRY: 0.41,    PLN: 0.048,   CZK: 0.28,    HUF: 4.35,
  RON: 0.055,   UAH: 0.5,     RUB: 1.10,    ILS: 0.044,
  MAD: 0.12,    BGN: 0.021,   IQD: 15.7,    TWD: 0.39,
};

function generateMockItinerary(destination, budget, currency, daysCount, interests, startDate) {
  const destName = destination || 'Selected Destination';
  const totalDays = Number(daysCount) || 3;
  const totalBudget = Number(budget) || 15000;
  const curr = currency || 'INR';
  const avgDaily = Math.round(totalBudget / totalDays);
  const baseDate = startDate ? new Date(startDate) : new Date();

  // Determine budget tier in INR
  const rate = INR_TO_CURRENCY[curr] || 1.0;
  const dailyBudgetInINR = avgDaily / rate;
  let budgetTier = 'mid'; // default
  if (dailyBudgetInINR < 3000) {
    budgetTier = 'low';
  } else if (dailyBudgetInINR > 8000) {
    budgetTier = 'high';
  }

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

      let morningDesc = '';
      let afternoonDesc = '';
      let eveningDesc = '';

      if (budgetTier === 'low') {
        morningDesc = `Begin the morning with a self-guided walking tour exploring ${city.landmarks[lmIdx1]} and wandering through the historic ${city.neighborhoods[nhIdx1]} neighborhood. Visit the free-entry cultural site of ${city.culture[cultIdx]}.`;
        afternoonDesc = `Head to the vibrant ${city.shopping[shopIdx]} area for budget-friendly window shopping. For lunch, sample local street eats or taste ${city.food[foodIdx]} at an affordable neighborhood diner.`;
        eveningDesc = `Enjoy a relaxed evening activity of ${city.activities[actIdx]} (utilizing cheap local transport). Afterwards, dine at a pocket-friendly cafe in the lively ${city.neighborhoods[nhIdx2]} district.`;
      } else if (budgetTier === 'high') {
        morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} with a private guide, followed by a personalized tour of the historic ${city.neighborhoods[nhIdx1]} neighborhood. Visit the premier cultural exhibition at ${city.culture[cultIdx]}.`;
        afternoonDesc = `Head to the upscale boutiques in the ${city.shopping[shopIdx]} area for premium shopping. Enjoy a gourmet lunch featuring refined preparations of ${city.food[foodIdx]} at a highly-acclaimed signature restaurant.`;
        eveningDesc = `Indulge in a premium evening experience of ${city.activities[actIdx]} via private transport. Afterwards, unwind with a multi-course dinner at a top-tier restaurant in the exclusive ${city.neighborhoods[nhIdx2]} district.`;
      } else {
        morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} and taking a guided stroll around the historic ${city.neighborhoods[nhIdx1]} neighborhood. Visit the nearby cultural site of ${city.culture[cultIdx]}.`;
        afternoonDesc = `Head to the vibrant ${city.shopping[shopIdx]} area for shopping and sightseeing. Have a delicious local lunch tasting ${city.food[foodIdx]} at a well-rated local diner.`;
        eveningDesc = `Enjoy the evening activity of ${city.activities[actIdx]}. Afterwards, relax and dine at a cozy restaurant in the lively ${city.neighborhoods[nhIdx2]} district.`;
      }

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
      const lowBudgetPlans = [
        {
          morning: `Take a self-guided walking tour through the historic streets of ${destName}, exploring the main public plazas and taking photos from a free scenic city overlook.`,
          afternoon: `Wander through the bustling central public market of ${destName} to browse budget-friendly local stalls. Enjoy a budget lunch at a popular street food joint or local eatery.`,
          evening: `Take a relaxing evening stroll along the main waterfront promenade or central plaza of ${destName}, and enjoy a pocket-friendly dinner at a casual neighborhood restaurant.`
        },
        {
          morning: `Join a free walking tour through ${destName}'s oldest residential neighborhood to see the historic architecture and learn about local heritage.`,
          afternoon: `Browse the artisan workshops and local craft displays in the creative arts district of ${destName}. Have lunch at an affordable courtyard cafe or bakery.`,
          evening: `Experience the local evening vibe at a lively community square or night market in ${destName}, tasting affordable street food snacks.`
        },
        {
          morning: `Visit a peaceful scenic park, nature reserve, or iconic natural viewpoint just outside the central area of ${destName} (using low-cost public transit).`,
          afternoon: `Explore a free cultural center, art gallery, or public history archive in ${destName}. Have a relaxing lunch at a budget-friendly local bistro.`,
          evening: `Relax at a popular local sunset spot or public park in ${destName}. Enjoy a simple dinner featuring fresh regional ingredients at a cozy tavern.`
        },
        {
          morning: `Explore the public areas around a historic fort, castle, or old stone heritage structure in or near ${destName}.`,
          afternoon: `Head to a lively bazaar or flea market in ${destName} to browse unique local crafts. Enjoy lunch at a traditional family-owned diner.`,
          evening: `Enjoy a peaceful evening riverfront walk or lakeside stroll in ${destName}, followed by dining at an affordable family-style eatery.`
        },
        {
          morning: `Walk through a vibrant shopping district or local high street in ${destName}, stopping by historic architecture sites along the way.`,
          afternoon: `Visit a public botanical garden, municipal glasshouse, or scenic green space in ${destName}. Have lunch at a garden cafe known for fresh local produce.`,
          evening: `Attend a free cultural event or live street performance in ${destName}, followed by dinner at a cozy, budget-friendly tavern.`
        },
        {
          morning: `Take a morning walk through a quiet residential neighborhood of ${destName} to see how locals live, visiting a popular local bakery.`,
          afternoon: `Explore a local science museum, library, or historic archive in ${destName}. Have lunch at a popular cafe nearby.`,
          evening: `Discover the local nightlife scene in a lively district of ${destName}, visiting a popular pub or music lounge for drinks and snacks.`
        },
        {
          morning: `Visit a beautiful local monument, historic bridge, or ancient architectural tower in ${destName}.`,
          afternoon: `Spend the afternoon exploring local boutique shops and souvenir markets in ${destName}. Enjoy a farewell lunch at a highly-rated local diner.`,
          evening: `Gather at the main central square of ${destName} to see the city lights, and enjoy a final celebratory dinner at a premium restaurant.`
        }
      ];

      const midBudgetPlans = [
        {
          morning: `Explore the central historic quarter of ${destName}, walking down the main heritage streets, visiting the municipal museum, and stopping at a scenic city overlook.`,
          afternoon: `Visit the central market square of ${destName} to explore local stalls. Have a traditional local lunch at a popular family-run restaurant nearby.`,
          evening: `Take an evening walk along the main waterfront promenade or central plaza of ${destName}, and enjoy dinner at a highly-rated local eatery serving regional specialties.`
        },
        {
          morning: `Join a guided walking tour through ${destName}'s oldest neighborhood to see the historic architecture and learn about local heritage.`,
          afternoon: `Browse the artisan workshops and local craft boutiques in the creative arts district of ${destName}. Have lunch at a cozy courtyard cafe.`,
          evening: `Experience the local evening vibe at a popular street food lane or central square in ${destName}, tasting authentic local street eats.`
        },
        {
          morning: `Visit a peaceful scenic park, nature reserve, or iconic natural viewpoint just outside the central area of ${destName}.`,
          afternoon: `Explore a prominent cultural center, art gallery, or history archive in ${destName}. Have a relaxing lunch at a nearby bistro.`,
          evening: `Relax at a popular local sunset spot or rooftop lounge in ${destName}. Enjoy a premium dinner featuring fresh regional ingredients.`
        },
        {
          morning: `Walk through a vibrant shopping district or local high street in ${destName}, stopping by historic architecture sites along the way.`,
          afternoon: `Visit a botanical garden, municipal glasshouse, or scenic green space in ${destName}. Have lunch at a garden cafe known for fresh local produce.`,
          evening: `Attend a traditional cultural show, live music performance, or community event in ${destName}, followed by dinner at a cozy tavern.`
        },
        {
          morning: `Explore the ruins of a historic fort, castle, or old stone heritage structure in or near ${destName}.`,
          afternoon: `Head to a bustling bazaar or flea market in ${destName} to buy unique local crafts. Enjoy lunch at a traditional diner nearby.`,
          evening: `Enjoy a peaceful evening boat ride, riverfront stroll, or lakeside walk in ${destName}, followed by dining at a waterfront restaurant.`
        },
        {
          morning: `Take a morning walk through a quiet residential neighborhood of ${destName} to see how locals live, visiting a popular local bakery.`,
          afternoon: `Explore a local science museum, library, or historic archive in ${destName}. Have lunch at a popular cafe nearby.`,
          evening: `Discover the local nightlife scene in a lively district of ${destName}, visiting a popular pub or music lounge for drinks and snacks.`
        },
        {
          morning: `Visit a beautiful local monument, historic bridge, or ancient architectural tower in ${destName}.`,
          afternoon: `Spend the afternoon exploring local boutique shops and souvenir markets in ${destName}. Enjoy a farewell lunch at a highly-rated local diner.`,
          evening: `Gather at the main central square of ${destName} to see the city lights, and enjoy a final celebratory dinner at a premium restaurant.`
        }
      ];

      const highBudgetPlans = [
        {
          morning: `Embark on a private guided tour of the central historic quarter of ${destName}, gaining exclusive access to key heritage landmarks and a premium scenic overlook.`,
          afternoon: `Browse the high-end specialty boutiques around the central district of ${destName}. Have a gourmet lunch featuring upscale local recipes at a highly-rated signature restaurant.`,
          evening: `Take a private sunset cruise or guided evening tour of the waterfront in ${destName}, followed by a multi-course tasting dinner at an acclaimed fine dining restaurant.`
        },
        {
          morning: `Join a private expert-led walking tour of ${destName}'s historic neighborhood, visiting exclusive historical sites and private archives.`,
          afternoon: `Visit the fine art galleries, designer studios, and premium craft boutiques in ${destName}'s arts district. Have lunch at a highly-rated chef's bistro.`,
          evening: `Experience the city's nightlife with a VIP reservation at a top-tier lounge or live music venue in ${destName}, enjoying custom cocktails and premium appetizers.`
        },
        {
          morning: `Take a private chauffeured excursion to a pristine nature reserve, national park, or stunning panoramic viewpoint just outside ${destName}.`,
          afternoon: `Explore a major private museum, prestigious art exhibition, or private collection in ${destName}. Have a gourmet lunch at a Michelin-rated garden pavilion restaurant.`,
          evening: `Enjoy sunset cocktails at an exclusive rooftop bar with sweeping views of ${destName}, followed by an exquisite celebratory dinner at a top-ranked restaurant.`
        },
        {
          morning: `Take a VIP guided tour of a historic palace, private castle, or prominent heritage estate in the ${destName} region.`,
          afternoon: `Hire a personal shopping guide to browse the premium artisan boutiques and high-end markets in ${destName}. Enjoy lunch at a refined traditional restaurant.`,
          evening: `Book a private boat charter, yacht cruise, or scenic helicopter ride over ${destName}, followed by a luxury dinner at a celebrated waterside establishment.`
        },
        {
          morning: `Browse the luxury designer boutiques along the premier high street of ${destName}, accompanied by private transit.`,
          afternoon: `Visit a prestigious botanical garden or private historic estate in ${destName}. Enjoy a catered gourmet lunch in a scenic reserved pavilion.`,
          evening: `Attend a premier theatrical production, opera, or exclusive cultural show in ${destName}, followed by a late-night dinner at a high-end bistro.`
        },
        {
          morning: `Take a private cooking class with a renowned chef in ${destName} to learn the secrets of local gastronomy, starting with a guided market tour.`,
          afternoon: `Visit a luxury wellness spa or exclusive private library/gallery in ${destName}. Enjoy a light, high-end lunch at a premium wellness cafe.`,
          evening: `Discover the upscale nightlife scene in the most exclusive district of ${destName}, visiting a renowned cocktail lounge or private club.`
        },
        {
          morning: `Take a private helicopter tour or luxury scenic drive to view the iconic architectural landmarks of ${destName}.`,
          afternoon: `Spend the afternoon collecting premium local art, jewelry, and specialty goods from ${destName}'s top boutiques. Enjoy a celebratory farewell lunch.`,
          evening: `Gather for a private dinner event at a top-rated panoramic restaurant overlooking ${destName}, celebrating the completion of your luxury journey.`
        }
      ];

      let syntheticPlans = midBudgetPlans;
      if (budgetTier === 'low') {
        syntheticPlans = lowBudgetPlans;
      } else if (budgetTier === 'high') {
        syntheticPlans = highBudgetPlans;
      }

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
        destinationDataBlock += `\nCRITICAL: Use the real place names listed above as your primary guide, but you are highly encouraged to supplement them with other real-world, physically existing landmarks, restaurants, cultural spots, and markets in these cities to create a highly detailed, immersive itinerary. Do not invent or make up any place names under any circumstances.`;
      }
    } else if (matchedDbCity) {
      destinationDataBlock = `\n\nDESTINATION DATABASE MATCH (City: ${matchedDbCity.name}, ${matchedDbCity.country}):\n`;
      destinationDataBlock += `Real Landmarks: ${(matchedDbCity.landmarks || []).join(', ')}\n`;
      destinationDataBlock += `Real Neighborhoods: ${(matchedDbCity.neighborhoods || []).join(', ')}\n`;
      destinationDataBlock += `Real Food/Dining: ${(matchedDbCity.food || []).join(', ')}\n`;
      destinationDataBlock += `Real Activities: ${(matchedDbCity.activities || []).join(', ')}\n`;
      destinationDataBlock += `Real Shopping: ${(matchedDbCity.shopping || []).join(', ')}\n`;
      destinationDataBlock += `Real Culture: ${(matchedDbCity.culture || []).join(', ')}\n`;
      destinationDataBlock += `\nCRITICAL: Use the real place names listed above as your primary guide, but you are highly encouraged to supplement them with other real-world, physically existing landmarks, restaurants, cultural spots, and markets in this city to create a highly detailed, immersive itinerary. Do not invent or make up any place names under any circumstances.`;
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
- HIGH DETAIL IMMERSIVE EXPERIENCE: Provide rich, detailed, and highly descriptive plans for each time slot (morning, afternoon, evening). Each description block MUST be at least 30 to 60 words. Do not use short summaries; describe the sights, history, atmosphere, specific dishes to order, and scenic spots to make the user feel like they have a premium local travel guide.
- GLOBAL PLACE DETECTION: Detect what the destination is and structure the itinerary accordingly:
  * If it is a Landmark/Famous Spot (e.g. "Taj Mahal", "Eiffel Tower"): Structure the plan around that landmark and its surrounding city/neighborhood.
  * If it is a Country or State/Region (e.g. "India", "California", "Scotland", "Kenya"): Structure the plan across 1 to 3 key cities within that region (e.g. Edinburgh and Glasgow for Scotland).
  * If it is a City: Organize days by distinct neighborhoods to minimize transit time.
- BALANCED DEFAULT (NO SPECIFIC INTERESTS): If no specific interests or vibes are chosen, you MUST automatically output a "Best of the Destination" itinerary. Each day must include a balanced mix of:
  * At least 1-2 top landmarks or major tourist attractions.
  * At least 1 famous local dish or must-try food joint (name specific restaurants/cafes/street stalls).
  * At least 1 popular local market, bazaar, shopping street, or mall.
  * At least 1 cultural or heritage site (museum, old town quarter, temple/church, art gallery).
  * 1-2 unique local experiences or panoramic viewpoints.
- INTERESTS CUSTOMIZATION: If specific interests (e.g. party, shopping, food) are chosen, bias the plan to focus heavily on those activities, but you must still keep the plan practical and balanced, ensuring it still includes local food, attractions, and cultural context.
- BUDGET ADAPTATION: The itinerary MUST adapt its recommendations based on the user's budget tier:
  * LOW BUDGET: Propose free attractions (parks, public squares, walking tours, free museums), street food markets, budget local eateries, and public transit tips.
  * MID BUDGET: Propose a mix of famous paid attractions, mid-range local restaurants, local shopping streets, and standard transport options.
  * HIGH BUDGET: Propose premium experiences, fine-dining restaurants, guided private tours, upscale neighborhoods, shopping malls/boutiques, and taxi/private transfer options.
- REAL PLACE NAMES ONLY: You MUST use REAL, verifiable place names — real landmarks, real neighborhoods, real restaurants, real markets, real museums, real parks, real cultural venues. Do NOT invent, fabricate, or make up fake place names. If you do not know real landmarks or restaurants for a destination, use generic descriptions of the activities (e.g., "visit a local museum", "dine at a traditional restaurant") instead of inventing specific place names.
- Day-by-Day Variety: Do not repeat similar sentences or structures across days. Each day must feel unique, showcasing a different selection of neighborhoods, landmarks, local eats, and activities.
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
        const reformatCallPromise = primaryModel.generateContent(reformatPrompt);
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
