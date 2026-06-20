const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

// List of all countries to ensure 185+ countries are supported
const allCountries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil",
  "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea",
  "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY environment variable is not defined in .env");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const dbPath = path.join(__dirname, 'known_cities.json');

async function main() {
  console.log("Starting global database generation script...");
  
  // Load existing database
  let db = { cities: {}, regions: {} };
  if (fs.existsSync(dbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(`Loaded existing database: ${Object.keys(db.cities).length} cities, ${Object.keys(db.regions).length} regions.`);
    } catch (e) {
      console.error("Failed to parse existing database, starting fresh.", e);
    }
  }

  // Find missing countries
  const missingCountries = allCountries.filter(c => {
    const key = c.toLowerCase().trim();
    return !db.regions[key];
  });

  console.log(`Total countries in world: ${allCountries.length}`);
  console.log(`Missing countries to generate: ${missingCountries.length}`);

  if (missingCountries.length === 0) {
    console.log("All countries are already covered! No generation needed.");
    return;
  }

  // Batch query missing countries (15 per batch to prevent token limits and rate limits)
  const batchSize = 15;
  for (let i = 0; i < missingCountries.length; i += batchSize) {
    const batch = missingCountries.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(missingCountries.length / batchSize)}: ${batch.join(', ')}`);
    
    let success = false;
    let retries = 3;
    while (!success && retries > 0) {
      try {
        const responseData = await queryGeminiForBatch(batch);
        
        // Merge generated data into our database
        if (responseData && responseData.regions && responseData.cities) {
          // Merge regions
          for (const [key, reg] of Object.entries(responseData.regions)) {
            db.regions[key.toLowerCase().trim()] = reg;
          }
          // Merge cities
          for (const [key, city] of Object.entries(responseData.cities)) {
            db.cities[key.toLowerCase().trim()] = city;
          }
          
          // Save database at each batch to prevent data loss
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
          console.log(`Successfully saved database! Total: ${Object.keys(db.cities).length} cities, ${Object.keys(db.regions).length} regions.`);
          success = true;
        } else {
          console.warn(`Empty or invalid response for batch. Retries left: ${retries - 1}`);
          retries--;
        }
      } catch (err) {
        console.error(`Error processing batch: ${err.message}. Retries left: ${retries - 1}`);
        retries--;
        if (retries > 0) {
          console.log("Waiting 10 seconds before retry...");
          await sleep(10000);
        }
      }
    }

    // Add a small delay between batches to respect rate limits (4 seconds)
    if (i + batchSize < missingCountries.length) {
      console.log("Waiting 4 seconds before next batch...");
      await sleep(4000);
    }
  }

  console.log("\nFinished global database expansion!");
  console.log(`Final Database Size: ${Object.keys(db.cities).length} cities, ${Object.keys(db.regions).length} regions.`);
}

async function queryGeminiForBatch(countries) {
  const prompt = `You are a travel database compiler. Generate travel details for the following list of countries:
[${countries.join(', ')}]

For each country, identify 1 major tourism city (typically the capital city, e.g. Nairobi for Kenya, Buenos Aires for Argentina).
If it is a small island or city-state (like Monaco or Singapore), the city name can be the country name itself.

Return ONLY a JSON object containing two main keys: "regions" and "cities".
No markdown code block backticks (like \`\`\`json), no trailing commas, no extra text. Respond with ONLY the raw JSON string starting with { and ending with }.

Use the following exact JSON structure:
{
  "regions": {
    "country_name_lowercase": {
      "name": "Country Name",
      "country": "Country Name",
      "cities": ["City Name"]
    }
  },
  "cities": {
    "city_name_lowercase": {
      "name": "City Name",
      "country": "Country Name",
      "state": "State/Region Name or null",
      "landmarks": ["real famous landmark 1", "real famous landmark 2", "real famous landmark 3", "real famous landmark 4"],
      "neighborhoods": ["real neighborhood 1", "real neighborhood 2"],
      "food": ["real local dish 1", "real local dish 2", "famous food street or restaurant/cafe name"],
      "activities": ["real activity 1", "real activity 2", "real activity 3"],
      "shopping": ["real market 1", "real shopping street or mall 2"],
      "culture": ["real museum 1", "real church/temple/heritage site 2"]
    }
  }
}

CRITICAL: Use ONLY real-world, verifiable names of actual places, foods, and attractions. Never fabricate names.`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  
  // Clean markdown wrappers if any
  if (text.startsWith('```')) {
    text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("JSON parsing failed for text:", text);
    throw err;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error("Fatal error running main script:", err);
});
