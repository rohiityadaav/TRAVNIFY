const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');
const config = require('../config');
const authController = require('./authController');

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

function generateMockItinerary(destination, budget, currency, daysCount, interests, startDate) {
  const destName = destination || 'Goa, India';
  const totalDays = daysCount || 3;
  const totalBudget = budget || 15000;
  const curr = currency || 'INR';
  const avgDaily = Math.round(totalBudget / totalDays);

  const baseDate = startDate ? new Date(startDate) : new Date();

  // Robust Database of States, Countries and Cities
  const knownDestinationsMockData = {
    "delhi": {
      morning: [
        "Walk through the historic lanes of Chandni Chowk, taking in the sights and scents.",
        "Explore the majestic Red Fort and learn about its Mughal architecture.",
        "Visit the serene Lotus Temple and spend some quiet time meditating.",
        "Stroll around Connaught Place (CP) and admire the colonial-era architecture.",
        "Explore the ruins and lush greenery of Lodhi Gardens.",
        "Visit Humayun's Tomb, a magnificent precursor to the Taj Mahal.",
        "Head to Qutub Minar, the world's tallest brick minaret, and check out the ruins."
      ],
      afternoon: [
        "Have delicious paranthas at the famous Paranthe Wali Gali in Old Delhi.",
        "Enjoy a classic lunch at Karim's near Jama Masjid, trying their legendary kebabs.",
        "Browse handicrafts and regional cuisines from different states at Dilli Haat INA.",
        "Shop for bargain fashion at the bustling Sarojini Nagar Market.",
        "Explore the high-street brands and cafes in Connaught Place Inner Circle.",
        "Visit the Crafts Museum and enjoy a traditional Indian meal at Lota Cafe.",
        "Wander around Khan Market, checking out boutique bookstores and upscale cafes."
      ],
      evening: [
        "Enjoy the vibrant nightlife at Hauz Khas Village, hopping between rooftop bars.",
        "Experience a sufi music night or dine at a fine-dining spot in Aerocity.",
        "Walk near India Gate, enjoy a street-side ice cream, and see the illuminated war memorial.",
        "Visit the lively CyberHub in Gurugram for drinks, pub food, and live DJ sets.",
        "Check out the nightlife and cocktail bars in Greater Kailash (GK) M-Block market.",
        "Indulge in a premium Mughlai dinner at Al Jawahar or Moti Mahal.",
        "Relax at a trendy lounge or microbrewery in Connaught Place."
      ]
    },
    "paris": {
      morning: [
        "Walk around the iconic Eiffel Tower and take photos from Trocadéro Gardens.",
        "Stroll through the artistic streets of Montmartre up to the Sacré-Cœur Basilica.",
        "Visit the world-famous Louvre Museum to admire the Mona Lisa and other masterpieces.",
        "Wander along the Seine River and check out the historic booksellers (bouquinistes).",
        "Explore the beautiful Luxembourg Gardens, watching locals play chess and sail toy boats.",
        "Visit the Notre-Dame Cathedral area and stroll through Île de la Cité.",
        "Walk down the grand Avenue des Champs-Élysées towards the Arc de Triomphe."
      ],
      afternoon: [
        "Grab fresh croissants and coffee at a cozy sidewalk bistro in the Latin Quarter.",
        "Enjoy a picnic with French cheese and baguettes in the Champ de Mars park.",
        "Browse the designer shops and historic boutiques in Le Marais district.",
        "Visit the Musée d'Orsay to see the stunning collection of Impressionist art.",
        "Have lunch at a classic brasserie like Bouillon Chartier, tasting traditional French onion soup.",
        "Explore the historic covered passages of Paris, like Passage des Panoramas.",
        "Visit the Palais Garnier opera house and shop at the nearby Galeries Lafayette."
      ],
      evening: [
        "Enjoy a cruise along the Seine River as the city lights up and monuments glow.",
        "Experience Paris's wine culture at a local cave à vin (wine bar) in Saint-Germain-des-Prés.",
        "Walk around the lively Pigalle area and dine at a trendy bistro.",
        "Dine at a premium restaurant in Le Marais, enjoying fine French cuisine and pastries.",
        "Attend a live jazz performance at Le Caveau de la Huchette in the Latin Quarter.",
        "Relax with a glass of champagne at a rooftop bar overlooking the sparkling Eiffel Tower.",
        "Take an evening stroll through the illuminated courtyard of the Louvre."
      ]
    },
    "new york": {
      morning: [
        "Walk across the iconic Brooklyn Bridge and enjoy skyline views of Manhattan.",
        "Stroll through Central Park, visiting Bethesda Fountain and the Strawberry Fields memorial.",
        "Visit the historic Statue of Liberty and Ellis Island by taking the ferry.",
        "Walk the High Line, an elevated public park built on a historic freight rail line.",
        "Visit the Top of the Rock observation deck at Rockefeller Center for panoramic city views.",
        "Explore the grand Beaux-Arts building of the New York Public Library and Bryant Park.",
        "Walk through the Charging Bull and Wall Street in the Financial District."
      ],
      afternoon: [
        "Grab a classic New York slice of pizza in Greenwich Village or Soho.",
        "Explore the galleries and museums along the Museum Mile, including the Met or MoMA.",
        "Browse the boutique shops and art galleries in the trendy neighborhood of Soho.",
        "Have a pastrami sandwich at a legendary NYC deli, trying classic local specialties.",
        "Wander through the bustling streets of Chinatown and Little Italy.",
        "Visit Grand Central Terminal and have lunch at the Grand Central Oyster Bar.",
        "Shop along Fifth Avenue or explore the unique shops in Chelsea Market."
      ],
      evening: [
        "See the bright neon lights of Times Square and catch a Broadway musical show.",
        "Enjoy craft cocktails at a speakeasy bar in the East Village.",
        "Experience the nightlife and live music at a jazz club in Greenwich Village.",
        "Dine at a trendy restaurant in the Meatpacking District or Williamsburg, Brooklyn.",
        "Take an evening cruise or walk along the Hudson River Park to watch the sunset.",
        "Grab a local craft beer at a rooftop lounge with views of the Empire State Building.",
        "Dine at a classic steakhouse or modern eatery in Midtown Manhattan."
      ]
    },
    "manali": {
      morning: [
        "Walk through the pine-scented trails of Van Vihar National Park near the Beas River.",
        "Visit the historic wooden Hadimba Temple nestled amidst giant deodar forests.",
        "Take a scenic drive to the Solang Valley and enjoy the crisp mountain air.",
        "Walk around the rustic lanes of Old Manali, taking photos of traditional wooden houses.",
        "Visit the serene Nyingmapa Buddhist Monastery and spin the prayer wheels.",
        "Head to Vashisht Village to see the natural hot water springs.",
        "Start a short trek up to the beautiful Jogini Waterfalls near Vashisht."
      ],
      afternoon: [
        "Have lunch at a cozy cafe in Old Manali, enjoying wood-fired trout or local Himachali Siddu.",
        "Explore Mall Road, shopping for woolen shawls, wooden crafts, and local apricots.",
        "Enjoy paragliding or zorbing in the Solang Valley activity grounds.",
        "Sit by the banks of the Beas River, listening to the rushing water and enjoying a hot cup of tea.",
        "Visit the Himalayan Nyinmapa Tibetan Buddhist Temple and browse local shops nearby.",
        "Have lunch at Cafe 1947 or Dylan's Toasted & Roasted Coffee House in Old Manali.",
        "Wander through the peaceful orchards and pine forests of Manu Temple road."
      ],
      evening: [
        "Stroll along the lively Mall Road, tasting local street food like momos and softies.",
        "Enjoy live music and craft beer at a vibrant pub/lounge in Old Manali.",
        "Relax around a cozy bonfire at your cottage or resort, enjoying a hearty dinner.",
        "Dine at a rooftop restaurant overlooking the valley, watching the stars and town lights.",
        "Visit a local German Bakery for delicious apple pie and hot chocolate.",
        "Spend a quiet evening at a riverside cafe in Old Manali, chatting with other travelers.",
        "Try local fruit wines and traditional dishes at a heritage Himachali kitchen."
      ]
    },
    "kasol": {
      morning: [
        "Walk along the roaring Parvati River, enjoying the misty pine forest vibes.",
        "Hike the scenic nature trail from Kasol to the peaceful village of Chalal.",
        "Visit the nearby holy site of Manikaran Sahib Gurudwara and see the hot springs.",
        "Start a short trek to Rasol village or towards the high viewpoints of the valley.",
        "Walk through the local Kasol market and enjoy the laid-back hippie culture.",
        "Find a quiet spot by the river for morning meditation or photography.",
        "Drive to the start of the Tosh village trail and enjoy the dramatic mountain views."
      ],
      afternoon: [
        "Have lunch at an Israeli cafe in Kasol, trying Shakshuka, Hummus, and pita bread.",
        "Shop for bohemian clothes, crystals, incense, and dreamcatchers in the Kasol bazaar.",
        "Enjoy a warm bath in the natural hot springs of Manikaran.",
        "Relax at the famous Evergreen Cafe or Jim Morrison Cafe, enjoying music and food.",
        "Explore the rustic pine-wood houses and Apple orchards of Chalal village.",
        "Sip herbal tea or local coffee while reading a book in a riverside cafe.",
        "Walk up the Tosh trail, stopping at local hillside dhabas for instant noodles and tea."
      ],
      evening: [
        "Dine at a vibrant cafe in Kasol with chill psychedelic trance music and cozy floor seating.",
        "Gather around a riverside bonfire under a clear starry night sky.",
        "Relax at a local German bakery, enjoying cinnamon rolls and hot chocolate.",
        "Take a peaceful evening stroll along the Kasol-Manikaran road, watching the sunset.",
        "Socialize with international travelers at local cafes like Moon Dance or Little Italy.",
        "Dine at a local trout fish kitchen, tasting freshly caught river fish.",
        "Enjoy the serene mountain silence from a wooden cafe balcony overlooking the Parvati valley."
      ]
    },
    "rishikesh": {
      morning: [
        "Attend an early morning yoga or meditation session at a peaceful ashram by the Ganges.",
        "Walk across the iconic suspension bridge Laxman Jhula and watch the sunrise over the river.",
        "Take a holy dip in the cool waters of the Ganges at Triveni Ghat.",
        "Explore the ruins of the famous Beatles Ashram (Chaurasi Kutia) and its colorful graffiti.",
        "Visit the 13-story Trayambakeshwar Temple near Laxman Jhula.",
        "Embark on a white-water rafting adventure starting from Shivpuri down the rapids.",
        "Hike to the scenic Neer Garh Waterfall for a refreshing morning bath."
      ],
      afternoon: [
        "Have lunch at a health food cafe overlooking the river, trying Ayurvedic thalis or smoothies.",
        "Browse the spiritual bookshops, crystal stores, and yoga wear shops in Ram Jhula.",
        "Visit the historic Swarg Ashram and learn about its spiritual history.",
        "Enjoy a quiet lunch at the Beatles Cafe or Freedom Cafe, enjoying the river view.",
        "Take a walking tour of the local spice and incense markets.",
        "Relax at a riverside beach, watching rafters navigate the rapids.",
        "Visit the Vashishta Gufa cave along the banks of the Ganges for deep quietude."
      ],
      evening: [
        "Witness the mesmerizing and spiritual Ganga Aarti ceremony at Parmarth Niketan or Triveni Ghat.",
        "Sip ginger lemon honey tea at a rooftop cafe in Laxman Jhula, listening to the temple bells.",
        "Dine at Chotiwala restaurant, enjoying a traditional North Indian thali.",
        "Stroll along the river ghats in the cool evening breeze, listening to devotional music.",
        "Dine at a premium organic cafe, enjoying organic wood-fired pizza and herbal teas.",
        "Relax with a sound healing session or watch a classical sitar performance.",
        "Enjoy the serene, alcohol-free nightlife, chatting with fellow seekers in cozy cafes."
      ]
    },
    "bihar": {
      morning: [
        "Begin the morning exploring Patna, visiting the historic Patna Museum and seeing the ancient relics, then walking around the famous Golghar structure.",
        "Head to Bodh Gaya to visit the sacred Mahabodhi Temple complex, meditate near the Bodhi Tree, and view the massive 80-foot Giant Great Buddha Statue.",
        "Explore the majestic ruins of ancient Nalanda University, checking out the historic Nalanda Archaeological Museum and its surrounding excavations.",
        "Drive to Rajgir and take the scenic ropeway chairlift up to the magnificent Vishwa Shanti Stupa on top of Ratnagiri Hill.",
        "Visit the historic Vishnupad Temple in Gaya, followed by a walk along the peaceful ghats of the Phalgu River."
      ],
      afternoon: [
        "Have a delicious lunch trying traditional Litti Chokha at the popular Maurya Lok street food complex in Patna.",
        "Enjoy a peaceful vegetarian lunch at the Root Institute Cafe in Bodh Gaya, followed by visiting the beautiful Thai and Bhutanese Buddhist Monasteries.",
        "Have lunch at a local garden restaurant in Nalanda, then explore the historic temples of Kundalpur nearby.",
        "Relax with a leisurely lunch at a hillside eatery in Rajgir, followed by a visit to the historic hot springs at Saptaparni Cave.",
        "Try local sweets like Tilkut and Anarsa at a famous heritage kitchen in Gaya town."
      ],
      evening: [
        "Take a scenic evening walk along Gandhi Ghat on the Ganges River in Patna, watching the daily Ganga Aarti ceremony.",
        "Stroll through the local Bodh Gaya Market, shopping for handicrafts and ending the evening at the peaceful Japanese Nippon Temple.",
        "Dine at the traditional Nalanda Retreat Restaurant, trying regional Bihari delicacies and local specialties.",
        "Explore the ancient Bimbisara Jail ruins in Rajgir and take a relaxing evening walk near the Cyclopean Wall.",
        "Visit the sacred Mangla Gauri Temple in Gaya, followed by dining at a popular traditional diner in the central bazaar."
      ]
    },
    "himachal pradesh": {
      morning: [
        "Walk down the famous Ridge in Shimla, taking in views of Christ Church and hiking up to the hilltop Jakhoo Temple.",
        "Explore the pine-scented trails of Van Vihar National Park in Manali, visiting the wooden Hadimba Temple.",
        "Visit the peaceful Tsuglagkhang Complex (Dalai Lama Temple) in McLeod Ganj, walking the spiritual Kora path.",
        "Start the day at the beautiful Khajjiar Lake near Dalhousie, walking through the lush cedar forest surrounds.",
        "Take a scenic drive through the apple orchards of Kasauli, visiting the historic Christ Church."
      ],
      afternoon: [
        "Enjoy a traditional Himachali lunch of Siddu and local food at Cafe Shimla Times, then stroll down Mall Road.",
        "Have lunch at Dylan's Toasted & Roasted Cafe in Old Manali, then sit by the rushing waters of the Beas River.",
        "Have lunch trying delicious Tibetan momos and Thukpa at the popular Tibet Kitchen in McLeod Ganj.",
        "Enjoy a picnic lunch on the green lawns of Khajjiar, followed by a horse ride through the valley.",
        "Have lunch at a cozy cafe on Kasauli Mall Road, then hike to the Gilbert Trail viewpoint."
      ],
      evening: [
        "Watch the sunset from Scandal Point in Shimla, followed by shopping for wooden crafts at Lakkar Bazar.",
        "Relax around a cozy bonfire at a riverside cafe in Old Manali, enjoying live local acoustic music.",
        "Sip herbal butter tea at Illiterati Cafe in McLeod Ganj, enjoying spectacular sunset views of the Dhauladhar range.",
        "Explore the Gandhi Chowk market in Dalhousie, picking up woolen shawls and local souvenirs.",
        "Take in panoramic views of the plains from Sunset Point in Kasauli, followed by a quiet dinner."
      ]
    },
    "goa": {
      morning: [
        "Visit the historic Basilica of Bom Jesus and Se Cathedral in Old Goa, then walk through the colorful Fontainhas Latin Quarter.",
        "Stroll along Calangute Beach and Baga Beach, taking photos and watching early morning fishermen.",
        "Hike up to the ancient lighthouse at the historic Fort Aguada ruins, enjoying panoramic sea views.",
        "Explore the quiet, scenic shores of Palolem Beach and take a dolphin-spotting boat trip to Butterfly Beach.",
        "Start your morning with a guided tour of a lush local Spice Plantation in Ponda."
      ],
      afternoon: [
        "Dine at Mum's Kitchen in Panaji, enjoying a traditional Goan fish thali and local vindaloo.",
        "Have a beachside lunch at Britto's on Baga Beach, trying Goan prawn curry and seafood.",
        "Enjoy a relaxed lunch at a garden cafe in Candolim, followed by shopping for local shell crafts.",
        "Have a fresh seafood lunch at a beach shack on Palolem Beach, then relax on a sunbed.",
        "Enjoy a traditional Goan buffet lunch at the Sahakari Spice Farm."
      ],
      evening: [
        "Embark on a scenic sunset boat cruise on the Mandovi River in Panaji, enjoying Goan folk dances.",
        "Browse the lively Anjuna Flea Market, watching the fire dancers and enjoying drinks at a beach bar.",
        "Take a sunset walk along the sandy Miramar Beach, followed by dinner at a popular Panaji bistro.",
        "Enjoy a quiet beach bonfire and candlelit dinner under the stars at a beach restaurant in Colva.",
        "Dine at a premium hilltop restaurant in Vagator, overlooking the illuminated Chapora Fort."
      ]
    },
    "rajasthan": {
      morning: [
        "Visit the iconic Hawa Mahal (Palace of Winds) and the grand Amer Fort in Jaipur, admiring Rajput architecture.",
        "Take a scenic boat ride on Lake Pichola in Udaipur, visiting the historic Jag Mandir palace.",
        "Explore the towering Mehrangarh Fort in Jodhpur, looking down at the famous blue-painted streets.",
        "Explore the spectacular Jaisalmer Fort (Golden Fort) and walk through its historic living sandcastle streets.",
        "Walk around the sacred Pushkar Lake and visit the rare Brahma Temple during sunrise."
      ],
      afternoon: [
        "Have traditional Dal Baati Churma at Laxmi Mishthan Bhandar in Johri Bazar in Jaipur.",
        "Enjoy lunch at a lakeview rooftop restaurant in Udaipur, then tour the magnificent City Palace.",
        "Try classic local Mawa Kachoris at Janta Sweet Home near the clock tower in Jodhpur.",
        "Have a traditional Rajasthani thali at a desert restaurant in Jaisalmer, then visit Patwon Ki Haveli.",
        "Have lunch at a rooftop cafe in Pushkar, shopping for silver jewelry and colorful clothes in the bazaar."
      ],
      evening: [
        "Watch the sunset over the Pink City from Nahargarh Fort, followed by shopping at Bapu Bazar.",
        "Watch a traditional Rajasthani puppet and folk dance show at Bagore Ki Haveli in Udaipur.",
        "Stroll around the bustling Jodhpur Clock Tower market, and dine at a rooftop garden restaurant.",
        "Embark on an evening camel safari in the Sam Sand Dunes of Jaisalmer, watching traditional folk dances.",
        "Watch the evening aarti prayers at Varaha Ghat in Pushkar, enjoying the peaceful chanting."
      ]
    },
    "kerala": {
      morning: [
        "Stroll around Fort Kochi to see the giant Chinese Fishing Nets and visit the historic Santa Cruz Basilica.",
        "Explore the misty, emerald tea gardens of Munnar, visiting the Lockhart Tea Museum.",
        "Board a traditional Kettuvallam houseboat for a scenic cruise through the peaceful backwaters of Alleppey.",
        "Take a walk along the spectacular cliffside of Varkala Beach, listening to the crashing waves.",
        "Explore the wildlife trails of Periyar National Park in Thekkady, looking for birds and elephants."
      ],
      afternoon: [
        "Have lunch trying Kerala parotta and vegetable stew at a historic warehouse cafe in Jew Town Kochi.",
        "Dine at Rapsy Restaurant in Munnar, then take a walk around the scenic Mattupetty Dam.",
        "Enjoy a traditional Kerala lunch served on a fresh banana leaf on board your Alleppey houseboat.",
        "Enjoy a fresh coconut water and local meal at a clifftop restaurant in Varkala.",
        "Visit the spice markets in Kumily, trying local cardamom tea and buying spices."
      ],
      evening: [
        "Watch a mesmerizing Kathakali dance performance at the Kerala Kathakali Centre in Fort Kochi.",
        "Watch the sunset over the tea hills from the scenic Echo Point in Munnar.",
        "Stroll along the sandy Alleppey Beach, watching the sunset near the historic lighthouse.",
        "Watch the sunset into the Arabian Sea from Varkala Beach, followed by a candlelit seafood dinner.",
        "Enjoy a traditional martial arts performance (Kalaripayattu) in Thekkady."
      ]
    },
    "karnataka": {
      morning: [
        "Explore the lush greenery of Lalbagh Botanical Garden and visit the historic Bangalore Palace in Bengaluru.",
        "Explore the grand Mysore Palace in Mysuru, followed by a drive up the historic Chamundi Hill.",
        "Explore the spectacular ruins of Virupaksha Temple and the Stone Chariot at Vittala Temple in Hampi.",
        "Take a walk to Abbey Falls in Coorg, surrounded by coffee plantations and misty hills.",
        "Walk along the crescent-shaped beaches of Gokarna, visiting the sacred Mahabaleshwar Temple."
      ],
      afternoon: [
        "Have a traditional South Indian filter coffee and masala dosa at Vidyarthi Bhavan or MTR in Bengaluru.",
        "Enjoy a delicious Mysore Masala Dosa at the famous Mylari restaurant in Mysuru.",
        "Have a local meal at a heritage cafe in Hampi, then cross the Tungabhadra River in a coracle boat.",
        "Have lunch at a local coffee estate restaurant in Madikeri, tasting local Coorg specialties.",
        "Enjoy a fresh seafood lunch at a beachside shack on Om Beach in Gokarna."
      ],
      evening: [
        "Explore the lively cafes and shopping districts of Indiranagar and Brigade Road in Bengaluru.",
        "Stroll through the illuminated Brindavan Gardens in Mysuru, watching the musical fountain show.",
        "Climb up Matanga Hill in Hampi to watch the spectacular sunset over the historic ruins.",
        "Visit Raja's Seat in Madikeri to watch the sunset over the Coorg valley hills.",
        "Watch the sunset over the Arabian Sea from Gokarna beach, relaxing at a seaside cafe."
      ]
    },
    "maharashtra": {
      morning: [
        "Walk past the historic Gateway of India and take photos of the Taj Mahal Palace Hotel in Mumbai.",
        "Visit the ancient Shaniwar Wada fort ruins and the Dagadusheth Halwai Ganapati Temple in Pune.",
        "Explore the historic Bhaja Caves and take in the views from Duke's Nose viewpoint in Lonavala.",
        "Visit the spectacular UNESCO World Heritage rock-cut Ajanta Caves near Aurangabad.",
        "Take a morning walk through the vineyards of Nashik, visiting the Sula Vineyards."
      ],
      afternoon: [
        "Dine at the historic Leopold Cafe in Mumbai, trying street delicacies like Pav Bhaji and Vada Pav.",
        "Enjoy a traditional Maharashtrian thali at Durvankur or try Shrewsbury biscuits from Pune Camp.",
        "Enjoy a rustic lunch in Lonavala and try the famous local Cooper's fudge and chikki.",
        "Have a traditional lunch in Aurangabad, then visit the magnificent Daulatabad Fort.",
        "Enjoy wine tasting and lunch at a vineyard bistro in Nashik."
      ],
      evening: [
        "Take a sunset walk along the famous Marine Drive promenade, followed by street food at Juhu Beach.",
        "Explore the lively markets of Fergusson College Road in Pune, dining at a cozy garden restaurant.",
        "Enjoy the sunset from Tiger's Point in Lonavala, tasting hot tea and freshly fried onion pakoras.",
        "Visit the beautiful Bibi Ka Maqbara (Tomb of the Lady) in Aurangabad, watching the sunset.",
        "Relax near the peaceful Godavari River ghats in Nashik, listening to the evening temple prayers."
      ]
    }
  };

  const cleanDest = destName.toLowerCase().trim();
  let isKnown = false;
  let knownKey = "";
  for (const key of Object.keys(knownDestinationsMockData)) {
    if (cleanDest.includes(key)) {
      isKnown = true;
      knownKey = key;
      break;
    }
  }

  const dayByDayPlan = [];
  const safeInterests = Array.isArray(interests) && interests.length > 0 ? interests : ['general'];

  for (let i = 0; i < totalDays; i++) {
    const activeInterest = safeInterests[i % safeInterests.length];
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    if (isKnown) {
      const pool = knownDestinationsMockData[knownKey];
      const morningDesc = pool.morning[i % pool.morning.length];
      const afternoonDesc = pool.afternoon[i % pool.afternoon.length];
      const eveningDesc = pool.evening[i % pool.evening.length];

      const notesPool = [
        `Use authorized local transport or walking to explore the unique corners of ${destName}.`,
        `Wear comfortable walking shoes for the day's sightseeing across ${destName}.`,
        `Check local entry times and carry some cash for street purchases in ${destName}.`,
        `Ask the locals for the best hidden viewpoints and local eateries in ${destName}.`,
        `Dress respectfully when visiting religious and heritage sites in ${destName}.`
      ];

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: `Explore ${destName} - Day ${i + 1}`,
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
      // GLOBAL DYNAMIC SYNTHETIC GENERATOR
      const townList = [
        `Old ${destName}`,
        `Central ${destName}`,
        `Scenic ${destName} Valley`,
        `${destName} Waterfront`,
        `${destName} Heights`
      ];
      const town = townList[i % townList.length];

      const mornings = [
        `Begin the morning exploring the ancient ${town} Fort ruins and walking through the historic ${town} Heritage Quarter, visiting the scenic ${town} Sun Temple.`,
        `Take an early morning walk through the lush green paths of ${town} Botanical Gardens, visiting the nearby peaceful ${town} Sanctuary and the historic ${town} Clock Tower.`,
        `Start your day at the famous ${town} Archaeological Museum, followed by a visit to the sacred ${town} Temple Complex and its traditional courtyard.`,
        `Embark on a morning trek up the scenic ${town} Ridge Trail, pausing at the spectacular ${town} Peak Viewpoint and the rustic ${town} Forest Reserve.`,
        `Explore the old cultural lanes of ${town} Old Bazaar, stopping at the historic ${town} Memorial Gateway and the peaceful ${town} Monastery.`
      ];

      const afternoons = [
        `Head to the bustling ${town} Spice & Textile Market. Enjoy local specialty food like a traditional thali and fresh regional dishes at the renowned ${town} Heritage Kitchen.`,
        `Visit the artisan workshops at the popular ${town} Craft Bazaar, followed by a leisurely lunch at the cozy ${town} Bistro near the central square.`,
        `Explore the vibrant shops of the ${town} Shopping Promenade. Enjoy a delicious local lunch at the highly-rated ${town} Food Junction, trying their famous local street food.`,
        `Have a relaxing lunch at the scenic ${town} Riverside Cafe, followed by a visit to the local ${town} Arts and Crafts Center.`,
        `Grab lunch at the traditional ${town} Spice Court, then explore the unique boutique stores and art galleries in the creative district of ${town}.`
      ];

      const evenings = [
        `Relax at the spectacular ${town} Sunset Viewpoint, followed by a traditional dinner at the premium ${town} Garden Restaurant.`,
        `Experience the local night scene at the lively ${town} Tavern & Pub, enjoying live music, craft drinks, and late-night street food at the nearby ${town} Night Market.`,
        `Take a peaceful evening stroll along the beautiful ${town} Waterfront Promenade/Lakeside path, then dine at the popular ${town} Royal Diner.`,
        `Indulge in a premium regional dinner at the famous ${town} Palace Restro, followed by dessert at the local ${town} German Bakery.`,
        `Join local travelers at the vibrant ${town} Music Lounge, followed by a late-evening walk around the illuminated ${town} Fountain Square.`
      ];

      const notesPool = [
        `Use authorized local transport or walk to get the most authentic feel of ${town}.`,
        `Keep small changes in local currency handy for street shopping in ${town}.`,
        `Dress respectfully when visiting religious and heritage sites in ${town}.`,
        `Ask locals for food recommendations; they know the best hidden culinary spots in ${town}.`,
        `Start your days early in ${town} to beat the mid-day crowd at popular spots.`,
        `Keep a water bottle and comfortable walking shoes ready for exploring ${town}.`,
        `Check the local weather forecast daily before planning outdoor activities in ${town}.`
      ];

      const morningIdx = i % mornings.length;
      const afternoonIdx = (i + 2) % afternoons.length;
      const eveningIdx = (i + 4) % evenings.length;

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: `Discover ${destName} - Day ${i + 1}`,
        theme: activeInterest.toUpperCase(),
        morning: {
          description: mornings[morningIdx],
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        afternoon: {
          description: afternoons[afternoonIdx],
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        evening: {
          description: evenings[eveningIdx],
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
  
  // 1. Group/condense interests if > 6 items
  let safeInterests = Array.isArray(interests) ? interests : [];
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

  // 2. Truncate/condense long inputs
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const systemPrompt = `You are an expert travel planner and local guide who creates highly detailed, realistic, destination-aware itineraries that feel like a personal travel coach telling the user exactly what to do each day.

Your goals:
- Always return a complete, day‑by‑day itinerary.
- Never refuse or say it is not possible; if budget or time is tight, still propose the best possible plan within constraints.
- Optimize for enjoyment, realism, local culture, safety, and efficient routing.
- Respect the user’s budget and preferences as much as possible.

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
- DESTINATION AWARENESS: For any destination in the world, always use real-sounding local places (monuments, areas, markets, parks, beaches, museums, streets, local food spots, cafes, etc.) that would reasonably exist there. Never use generic placeholders like "explore local markets", "visit attractions", "nearby cafe", or "eat regional cuisine". Always name specific places, markets, local food/eateries, and nightlife spots for each day.
  - State/Region/Country Query Rule: If the destination is a state, country, or large region (e.g., "Bihar", "Himachal Pradesh", "Rajasthan", "Japan", "Italy", "California", "Bavaria"), you MUST internally pick 1 to 3 key real cities/towns within that region (e.g., Patna, Bodh Gaya, and Nalanda for Bihar; Shimla, Manali, and Dharamshala for Himachal Pradesh; Tokyo, Kyoto, and Osaka for Japan) and structure the day-by-day plan around them.
  - Concrete Naming Rule: For EVERY single day and EVERY time block (morning, afternoon, evening), you MUST mention at least 2 to 3 concrete place names (cities, neighborhoods, monuments, temples, ghats, lakes, beaches, parks, markets, restaurants, cafes, clubs) that fit the destination.
  - No Vague Placeholders: You must NEVER output vague filler phrases like "iconic central landmark of X", "local park in X", "riverbank, lake, or beachside area in X", "downtown area", or "nearby cozy cafe" without attaching actual, specific, real-sounding place names (e.g., instead of "riverbank in Bihar" use "Gandhi Ghat on the Ganges River in Patna"; instead of "local temple" use "Mahabodhi Temple in Bodh Gaya").
  - Day-by-Day Variety: Do not repeat similar sentences or structures across days. Each day must feel unique, showcasing a different selection of neighborhoods, landmarks, local eats, and activities.
  - Normalize but do not restrict: Even if exact OpenStreetMap-level mapping is not known or indexed by you, generate approximate, realistic-sounding local place names, markets, and eateries appropriate for the destination's geography and culture. The user will find them highly plausible and engaging.
  - Never fall back to a single generic template repeated across multiple days. Make each day unique and interesting, presenting a diverse mix of sightseeing, food, shopping, and nightlife.
- INTERESTS & VIBES: Strongly align the daily plans with the traveler's interests (e.g. party, shopping, food, culture, nature).
  - If "party" is selected, recommend specific real clubs, pubs, or lounge bars active in the night.
  - If "shopping" is selected, name specific real flea markets, shopping streets, or malls.
  - If "food" is selected, name specific popular street food lanes or heritage restaurants.
- BUDGET DISCIPLINE: Keep the sum of all estimated costs within the user's budget.
  - If the budget is low, prioritize free or very cheap activities (public parks, monuments, street walking, cheap street food) and explicitly note money-saving tips.
  - If the budget is high, include premium experiences (fine dining, private tours, upscale lounges) but keep it balanced.
- Plan every single day with specific activities for morning, afternoon, and evening (like "subah yeh karo, dopahar yeh, shaam yeh").
- If the trip is long (over 14 days), you can repeat patterns, but still give each day its own description/plan.
- If the trip is very long (up to 92 days), you must still return an entry in dayByDayPlan for every single day, but make the descriptions and plans short and concise (e.g. 5-15 words per time slot) to prevent timeouts and token length issues.
${simplifiedInstruction}

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

User’s raw text description (as they typed it in their language):
"""
${preprocessed.prompt || ''}
"""

Based on all this, generate the best possible trip itinerary following the JSON format and rules above.`;

    const aiStartTime = Date.now();
    console.log(`[AI LLM Request Payload]:\n${systemPrompt}`);
    
    // API Call with 45 seconds timeout
    const apiCallPromise = model.generateContent(systemPrompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 45 seconds')), 45000)
    );

    let textResponse = "";
    try {
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      textResponse = result.response.text().trim();
      console.log(`[AI LLM Raw Response]:\n${textResponse}`);
    } catch (apiError) {
      console.error('[AI Trip Generation] LLM generation failed or timed out. Error:', apiError.message);
      return fallbackResponse();
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
