const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');
const config = require('../config');
const authController = require('./authController');
const Sentry = require('@sentry/node');
const posthogClient = require('../posthogClient');

function captureUnexpectedException(req, error) {
  if (process.env.SENTRY_DSN) {
    Sentry.withScope(scope => {
      if (req.user) {
        scope.setUser({ id: req.user.id, email: req.user.email });
      }
      Sentry.captureException(error);
    });
  }
}
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PDFDocument: LibPDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

function normalizeCountry(c) {
  if (!c) return '';
  const low = c.toLowerCase().trim();
  if (low === 'usa' || low === 'united states' || low === 'united states of america' || low === 'u.s.a.' || low === 'u.s.') {
    return 'united states';
  }
  if (low === 'uk' || low === 'united kingdom' || low === 'u.k.') {
    return 'united kingdom';
  }
  return low;
}

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

const COUNTRY_TO_CONTINENT = {
  "india": "asia",
  "japan": "asia",
  "china": "asia",
  "south korea": "asia",
  "singapore": "asia",
  "thailand": "asia",
  "vietnam": "asia",
  "malaysia": "asia",
  "indonesia": "asia",
  "philippines": "asia",
  "nepal": "asia",
  "pakistan": "asia",
  "bangladesh": "asia",
  "sri lanka": "asia",
  "saudi arabia": "asia",
  "uae": "asia",
  "united arab emirates": "asia",
  "qatar": "asia",
  "turkey": "asia",
  "france": "europe",
  "united kingdom": "europe",
  "uk": "europe",
  "germany": "europe",
  "italy": "europe",
  "spain": "europe",
  "netherlands": "europe",
  "switzerland": "europe",
  "austria": "europe",
  "greece": "europe",
  "sweden": "europe",
  "norway": "europe",
  "denmark": "europe",
  "finland": "europe",
  "ireland": "europe",
  "belgium": "europe",
  "portugal": "europe",
  "united states": "north_america",
  "usa": "north_america",
  "canada": "north_america",
  "mexico": "north_america",
  "brazil": "south_america",
  "argentina": "south_america",
  "chile": "south_america",
  "colombia": "south_america",
  "peru": "south_america",
  "australia": "oceania",
  "new zealand": "oceania",
  "egypt": "africa",
  "south africa": "africa",
  "kenya": "africa",
  "morocco": "africa",
  "nigeria": "africa"
};

const COUNTRY_TO_CURRENCY = {
  "india": "INR",
  "japan": "JPY",
  "france": "EUR",
  "germany": "EUR",
  "italy": "EUR",
  "spain": "EUR",
  "netherlands": "EUR",
  "switzerland": "CHF",
  "austria": "EUR",
  "greece": "EUR",
  "sweden": "SEK",
  "norway": "NOK",
  "denmark": "DKK",
  "finland": "EUR",
  "ireland": "EUR",
  "belgium": "EUR",
  "portugal": "EUR",
  "united kingdom": "GBP",
  "uk": "GBP",
  "united states": "USD",
  "usa": "USD",
  "canada": "CAD",
  "mexico": "MXN",
  "brazil": "BRL",
  "argentina": "ARS",
  "chile": "CLP",
  "colombia": "COP",
  "peru": "PEN",
  "australia": "AUD",
  "new zealand": "NZD",
  "egypt": "EGP",
  "south africa": "ZAR",
  "kenya": "KES",
  "morocco": "MAD",
  "nigeria": "NGN",
  "singapore": "SGD",
  "thailand": "THB",
  "vietnam": "VND",
  "malaysia": "MYR",
  "indonesia": "IDR",
  "philippines": "PHP",
  "nepal": "NPR",
  "pakistan": "PKR",
  "bangladesh": "BDT",
  "sri lanka": "LKR",
  "saudi arabia": "SAR",
  "uae": "AED",
  "united arab emirates": "AED",
  "qatar": "QAR",
  "turkey": "TRY"
};

// Load World travel encyclopedia and merge with geo dataset
let worldEncyclopedia = { continents: {} };
try {
  const encPath = path.join(__dirname, '../data/world_travel_encyclopedia.json');
  if (fs.existsSync(encPath)) {
    worldEncyclopedia = JSON.parse(fs.readFileSync(encPath, 'utf8'));
    console.log(`Loaded World travel encyclopedia database.`);
  } else {
    console.warn(`WARNING: world_travel_encyclopedia.json not found at ${encPath}.`);
  }
} catch (err) {
  console.error('Failed to load World travel encyclopedia:', err);
}

// Merge known_cities.json into worldEncyclopedia for global coverage
try {
  const dbInstance = getKnownCitiesDb();
  if (dbInstance && dbInstance.cities) {
    let mergedCount = 0;
    const continents = worldEncyclopedia.continents = worldEncyclopedia.continents || {};
    
    for (const [cityKey, cityData] of Object.entries(dbInstance.cities)) {
      const normCountry = normalizeCountry(cityData.country);
      const continentKey = COUNTRY_TO_CONTINENT[normCountry] || 'other';
      
      // Ensure hierarchy exists
      continents[continentKey] = continents[continentKey] || { countries: {} };
      continents[continentKey].countries = continents[continentKey].countries || {};
      continents[continentKey].countries[normCountry] = continents[continentKey].countries[normCountry] || { statesOrRegions: {} };
      
      const states = continents[continentKey].countries[normCountry].statesOrRegions = continents[continentKey].countries[normCountry].statesOrRegions || {};
      const stateKey = (cityData.state || 'general').toLowerCase().trim();
      states[stateKey] = states[stateKey] || { cities: {} };
      
      const cities = states[stateKey].cities = states[stateKey].cities || {};
      
      // Only merge if not already defined in the curated database
      if (!cities[cityKey]) {
        const countryCurrency = COUNTRY_TO_CURRENCY[normCountry] || 'USD';
        
        // Dynamically build places from landmarks, food, activities, shopping
        const places = [];
        if (Array.isArray(cityData.landmarks)) {
          cityData.landmarks.forEach(name => {
            places.push({
              name,
              type: 'attraction',
              approx_cost: 0,
              currency: countryCurrency,
              description: `Iconic landmark to visit in ${cityData.name}.`,
              tags: ['landmark', 'sightseeing']
            });
          });
        }
        if (Array.isArray(cityData.food)) {
          cityData.food.forEach(name => {
            places.push({
              name,
              type: 'restaurant',
              approx_cost: 0,
              currency: countryCurrency,
              description: `Recommended local food/dining experience in ${cityData.name}.`,
              tags: ['food', 'dining']
            });
          });
        }
        if (Array.isArray(cityData.activities)) {
          cityData.activities.forEach(name => {
            places.push({
              name,
              type: 'attraction',
              approx_cost: 0,
              currency: countryCurrency,
              description: `Top activity to experience in ${cityData.name}.`,
              tags: ['activity']
            });
          });
        }
        if (Array.isArray(cityData.shopping)) {
          cityData.shopping.forEach(name => {
            places.push({
              name,
              type: 'market',
              approx_cost: 0,
              currency: countryCurrency,
              description: `Popular local shopping spot in ${cityData.name}.`,
              tags: ['shopping', 'market']
            });
          });
        }
        if (Array.isArray(cityData.culture)) {
          cityData.culture.forEach(name => {
            places.push({
              name,
              type: 'attraction',
              approx_cost: 0,
              currency: countryCurrency,
              description: `Cultural and heritage site in ${cityData.name}.`,
              tags: ['culture']
            });
          });
        }

        cities[cityKey] = {
          name: cityData.name,
          places: places,
          areas: {}
        };
        mergedCount++;
      }
    }
    console.log(`Merged ${mergedCount} cities from geo dataset into World Travel Encyclopedia.`);
  }
} catch (mergeErr) {
  console.error('Failed to merge known cities geo dataset into World travel encyclopedia:', mergeErr);
}

