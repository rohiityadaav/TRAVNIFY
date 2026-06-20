const { generateMockItinerary } = require('./controllers/tripController');
const itinerary = generateMockItinerary("Edinburgh", 15000, "INR", 3, [], "2026-06-21");
console.log(JSON.stringify(itinerary, null, 2));
