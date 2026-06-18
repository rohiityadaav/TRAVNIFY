require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `You are TRAVNIFY, a premium AI travel assistant.
Your job is to parse the user's travel request and output a highly detailed, budget-aware day-by-day trip plan.

USER PARAMETERS:
- Destination: "Paris"
- Total Budget: 2000 USD
- Duration: 3 Days
- Interests: culture, shopping

YOUR OUTPUT INSTRUCTIONS:
Generate a valid JSON object matching the exact schema below.
- Do NOT output any markdown tags (like \`\`\`json). Return ONLY the raw JSON string starting with { and ending with }.
- Do NOT invent specific hotel or restaurant brand names. Use generic types.
- Price segments should be in "USD".
- Budget percentages in budgetBreakdown must add up to 100%.
- CRITICAL FOR SPEED: Be concise. Keep descriptions under 15 words. Limit each day to exactly 3 blocks (Morning, Afternoon, Evening).

JSON Schema structure:
{
  "summary": {
    "destination": "Paris",
    "totalDays": 3,
    "approxTotalCost": 2000,
    "currency": "USD",
    "dailyAverageCost": 667
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
      "location": "Paris Center",
      "blocks": [
        {
          "type": "travel" | "stay" | "food" | "activity" | "free_time",
          "title": "Title of event",
          "description": "Brief description, maximum 15 words.",
          "timeWindow": "09:00 - 11:00",
          "approxCost": "Value USD"
        }
      ]
    }
  ]
}`;

async function testOptimized() {
  console.log("Testing optimized prompt with gemini-2.5-flash...");
  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    const duration = Date.now() - startTime;
    console.log(`✅ Completed in ${(duration / 1000).toFixed(2)}s. Response length: ${text.length} chars.`);
    console.log("Response Preview:\n", text.substring(0, 300) + "\n...");
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed after ${(duration / 1000).toFixed(2)}s:`, err.message);
  }
}

testOptimized();