// Find global destination entry by name (smart matching with aliases and typos across the hierarchy)
function findGlobalDestination({ country, city, area, queryText }) {
  if (!worldEncyclopedia || !worldEncyclopedia.continents) return null;
  
  const qText = (queryText || '').toLowerCase().trim();
  const qCity = (city || '').toLowerCase().trim();
  const qCountry = normalizeCountry(country);
  const qArea = (area || '').toLowerCase().trim();
  
  if (!qText && !qCity) return null;

  let bestCityMatch = null;
  let bestCityData = null;
  let matchedCountryName = '';

  const continents = worldEncyclopedia.continents || {};
  for (const [contKey, continent] of Object.entries(continents)) {
    const countries = continent.countries || {};
    for (const [countryKey, countryData] of Object.entries(countries)) {
      const cName = countryKey.toLowerCase().trim();
      const normCName = normalizeCountry(cName);
      
      const states = countryData.statesOrRegions || {};
      for (const [stateKey, stateData] of Object.entries(states)) {
        const cities = stateData.cities || {};
        for (const [cityKey, cityData] of Object.entries(cities)) {
          const cityName = cityKey.toLowerCase().trim();
          
          let isCityMatch = false;
          if (qCity && cityName === qCity) {
            if (!qCountry || normCName === qCountry) {
              isCityMatch = true;
            }
          }
          if (!isCityMatch && qText) {
            if (qText === cityName || qText.includes(cityName)) {
              if (qText.includes(cName) || qText.includes(normCName) || !qCountry || normCName === qCountry) {
                isCityMatch = true;
              }
            }
          }

          if (isCityMatch) {
            bestCityMatch = cityKey;
            bestCityData = cityData;
            matchedCountryName = countryKey;
            
            const areas = cityData.areas || {};
            for (const [areaKey, areaData] of Object.entries(areas)) {
              const areaName = (areaData.name || areaKey).toLowerCase().trim();
              const areaNeighborhood = (areaData.neighborhood || '').toLowerCase().trim();
              const aliases = (areaData.aliases || []).map(a => a.toLowerCase().trim());
              
              if (qArea && (areaName.includes(qArea) || areaNeighborhood.includes(qArea) || aliases.includes(qArea))) {
                return { ...areaData, city: cityKey, country: countryKey, matchType: 'area' };
              }
              
              if (qText && (qText === areaName || qText === areaNeighborhood || qText.includes(areaName) || qText.includes(areaNeighborhood) || aliases.includes(qText) || aliases.some(a => qText.includes(a)))) {
                return { ...areaData, city: cityKey, country: countryKey, matchType: 'area' };
              }
              
              if (qText) {
                if (areaName.includes('connaught') && (qText.includes('connaught') || /\bcp\b/.test(qText))) {
                  return { ...areaData, city: cityKey, country: countryKey, matchType: 'area' };
                }
                if (areaName.includes('hauz') && (qText.includes('hauz khas') || qText.includes('hauz kahs'))) {
                  return { ...areaData, city: cityKey, country: countryKey, matchType: 'area' };
                }
              }
            }
          }
        }
      }
    }
  }

  if (bestCityData) {
    let allPlaces = [...(bestCityData.places || [])];
    const areas = bestCityData.areas || {};
    for (const areaData of Object.values(areas)) {
      if (areaData.places && Array.isArray(areaData.places)) {
        allPlaces.push(...areaData.places);
      }
    }
    
    const seen = new Set();
    allPlaces = allPlaces.filter(p => {
      const k = p.name.toLowerCase().trim();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      name: bestCityData.name || bestCityMatch,
      city: bestCityMatch,
      country: matchedCountryName,
      places: allPlaces,
      matchType: 'city'
    };
  }

  if (qText) {
    // Secondary pass: check areas by neighborhood name (exact or partial) and aliases
    for (const [contKey, continent] of Object.entries(continents)) {
      const countries = continent.countries || {};
      for (const [countryKey, countryData] of Object.entries(countries)) {
        const states = countryData.statesOrRegions || {};
        for (const [stateKey, stateData] of Object.entries(states)) {
          const cities = stateData.cities || {};
          for (const [cityKey, cityData] of Object.entries(cities)) {
            const areas = cityData.areas || {};
            for (const [areaKey, areaData] of Object.entries(areas)) {
              const areaName = (areaData.name || areaKey).toLowerCase().trim();
              const areaNeighborhood = (areaData.neighborhood || '').toLowerCase().trim();
              const aliases = (areaData.aliases || []).map(a => a.toLowerCase().trim());
              // Bidirectional check: qText contains area OR area contains qText (for standalone neighborhood names)
              const nameMatch = qText.includes(areaName) || areaName.includes(qText) ||
                (areaNeighborhood && (qText === areaNeighborhood || qText.includes(areaNeighborhood) || areaNeighborhood.includes(qText)));
              const aliasMatch = aliases.some(a => qText.includes(a) || a.includes(qText));
              if (nameMatch || aliasMatch) {
                return { ...areaData, city: cityKey, country: countryKey, matchType: 'area' };
              }
            }
          }
        }
      }
    }
  }

  return null;
}

function findIndiaEncyclopediaEntry(destName) {
  const resolved = resolveCityAndCountry(destName);
  return findGlobalDestination({
    country: resolved.country,
    city: resolved.city,
    area: resolved.area,
    queryText: destName
  });
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
function getCityTerminals(cityName) {
  const nameLower = cityName.toLowerCase().trim();
  const terminalDb = {
    "shimla": { airport: "Shimla Airport (Jubarhatti)", station: "Shimla Railway Station", bus: "Shimla ISBT (Tutikandi)" },
    "manali": { airport: "Kullu-Manali Airport (Bhuntar)", station: "Joginder Nagar Narrow-Gauge Station", bus: "Manali Bus Stand" },
    "amritsar": { airport: "Sri Guru Ram Dass Jee International Airport", station: "Amritsar Junction", bus: "Amritsar Bus Stand" },
    "delhi": { airport: "Indira Gandhi International Airport (DEL)", station: "New Delhi Railway Station (NDLS)", bus: "Kashmere Gate ISBT" },
    "mumbai": { airport: "Chhatrapati Shivaji Maharaj International Airport (BOM)", station: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", bus: "Mumbai Central Bus Depot" },
    "bengaluru": { airport: "Kempegowda International Airport (BLR)", station: "KSR Bengaluru City Station (SBC)", bus: "Kempegowda Bus Station (Majestic)" },
    "kolkata": { airport: "Netaji Subhash Chandra Bose International Airport (CCU)", station: "Howrah Junction (HWH)", bus: "Babughat Bus Terminus" },
    "paris": { airport: "Charles de Gaulle Airport (CDG)", station: "Gare du Nord", bus: "Bercy Seine Bus Station" },
    "new york": { airport: "John F. Kennedy International Airport (JFK)", station: "Penn Station", bus: "Port Authority Bus Terminal" },
    "london": { airport: "Heathrow Airport (LHR)", station: "King's Cross Station", bus: "Victoria Coach Station" },
    "tokyo": { airport: "Haneda Airport (HND)", station: "Tokyo Station", bus: "Shinjuku Expressway Bus Terminal" },
    "edinburgh": { airport: "Edinburgh Airport (EDI)", station: "Edinburgh Waverley Station", bus: "Edinburgh Bus Station" },
    "dubai": { airport: "Dubai International Airport (DXB)", station: "Dubai Metro Union Station", bus: "Al Ghubaiba Bus Terminal" }
  };
  return terminalDb[nameLower] || {
    airport: `${cityName} Airport`,
    station: `${cityName} Railway Station`,
    bus: `${cityName} Central Bus Terminal`
  };
}

const cityCoords = {
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "agra": { lat: 27.1767, lng: 78.0081 },
  "goa": { lat: 15.2993, lng: 74.1240 },
  "shimla": { lat: 31.1048, lng: 77.1734 },
  "manali": { lat: 32.2396, lng: 77.1887 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "london": { lat: 51.5074, lng: -0.1278 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "tokyo": { lat: 35.6762, lng: 139.6503 },
  "dubai": { lat: 25.2048, lng: 55.2708 },
  "edinburgh": { lat: 55.9533, lng: -3.1883 },
  "bali": { lat: -8.4095, lng: 115.1889 },
  "singapore": { lat: 1.3521, lng: 103.8198 },
  "bangkok": { lat: 13.7563, lng: 100.5018 },
  "sydney": { lat: -33.8688, lng: 151.2093 }
};

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

function parseDestinationString(destStr) {
  if (!destStr) return { city: '', country: '' };
  const parts = destStr.split(',').map(s => s.trim());
  const city = parts[0] || '';
  const country = parts[1] || parts[0] || '';
  return { city, country };
}

function estimateDistance(startCity, startCountry, destCity, destCountry, startLat, startLng) {
  const startCityClean = (startCity || '').toLowerCase().trim();
  const destCityClean = (destCity || '').toLowerCase().trim();
  
  if (startCityClean === destCityClean && startCityClean !== '') {
    return 0;
  }

  // Resolve starting coordinates
  let sLat = Number(startLat);
  let sLng = Number(startLng);
  if (isNaN(sLat) || isNaN(sLng) || !startLat || !startLng) {
    const coords = cityCoords[startCityClean];
    if (coords) {
      sLat = coords.lat;
      sLng = coords.lng;
    }
  }

  // Resolve destination coordinates
  let dLat = null;
  let dLng = null;
  const coords = cityCoords[destCityClean];
  if (coords) {
    dLat = coords.lat;
    dLng = coords.lng;
  }

  // If we have both sets of coordinates, compute Haversine distance
  if (sLat !== null && sLng !== null && !isNaN(sLat) && !isNaN(sLng) && dLat !== null && dLng !== null) {
    return getHaversineDistance(sLat, sLng, dLat, dLng);
  }

  // Heuristic-based distance estimation if coords are missing
  const startCountryClean = (startCountry || '').toLowerCase().trim();
  const destCountryClean = (destCountry || '').toLowerCase().trim();

  if (startCountryClean === destCountryClean && startCountryClean !== '') {
    const largeCountries = ['india', 'united states', 'usa', 'china', 'australia', 'canada', 'brazil', 'russia'];
    if (largeCountries.includes(startCountryClean)) {
      return 600;
    }
    return 250;
  }

  return 3000; // International default
}

function computeHowToReach(startCity, startCountry, destCity, destCountry, distanceKm, budgetTier, currency, destArea) {
  const currencySymbol = currency || 'INR';
  const rate = INR_TO_CURRENCY[currencySymbol] || 1.0;
  const startC = startCity || 'Origin';
  const startCo = startCountry || 'Origin Country';
  const destC = destCity || 'Destination';
  const destCo = destCountry || 'Destination Country';
  const budget = (budgetTier || 'mid').toLowerCase();

  const startTerminals = getCityTerminals(startC);
  const destTerminals = getCityTerminals(destC);

  const getCost = (inrAmount) => {
    return {
      amount: Math.round(inrAmount * rate),
      currency: currencySymbol
    };
  };

  // 1) Same-city / local trips
  if (startC.toLowerCase().trim() === destC.toLowerCase().trim() && startC !== '') {
    const localTips = getCityLocalTransitTips(destC, destArea);
    const startLoc = `Your location in ${destC} (nearest metro or cab pickup)`;
    const endLoc = destArea || destC;
    if (distanceKm <= 3) {
      return {
        recommendedMode: "walking",
        summary: `Walking or quick local transport recommended in ${destC}.`,
        details: localTips.walking,
        nearestStartTerminal: startLoc,
        nearestEndTerminal: endLoc,
        estimatedCost: getCost(budget === 'low' ? 0 : (budget === 'high' ? 150 : 60))
      };
    } else if (distanceKm <= 10) {
      let mode = "metro / public bus";
      if (budget === 'mid') mode = "metro + cab/auto";
      if (budget === 'high') mode = "cab / taxi";

      return {
        recommendedMode: mode,
        summary: `Local metro, bus, or cab ride recommended in ${destC}.`,
        details: localTips.medium,
        nearestStartTerminal: startLoc,
        nearestEndTerminal: endLoc,
        estimatedCost: getCost(budget === 'low' ? 50 : (budget === 'high' ? 250 : 120))
      };
    } else {
      let mode = "metro / city bus";
      if (budget === 'mid') mode = "metro + cab/auto";
      if (budget === 'high') mode = "cab / taxi";

      return {
        recommendedMode: mode,
        summary: `Cross-city transit via metro or direct cab in ${destC}.`,
        details: localTips.long,
        nearestStartTerminal: startLoc,
        nearestEndTerminal: endLoc,
        estimatedCost: getCost(budget === 'low' ? 80 : (budget === 'high' ? 500 : 200))
      };
    }
  }

  // 2) Same country inter-city
  if (startCo.toLowerCase().trim() === destCo.toLowerCase().trim() && startCo !== '') {
    if (distanceKm <= 350) {
      if (budget === 'low') {
        return {
          recommendedMode: "bus / sleeper train",
          summary: `Budget-friendly bus or sleeper train from ${startC} to ${destC}.`,
          details: `Since ${startC} and ${destC} are relatively close, a train or bus is the most cost-effective way to travel; flights are not necessary here. Taking an intercity bus or booking a sleeper-class train ticket from ${startTerminals.bus || startC} is ideal for keeping expenses low. The journey is relatively short and scenic, letting you relax along the way.`,
          nearestStartTerminal: startTerminals.bus,
          nearestEndTerminal: destTerminals.bus,
          estimatedCost: getCost(500)
        };
      } else if (budget === 'high') {
        return {
          recommendedMode: "private cab / express train",
          summary: `Premium express train or private cab from ${startC} to ${destC}.`,
          details: `Since ${startC} and ${destC} are relatively close, a train or bus is the most cost-effective way to travel; flights are not necessary here. Hailing a private intercity cab offers the ultimate convenience with door-to-door service and flexible departure times. Alternatively, a premium high-speed express train or chair-car class provides a very fast and comfortable ride.`,
          nearestStartTerminal: startTerminals.station,
          nearestEndTerminal: destTerminals.station,
          estimatedCost: getCost(4000)
        };
      } else {
        return {
          recommendedMode: "AC train / express bus",
          summary: `Comfortable AC train or express bus from ${startC} to ${destC}.`,
          details: `Since ${startC} and ${destC} are relatively close, a train or bus is the most cost-effective way to travel; flights are not necessary here. Booking a seat on an AC express train or a premium intercity Volvo bus offers a great balance of comfort and value. The journey takes only a few hours, arriving directly near the city center.`,
          nearestStartTerminal: startTerminals.station,
          nearestEndTerminal: destTerminals.station,
          estimatedCost: getCost(1200)
        };
      }
    } else if (distanceKm <= 800) {
      if (budget === 'low') {
        return {
          recommendedMode: "sleeper train / overnight bus",
          summary: `Sleeper train or overnight bus from ${startC} to ${destC}.`,
          details: `For the medium distance between ${startC} and ${destC}, a sleeper-class train or overnight bus is the most cost-effective option. This lets you save on a night's accommodation while traveling. A budget flight is optional but would be significantly more expensive for your low budget.`,
          nearestStartTerminal: startTerminals.bus,
          nearestEndTerminal: destTerminals.bus,
          estimatedCost: getCost(700)
        };
      } else if (budget === 'high') {
        return {
          recommendedMode: "flight / premium AC train",
          summary: `Direct flight or premium AC train from ${startC} to ${destC}.`,
          details: `From ${startC} to ${destC}, a direct flight is the most comfortable and fast option for your budget, taking around 1-2 hours. Upon arrival at the destination airport, you can take a pre-booked private transfer or taxi to your hotel. If you prefer a scenic journey, a premium first-class AC sleeper train is also a very relaxing option.`,
          nearestStartTerminal: startTerminals.airport,
          nearestEndTerminal: destTerminals.airport,
          estimatedCost: getCost(5500)
        };
      } else {
        return {
          recommendedMode: "AC train / budget flight",
          summary: `Comfortable AC train or budget flight from ${startC} to ${destC}.`,
          details: `From ${startC} to ${destC}, the distance is long enough that an AC train (such as 3-Tier or 2-Tier) is a highly comfortable and popular option. Alternatively, a budget flight is a great time-saving alternative if booked in advance. This combination gives you the best mix of cost and convenience for your travel budget.`,
          nearestStartTerminal: startTerminals.station,
          nearestEndTerminal: destTerminals.station,
          estimatedCost: getCost(2200)
        };
      }
    } else {
      if (budget === 'low') {
        return {
          recommendedMode: "sleeper train",
          summary: `Sleeper train from ${startC} to ${destC}.`,
          details: `The distance between ${startC} and ${destC} is long, so a flight is the fastest mode, but for a low budget, a sleeper-class train or long-distance bus is the primary option. The train journey will take a significant amount of time, so bring snacks and entertainment. A flight remains optional but is much more expensive.`,
          nearestStartTerminal: startTerminals.station,
          nearestEndTerminal: destTerminals.station,
          estimatedCost: getCost(1000)
        };
      } else if (budget === 'high') {
        return {
          recommendedMode: "flight",
          summary: `Direct flight from ${startC} to ${destC}.`,
          details: `From ${startC} to ${destC}, the distance is long enough that a flight is the most comfortable option for your budget. We recommend booking a direct flight to save time and ensure a premium travel experience. Once you land, a private cab or express airport train will take you straight to your hotel in comfort.`,
          nearestStartTerminal: startTerminals.airport,
          nearestEndTerminal: destTerminals.airport,
          estimatedCost: getCost(7500)
        };
      } else {
        return {
          recommendedMode: "flight / express train",
          summary: `Budget flight or AC train from ${startC} to ${destC}.`,
          details: `From ${startC} to ${destC}, the distance is long enough that a flight is the most comfortable option to save time. Look for budget carriers early to get the best deals. If you prefer to avoid flying, an express train with AC sleeper coaches is a good alternative that offers a comfortable overnight journey.`,
          nearestStartTerminal: startTerminals.airport,
          nearestEndTerminal: destTerminals.airport,
          estimatedCost: getCost(4500)
        };
      }
    }
  }

  // 3) International trips (startCo !== destCo)
  if (budget === 'low') {
    return {
      recommendedMode: "flight + public transit",
      summary: `International flight and public transit from ${startC} to ${destC}.`,
      details: `From ${startC}, the best way to reach ${destC} is by international flight. To keep costs low, compare budget airlines and book one-stop flights in advance. Once you arrive at the destination airport, use the local airport train, metro, or public bus system as they are the most economical ways to reach your hotel.`,
      nearestStartTerminal: startTerminals.airport,
      nearestEndTerminal: destTerminals.airport,
      estimatedCost: getCost(12000)
    };
  } else if (budget === 'high') {
    return {
      recommendedMode: "direct flight + private cab",
      summary: `Direct flight and private airport transfer from ${startC} to ${destC}.`,
      details: `From ${startC}, the best way to reach ${destC} is by a direct international flight for maximum speed and comfort. We recommend booking premium economy or business class for a relaxed journey. Once you arrive at the airport, a pre-arranged private cab or premium transfer service will meet you and drive you directly to your hotel.`,
      nearestStartTerminal: startTerminals.airport,
      nearestEndTerminal: destTerminals.airport,
      estimatedCost: getCost(55000)
    };
  } else {
    return {
      recommendedMode: "flight + airport train",
      summary: `Direct/1-stop flight and express airport train from ${startC} to ${destC}.`,
      details: `From ${startC}, the best way to reach ${destC} is by international flight to the destination's primary airport. Look for direct or quick 1-stop flights to balance budget and transit time. After landing, take the airport express train or a licensed taxi for a comfortable and efficient transfer to your hotel.`,
      nearestStartTerminal: startTerminals.airport,
      nearestEndTerminal: destTerminals.airport,
      estimatedCost: getCost(25000)
    };
  }
}

function normalizeItinerary(itinerary, startDate, parsedBudget, activeCurrency, daysCount, context = {}) {
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

      if (block.places && Array.isArray(block.places)) {
        amount = block.places.reduce((sum, p) => sum + (Number(p.approx_cost || p.approxCost || p.approx_value || p.approxValue) || 0), 0);
      } else if (block.estimatedCost && typeof block.estimatedCost === 'object') {
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
        title: block.title || '',
        description,
        estimatedCost: { amount, currency },
        type,
        places: block.places || [],
        notes: block.notes || ''
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

  // Deduce budget tier
  const avgDaily = Math.round(estCostAmount / totalDays);
  const rate = INR_TO_CURRENCY[estCostCurrency] || 1.0;
  const dailyBudgetInINR = avgDaily / rate;
  let budgetTier = context.budgetTier;
  if (!budgetTier) {
    if (dailyBudgetInINR < 3000) {
      budgetTier = 'low';
    } else if (dailyBudgetInINR > 8000) {
      budgetTier = 'high';
    } else {
      budgetTier = 'mid';
    }
  }

  const startCity = context.startCity || itinerary.startCity || '';
  const startCountry = context.startCountry || '';
  const startLat = context.userLat || null;
  const startLng = context.userLng || null;

  const destLat = context.destLat || null;
  const destLng = context.destLng || null;
  const resolvedDestCity = context.resolvedDestCity || '';
  const resolvedDestCountry = context.resolvedDestCountry || '';

  const resolvedStart = resolveCityAndCountry(startCity);
  const resolvedDest = resolveCityAndCountry(destination);

  // Integrate client geocoding if available
  if (resolvedDestCity) {
    if (!resolvedDest.city || resolvedDest.city.toLowerCase() === destination.toLowerCase()) {
      resolvedDest.city = resolvedDestCity;
      resolvedDest.country = resolvedDestCountry || resolvedDest.country;
    }
  }

  const cleanCity = (c) => {
    if (!c) return '';
    let name = c.toLowerCase().trim();
    if (name === 'new delhi' || name === 'delhi ncr' || name === 'noida' || name === 'gurgaon' || name === 'ghaziabad' || name === 'faridabad') {
      return 'delhi';
    }
    if (name === 'nyc' || name === 'new york city' || name === 'brooklyn' || name === 'queens' || name === 'manhattan' || name === 'bronx' || name === 'staten island' || name === 'brooklyn heights' || name === 'williamsburg') {
      return 'new york';
    }
    if (name === 'bombay') {
      return 'mumbai';
    }
    return name;
  };

  const startCityClean = cleanCity(resolvedStart.city || startCity);
  const destCityClean = cleanCity(resolvedDest.city || destination);

  const normalizedStartCountry = normalizeCountry(resolvedStart.country || startCountry);
  const normalizedDestCountry = normalizeCountry(resolvedDest.country);

  let isSameCity = startCityClean && destCityClean && 
    (startCityClean === destCityClean || startCityClean.includes(destCityClean) || destCityClean.includes(startCityClean)) &&
    (
      !normalizedStartCountry || !normalizedDestCountry ||
      normalizedStartCountry === normalizedDestCountry
    );

  // Coordinate-based same-city check (if within 50 km, force isSameCity = true)
  let distanceKm = null;
  if (startLat && startLng) {
    let dLat = Number(destLat);
    let dLng = Number(destLng);
    if (isNaN(dLat) || isNaN(dLng) || !destLat || !destLng) {
      const coords = cityCoords[destCityClean];
      if (coords) {
        dLat = coords.lat;
        dLng = coords.lng;
      }
    }

    if (dLat !== null && dLng !== null && !isNaN(dLat) && !isNaN(dLng)) {
      distanceKm = getHaversineDistance(Number(startLat), Number(startLng), dLat, dLng);
      if (distanceKm !== null && distanceKm < 50) {
        isSameCity = true;
      }
    }
  }

  let howToReach = itinerary.howToReach;

  // Strict override when isSameCity === true: Completely discard the AI's howToReach and rebuild via computeHowToReach.
  if (isSameCity) {
    const finalDistance = resolvedDest.area ? 10 : 2;
    howToReach = computeHowToReach(
      resolvedDest.city || destCityClean || destination,
      resolvedDest.country || startCountry,
      resolvedDest.city || destCityClean || destination,
      resolvedDest.country,
      finalDistance,
      budgetTier,
      estCostCurrency,
      resolvedDest.area || destination
    );
  } else if (!howToReach) {
    const finalDistance = distanceKm || estimateDistance(
      resolvedStart.city || startCity,
      resolvedStart.country || startCountry,
      resolvedDest.city,
      resolvedDest.country,
      startLat,
      startLng
    );
    howToReach = computeHowToReach(
      resolvedStart.city || startCity,
      resolvedStart.country || startCountry,
      resolvedDest.city,
      resolvedDest.country,
      finalDistance,
      budgetTier,
      estCostCurrency,
      resolvedDest.area || destination
    );
  } else {
    // If not same-city but has missing fields, generate it
    const hasRequiredFields = howToReach.recommendedMode && howToReach.details && howToReach.estimatedCost;
    if (!hasRequiredFields) {
      const finalDistance = distanceKm || estimateDistance(
        resolvedStart.city || startCity,
        resolvedStart.country || startCountry,
        resolvedDest.city,
        resolvedDest.country,
        startLat,
        startLng
      );
      howToReach = computeHowToReach(
        resolvedStart.city || startCity,
        resolvedStart.country || startCountry,
        resolvedDest.city,
        resolvedDest.country,
        finalDistance,
        budgetTier,
        estCostCurrency,
        resolvedDest.area || destination
      );
    }
  }

  // Defensive post-validation pass for same-city trips
  if (isSameCity && howToReach) {
    const recModeLower = (howToReach.recommendedMode || '').toLowerCase();
    const startTerminalLower = (howToReach.nearestStartTerminal || '').toLowerCase();
    const endTerminalLower = (howToReach.nearestEndTerminal || '').toLowerCase();
    const detailsLower = (howToReach.details || '').toLowerCase();

    const hasFlightOrAirport = 
      recModeLower.includes('flight') || 
      recModeLower.includes('plane') || 
      recModeLower.includes('airport') ||
      startTerminalLower.includes('airport') || 
      endTerminalLower.includes('airport') ||
      detailsLower.includes('airport') ||
      detailsLower.includes('flight');

    if (hasFlightOrAirport) {
      console.warn(`[AI Same-City Sanitization] Detected residual flight/airport mention for same-city trip. Re-forcing override and sanitizing details.`);
      const finalDistance = resolvedDest.area ? 10 : 2;
      howToReach = computeHowToReach(
        resolvedDest.city || destCityClean || destination,
        resolvedDest.country || startCountry,
        resolvedDest.city || destCityClean || destination,
        resolvedDest.country,
        finalDistance,
        budgetTier,
        estCostCurrency,
        resolvedDest.area || destination
      );

      // Strip airport and flight words from details/summary
      if (howToReach.details) {
        howToReach.details = howToReach.details
          .replace(/\bflight\b/gi, 'local transit')
          .replace(/\bflights\b/gi, 'local transit options')
          .replace(/\bairport\b/gi, 'metro station/pickup point')
          .replace(/\bairports\b/gi, 'metro stations/pickup points');
      }
      if (howToReach.summary) {
        howToReach.summary = howToReach.summary
          .replace(/\bflight\b/gi, 'local transit')
          .replace(/\bflights\b/gi, 'local transit options')
          .replace(/\bairport\b/gi, 'metro station/pickup point');
      }
    }
  }

  console.log(`[DEBUG Same-City] Resolution summary for destination "${destination}":`);
  console.log(`  - startCity: "${startCity}" -> resolved: "${resolvedStart.city}", country: "${resolvedStart.country}"`);
  console.log(`  - destination: "${destination}" -> resolved: "${resolvedDest.city}", country: "${resolvedDest.country}", area: "${resolvedDest.area}"`);
  console.log(`  - startCoords: (${startLat}, ${startLng})`);
  console.log(`  - destCoords: (${destLat}, ${destLng})`);
  console.log(`  - distanceKm: ${distanceKm}`);
  console.log(`  - isSameCity: ${isSameCity}`);
  console.log(`  - final howToReach:`, JSON.stringify(howToReach, null, 2));

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
    howToReach,
    dayByDayPlan,
    safetyAndLogistics,
    localCurrencyNote,
    budgetBreakdown,
    destination,
    startCity,
    startCountry,
    userLat: startLat,
    userLng: startLng,
    resolvedDestCity,
    resolvedDestCountry,
    destLat,
    destLng,
    budgetTier,
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
          title: day.morning.title || '☀️ Morning',
          placeName: (day.morning.places && day.morning.places[0]) ? day.morning.places[0].name : '☀️ Morning Plan',
          description: day.morning.description,
          activity: day.morning.description,
          areaOrNeighborhood: (day.morning.places && day.morning.places[0]) ? day.morning.places[0].area : destination,
          approxCost: {
            value: day.morning.estimatedCost.amount,
            currency: day.morning.estimatedCost.currency
          },
          type: day.morning.type,
          places: day.morning.places || [],
          notes: day.morning.notes || ''
        },
        {
          timeWindow: 'Afternoon (13:00 - 17:00)',
          timeSlot: 'Afternoon (13:00 - 17:00)',
          title: day.afternoon.title || '🌤️ Afternoon',
          placeName: (day.afternoon.places && day.afternoon.places[0]) ? day.afternoon.places[0].name : '🌤️ Afternoon Plan',
          description: day.afternoon.description,
          activity: day.afternoon.description,
          areaOrNeighborhood: (day.afternoon.places && day.afternoon.places[0]) ? day.afternoon.places[0].area : destination,
          approxCost: {
            value: day.afternoon.estimatedCost.amount,
            currency: day.afternoon.estimatedCost.currency
          },
          type: day.afternoon.type,
          places: day.afternoon.places || [],
          notes: day.afternoon.notes || ''
        },
        {
          timeWindow: 'Evening (18:00 - 22:00)',
          timeSlot: 'Evening (18:00 - 22:00)',
          title: day.evening.title || '🌙 Evening',
          placeName: (day.evening.places && day.evening.places[0]) ? day.evening.places[0].name : '🌙 Evening Plan',
          description: day.evening.description,
          activity: day.evening.description,
          areaOrNeighborhood: (day.evening.places && day.evening.places[0]) ? day.evening.places[0].area : destination,
          approxCost: {
            value: day.evening.estimatedCost.amount,
            currency: day.evening.estimatedCost.currency
          },
          type: day.evening.type,
          places: day.evening.places || [],
          notes: day.evening.notes || ''
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

function cleanNameForMatching(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\(.*\)/g, '') // remove parentheses content
    .replace(/\b(village|town|district|station|metro|airport|railway|junction|terminal|west|east|north|south|central|market|street|road|avenue|square|park|palace|castle|fort|temple|church|mosque|tomb|gardens|monument|bridge|lake|harbor|valley|hills|caves|dargah|tower)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const cityCandidates = [];
  for (const [key, ct] of Object.entries(cities)) {
    if (destinationMatches(key, primaryToken)) {
      cityCandidates.push(ct);
    }
  }
  if (cityCandidates.length > 0) {
    const matchingCountry = cityCandidates.find(ct => {
      const countryLower = (ct.country || '').toLowerCase();
      return cleanDest.includes(countryLower);
    });
    const exactNameMatch = cityCandidates.find(ct => (ct.name || '').toLowerCase() === primaryToken);
    matchedCity = matchingCountry || exactNameMatch || cityCandidates[0];
  }

  // If no city matches directly, check if the input matches any neighborhood of a city!
  if (!matchedCity) {
    const neighborhoodCandidates = [];
    for (const [key, ct] of Object.entries(cities)) {
      const neighborhoods = ct.neighborhoods || [];
      const matchedNh = neighborhoods.find(nh => {
        const cleanNh = nh.toLowerCase().trim();
        const escaped = primaryToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const boundaryRegex = new RegExp(`(^|[\\s,\\/\\(\\)-])${escaped}([\\s,\\/\\(\\)-]|$)`, 'i');
        
        const nhClean = cleanNameForMatching(cleanNh);
        const tokenClean = cleanNameForMatching(primaryToken);
        const hasSubstringMatch = nhClean && tokenClean && (nhClean.includes(tokenClean) || tokenClean.includes(nhClean));
        
        return boundaryRegex.test(cleanNh) || isFuzzyMatch(cleanNh, primaryToken) || hasSubstringMatch;
      });
      if (matchedNh) {
        neighborhoodCandidates.push(ct);
      }
    }
    if (neighborhoodCandidates.length > 0) {
      const matchingCountry = neighborhoodCandidates.find(ct => {
        const countryLower = (ct.country || '').toLowerCase();
        return cleanDest.includes(countryLower);
      });
      matchedCity = matchingCountry || neighborhoodCandidates[0];
    }
  }

  // If no city matches directly, check if the input matches any landmark of a city!
  if (!matchedCity) {
    const landmarkCandidates = [];
    for (const [key, ct] of Object.entries(cities)) {
      const landmarks = ct.landmarks || [];
      const matchedLandmark = landmarks.find(lm => {
        const cleanLm = lm.toLowerCase().trim();
        const escaped = primaryToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const boundaryRegex = new RegExp(`(^|[\\s,\\/\\(\\)-])${escaped}([\\s,\\/\\(\\)-]|$)`, 'i');
        
        const lmClean = cleanNameForMatching(cleanLm);
        const tokenClean = cleanNameForMatching(primaryToken);
        const hasSubstringMatch = lmClean && tokenClean && (lmClean.includes(tokenClean) || tokenClean.includes(lmClean));
        
        return boundaryRegex.test(cleanLm) || isFuzzyMatch(cleanLm, primaryToken) || hasSubstringMatch;
      });
      if (matchedLandmark) {
        landmarkCandidates.push(ct);
      }
    }
    if (landmarkCandidates.length > 0) {
      const matchingCountry = landmarkCandidates.find(ct => {
        const countryLower = (ct.country || '').toLowerCase();
        return cleanDest.includes(countryLower);
      });
      matchedCity = matchingCountry || landmarkCandidates[0];
    }
  }

  // Try to find matching region only if no city (direct or landmark) was matched
  let matchedRegion = null;
  if (!matchedCity) {
    const regionCandidates = [];
    for (const [key, reg] of Object.entries(regions)) {
      if (destinationMatches(key, primaryToken)) {
        regionCandidates.push(reg);
      }
    }
    if (regionCandidates.length > 0) {
      const matchingCountry = regionCandidates.find(reg => {
        const countryLower = (reg.country || '').toLowerCase();
        return cleanDest.includes(countryLower);
      });
      const exactNameMatch = regionCandidates.find(reg => (reg.name || '').toLowerCase() === primaryToken);
      matchedRegion = matchingCountry || exactNameMatch || regionCandidates[0];
    }
  }

  return { matchedCity, matchedRegion };
}

function isKnownCountry(countryName) {
  if (!countryName) return false;
  const dbInstance = getKnownCitiesDb();
  const cities = dbInstance.cities || {};
  const cNameLower = countryName.toLowerCase().trim();
  for (const ct of Object.values(cities)) {
    if ((ct.country || '').toLowerCase().trim() === cNameLower) {
      return true;
    }
  }
  const regions = dbInstance.regions || {};
  for (const reg of Object.values(regions)) {
    if ((reg.country || '').toLowerCase().trim() === cNameLower) {
      return true;
    }
  }
  const commonCountries = ['usa', 'united states', 'uk', 'united kingdom', 'india', 'france', 'germany', 'japan', 'china', 'australia', 'canada', 'brazil', 'spain', 'italy'];
  if (commonCountries.includes(cNameLower)) return true;
  return false;
}

function resolveCityAndCountry(destName) {
  if (!destName) return { area: '', city: '', country: '' };

  const { matchedCity, matchedRegion } = matchDestinationInDb(destName);

  if (matchedCity) {
    const cleanDest = destName.toLowerCase().trim();
    const primaryToken = cleanDest.split(',')[0].trim();
    let area = '';

    const neighborhoods = matchedCity.neighborhoods || [];
    const foundNh = neighborhoods.find(nh => {
      const cleanNh = nh.toLowerCase().trim();
      const nhClean = cleanNameForMatching(cleanNh);
      const tokenClean = cleanNameForMatching(primaryToken);
      const hasSubstringMatch = nhClean && tokenClean && (nhClean.includes(tokenClean) || tokenClean.includes(nhClean));
      return cleanNh.includes(primaryToken) || primaryToken.includes(cleanNh) || isFuzzyMatch(cleanNh, primaryToken) || hasSubstringMatch;
    });

    let foundLm = null;
    if (!foundNh) {
      const landmarks = matchedCity.landmarks || [];
      foundLm = landmarks.find(lm => {
        const cleanLm = lm.toLowerCase().trim();
        const lmClean = cleanNameForMatching(cleanLm);
        const tokenClean = cleanNameForMatching(primaryToken);
        const hasSubstringMatch = lmClean && tokenClean && (lmClean.includes(tokenClean) || tokenClean.includes(lmClean));
        return cleanLm.includes(primaryToken) || primaryToken.includes(cleanLm) || isFuzzyMatch(cleanLm, primaryToken) || hasSubstringMatch;
      });
    }

    const matchedArea = foundNh || foundLm;
    if (matchedArea) {
      area = matchedArea;
    } else {
      // Fallback: if the input is not exactly the city name, treat the first token as the area
      const rawFirstToken = destName.split(',')[0].trim();
      if (rawFirstToken.toLowerCase() !== matchedCity.name.toLowerCase()) {
        area = rawFirstToken;
      }
    }

    return {
      area: area || '',
      city: matchedCity.name,
      country: matchedCity.country
    };
  }

  if (matchedRegion) {
    return {
      area: '',
      city: matchedRegion.name,
      country: matchedRegion.country
    };
  }

  // Parse text heuristics if no DB match
  const parts = destName.split(',').map(s => s.trim()).filter(Boolean);

  if (parts.length === 1) {
    return { area: '', city: parts[0], country: '' };
  } else if (parts.length === 2) {
    if (isKnownCountry(parts[1])) {
      return { area: '', city: parts[0], country: parts[1] };
    } else {
      return { area: parts[0], city: parts[1], country: '' };
    }
  } else if (parts.length >= 3) {
    return {
      area: parts[0],
      city: parts[1],
      country: parts[parts.length - 1]
    };
  }

  return { area: '', city: destName, country: '' };
}

function getCityLocalTransitTips(cityName, destArea) {
  const nameLower = cityName.toLowerCase().trim();
  const destName = destArea || 'your destination';
  if (nameLower === 'delhi' || nameLower === 'new delhi') {
    return {
      walking: `Since you’re already in Delhi, you don’t need air travel or intercity train. The best way to reach ${destName} is walking, which takes just a few minutes, or a quick auto-rickshaw ride.`,
      medium: `Since you’re already in Delhi, you don’t need air travel or intercity train. The best way to reach ${destName} is taking the Delhi Metro (such as the Yellow Line) to avoid traffic. Alternatively, you can take a direct cab or auto-rickshaw for door-to-door comfort.`,
      long: `Since you’re already in Delhi, you don’t need air travel or intercity train. The best way to cross the city to ${destName} is using the Delhi Metro network for the main stretch, then taking a short auto or cab for the last mile. Direct app-based cabs are also highly convenient.`
    };
  }
  if (nameLower === 'mumbai') {
    return {
      walking: `Since you’re already in Mumbai, you don’t need air travel or intercity train. The best way to reach ${destName} is walking or taking a quick auto-rickshaw/local taxi.`,
      medium: `Since you’re already in Mumbai, you don’t need air travel or intercity train. The best way to reach ${destName} is taking the Mumbai Metro or the local train network. A cab or auto-rickshaw is also a great option for door-to-door transit.`,
      long: `Since you’re already in Mumbai, you don’t need air travel or intercity train. The best way to cross the city to ${destName} is using the local trains or Metro to bypass traffic, then taking a taxi or auto for the last mile.`
    };
  }
  if (nameLower === 'new york' || nameLower === 'nyc') {
    return {
      walking: `Since you’re already in New York, the best way to reach ${destName} is a pleasant walk or a quick taxi ride.`,
      medium: `Since you’re already in New York, the best way to reach ${destName} is taking the NYC subway. It is the fastest way to travel between boroughs and avoid street traffic.`,
      long: `Since you’re already in New York, the best way to travel to ${destName} is taking the subway (express lines where available) for the main stretch, followed by walking or a taxi for the final blocks.`
    };
  }
  if (nameLower === 'paris') {
    return {
      walking: `Since you’re already in Paris, the best way to reach ${destName} is walking through the scenic streets or taking a short metro ride.`,
      medium: `Since you’re already in Paris, the best way to reach ${destName} is using the Paris Métro or RER network. It is very efficient and covers all neighborhoods.`,
      long: `Since you’re already in Paris, the best way to travel to ${destName} is taking the Métro or RER train lines to the nearest station, then a short walk or taxi for the last stretch.`
    };
  }

  // Default generic local transit tips for any other city in the world
  return {
    walking: `Since you’re already in ${cityName}, you don’t need air travel or intercity train. The best way to reach ${destName} is walking, which takes just a few minutes. For convenience, a short local taxi or public bus ride is also easily available.`,
    medium: `Since you’re already in ${cityName}, you don’t need air travel or intercity train. The best way to reach ${destName} is using the city's local metro/subway, tram, or bus network. Alternatively, you can take a direct taxi or app-based cab for door-to-door comfort.`,
    long: `Since you’re already in ${cityName}, you don’t need air travel or intercity train. The best way to travel across the city to ${destName} is taking local transit (metro/subway or express bus) to bypass traffic, then a short taxi or walk for the last mile.`
  };
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

function generateMockItinerary(destination, budget, currency, daysCount, interests, startDate, startCity = '', startCountry = '', userLat = null, userLng = null, resolvedDestCity = '', resolvedDestCountry = '', destLat = null, destLng = null) {
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

  const safeInterests = Array.isArray(interests) && interests.length > 0 ? interests : ['landmarks', 'culture', 'nature', 'shopping', 'food', 'nightlife'];
  const activeInterest = safeInterests[0];

  // Check if destination matches any World Travel Encyclopedia entries
  const resolvedForMock = resolveCityAndCountry(destName);
  const matchedEnc = findGlobalDestination({
    country: resolvedForMock.country,
    city: resolvedForMock.city,
    area: resolvedForMock.area,
    queryText: destName
  });
  if (matchedEnc) {
    const areaLabel = matchedEnc.neighborhood || matchedEnc.name || destName;
    const encCurr = (matchedEnc.places && matchedEnc.places[0] && matchedEnc.places[0].currency) ? matchedEnc.places[0].currency : curr;
    const places = matchedEnc.places || [];
    const attractions = places.filter(p => p.type === 'attraction');
    const cafes = places.filter(p => p.type === 'cafe');
    const markets = places.filter(p => p.type === 'market');
    const nightlife = places.filter(p => p.type === 'nightlife');
    const restaurants = places.filter(p => p.type === 'restaurant');

    const dayByDayPlan = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // Determine area label for descriptions and fallbacks
      const areaForDesc = areaLabel;

      // Select specific places dynamically (rotate lists)
      const att1 = attractions[i % attractions.length] || { name: `${areaLabel} Landmark`, type: "attraction", approx_cost: 0, description: `Explore the beautiful areas around ${areaLabel}.` };
      const att2 = attractions[(i + 1) % attractions.length] || attractions[0] || { name: `${areaLabel} Sight`, type: "attraction", approx_cost: 0, description: `Enjoy sightseeing in ${areaLabel}.` };
      const cafe1 = cafes[i % cafes.length] || { name: `Local Café in ${areaLabel}`, type: "cafe", approx_cost: 200, description: `Relax and grab a beverage at a cozy café.` };
      const mkt1 = markets[i % markets.length] || { name: `${areaLabel} Market`, type: "market", approx_cost: 0, description: `Stroll through the local shops and boutique stores.` };
      const rest1 = restaurants[i % restaurants.length] || { name: `Popular Restaurant in ${areaLabel}`, type: "restaurant", approx_cost: 400, description: `Savor regional specialties at a highly recommended dining spot.` };
      const bar1 = nightlife[i % nightlife.length] || { name: `Lounge bar in ${areaLabel}`, type: "nightlife", approx_cost: 800, description: `Unwind at a popular night spot or bar with local atmosphere.` };

      // Build periods based on neighborhood templates if matching, else generic data-driven template
      let title = '';
      let morning = {};
      let afternoon = {};
      let evening = {};
      let notes = [];

      const isCP = areaLabel.toLowerCase().includes('connaught');
      const isHK = areaLabel.toLowerCase().includes('hauz');
      const isSJ = areaLabel.toLowerCase().includes('safdarjung');

      if (isCP) {
        title = `Explore Connaught Place - Day ${i + 1}`;
        morning = {
          title: `Visit ${att2.name} and explore ${mkt1.name}`,
          description: `Start your morning by visiting ${att2.name} to admire its unique historical architecture, followed by a walk through the lively stalls of ${mkt1.name}. Enjoy a traditional filter coffee or snack at ${cafe1.name}.`,
          places: [
            { name: att2.name, type: att2.type, area: areaLabel, approx_cost: att2.approx_cost },
            { name: mkt1.name, type: mkt1.type, area: areaLabel, approx_cost: mkt1.approx_cost },
            { name: cafe1.name, type: cafe1.type, area: areaLabel, approx_cost: cafe1.approx_cost }
          ],
          notes: `Janpath Market is great for bargaining and buy local items.`
        };
        afternoon = {
          title: `Lunch at ${rest1.name} and shopping in CP Inner Circle`,
          description: `Have a delicious lunch at the iconic ${rest1.name} in Connaught Place. Spend the afternoon exploring the circular streets and shopping colonnades, visiting ${att1.name} at the center of the hub.`,
          places: [
            { name: rest1.name, type: rest1.type, area: areaLabel, approx_cost: rest1.approx_cost },
            { name: att1.name, type: att1.type, area: areaLabel, approx_cost: att1.approx_cost }
          ],
          notes: `Rajiv Chowk metro station is the central hub here.`
        };
        evening = {
          title: `Evening drinks at ${bar1.name} overlooking CP`,
          description: `As dusk falls, head to ${bar1.name} for drinks and dinner. Enjoy a fantastic view over CP and soak in the lively nightlife and cosmopolitan vibe.`,
          places: [
            { name: bar1.name, type: bar1.type, area: areaLabel, approx_cost: bar1.approx_cost }
          ],
          notes: `Advance reservations are recommended on weekends.`
        };
        notes = [`CP is pedestrian-friendly but watch out for street vendors.`, `Carry some cash for small purchases.`];
      } else if (isHK) {
        title = `Explore Hauz Khas - Day ${i + 1}`;
        morning = {
          title: `Morning walk at ${att1.name} and ${att2.name}`,
          description: `Begin your morning walking through the ancient 13th-century ruins of ${att1.name} next to the lake, then wander into the lush greenery of ${att2.name} to see the spotted deer in their natural habitat.`,
          places: [
            { name: att1.name, type: att1.type, area: areaLabel, approx_cost: att1.approx_cost },
            { name: att2.name, type: att2.type, area: areaLabel, approx_cost: att2.approx_cost }
          ],
          notes: `Early morning has the coolest weather for walking.`
        };
        afternoon = {
          title: `Boutique shopping and coffee at ${cafe1.name}`,
          description: `Explore the narrow lanes of Hauz Khas Village, browsing unique designer fashion shops at ${mkt1.name}. Take a rest and enjoy lunch or coffee at the cozy ${cafe1.name}.`,
          places: [
            { name: mkt1.name, type: mkt1.type, area: areaLabel, approx_cost: mkt1.approx_cost },
            { name: cafe1.name, type: cafe1.type, area: areaLabel, approx_cost: cafe1.approx_cost }
          ],
          notes: `Look for art galleries hidden in upper floors.`
        };
        evening = {
          title: `Dine at ${rest1.name} and nightlife at ${bar1.name}`,
          description: `Enjoy authentic dinner at ${rest1.name} with views of the fort. Spend the night experiencing the lively nightlife, music, and cocktail scene at ${bar1.name} in Hauz Khas.`,
          places: [
            { name: rest1.name, type: rest1.type, area: areaLabel, approx_cost: rest1.approx_cost },
            { name: bar1.name, type: bar1.type, area: areaLabel, approx_cost: bar1.approx_cost }
          ],
          notes: `Cabs can be boarded right outside the village gate.`
        };
        notes = [`Hauz Khas is one of Delhi's most popular nightlife areas.`, `Watch your step in narrow village staircases.`];
      } else if (isSJ) {
        title = `Explore Safdarjung - Day ${i + 1}`;
        morning = {
          title: `Visit the majestic ${att1.name}`,
          description: `Start your day by visiting the famous ${att1.name} to admire its sandstone and marble Mughal architecture. Walk through the quiet gardens and enjoy the serene morning breeze.`,
          places: [
            { name: att1.name, type: att1.type, area: areaLabel, approx_cost: att1.approx_cost }
          ],
          notes: `Carry camera for beautiful monument pictures.`
        };
        afternoon = {
          title: `Lunch at ${rest1.name} and SDA Market stroll`,
          description: `For lunch, head over to ${rest1.name} to enjoy delicious spicy North Indian curries. Spend your afternoon wandering through ${mkt1.name} and grab a special dessert at ${cafe1.name}.`,
          places: [
            { name: rest1.name, type: rest1.type, area: areaLabel, approx_cost: rest1.approx_cost },
            { name: mkt1.name, type: mkt1.type, area: areaLabel, approx_cost: mkt1.approx_cost },
            { name: cafe1.name, type: cafe1.type, area: areaLabel, approx_cost: cafe1.approx_cost }
          ],
          notes: `SDA market is a popular student hub with lively vibes.`
        };
        evening = {
          title: `Live music at ${bar1.name} in Safdarjung`,
          description: `Spend your evening experiencing outstanding live music performances and cocktails at ${bar1.name}. Enjoy the cozy speakeasy ambiance and premium dining menu.`,
          places: [
            { name: bar1.name, type: bar1.type, area: areaLabel, approx_cost: bar1.approx_cost }
          ],
          notes: `Booking a table in advance is highly recommended.`
        };
        notes = [`Safdarjung area features a mix of quiet residential lanes and hip markets.`, `Public transport is easily accessible near SDA.`];
      } else {
        // Generic but DATA-DRIVEN template using world encyclopedia data for any matched area/city (Paris, Tokyo, NYC, Bandra, Jaipur Old City, etc.)
        title = `Explore ${matchedEnc.name || areaLabel} - Day ${i + 1}`;
        morning = {
          title: `Morning exploration of ${att1.name}`,
          description: `Start your day by visiting the famous ${att1.name} to take photos and explore the site. Head over to ${cafe1.name} for breakfast or local specialty coffee.`,
          places: [
            { name: att1.name, type: att1.type, area: areaLabel, approx_cost: att1.approx_cost },
            { name: cafe1.name, type: cafe1.type, area: areaLabel, approx_cost: cafe1.approx_cost }
          ],
          notes: `Check entry rules and fees before visiting.`
        };
        afternoon = {
          title: `Shopping walk through ${mkt1.name} and lunch at ${rest1.name}`,
          description: `Spend your afternoon exploring the local culture and shopping lanes of ${mkt1.name}. For lunch, dine at ${rest1.name} and try authentic local recipes.`,
          places: [
            { name: mkt1.name, type: mkt1.type, area: areaLabel, approx_cost: mkt1.approx_cost },
            { name: rest1.name, type: rest1.type, area: areaLabel, approx_cost: rest1.approx_cost }
          ],
          notes: `Bargaining may be common in local markets.`
        };
        evening = {
          title: `Evening leisure at ${att2.name} and nightlife at ${bar1.name}`,
          description: `Stroll through the scenic area of ${att2.name} as the weather cools down. Later, enjoy dinner and drinks at the popular local venue ${bar1.name}.`,
          places: [
            { name: att2.name, type: att2.type, area: areaLabel, approx_cost: att2.approx_cost },
            { name: bar1.name, type: bar1.type, area: areaLabel, approx_cost: bar1.approx_cost }
          ],
          notes: `Reserve tables in advance on weekends.`
        };
        notes = [`Use authorized transport options.`, `Keep hydrated throughout the day.`];
      }

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: title || `Explore ${matchedEnc.name} - Day ${i + 1}`,
        theme: activeInterest.toUpperCase(),
        morning,
        afternoon,
        evening,
        notes
      });
    }

    const encCostTotal = dayByDayPlan.reduce((sum, d) => {
        const mCost = (d.morning.places || []).reduce((s, p) => s + (p.approx_cost || 0), 0);
        const aCost = (d.afternoon.places || []).reduce((s, p) => s + (p.approx_cost || 0), 0);
        const eCost = (d.evening.places || []).reduce((s, p) => s + (p.approx_cost || 0), 0);
        return sum + mCost + aCost + eCost;
      }, 0);

    const rawMock = {
      tripSummary: {
        destination: matchedEnc.name || areaLabel,
        totalDays: totalDays,
        travelStyle: budgetTier,
        estimatedTotalCost: {
          amount: encCostTotal || totalBudget,
          currency: encCurr
        },
        bestTimeAdvice: "Best visited during the shoulder season for pleasant weather and fewer crowds."
      },
      howToReach: {
        recommendedMode: "local transit",
        summary: `Take local transit directly to ${areaLabel}.`,
        nearestStartTerminal: "Local station",
        nearestEndTerminal: `${areaLabel}`,
        details: `Reaching ${areaLabel} is easy via the city's local metro, bus, or taxi network depending on your starting location.`,
        estimatedCost: {
          amount: Math.round(150 * (INR_TO_CURRENCY[encCurr] || 1)),
          currency: encCurr
        }
      },
      dayByDayPlan,
      safetyAndLogistics: {
        localTransportTips: "Metro is highly recommended for escaping traffic.",
        areaSafetyNotes: "Keep your belongings safe in crowded market areas.",
        moneySavingTips: "Explore street food stalls and local heritage spots for budget options."
      }
    };

    return normalizeItinerary(rawMock, startDate, totalBudget, curr, totalDays, { startCity, startCountry, userLat, userLng, budgetTier, resolvedDestCity, resolvedDestCountry, destLat, destLng });
  }

  // --- Normal non-matched destination fallback logic ---
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
  for (let i = 0; i < totalDays; i++) {
    const activeInterest = safeInterests[i % safeInterests.length];
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    if (resolvedCities.length > 0) {
      const city = resolvedCities[i % resolvedCities.length];
      
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
        morningDesc = `Begin the morning with an exploratory walk around ${city.landmarks[lmIdx1]} and wandering through the ${city.neighborhoods[nhIdx1]} neighborhood. Visit the free-entry cultural site of ${city.culture[cultIdx]}.`;
        afternoonDesc = `Head to the vibrant ${city.shopping[shopIdx]} area for budget-friendly local market shopping. For lunch, sample local street eats or taste ${city.food[foodIdx]} at an affordable neighborhood diner.`;
        eveningDesc = `Enjoy a relaxed evening activity of ${city.activities[actIdx]} (utilizing cheap local transport). Afterwards, dine at a pocket-friendly cafe in the lively ${city.neighborhoods[nhIdx2]} district.`;
      } else if (budgetTier === 'high') {
        morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} with a private guide, followed by a personalized tour of the beautiful ${city.neighborhoods[nhIdx1]} neighborhood. Visit the premier cultural exhibition at ${city.culture[cultIdx]}.`;
        afternoonDesc = `Head to the upscale boutiques in the ${city.shopping[shopIdx]} area for premium shopping. Enjoy a gourmet lunch featuring refined preparations of ${city.food[foodIdx]} at a highly-acclaimed signature restaurant.`;
        eveningDesc = `Indulge in a premium evening experience of ${city.activities[actIdx]} via private transport. Afterwards, unwind with a multi-course dinner at a top-tier restaurant in the exclusive ${city.neighborhoods[nhIdx2]} district.`;
      } else {
        morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} and taking a guided stroll around the beautiful ${city.neighborhoods[nhIdx1]} neighborhood. Visit the nearby cultural site of ${city.culture[cultIdx]}.`;
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
          title: `Explore ${city.landmarks[lmIdx1]}`,
          description: morningDesc,
          places: [
            { name: city.landmarks[lmIdx1], type: 'attraction', area: city.neighborhoods[nhIdx1] || city.name, approx_cost: 0 }
          ],
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        afternoon: {
          title: `Lunch and Shopping in ${city.neighborhoods[nhIdx1]}`,
          description: afternoonDesc,
          places: [
            { name: city.shopping[shopIdx], type: 'market', area: city.neighborhoods[nhIdx1] || city.name, approx_cost: 0 }
          ],
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        evening: {
          title: `Evening ${city.activities[actIdx]}`,
          description: eveningDesc,
          places: [
            { name: city.activities[actIdx], type: 'attraction', area: city.neighborhoods[nhIdx2] || city.name, approx_cost: 0 }
          ],
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
          morning: `Take an exploratory walk around the famous landmarks of ${destName}, exploring the main public streets and taking photos from a free scenic city viewpoint.`,
          afternoon: `Wander through the bustling local market street of ${destName} to browse budget-friendly local stalls. Enjoy a budget lunch at a popular street food joint or local eatery.`,
          evening: `Take a relaxing evening stroll along the main walking boulevard or central area of ${destName}, and enjoy a pocket-friendly dinner at a casual neighborhood restaurant.`
        },
        {
          morning: `Join a free walking tour through ${destName}'s oldest residential neighborhood to see the classic architecture and learn about local heritage.`,
          afternoon: `Browse the artisan workshops and local craft displays in the creative arts district of ${destName}. Have lunch at an affordable courtyard cafe or bakery.`,
          evening: `Experience the local evening vibe at a lively community square or night market in ${destName}, tasting affordable street food snacks.`
        },
        {
          morning: `Visit a peaceful scenic park, nature reserve, or iconic natural viewpoint just outside the central area of ${destName} (using low-cost public transit).`,
          afternoon: `Explore a free cultural center, art gallery, or public history archive in ${destName}. Have a relaxing lunch at a budget-friendly local bistro.`,
          evening: `Relax at a popular local sunset spot or public park in ${destName}. Enjoy a simple dinner featuring fresh regional ingredients at a cozy tavern.`
        }
      ];

      const midBudgetPlans = [
        {
          morning: `Explore the central historic quarter of ${destName}, walking down the main heritage streets, visiting the municipal museum, and stopping at a scenic city viewpoint.`,
          afternoon: `Visit the central market area of ${destName} to explore local stalls. Have a traditional local lunch at a popular family-run restaurant nearby.`,
          evening: `Take an evening walk along the main walking boulevard or central plaza of ${destName}, and enjoy dinner at a highly-rated local eatery serving regional specialties.`
        },
        {
          morning: `Join a guided walking tour through ${destName}'s oldest neighborhood to see the classic architecture and learn about local heritage.`,
          afternoon: `Browse the artisan workshops and local craft boutiques in the creative arts district of ${destName}. Have a cozy courtyard cafe lunch.`,
          evening: `Experience the local evening vibe at a popular street food lane or central square in ${destName}, tasting authentic local street eats.`
        }
      ];

      const highBudgetPlans = [
        {
          morning: `Embark on a private guided tour of the central historic quarter of ${destName}, gaining exclusive access to key heritage landmarks and a premium scenic viewpoint.`,
          afternoon: `Browse the high-end specialty boutiques around the central district of ${destName}. Have a gourmet lunch featuring upscale local recipes at a highly-rated signature restaurant.`,
          evening: `Take a private sunset cruise or guided evening tour of the coastline in ${destName}, followed by a multi-course tasting dinner at an acclaimed fine dining restaurant.`
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
        `Start your days early in ${destName} to beat the mid-day crowd at popular spots.`,
        `Keep a water bottle and comfortable walking shoes ready for exploring ${destName}.`
      ];

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: `Discover ${destName} - Day ${i + 1}`,
        theme: activeInterest.toUpperCase(),
        morning: {
          title: `Morning in ${destName}`,
          description: plan.morning,
          places: [{ name: `Local Sights in ${destName}`, type: 'attraction', area: destName, approx_cost: 0 }],
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        afternoon: {
          title: `Afternoon in ${destName}`,
          description: plan.afternoon,
          places: [{ name: `Local Market in ${destName}`, type: 'market', area: destName, approx_cost: 0 }],
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency: curr }
        },
        evening: {
          title: `Evening in ${destName}`,
          description: plan.evening,
          places: [{ name: `Dining in ${destName}`, type: 'restaurant', area: destName, approx_cost: 0 }],
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

  return normalizeItinerary(rawMock, startDate, totalBudget, curr, totalDays, { startCity, startCountry, userLat, userLng, budgetTier, resolvedDestCity, resolvedDestCountry, destLat, destLng });
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
  
  let fallbackResponse;
  try {
    const { prompt, destination, budget, currency, startDate, endDate, interests, preferredCurrency, simplified, userLat, userLng, startCity, startCountry, resolvedDestCity, resolvedDestCountry, destLat, destLng } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "FROM date and TO date are required to generate a trip." });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: "FROM date cannot be after TO date." });
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

    // Check user premium status
    let activeUser = null;
    let isPremium = false;
    if (req.userId) {
      activeUser = await db.users.findById(req.userId);
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
      const creditStatus = await db.users.consumeCredit(req.userId);
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

    // Compute budget tier
    const avgDaily = Math.round(parsedBudget / daysCount);
    const rate = INR_TO_CURRENCY[activeCurrency] || 1.0;
    const dailyBudgetInINR = avgDaily / rate;
    let budgetTier = 'mid'; // default
    if (dailyBudgetInINR < 3000) {
      budgetTier = 'low';
    } else if (dailyBudgetInINR > 8000) {
      budgetTier = 'high';
    }

    fallbackResponse = async () => {
      console.log('[AI Trip Generation] Fallback triggered. Generating server-side mock itinerary.');
      const safeInterests = Array.isArray(interests) ? interests : [];
      const itinerary = generateMockItinerary(destination, parsedBudget, activeCurrency, daysCount, safeInterests, startDate, startCity, startCountry, userLat, userLng, resolvedDestCity, resolvedDestCountry, destLat, destLng);
      
      if (activeUser && !isPremium) {
        await db.users.update(activeUser.id, { freeTripsGenerated: activeUser.freeTripsGenerated + 1 });
      }
      const freshUser = activeUser ? await db.users.findById(activeUser.id) : null;
      return res.json({ itinerary, user: authController.formatUserProfile(freshUser), engineVersion: "itinerary-v2-global-encyclopedia" });
    };

    // Initialize Gemini dynamically if not already done
    if (!genAI && config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim() !== '') {
      genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }

    if (!genAI) {
      console.warn('[AI Service Warning] GEMINI_API_KEY is missing on server.');
      return await fallbackResponse();
    }

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

    // --- Resolve destination against World Travel Encyclopedia or fallback known-cities database ---
    let destinationDataBlock = '';
    let isUnlistedCity = false;

    // 1. Try world travel encyclopedia first (curated data with specific venues)
    const resolvedForPrompt = resolveCityAndCountry(preprocessed.destination);
    const matchedEnc = findGlobalDestination({
      country: resolvedForPrompt.country,
      city: resolvedForPrompt.city,
      area: resolvedForPrompt.area,
      queryText: preprocessed.destination
    });

    if (matchedEnc) {
      const encCurrency = (matchedEnc.places && matchedEnc.places[0] && matchedEnc.places[0].currency) ? matchedEnc.places[0].currency : displayCurrency;
      destinationDataBlock = `\n\nWORLD TRAVEL ENCYCLOPEDIA CONTEXT (Destination: ${matchedEnc.name || preprocessed.destination}):
You are planning a trip to a specific neighborhood/area: "${matchedEnc.name || preprocessed.destination}" in ${matchedEnc.country || resolvedForPrompt.country || 'the destination country'}.
You MUST construct the itinerary using the following real, physically existing venues, attractions, cafes, markets, and nightlife spots from our verified global database. Do NOT invent other names.

Available real venues in this locality:
`;
      (matchedEnc.places || []).forEach(place => {
        destinationDataBlock += `- Name: "${place.name}" | Type: "${place.type}" | Typical Cost: ${place.approx_cost} ${place.currency || encCurrency} | Description: ${place.description}\n`;
      });

      destinationDataBlock += `\nCRITICAL AI INSTRUCTIONS FOR THIS MATCHED AREA:
1. You MUST use these real venues and names as the primary source. Do not invent any generic landmarks or places.
2. In each time slot (morning, afternoon, evening), mention at least one of the real place names listed above.
3. Keep timings and spatial routing highly localized to this neighborhood to avoid unnecessary travel across the city.
4. Use the local currency (${encCurrency}) for all cost estimates in places[].approx_cost.
`;
    } else {
      // 2. Try known-cities database as secondary source
      const { matchedCity: matchedDbCity, matchedRegion: matchedDbRegion } = matchDestinationInDb(preprocessed.destination);
      if (matchedDbRegion) {
        const dbInstance = getKnownCitiesDb();
        const dbCities = dbInstance.cities || {};
        const regionCities = matchedDbRegion.cities.map(name => {
          const key = name.toLowerCase().trim();
          return dbCities[key] || null;
        }).filter(Boolean);

        if (regionCities.length > 0) {
          destinationDataBlock = `\n\nDESTINATION DATABASE MATCH (Region: ${matchedDbRegion.name}, ${matchedDbRegion.country}):\nThis is a known region. You MUST structure the itinerary around these real cities within it: ${matchedDbRegion.cities.join(', ')}.\n`;
          for (const ct of regionCities.slice(0, 10)) {
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
      } else {
        // 3. Unlisted city — rely entirely on LLM's own world knowledge
        isUnlistedCity = true;
        destinationDataBlock = `\n\nLLM WORLD KNOWLEDGE MODE — Destination "${preprocessed.destination}" is not in our curated database.
You MUST use your own knowledge of real-world places to construct a rich, specific itinerary for this destination.
CRITICAL RULES:
- Only use real, verifiable venue names, landmarks, streets, restaurants, and neighborhoods that you are confident exist.
- If you are not certain a place exists, describe the category (e.g. "visit a local fish market") instead of inventing a specific name.
- Do NOT use generic fillers like "central public market", "main waterfront promenade", or "self-guided walking tour".
- Mention specific street names, famous landmarks, and authentic local dishes wherever possible.
`;
      }
    }

    const systemPrompt = `You are a professional global travel planner and local expert who creates highly detailed, realistic, destination-aware itineraries that feel like a premium personal travel coach for any destination in the world.

Your goals:
- Always return a complete, day‑by‑day itinerary.
- Never refuse or say it is not possible; if budget or time is tight, still propose the best possible plan.
- Optimize for enjoyment, realism, local culture, safety, and efficient routing.
- Respect the user's budget and preferences.

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
  "howToReach": {
    "recommendedMode": "string (e.g. metro, train, flight, cab)",
    "summary": "string (1-2 lines summarizing transport recommendation)",
    "nearestStartTerminal": "string",
    "nearestEndTerminal": "string",
    "details": "string (3-5 sentences explaining transport recommendation, naming stations/airports)",
    "estimatedCost": {
      "amount": number,
      "currency": "${displayCurrency}"
    }
  },
  "dayByDayPlan": [
    {
      "dayNumber": number,
      "title": "string",
      "theme": "string",
      "morning": {
        "title": "string (e.g. Explore Connaught Place cafés and Central Park)",
        "description": "Detailed plan (2-3 sentences) with SPECIFIC place names from the database.",
        "places": [
          { "name": "string", "type": "attraction|cafe|restaurant|market|park|nightlife|other", "area": "string", "approx_cost": number }
        ],
        "notes": "string (optional tips)"
      },
      "afternoon": {
        "title": "string",
        "description": "Detailed plan (2-3 sentences) with SPECIFIC place names from the database.",
        "places": [
          { "name": "string", "type": "attraction|cafe|restaurant|market|park|nightlife|other", "area": "string", "approx_cost": number }
        ],
        "notes": "string (optional tips)"
      },
      "evening": {
        "title": "string",
        "description": "Detailed plan (2-3 sentences) with SPECIFIC place names from the database.",
        "places": [
          { "name": "string", "type": "attraction|cafe|restaurant|market|park|nightlife|other", "area": "string", "approx_cost": number }
        ],
        "notes": "string (optional tips)"
      },
      "notes": [
        "string"
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
- PROFESSIONAL GLOBAL TRAVEL PLANNER ROLE: Act as an expert local travel planner and cultural guide for any country. Write in a helpful, professional tone. Avoid any emojis in the final stored data (icons will be handled in the UI).
- LOCALIZED & EFFICIENT ROUTING: Cluster activities by neighborhood to prevent unnecessary cross-city travel. Keep timings realistic, ensuring only 2-4 key activities/places are planned per day. Add short justifications in descriptions explaining why a place is suitable for a particular time of day (e.g. cooler in morning, lively vibe in evening).
- STRICT AVOIDANCE OF GENERIC PLACEHOLDERS: Do NOT invent generic filler names like "central public market", "main waterfront promenade", "self-guided walking tour through the historic streets of [area]" under any circumstances. Mention real venue names, landmarks, and streets. Every morning, afternoon, and evening slot must reference at least one concrete place.
- GEOLOCATION TRANSPORT RECOMMENDATION: The user is starting their trip from ${startCity || 'their home city'}, ${startCountry || 'their home country'} (Coordinates: ${userLat || 'unknown'}, ${userLng || 'unknown'}). You MUST recommend the best travel mode to reach the destination based on starting location, distance, and budget tier (${budgetTier}) using this 3-level rule set:
  1) Same-city / local trips (origin and destination in the same city/metro area, e.g. Delhi to Hauz Khas, Paris to Montmartre, Mumbai to Bandra, NY to Brooklyn): Suggest local city transport only (walking, cab/taxi/app-based taxi, auto/e-rickshaw/tuk-tuk, metro/subway/tram, city buses). You must NOT mention flights or intercity trains, and you must NOT invent fake airports or train terminals for local neighborhoods under any circumstances. Recommend only realistic local transit options. Distance guidelines: Very short (0-3 km) -> walking + optional auto/taxi. Short/medium (3-10 km) -> metro/subway/tram + short auto/taxi, or direct cab. Long cross-city (10+ km) -> metro + cab/auto, or full cab if budget is high. Budget: low budget -> prioritize metro/subway/bus/tram; mid budget -> metro + cab/auto mix; high budget -> cabs/app taxis.
  2) Inter-city, same country trips (startCountry == destCountry AND startCity != destCity): Recommend bus, train, or flight. Distance guidelines: Short (< 300-400 km) -> bus or train, avoid flights. Medium (400-800 km) -> low budget uses train (sleeper/AC) or overnight bus; high budget uses flight (optional). Long (> 800-1000 km) -> high/medium budget uses flight; low budget uses train (sleeper) or bus. Budget: low budget -> prefer train/bus (flights only as optional/more expensive); mid budget -> AC trains or budget flights; high budget -> flights for long distances.
  3) International trips (startCountry != destCountry): Flights are the primary mode. Suggest direct or 1-stop flights from nearest international airport of startCity to destination airport. After the flight, recommend local transfer modes at destination (airport train/metro/bus/taxi).
  * Populate the "howToReach" block with recommendedMode, summary (1-2 lines), details (3-5 sentences), nearestStartTerminal, nearestEndTerminal, and estimatedCost.
  * For matched encyclopedia entries (India, Japan, France, USA, etc.), recommend standard local travel modes appropriate to that city.
- HIGH DETAIL IMMERSIVE EXPERIENCE: Provide rich, detailed, and highly descriptive plans for each time slot (morning, afternoon, evening). Each description block MUST be at least 30 to 60 words. Do not use short summaries; describe the sights, history, atmosphere, specific dishes to order, and scenic spots to make the user feel like they have a premium local travel guide.
- GLOBAL PLACE DETECTION: Detect what the destination is and structure the itinerary accordingly.
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
- Plan every single day with specific activities for morning, afternoon, and evening.
- If the trip is long (over 14 days), you can repeat patterns, but still give each day its own description/plan.
- If the trip is very long (up to 92 days), you must still return an entry in dayByDayPlan for every single day, but make the descriptions and plans short and concise (e.g. 5-15 words per time slot) to prevent timeouts and token length issues.
${simplifiedInstruction}`;

    const userPrompt = `Create a detailed travel itinerary using the following inputs.

Traveler request:
- Destination city: "${preprocessed.destination}"
- Travel dates: "${preprocessed.startDate}" to "${preprocessed.endDate}"
- Number of days: ${daysCount}
- Budget Tier / Style: "${budgetTier}" (Approx budget: ${preprocessed.budget || parsedBudget} ${displayCurrency})
- Traveler name: "${userName}"
- Origin: "${origin || 'Traveler Location'}"
- Group type: "${req.body.groupType || 'solo/couple/friends/family'}"
- Vibes / interests: "${preprocessed.interests.join(', ') || 'sightseeing, local life, relaxing'}"
- Must‑do things: "${preprocessed.mustDo || 'none'}"
- Must‑avoid things: "${preprocessed.mustAvoid || 'none'}"

Verified data for this destination:
${destinationDataBlock}

User's raw text description / notes:
"""
${preprocessed.prompt || ''}
"""

Instructions:
- Based on all this, generate the best possible trip itinerary following the JSON format and rules specified in system instructions.
- Return ONLY the JSON object, starting with { and ending with }. Do not include any extra text.`;

    const primaryModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt
    });
    const fallbackModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt
    });

    const aiStartTime = Date.now();
    console.log(`[AI LLM Request Payload (System Instruction)]:\n${systemPrompt}`);
    console.log(`[AI LLM Request Payload (User Prompt)]:\n${userPrompt}`);
    
    // API Call with 45 seconds timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 45 seconds')), 45000)
    );

    let textResponse = "";
    try {
      const primaryCallPromise = primaryModel.generateContent(userPrompt);
      const result = await Promise.race([primaryCallPromise, timeoutPromise]);
      textResponse = result.response.text().trim();
      console.log(`[AI LLM Raw Response (gemini-2.5-flash)]:\n${textResponse}`);
    } catch (primaryError) {
      console.warn(`[AI Trip Generation] Primary model (gemini-2.5-flash) failed: ${primaryError.message}. Trying fallback model (gemini-2.5-flash-lite)...`);
      // Try fallback model (gemini-2.5-flash-lite has higher free quota)
      try {
        const fallbackCallPromise = fallbackModel.generateContent(userPrompt);
        const fallbackTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback AI request timed out after 45 seconds')), 45000)
        );
        const fallbackResult = await Promise.race([fallbackCallPromise, fallbackTimeout]);
        textResponse = fallbackResult.response.text().trim();
        console.log(`[AI LLM Raw Response (gemini-2.5-flash-lite fallback)]:\n${textResponse}`);
      } catch (fallbackError) {
        console.error(`[AI Trip Generation] Both models failed. Primary: ${primaryError.message}. Fallback: ${fallbackError.message}. Using mock itinerary.`);
        return await fallbackResponse();
      }
    }

    // --- AI Guardrails Scan for Banned Generic Patterns ---
    const BANNED_PATTERNS = [
      /central public market/i,
      /waterfront promenade/i,
      /self-guided walking tour/i,
      /historic streets of/i,
      /main public plazas/i,
      /scenic city overlook/i
    ];
    
    let isGeneric = false;
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(textResponse)) {
        isGeneric = true;
        break;
      }
    }
    
    if (isGeneric) {
      console.warn(`[AI Guardrails] Banned generic pattern detected in LLM response for: ${preprocessed.destination}. Retrying once with strict instructions...`);
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(`AI response contained banned generic patterns for destination: ${preprocessed.destination}`, 'warning');
      }
      
      const retryPrompt = `${userPrompt}\n\nWARNING: Your previous response contained generic placeholder text (like "central public market" or "self-guided walking tour"). You MUST rewrite the entire plan using ONLY the real, specific places and venues from the provided database/context. Do NOT use generic placeholder phrases.`;
      
      try {
        const retryCallPromise = primaryModel.generateContent(retryPrompt);
        const retryResult = await Promise.race([retryCallPromise, timeoutPromise]);
        textResponse = retryResult.response.text().trim();
        console.log(`[AI LLM Retry Response]:\n${textResponse}`);
        
        // Re-check retried response
        isGeneric = false;
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.test(textResponse)) {
            isGeneric = true;
            break;
          }
        }
      } catch (retryError) {
        console.error(`[AI Guardrails] Retry request failed: ${retryError.message}. Falling back to deterministic itinerary.`);
        return await fallbackResponse();
      }
    }
    
    if (isGeneric) {
      if (isUnlistedCity) {
        // For completely unlisted cities, if LLM keeps returning generic output after retry,
        // return an honest, short fallback instead of fake data
        console.warn(`[AI Guardrails] Retried response for unlisted city "${preprocessed.destination}" is still generic. Returning honest fallback.`);
        const honestFallback = generateMockItinerary(preprocessed.destination, parsedBudget, activeCurrency, daysCount, Array.isArray(interests) ? interests : [], startDate, startCity, startCountry, userLat, userLng, resolvedDestCity, resolvedDestCountry, destLat, destLng);
        const freshUser2 = activeUser ? await db.users.findById(activeUser.id) : null;
        return res.json({ itinerary: honestFallback, user: authController.formatUserProfile(freshUser2), engineVersion: "itinerary-v2-global-encyclopedia", notice: "This destination is not yet in our curated database. The itinerary was generated using general travel knowledge." });
      }
      console.warn(`[AI Guardrails] Retried response is still generic. Falling back to deterministic mock generator.`);
      return await fallbackResponse();
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
     
Here is the user query and context:
${userPrompt}

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
        return await fallbackResponse();
      }
    }

    const itinerary = normalizeItinerary(parsedJson, startDate, parsedBudget, activeCurrency, daysCount, {
      startCity,
      startCountry,
      userLat,
      userLng,
      budgetTier,
      resolvedDestCity,
      resolvedDestCountry,
      destLat,
      destLng
    });
    if (!itinerary) {
      return await fallbackResponse();
    }

    if (activeUser && !isPremium) {
      await db.users.update(activeUser.id, { freeTripsGenerated: activeUser.freeTripsGenerated + 1 });
    }

    const duration = Date.now() - startTime;
    console.log(`[AI Trip Generation Success] Total endpoint latency: ${duration}ms`);
    const freshUser = activeUser ? await db.users.findById(activeUser.id) : null;
    
    if (posthogClient) {
      posthogClient.capture({
        distinctId: activeUser ? activeUser.id : 'anonymous',
        event: 'trip_generated_success',
        properties: {
          destination: itinerary.summary?.destination || resolvedDestCity || 'Unknown',
          days: itinerary.summary?.totalDays || daysCount,
          budgetTier: itinerary.summary?.approxTotalCost || budgetTier,
          budget: parsedBudget,
          currency: activeCurrency,
          duration_ms: duration
        }
      });
    }

    return res.json({ itinerary, user: authController.formatUserProfile(freshUser), engineVersion: "itinerary-v2-global-encyclopedia" });

  } catch (error) {
    console.error(`[AI Trip Generation Fatal Error] Error:`, error);
    captureUnexpectedException(req, error);
    return await fallbackResponse();
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
    const activeUser = await db.users.findById(req.userId);
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

      const startCity = req.body.startCity || originalItinerary.startCity || '';
      const startCountry = req.body.startCountry || originalItinerary.startCountry || '';
      const userLat = req.body.userLat !== undefined ? req.body.userLat : (originalItinerary.userLat || null);
      const userLng = req.body.userLng !== undefined ? req.body.userLng : (originalItinerary.userLng || null);
      const resolvedDestCity = req.body.resolvedDestCity || originalItinerary.resolvedDestCity || '';
      const resolvedDestCountry = req.body.resolvedDestCountry || originalItinerary.resolvedDestCountry || '';
      const destLat = req.body.destLat !== undefined ? req.body.destLat : (originalItinerary.destLat || null);
      const destLng = req.body.destLng !== undefined ? req.body.destLng : (originalItinerary.destLng || null);
      const budgetTier = req.body.budgetTier || originalItinerary.budgetTier || '';

      refinedItinerary = normalizeItinerary(
        {
          ...rawRefined,
          howToReach: originalItinerary.howToReach,
          safetyAndLogistics: originalItinerary.safetyAndLogistics,
          localCurrencyNote: originalItinerary.localCurrencyNote,
          budgetBreakdown: originalItinerary.budgetBreakdown
        },
        extractedStartDate,
        extractedBudget,
        extractedCurrency,
        extractedDaysCount,
        {
          startCity,
          startCountry,
          userLat,
          userLng,
          resolvedDestCity,
          resolvedDestCountry,
          destLat,
          destLng,
          budgetTier
        }
      );
    } catch (parseError) {
      console.error('Failed to parse Gemini refined itinerary.', parseError);
      captureUnexpectedException(req, parseError);
      return res.status(500).json({ error: 'AI failed to adjust this trip cleanly. Please try again.' });
    }

    return res.json({ itinerary: refinedItinerary });
  } catch (error) {
    console.error('Refine trip error:', error);
    captureUnexpectedException(req, error);
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
    captureUnexpectedException(req, error);
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
    captureUnexpectedException(req, error);
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
    captureUnexpectedException(req, error);
    return res.status(500).json({ error: 'An error occurred deleting your trip.' });
  }
}

