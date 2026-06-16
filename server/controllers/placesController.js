const axios = require('axios');
const fetch = require('node-fetch');
const config = require('../config');
console.log('Google Places API Key loaded:', !!config.GOOGLE_PLACES_API_KEY);

// Realistic Mock Places Database
const MOCK_PLACES = {
  stays: [
    { name: 'Seaside Heritage Villa & Spa', type: 'Hotel', rating: 4.8, area: 'Calangute, North Goa', priceLevel: '$$$', distance: '0.4 km from beach' },
    { name: 'Zostel Backpacker Hub', type: 'Hostel', rating: 4.5, area: 'Anjuna Beach road', priceLevel: '$', distance: '0.9 km from beach' },
    { name: 'Ocean Sands 3-Star Resort', type: 'Resort', rating: 4.2, area: 'Baga Cliffs', priceLevel: '$$', distance: '1.2 km from beach' },
    { name: 'Green Meadows Organic Farmstay', type: 'Homestay', rating: 4.7, area: 'Arpora countryside', priceLevel: '$$', distance: '3.1 km from beach' },
    { name: 'The Leela Premium Suites', type: 'Hotel', rating: 4.9, area: 'South Goa coast', priceLevel: '$$$$', distance: '0.1 km from beach' }
  ],
  food: [
    { name: 'The Local Fisherman Shack', type: 'Restaurant', rating: 4.6, area: 'Baga beach shoreline', priceLevel: '$$', distance: '0.2 km away' },
    { name: 'Spice Route Traditional Thali', type: 'Dhaba', rating: 4.4, area: 'Near Calangute main circle', priceLevel: '$', distance: '0.8 km away' },
    { name: 'Bean & Brew Espresso Lounge', type: 'Cafe', rating: 4.7, area: 'Anjuna hillside', priceLevel: '$$', distance: '1.5 km away' },
    { name: 'Olive Garden Fine Seafood Bistro', type: 'Restaurant', rating: 4.8, area: 'Vagator Cliffs', priceLevel: '$$$', distance: '2.1 km away' },
    { name: 'Late Night Curry & Tandoor Shop', type: 'Food Joint', rating: 4.1, area: 'Mapusa road', priceLevel: '$', distance: '4.5 km away' }
  ],
  activities: [
    { name: 'Aguada Fort Guided Walkthrough', type: 'Attraction', rating: 4.5, area: 'Sinquerim Hill', priceLevel: '$', distance: '2.4 km away' },
    { name: 'Scuba Diving & Coral Snorkeling', type: 'Adventure', rating: 4.8, area: 'Grande Island jetty', priceLevel: '$$$', distance: '8.0 km away' },
    { name: 'Baga Water Sports Complex', type: 'Recreation', rating: 4.3, area: 'Baga central beachfront', priceLevel: '$$', distance: '0.5 km away' },
    { name: 'Heritage Spice Plantation Tour', type: 'Sightseeing', rating: 4.7, area: 'Ponda woodlands', priceLevel: '$$', distance: '18 km away' },
    { name: 'Saturday Night Flea & Bazaar', type: 'Shopping', rating: 4.6, area: 'Arpora fields', priceLevel: 'Free', distance: '3.0 km away' }
  ]
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`API request to ${url.split('?')[0]} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const fetchPromise = fetch(url, options);
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function getNearbyPlaces(req, res) {
  const handlerStart = Date.now();
  try {
    const { category, latitude, longitude, query, locationName } = req.query;

    const activeCategory = category || 'stays';

    // If Google API key exists, request Places API
    if (config.GOOGLE_PLACES_API_KEY) {
      let lat = latitude;
      let lng = longitude;

      // Geocoding city/destination if raw lat/lng not provided
      if ((!lat || !lng) && locationName) {
        const geocodeStart = Date.now();
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${config.GOOGLE_PLACES_API_KEY}`;
          console.log(`[Google Geocoding API Call] Address: ${locationName}`);
          const geocodeResponse = await fetchWithTimeout(geocodeUrl, {}, 5000);
          const geocodeData = await geocodeResponse.json();
          const geocodeDuration = Date.now() - geocodeStart;
          
          if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results[0]) {
            const geom = geocodeData.results[0].geometry.location;
            lat = geom.lat;
            lng = geom.lng;
            console.log(`[Google Geocoding API Success] Resolved "${locationName}" to lat=${lat}, lng=${lng} in ${geocodeDuration}ms`);
          } else {
            console.warn(`[Google Geocoding API Status] Address: ${locationName}, Status: ${geocodeData.status} (took ${geocodeDuration}ms)`);
          }
        } catch (geocodeErr) {
          const geocodeDuration = Date.now() - geocodeStart;
          console.error(`[Google Geocoding API Error] Failed to geocode locationName "${locationName}" after ${geocodeDuration}ms:`, geocodeErr.message);
        }
      }

      // Default fallback / test center coordinates if still unresolved
      const cityDefaults = {
        'delhi': { lat: 28.6139, lng: 77.2090 },
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'goa': { lat: 15.5414, lng: 73.7631 },
        'calangute': { lat: 15.5414, lng: 73.7631 },
        'bangalore': { lat: 12.9716, lng: 77.5946 }
      };

      if (!lat || !lng) {
        const normalizedLoc = (locationName || '').toLowerCase();
        let resolvedFromDefaults = false;
        for (const [cityName, coords] of Object.entries(cityDefaults)) {
          if (normalizedLoc.includes(cityName)) {
            lat = coords.lat;
            lng = coords.lng;
            resolvedFromDefaults = true;
            console.log(`[Places Fallback] Resolved location "${locationName}" to default city coordinates: lat=${lat}, lng=${lng}`);
            break;
          }
        }
        if (!resolvedFromDefaults) {
          // Defaulting to Goa center Calangute default
          lat = '15.5414';
          lng = '73.7631';
          console.log(`[Places Fallback] No location resolved, using global default Calangute: lat=${lat}, lng=${lng}`);
        }
      }

      // Format input search query (e.g. remove "near me", etc.)
      let cleanQuery = (query || '').replace(/\bnear\s+me\b/gi, '').replace(/\bin\s+\w+\b/gi, '').trim();
      
      const radius = '3000'; // Reasonable 3km radius
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${config.GOOGLE_PLACES_API_KEY}`;

      // Set parameter based on keyword search vs category pill
      if (cleanQuery && cleanQuery.trim() !== '') {
        url += `&keyword=${encodeURIComponent(cleanQuery)}`;
      } else {
        // Fallback to Google category type mapping
        let placesType = 'lodging';
        if (activeCategory === 'food' || activeCategory === 'restaurants' || activeCategory === 'cafes') placesType = 'restaurant|cafe';
        else if (activeCategory === 'activities' || activeCategory === 'attractions') placesType = 'tourist_attraction|museum|park';
        else if (activeCategory === 'shopping') placesType = 'shopping_mall|store';
        else if (activeCategory === 'clubs' || activeCategory === 'party') placesType = 'night_club|bar';
        else if (activeCategory === 'beaches') placesType = 'natural_feature';
        else if (activeCategory === 'scooter' || activeCategory === 'car') placesType = 'car_rental';
        
        url += `&type=${placesType}`;
      }

      // Log raw call details (mask API key for security)
      const maskedUrl = url.replace(config.GOOGLE_PLACES_API_KEY, 'GOOGLE_PLACES_API_KEY_HIDDEN');
      console.log(`[Google Places API Call] Fetching: ${maskedUrl}`);

      const placesStart = Date.now();
      let response, data;
      try {
        response = await fetchWithTimeout(url, {}, 5000);
        data = await response.json();
      } catch (fetchErr) {
        const placesDuration = Date.now() - placesStart;
        console.error(`[Google Places API Error] Failed to fetch after ${placesDuration}ms:`, fetchErr.message);
        return res.status(502).json({ error: `Google Places API request failed: ${fetchErr.message}` });
      }
      
      const placesDuration = Date.now() - placesStart;
      const apiStatus = data.status;
      const apiErrorMsg = data.error_message || '';

      console.log(`[Google Places API Response] Status: ${apiStatus} (took ${placesDuration}ms)`);
      if (apiErrorMsg) {
        console.error(`[Google Places API Response Error Details]: ${apiErrorMsg}`);
      }

      // Handle errors and surface them gracefully to the UI
      if (apiStatus && apiStatus !== 'OK' && apiStatus !== 'ZERO_RESULTS') {
        return res.status(400).json({
          error: `Google Places API Error: ${apiStatus}. ${apiErrorMsg || 'Check API restrictions and configuration.'}`
        });
      }

      if (apiStatus === 'ZERO_RESULTS') {
        return res.json([]);
      }

      const googleResults = data.results || [];
      const formatted = googleResults.map(p => {
        let priceString = '$$';
        if (p.price_level === 0) priceString = 'Free';
        else if (p.price_level === 1) priceString = '$';
        else if (p.price_level === 2) priceString = '$$';
        else if (p.price_level === 3) priceString = '$$$';
        else if (p.price_level === 4) priceString = '$$$$';

        return {
          name: p.name,
          type: p.types && p.types[0] ? p.types[0].replace(/_/g, ' ').toUpperCase() : 'Place',
          rating: p.rating || 4.2,
          area: p.vicinity || 'Local Area',
          priceLevel: priceString,
          distance: `${(Math.random() * 2 + 0.2).toFixed(1)} km away`,
          place_id: p.place_id,
          lat: p.geometry && p.geometry.location ? p.geometry.location.lat : null,
          lng: p.geometry && p.geometry.location ? p.geometry.location.lng : null
        };
      });

      const handlerDuration = Date.now() - handlerStart;
      console.log(`[getNearbyPlaces Success] Handled via Google Places in ${handlerDuration}ms`);
      return res.json(formatted);
    }

    // Default to mock data if key not present
    let data = MOCK_PLACES[activeCategory] || MOCK_PLACES.stays;
    
    // Add custom adjustments if user searched something
    if (query) {
      data = data.map(item => ({
        ...item,
        area: item.area.replace('Calangute', query).replace('Goa', query)
      }));
    }

    const handlerDuration = Date.now() - handlerStart;
    console.log(`[getNearbyPlaces Success] Handled via Mock Data in ${handlerDuration}ms`);
    return res.json(data);
  } catch (error) {
    const handlerDuration = Date.now() - handlerStart;
    console.error(`Get places error after ${handlerDuration}ms:`, error);
    return res.status(500).json({ error: 'An error occurred fetching nearby locations.' });
  }
}

module.exports = {
  getNearbyPlaces
};

