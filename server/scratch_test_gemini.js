const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Gemini API Key:', apiKey ? (apiKey.substring(0, 8) + '...') : 'missing');
  if (!apiKey) {
    console.error('No key found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemPrompt = `You are an expert travel planner. Generate a 2-day itinerary for Japan in JSON only:
{
  "destination": "Japan",
  "days": [
    {
      "dayNumber": 1,
      "morning": "specific place description",
      "afternoon": "specific place description",
      "evening": "specific place description"
    }
  ]
}`;

  console.log('Sending request to Gemini...');
  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    console.log('Gemini Response:\n', text);
  } catch (err) {
    console.error('Gemini call failed:', err);
  }
}

run();