function getCurrencySymbol(currencyCode) {
  switch (currencyCode) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'INR': return '₹';
    default: return currencyCode || '₹';
  }
}

function generatePDFBuffer(trip, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      const itinerary = trip.itinerary;
      const { summary, days } = itinerary;
      const currencySymbol = getCurrencySymbol(summary.currency);

      // Design Header Banner (Primary Coral color)
      // A4 dimensions: 595.28 x 841.89 pt
      doc.rect(0, 0, 595.28, 110).fill('#F26430');

      // Title Block
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('TRAVNIFY PREMIUM TRAVEL MAP', 40, 25);
      
      doc.font('Helvetica')
         .fontSize(10)
         .text('AI-Generated Day-by-Day Complete Travel Itinerary', 40, 55);
      
      doc.text(`User Account: ${userEmail}`, 40, 75);

      // Reset text color to slate
      doc.fillColor('#1E293B');

      // Summary Section
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .text(`Destination: ${summary.destination}`, 40, 130);
      
      doc.font('Helvetica')
         .fontSize(11)
         .text(`Duration: ${summary.totalDays} Days`, 40, 155)
         .text(`Total Estimated Budget: ${currencySymbol} ${summary.approxTotalCost.toLocaleString()}`, 40, 172)
         .text(`Average Daily Budget: ${currencySymbol} ${summary.dailyAverageCost.toLocaleString()}`, 40, 189);

      let yOffset = 220;

      // Day loop
      days.forEach((day) => {
        // Check if we need a page break before day heading
        if (yOffset > 700) {
          doc.addPage();
          yOffset = 40;
        }

        // Draw Day Header
        const dateStr = day.date ? ` (${day.date})` : '';
        doc.fillColor('#F26430')
           .font('Helvetica-Bold')
           .fontSize(13)
           .text(`DAY ${day.dayNumber}: ${day.location || 'Explore City'}${dateStr}`, 40, yOffset);

        // Draw line separator below day header
        yOffset += 18;
        doc.strokeColor('#E2E8F0')
           .lineWidth(1)
           .moveTo(40, yOffset)
           .lineTo(555.28, yOffset)
           .stroke();

        yOffset += 12;

        // Blocks loop
        if (day.blocks && Array.isArray(day.blocks)) {
          day.blocks.forEach((block) => {
            // Check page break
            if (yOffset > 720) {
              doc.addPage();
              yOffset = 40;
            }

            // Block Title
            doc.fillColor('#1E293B')
               .font('Helvetica-Bold')
               .fontSize(10)
               .text(`[${block.timeWindow || 'Time Slot'}] ${block.title}`, 45, yOffset);

            yOffset = doc.y + 4;

            // Block Description
            doc.fillColor('#475569')
               .font('Helvetica')
               .fontSize(9.5)
               .text(block.description || '', 45, yOffset, { width: 510 });

            yOffset = doc.y + 6;

            // Block Cost
            const hasCost = block.approxCost && (
              typeof block.approxCost === 'object' 
                ? block.approxCost.value > 0 
                : parseInt(block.approxCost) > 0
            );
            if (hasCost) {
              const costStr = typeof block.approxCost === 'object' 
                ? `${getCurrencySymbol(block.approxCost.currency)}${block.approxCost.value}` 
                : block.approxCost;
              
              doc.fillColor('#F26430')
                 .font('Helvetica-Bold')
                 .fontSize(9)
                 .text(`Estimated Cost: ~ ${costStr}`, 45, yOffset);
              
              yOffset = doc.y + 8;
            }

            yOffset += 4;
          });
        }

        yOffset += 10;
      });

      // Disclaimer on last page
      if (yOffset > 740) {
        doc.addPage();
        yOffset = 40;
      }

      yOffset += 10;
      doc.fillColor('#94A3B8')
         .font('Helvetica-Oblique')
         .fontSize(8.5)
         .text('Disclaimer: All times and costs are estimates. Please verify schedules and pricing before traveling.', 40, yOffset);
      
      doc.text('TRAVNIFY takes no responsibility for availability, schedules, or pricing variances.', 40, doc.y + 4);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function watermarkPDF(pdfBuffer) {
  const pdfDoc = await LibPDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Draw diagonal text watermark
    page.drawText('Made by Travnify', {
      x: width / 2 - 140,
      y: height / 2 - 20,
      size: 40,
      font: font,
      color: rgb(0.85, 0.85, 0.85),
      rotate: degrees(45),
      opacity: 0.25,
    });

    // Draw footer watermark
    page.drawText('Made by Travnify - travnify.com', {
      x: width - 200,
      y: 20,
      size: 9,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.6,
    });
  }

  return await pdfDoc.save();
}

