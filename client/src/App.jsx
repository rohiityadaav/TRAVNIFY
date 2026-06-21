import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { ShieldCheck, Info, FileText, Heart, Shield, RefreshCw, X } from 'lucide-react';

import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import ItineraryViewer from './components/ItineraryViewer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import PlanTrip from './pages/PlanTrip';
import Explore from './pages/Explore';
import NearMe from './pages/NearMe';
import MyTrips from './pages/MyTrips';
import Premium from './pages/Premium';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Footer from './components/Footer';
import { safeFetch } from './lib/api';

import { useAuth } from './context/AuthContext';
import { initAnalytics, trackPageView, trackEvent } from './lib/analytics';
import { getCurrencySymbol, INR_TO_CURRENCY } from './lib/currency';
import knownCitiesDb from '../../server/data/known_cities.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'plan' | 'explore' | 'near-me' | 'my-trips'
  
  const {
    user,
    setUser,
    isAuthenticated,
    loginSuccess,
    logout,
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    openAuthModalWithMessage,
    executeProtectedAction
  } = useAuth();
  
  // Modals
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  
  // Itinerary planning
  const [activeItinerary, setActiveItinerary] = useState(null);
  const [activeTripDetails, setActiveTripDetails] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [tripError, setTripError] = useState(null);

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Initialize GA4 Analytics once on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Geolocation Request on mount
  useEffect(() => {
    const askGeo = async () => {
      if (!localStorage.getItem('geolocationAsked') && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            localStorage.setItem('geolocationAsked', 'true');
            localStorage.setItem('userLat', latitude);
            localStorage.setItem('userLng', longitude);
            console.log("Geolocation obtained successfully:", latitude, longitude);

            // Reverse geocode to get city name
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`);
              if (res.ok) {
                const data = await res.json();
                const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state || '';
                const country = data.address.country || '';
                if (city) localStorage.setItem('userCity', city);
                if (country) localStorage.setItem('userCountry', country);
                console.log("Resolved user starting city:", city, country);
              }
            } catch (err) {
              console.warn("Failed to reverse geocode user location on mount:", err);
            }
          },
          (error) => {
            console.warn("Geolocation permission denied or failed:", error);
            localStorage.setItem('geolocationAsked', 'true');
          }
        );
      }
    };
    askGeo();
  }, []);

  // Silent session check on app load
  useEffect(() => {
    const checkRefreshSession = async () => {
      try {
        const res = await safeFetch('/api/auth/refresh', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            loginSuccess(data.user, data.token);
            console.log("Session restored via refresh token successfully.");
          }
        }
      } catch (err) {
        // Silently ignore if no cookie/expired
        console.log("Session check on app load: no active refresh session.");
      }
    };
    checkRefreshSession();
  }, []);

  // Silent refresh loop every 12 minutes
  useEffect(() => {
    let refreshInterval;
    if (isAuthenticated) {
      refreshInterval = setInterval(async () => {
        try {
          const res = await safeFetch('/api/auth/refresh', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              loginSuccess(data.user, data.token);
              console.log("Silent access token refresh complete.");
            }
          }
        } catch (err) {
          console.warn("Silent access token refresh failed:", err);
        }
      }, 12 * 60 * 1000); // 12 minutes
    }
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  // Track Page Views when active tab or active itinerary details change
  useEffect(() => {
    if (activeItinerary) {
      trackPageView('/itinerary');
    } else {
      trackPageView(`/${activeTab}`);
    }
  }, [activeTab, activeItinerary]);

  // Sync saved trips when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      fetchSavedTrips(token);
    } else {
      setSavedTrips([]);
    }
  }, [isAuthenticated]);

  // Premium Modal GA4 Custom Event CTA Wrapper
  const openPricingModal = () => {
    trackEvent('premium_cta_click');
    setPricingModalOpen(true);
  };

  const syncUserCredits = async () => {
    const token = localStorage.getItem('token');
    if (token && setUser) {
      try {
        const res = await safeFetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (err) {
        console.warn('Failed to sync user credits from server:', err);
      }
    }
  };

  const fetchSavedTrips = async (token) => {
    try {
      const response = await safeFetch('/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const tripsData = await response.json();
      setSavedTrips(tripsData);
    } catch (err) {
      console.error('Error fetching saved trips:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSavedTrips([]);
    setActiveTab('home');
  };

  // Helper to calculate length in days
  const calculateLengthInDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const levenshteinDistance = (s1, s2) => {
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
  };

  const isFuzzyMatch = (s1, s2) => {
    const len = Math.max(s1.length, s2.length);
    if (len < 4) return s1 === s2;
    const dist = levenshteinDistance(s1, s2);
    const threshold = len > 8 ? 2 : 1;
    return dist <= threshold;
  };

  const matchDestinationInDb = (destName) => {
    const cities = knownCitiesDb.cities || {};
    const regions = knownCitiesDb.regions || {};

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
      // Fuzzy match for minor typos
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

    // If no city matches directly, check if the input matches any landmark of a city!
    if (!matchedCity) {
      const landmarkCandidates = [];
      for (const [key, ct] of Object.entries(cities)) {
        const landmarks = ct.landmarks || [];
        const matchedLandmark = landmarks.find(lm => {
          const cleanLm = lm.toLowerCase().trim();
          const escaped = primaryToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const boundaryRegex = new RegExp(`(^|[\\s,\\/\\(\\)-])${escaped}([\\s,\\/\\(\\)-]|$)`, 'i');
          return boundaryRegex.test(cleanLm) || isFuzzyMatch(cleanLm, primaryToken);
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
  };

  // Helper to generate a basic fallback template itinerary on the client
  const generateClientItineraryTemplate = (details) => {
    const destName = details.destination || 'Selected Destination';
    const daysCount = calculateLengthInDays(details.startDate, details.endDate);
    const budget = Number(details.budget) || 15000;
    const currency = details.currency || 'INR';
    const avgDaily = Math.round(budget / daysCount);
    const baseDate = details.startDate ? new Date(details.startDate) : new Date();

    // Determine budget tier in INR
    const rate = INR_TO_CURRENCY[currency] || 1.0;
    const dailyBudgetInINR = avgDaily / rate;
    let budgetTier = 'mid'; // default
    if (dailyBudgetInINR < 3000) {
      budgetTier = 'low';
    } else if (dailyBudgetInINR > 8000) {
      budgetTier = 'high';
    }

    // Ensure interests defaults to all-round mix if empty
    let interests = details.interests && details.interests.length > 0 ? details.interests : [];
    if (interests.length === 0) {
      interests = ['landmarks', 'culture', 'nature', 'shopping', 'food', 'nightlife'];
    }

    const { matchedCity, matchedRegion } = matchDestinationInDb(destName);
    const cities = knownCitiesDb.cities || {};

    // Resolve cities
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
    const safeInterests = interests.length > 0 ? interests : ['general'];

    for (let i = 0; i < daysCount; i++) {
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
            estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
          },
          afternoon: {
            description: afternoonDesc,
            estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
          },
          evening: {
            description: eveningDesc,
            estimatedCost: { amount: Math.round(avgDaily * 0.4), currency }
          },
          notes: [
            notesPool[i % notesPool.length],
            notesPool[(i + 2) % notesPool.length]
          ]
        });
      } else {
        // Unknown destination: generic but realistic descriptions
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
            estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
          },
          afternoon: {
            description: plan.afternoon,
            estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
          },
          evening: {
            description: plan.evening,
            estimatedCost: { amount: Math.round(avgDaily * 0.4), currency }
          },
          notes: [
            notesPool[i % notesPool.length],
            notesPool[(i + 3) % notesPool.length]
          ]
        });
      }
    }

    // Deduce howToReach for client fallback
    const startCity = localStorage.getItem('userCity') || (currency === 'INR' ? 'Delhi' : 'London');
    const getClientTerminals = (cityName) => {
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
    };

    const startTerminals = getClientTerminals(startCity);
    const destTerminals = getClientTerminals(destName);
    
    let clientHowToReach = null;
    if (startCity.toLowerCase().trim() === destName.toLowerCase().trim()) {
      clientHowToReach = {
        recommendedMode: "local transit",
        nearestStartTerminal: "Local transit stop",
        nearestEndTerminal: "Local transit destination",
        details: `Since you are already starting from ${destName}, utilize the local metro, public bus system, or local taxis for convenient and fast travel inside the city.`,
        estimatedCost: { amount: 150, currency }
      };
    } else {
      const isDifferentCountry = (currency === 'INR' && !['delhi', 'mumbai', 'bengaluru', 'kolkata', 'shimla', 'manali', 'amritsar', 'jaipur', 'udaipur', 'jaisalmer', 'jodhpur', 'pushkar', 'ranthambore', 'agra', 'varanasi', 'lucknow', 'mathura', 'vrindavan', 'ayodhya', 'rishikesh', 'haridwar', 'nainital', 'mussoorie', 'auli', 'indore', 'khajuraho', 'bhopal', 'ahmedabad', 'somnath', 'dwarka', 'pune', 'lonavala', 'goa', 'hampi', 'mysore', 'coorg', 'gokarna', 'kochi', 'alleppey', 'munnar', 'wayanad', 'varkala', 'chennai', 'madurai', 'mahabalipuram', 'ooty', 'rameswaram', 'hyderabad', 'warangal', 'tirupati', 'vizag', 'vijayawada', 'patna', 'ranchi', 'raipur', 'guwahati', 'shillong', 'tawang', 'kohima', 'imphal', 'aizawl', 'agartala', 'gangtok', 'port blair', 'havelock', 'diu', 'daman', 'silvassa', 'kavaratti', 'pondicherry', 'auroville'].includes(destName.toLowerCase().trim()));
      
      if (isDifferentCountry) {
        const cost = budgetTier === 'low' ? 7000 : (budgetTier === 'high' ? 25000 : 12000);
        clientHowToReach = {
          recommendedMode: "flight",
          nearestStartTerminal: startTerminals.airport,
          nearestEndTerminal: destTerminals.airport,
          details: `Board an international flight from ${startTerminals.airport} to ${destTerminals.airport}. We recommend checking airline rates early and comparing budget carriers for flight transfers.`,
          estimatedCost: { amount: cost, currency }
        };
      } else {
        if (budgetTier === 'low') {
          clientHowToReach = {
            recommendedMode: "bus",
            nearestStartTerminal: startTerminals.bus,
            nearestEndTerminal: destTerminals.bus,
            details: `Board an intercity bus or take a sleeper-class train from ${startTerminals.bus} to ${destTerminals.bus} for a cost-effective overland journey.`,
            estimatedCost: { amount: 650, currency }
          };
        } else if (budgetTier === 'high') {
          clientHowToReach = {
            recommendedMode: "flight",
            nearestStartTerminal: startTerminals.airport,
            nearestEndTerminal: destTerminals.airport,
            details: `Take a direct flight from ${startTerminals.airport} to ${destTerminals.airport} for the fastest and most premium transit. Upon arrival, use private terminal transfers.`,
            estimatedCost: { amount: 6000, currency }
          };
        } else {
          clientHowToReach = {
            recommendedMode: "train",
            nearestStartTerminal: startTerminals.station,
            nearestEndTerminal: destTerminals.station,
            details: `Book an AC 3-Tier or 2-Tier train ticket from ${startTerminals.station} to ${destTerminals.station} for a comfortable and scenic mid-budget journey.`,
            estimatedCost: { amount: 1800, currency }
          };
        }
      }
    }

    return {
      tripSummary: {
        destination: destName,
        totalDays: daysCount,
        travelStyle: 'mixed',
        estimatedTotalCost: { amount: budget, currency },
        bestTimeAdvice: `Generally, visiting ${destName} during the dry season offers the best climate.`
      },
      howToReach: clientHowToReach,
      dayByDayPlan,
      safetyAndLogistics: {
        localTransportTips: `Taxis, public transport, and walking are the best ways to get around ${destName}.`,
        areaSafetyNotes: `Keep your belongings secure in crowded spots and markets around ${destName}.`,
        moneySavingTips: `Look for local food joints and free entry parks in ${destName} to save costs.`
      },
      budgetBreakdown: {
        transportPercent: 25,
        stayPercent: 35,
        foodPercent: 20,
        activitiesPercent: 20
      },
      destination: destName,
      days: dayByDayPlan.map(day => ({
        dayNumber: day.dayNumber,
        date: day.date,
        title: day.title,
        location: destName,
        blocks: [
          {
            timeWindow: 'Morning (09:00 - 12:00)',
            title: '☀️ Morning',
            description: day.morning.description,
            approxCost: { value: day.morning.estimatedCost.amount, currency: day.morning.estimatedCost.currency },
            type: 'activity'
          },
          {
            timeWindow: 'Afternoon (13:00 - 17:00)',
            title: '🌤️ Afternoon',
            description: day.afternoon.description,
            approxCost: { value: day.afternoon.estimatedCost.amount, currency: day.afternoon.estimatedCost.currency },
            type: 'food'
          },
          {
            timeWindow: 'Evening (18:00 - 22:00)',
            title: '🌙 Evening',
            description: day.evening.description,
            approxCost: { value: day.evening.estimatedCost.amount, currency: day.evening.estimatedCost.currency },
            type: 'activity'
          }
        ]
      })),
      estimatedTotalCost: {
        value: budget,
        currency: currency
      },
      summary: {
        destination: destName,
        totalDays: daysCount,
        approxTotalCost: budget,
        currency: currency,
        dailyAverageCost: avgDaily
      }
    };
  };

  // 2. AI Travel Plan Generation Trigger
  const handleGenerateTrip = async (details) => {
    setIsLoading(true);
    setTripError(null);
    setActiveTripDetails(details);

    // Compute trip length in days
    const lengthInDays = calculateLengthInDays(details.startDate, details.endDate);
    
    // Check if user is Premium for long trips (> 92 days)
    if (lengthInDays > 92 && (!user || !user.isPremium)) {
      setIsLoading(false);
      openPricingModal();
      return;
    }

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const makeRequest = async (isSimplified = false) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30s timeout per call

      try {
        const userLat = localStorage.getItem('userLat');
        const userLng = localStorage.getItem('userLng');
        const startCity = localStorage.getItem('userCity');
        const startCountry = localStorage.getItem('userCountry');

        const bodyPayload = {
          ...details,
          preferredCurrency: user?.preferredCurrency || details.currency || 'INR',
          simplified: isSimplified
        };
        if (userLat && userLng) {
          bodyPayload.userLat = Number(userLat);
          bodyPayload.userLng = Number(userLng);
        }
        if (startCity) bodyPayload.startCity = startCity;
        if (startCountry) bodyPayload.startCountry = startCountry;

        const response = await safeFetch('/api/generateTrip', {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return await response.json();
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      // First attempt
      const data = await makeRequest(false);
      setIsLoading(false);
      const itineraryWithSource = {
        ...data.itinerary,
        generationSource: 'backend'
      };
      setActiveItinerary(itineraryWithSource);
      
      // Track plan generation success
      trackEvent('plan_created', {
        days: data.itinerary?.summary?.totalDays || details.days || 3,
        destinationCount: details.destination ? details.destination.split(',').length : 1
      });

      // Sync limits left on profile if logged in
      if (data.user && setUser) {
        setUser(data.user);
      } else {
        syncUserCredits();
      }
    } catch (err) {
      console.warn('[AI Trip Generation] First attempt failed. Error:', err.message);
      
      // If it's a premium gate error from the server, handle immediately without retrying or fallback
      if (err.code === 'NEED_PREMIUM_FOR_LONG_TRIP' || err.message?.includes('NEED_PREMIUM_FOR_LONG_TRIP')) {
        setIsLoading(false);
        openPricingModal();
        return;
      }

      // If it's normal credit limit error, handle immediately
      if (err.code === 'LIMIT_EXCEEDED' || err.code === 'FREE_LIMIT_REACHED') {
        setIsLoading(false);
        openPricingModal();
        syncUserCredits();
        return;
      }

      // Retry once with simplified flag
      console.log('[AI Trip Generation] Retrying once with simplified flag...');
      try {
        const data = await makeRequest(true);
        setIsLoading(false);
        const itineraryWithSource = {
          ...data.itinerary,
          generationSource: 'backend_retry'
        };
        setActiveItinerary(itineraryWithSource);

        // Track plan generation success
        trackEvent('plan_created', {
          days: data.itinerary?.summary?.totalDays || details.days || 3,
          destinationCount: details.destination ? details.destination.split(',').length : 1,
          simplified: true
        });

        if (data.user && setUser) {
          setUser(data.user);
        } else {
          syncUserCredits();
        }
      } catch (retryErr) {
        console.error('[AI Trip Generation] Retry attempt also failed. Error:', retryErr.message);
        
        // Final fallback: show a basic template itinerary generated on the client
        setIsLoading(false);
        const fallbackItinerary = generateClientItineraryTemplate(details);
        fallbackItinerary.generationSource = 'client_fallback';
        setActiveItinerary(fallbackItinerary);
        
        // Track fallback generation
        trackEvent('plan_created', {
          days: fallbackItinerary?.tripSummary?.totalDays || 3,
          destinationCount: details.destination ? details.destination.split(',').length : 1,
          fallback: true
        });

        syncUserCredits();
      }
    }
  };

  // 3. AI Refinement API call
  const handleRefineTrip = async (action) => {
    if (!user || !user.isPremium) {
      openPricingModal();
      return;
    }

    setIsRefining(true);
    try {
      const token = localStorage.getItem('token');
      const response = await safeFetch('/api/refineTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalItinerary: activeItinerary,
          action
        })
      });

      const data = await response.json();
      setActiveItinerary(data.itinerary);
    } catch (err) {
      alert(err.message || 'Error refining your trip plan. Please try again later.');
    } finally {
      setIsRefining(false);
    }
  };

  // 4. Save Trip Operation
  const handleSaveTrip = async () => {
    if (!user) {
      openAuthModal('signup');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await safeFetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: activeTripDetails?.destination || activeItinerary.summary.destination,
          budget: activeTripDetails?.budget || activeItinerary.summary.approxTotalCost,
          currency: activeTripDetails?.currency || activeItinerary.summary.currency,
          startDate: activeTripDetails?.startDate || '',
          endDate: activeTripDetails?.endDate || '',
          interests: activeTripDetails?.interests || [],
          itinerary: activeItinerary
        })
      });

      alert('🎉 Trip plan saved successfully to your account! Find it anytime in "My Trips".');
      fetchSavedTrips(token);
      setActiveTab('my-trips');
      setActiveItinerary(null);
    } catch (err) {
      alert(err.message || 'Could not save trip. Please try again later.');
    }
  };

  // 5. Delete Trip Operation
  const handleDeleteTrip = async (tripId) => {
    if (!confirm('Are you sure you want to delete this trip? This action is permanent.')) return;

    try {
      const token = localStorage.getItem('token');
      await safeFetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchSavedTrips(token);
    } catch (err) {
      alert(err.message || 'Could not delete trip. Please try again later.');
    }
  };

  // 6. View saved trip trigger
  const handleViewSavedTrip = (trip) => {
    setActiveItinerary(trip.itinerary);
    setActiveTripDetails({
      destination: trip.destination,
      budget: trip.budget,
      currency: trip.currency,
      startDate: trip.startDate,
      endDate: trip.endDate,
      interests: trip.interests
    });
  };

  // 7. Template Customization Select
  const handleSelectTemplate = (template) => {
    // Jump straight to planner and pre-fill details!
    setActiveTab('plan');
    setActiveItinerary(null);
    
    // Auto-prefill variables inside the PlanTrip view via trigger or simulated copy
    setTimeout(() => {
      const promptField = document.querySelector('.wizard-textarea');
      if (promptField) {
        promptField.value = template.prompt;
        // Trigger React updates using standard inputs
        const changeEvent = new Event('input', { bubbles: true });
        promptField.dispatchEvent(changeEvent);
      }
    }, 100);
  };

  // 8. HIGH-FIDELITY CLIENT SIDE PDF GENERATION
  // 8. HIGH-FIDELITY CLIENT SIDE PDF GENERATION
  const handleDownloadPDF = async () => {
    if (!user || !activeItinerary) return;

    try {
      const token = localStorage.getItem('token');
      const tripId = activeItinerary.id || 'new';

      // Verify PDF download privilege with the backend API
      await safeFetch(`/api/trips/${tripId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Proceed with PDF generation since authorized
      const { summary, days } = activeItinerary;
      const doc = new jsPDF();
      
      const currencySymbol = getCurrencySymbol(summary.currency);
      
      // Design Styles
      doc.setFillColor(242, 100, 48); // Primary Coral color
      doc.rect(0, 0, 210, 40, 'F');

      // Title Block
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('TRAVNIFY PREMIUM TRAVEL MAP', 15, 18);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text('AI-Generated Day-by-Day Complete Travel Itinerary', 15, 26);
      doc.text(`User Account: ${user.email}`, 15, 32);

      // Summary Section
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Destination: ${summary.destination}`, 15, 52);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Duration: ${summary.totalDays} Days`, 15, 60);
      doc.text(`Total Estimated Budget: ${currencySymbol} ${summary.approxTotalCost.toLocaleString()}`, 15, 66);
      doc.text(`Average Daily Budget: ${currencySymbol} ${summary.dailyAverageCost.toLocaleString()}`, 15, 72);

      let yOffset = 88;

      // Day loop
      days.forEach((day, dIdx) => {
        // Check if we need a page break
        if (yOffset > 240) {
          doc.addPage();
          yOffset = 20;
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(242, 100, 48); // Coral Day tags
        const dateStr = day.date ? ` (${day.date})` : '';
        doc.text(`DAY ${day.dayNumber}: ${day.location || 'Explore City'}${dateStr}`, 15, yOffset);
        doc.line(15, yOffset + 2, 195, yOffset + 2);
        
        yOffset += 10;

        // Event blocks loop
        day.blocks.forEach((block, bIdx) => {
          if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
          }

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(`[${block.timeWindow || 'Time Slot'}] ${block.title}`, 18, yOffset);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          
          const splitDescription = doc.splitTextToSize(block.description, 175);
          doc.text(splitDescription, 18, yOffset + 5);

          yOffset += (splitDescription.length * 5) + 6;

          const hasCost = block.approxCost && (typeof block.approxCost === 'object' ? block.approxCost.value > 0 : parseInt(block.approxCost) > 0);
          if (hasCost) {
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(242, 100, 48);
            const costStr = typeof block.approxCost === 'object' ? `${getCurrencySymbol(block.approxCost.currency)}${block.approxCost.value}` : block.approxCost;
            doc.text(`Estimated Cost: ~ ${costStr}`, 18, yOffset - 1);
            yOffset += 6;
          }
          
          yOffset += 4;
        });

        yOffset += 8;
      });

      // Add final disclaimer on last page
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }
      yOffset += 5;
      doc.setFont('Helvetica', 'oblique');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Disclaimer: All times and costs are estimates. Please verify schedules and pricing before traveling.', 15, yOffset);
      doc.text('TRAVNIFY takes no responsibility for availability, schedules, or pricing variances.', 15, yOffset + 5);

      // Save
      doc.save(`travnify_itinerary_${summary.destination.toLowerCase().replace(/ /g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      if (err.code === 'PREMIUM_REQUIRED' || err.status === 403) {
        setPricingModalOpen(true);
      } else {
        alert(err.message || 'An error occurred during PDF generation.');
      }
    }
  };

  const openAuthModal = (tab) => {
    openAuthModalWithMessage(tab || 'login');
  };

  return (
    <BrowserRouter>
      {import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL && (
        <div style={{
          background: '#FEF3C7',
          borderBottom: '1px solid #F59E0B',
          color: '#D97706',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          fontSize: '0.88rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          zIndex: 1000,
          position: 'relative'
        }}>
          <span>⚠️</span>
          <span>Server features (Near Me, AI planning, premium) are temporarily disabled because the backend is not yet deployed.</span>
        </div>
      )}
      <div className="app-container">
        {/* 1. Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // If switching tab, clear itinerary display to show primary list again
            if (tab !== 'plan') setActiveItinerary(null);
          }}
          user={user}
          onLogout={handleLogout}
          openAuthModal={openAuthModal}
          openPricingModal={openPricingModal}
          onUserUpdate={setUser}
        />

        {/* 2. Main Page Render */}
        <main className="main-content">
          <Routes>
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={
              activeItinerary ? (
                /* Render Generated Day Accordions */
                <ItineraryViewer
                  itinerary={activeItinerary}
                  user={user}
                  isRefining={isRefining}
                  onSave={handleSaveTrip}
                  onRefine={handleRefineTrip}
                  onDownloadPDF={handleDownloadPDF}
                  onBack={() => setActiveItinerary(null)}
                  openPricingModal={openPricingModal}
                  openAuthModal={openAuthModal}
                />
              ) : (
                /* Primary Page Tabs */
                <>
                  {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
                  
                  {activeTab === 'plan' && (
                    <ProtectedRoute fallbackTab="home" setActiveTab={setActiveTab} message="Create a free TRAVNIFY account to start planning trips.">
                      {isLoading ? (
                        /* High quality planning loader */
                        <div style={{ textAlign: 'center', padding: '8rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
                          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem auto' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '4px dashed #E2E8F0', borderRadius: '50%', boxSizing: 'border-box' }}></div>
                            <div className="spinner" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '4px solid transparent', borderTopColor: '#F26430', borderRadius: '50%', boxSizing: 'border-box' }}></div>
                          </div>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Constructing Your Dream Schedule</h3>
                          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.4' }}>
                            Our AI is parsing your parameters, mapping the daily segments, allocating budgets, and generating a premium travel map...
                          </p>
                          {loadingTime > 10 && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', color: '#B45309', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                              <span>⏳ We’re still working on your trip, almost there. (This might take a bit longer, please wait... elapsed: {loadingTime}s)</span>
                              <button 
                                onClick={() => { setIsLoading(false); }} 
                                style={{ background: '#F59E0B', border: 'none', color: '#FFFFFF', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              >
                                Cancel & Try Again
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {tripError && (
                            <div style={{
                              padding: '1rem',
                              background: '#FEF2F2',
                              border: '1px solid #FCA5A5',
                              borderRadius: '12px',
                              color: '#991B1B',
                              fontSize: '0.95rem',
                              marginBottom: '1.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              maxWidth: '600px',
                              margin: '0 auto 1.5rem auto',
                              textAlign: 'left'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                <span>{tripError}</span>
                              </span>
                              <button onClick={() => setTripError(null)} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
                                <X size={16} />
                              </button>
                            </div>
                          )}
                          <PlanTrip onGenerate={handleGenerateTrip} isLoading={isLoading} user={user} />
                        </>
                      )}
                    </ProtectedRoute>
                  )}
                  
                  {activeTab === 'explore' && (
                    <ProtectedRoute fallbackTab="home" setActiveTab={setActiveTab} message="Create a free TRAVNIFY account to explore travel templates and activities.">
                      <Explore 
                        onSelectTemplate={handleSelectTemplate} 
                        user={user} 
                        setUser={setUser}
                        openPricingModal={openPricingModal}
                        openAuthModal={openAuthModal}
                      />
                    </ProtectedRoute>
                  )}
                  
                  {activeTab === 'near-me' && (
                    <ProtectedRoute fallbackTab="home" setActiveTab={setActiveTab} message="Create a free TRAVNIFY account to see nearby locations and transit maps.">
                      <NearMe destinationCity={activeTripDetails?.destination || ''} />
                    </ProtectedRoute>
                  )}
                  
                  {activeTab === 'my-trips' && (
                    <ProtectedRoute fallbackTab="home" setActiveTab={setActiveTab} message="Create a free TRAVNIFY account to view and manage your saved travel itineraries.">
                      <MyTrips
                        savedTrips={savedTrips}
                        user={user}
                        onDelete={handleDeleteTrip}
                        onViewTrip={handleViewSavedTrip}
                        setActiveTab={setActiveTab}
                        openAuthModal={openAuthModal}
                      />
                    </ProtectedRoute>
                  )}

                  {activeTab === 'premium' && (
                    <Premium setActiveTab={setActiveTab} />
                  )}
                </>
              )
            } />
          </Routes>
        </main>

        {/* 3. Footer */}
        <Footer />

        {/* 4. Auth modal popup dialog overlay */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialTab={authModalTab}
          onAuthSuccess={loginSuccess}
        />

        {/* 5. Pricing upgrade overlay modal */}
        <PricingModal
          isOpen={pricingModalOpen}
          onClose={() => setPricingModalOpen(false)}
          user={user}
          onUpgradeSuccess={(updatedUser) => {
            setUser(updatedUser);
            trackEvent('premium_upgraded');
            alert('💳 Upgrade Verified! Premium Features Unlocked. Try saving trips or exporting to PDF.');
          }}
        />
      </div>
    </BrowserRouter>
  );
}
