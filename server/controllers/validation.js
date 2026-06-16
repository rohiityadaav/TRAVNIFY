// Lightweight input validation and sanitization middleware for TRAVNIFY AI endpoints

/**
 * Strips HTML tags completely to prevent cross-site scripting (XSS) or model injection.
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validator for /api/generateTrip
 */
exports.validateGenerateTrip = (req, res, next) => {
  let { prompt, destination, budget, currency, startDate, endDate, interests } = req.body;

  // 1. Check if both inputs are missing
  if (!prompt && !destination) {
    return res.status(400).json({ code: 'INVALID_INPUT', error: 'Please check your fields and try again. A destination or prompt is required.' });
  }

  // 2. Validate and sanitize prompt
  if (prompt) {
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Please check your fields and try again.' });
    }
    if (prompt.length > 1000) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Prompt exceeds the maximum limit of 1000 characters.' });
    }
    req.body.prompt = sanitizeString(prompt);
  }

  // 3. Validate and sanitize destination
  if (destination) {
    if (typeof destination !== 'string' || destination.trim().length === 0) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Please check your fields and try again.' });
    }
    if (destination.length > 200) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Destination exceeds the maximum limit of 200 characters.' });
    }
    req.body.destination = sanitizeString(destination);
  }

  // 4. Validate days duration bounds (1 to 30 days)
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Please provide valid dates.' });
    }
    
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays < 1 || diffDays > 30) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Duration must be between 1 and 30 days.' });
    }
  }

  // 5. Validate budget and currency values
  if (budget) {
    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0 || parsedBudget > 10000000) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Budget must be a positive number up to 10,000,000.' });
    }
    req.body.budget = parsedBudget;
  }

  if (currency) {
    if (currency !== 'INR' && currency !== 'USD') {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Currency must be either INR or USD.' });
    }
  }

  // 6. Validate and sanitize interests array
  if (interests) {
    if (!Array.isArray(interests)) {
      return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Interests must be an array.' });
    }
    // Silently trim to first 3 if more are provided — recommendation, not a hard limit
    const trimmedInterests = interests.slice(0, 3);
    const cleanInterests = [];
    for (let interest of trimmedInterests) {
      if (typeof interest !== 'string' || interest.length > 50) {
        return res.status(400).json({ code: 'INVALID_INPUT', error: 'Invalid input. Individual interest items must be under 50 characters.' });
      }
      cleanInterests.push(sanitizeString(interest));
    }
    req.body.interests = cleanInterests;
  }

  next();
};

/**
 * Validator for /api/refineTrip
 */
exports.validateRefineTrip = (req, res, next) => {
  const { originalItinerary, action } = req.body;

  if (!originalItinerary || !action) {
    return res.status(400).json({ error: 'Original itinerary and refinement action are required.' });
  }

  if (typeof action !== 'string' || !['cheaper', 'more_fun', 'more_relaxed'].includes(action)) {
    return res.status(400).json({ error: 'Invalid refinement action.' });
  }

  if (typeof originalItinerary !== 'object' || !originalItinerary.summary || !Array.isArray(originalItinerary.days)) {
    return res.status(400).json({ error: 'Invalid itinerary format.' });
  }

  next();
};

/**
 * Validator for discovery endpoints: Hidden Gems and Activity Explorer
 */
exports.validateDiscoverQuery = (req, res, next) => {
  let query = req.body.query || req.query.query;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty search query.' });
  }

  if (query.length > 300) {
    return res.status(400).json({ error: 'Invalid input. Query exceeds the maximum limit of 300 characters.' });
  }

  req.body.query = sanitizeString(query);
  next();
};