async function downloadTripPDF(req, res) {
  try {
    const activeUser = await db.users.findById(req.userId);
    if (!activeUser || !activeUser.isPremium) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        message: 'PDF download is available only for Premium users.'
      });
    }

    // For POST requests, just return authorized status (backward compatibility)
    if (req.method === 'POST') {
      return res.json({ success: true, message: 'PDF download authorized.' });
    }

    // For GET requests, perform PDF generation and watermarking
    const tripId = req.params.tripId || req.params.id;
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required.' });
    }

    const trip = db.trips.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Generate the PDF
    const pdfBuffer = await generatePDFBuffer(trip, activeUser.email);

    // Apply watermark
    const watermarkedBuffer = await watermarkPDF(pdfBuffer);

    // Write to a temporary file
    const os = require('os');
    const tempFilePath = path.join(os.tmpdir(), `itinerary_travnify_${Date.now()}.pdf`);
    await fs.promises.writeFile(tempFilePath, Buffer.from(watermarkedBuffer));

    // Send file to client
    res.download(tempFilePath, 'itinerary_travnify.pdf', (err) => {
      if (err) {
        console.error('File download callback error:', err);
      }
      // Clean up the temp file
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Temp file cleanup error:', unlinkErr);
        }
      });
    });

  } catch (error) {
    console.error('PDF download/generation error:', error);
    captureUnexpectedException(req, error);
    return res.status(500).json({ error: 'An error occurred during PDF generation.' });
  }
}

module.exports = {
  generateTrip,
  refineTrip,
  getSavedTrips,
  saveTrip,
  deleteTrip,
  downloadTripPDF,
  generateMockItinerary,
  // Public aliases for testing
  findGlobalDestinationPublic: (queryText) => findGlobalDestination({ queryText })
};
