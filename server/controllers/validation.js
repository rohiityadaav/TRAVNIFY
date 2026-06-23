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

  // 4. Validate days duration bounds (1 to 366 days)
  if (!startDate || !endDate) {
    return res.status(400).json({ error: "FROM date and TO date are required to generate a trip." });
  }

  let start = new Date(startDate);
  let end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "FROM date and TO date are required to generate a trip." });
  }

  let diffTime = end - start;
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays < 1) {
    return res.status(400).json({ error: "FROM date cannot be after TO date." });
  } else if (diffDays > 366) {
    // Clamp to 366 days max
    end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
    req.body.endDate = end.toISOString().split('T')[0];
  }

  // 5. Validate budget and currency values
  if (budget) {
    let parsedBudget = Number(budget);
    if (isNaN(parsedBudget)) {
      const digits = String(budget).replace(/[^0-9]/g, '');
      parsedBudget = Number(digits) || 15000;
    }
    if (parsedBudget <= 0) parsedBudget = 15000;
    if (parsedBudget > 10000000) parsedBudget = 10000000;
    req.body.budget = parsedBudget;
  }

  if (currency) {
    if (typeof currency !== 'string' || currency.trim().length !== 3) {
      req.body.currency = 'INR';
    } else {
      req.body.currency = currency.trim().toUpperCase();
    }
  }

  // 6. Validate and sanitize interests array
  if (interests) {
    if (!Array.isArray(interests)) {
      req.body.interests = ['general'];
    } else {
      const trimmedInterests = interests.slice(0, 50);
      const cleanInterests = [];
      for (let interest of trimmedInterests) {
        if (typeof interest === 'string' && interest.length <= 50) {
          cleanInterests.push(sanitizeString(interest));
        }
      }
      req.body.interests = cleanInterests.length > 0 ? cleanInterests : ['general'];
    }
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

  if (typeof originalItinerary !== 'object' || (!originalItinerary.summary && !originalItinerary.destination) || !Array.isArray(originalItinerary.days)) {
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
