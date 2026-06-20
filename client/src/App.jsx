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
import { getCurrencySymbol } from './lib/currency';
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
    for (const [key, ct] of Object.entries(cities)) {
      if (destinationMatches(key, primaryToken)) {
        matchedCity = ct;
        break;
      }
    }

    // If no city matches directly, check if the input matches any landmark of a city!
    if (!matchedCity) {
      for (const [key, ct] of Object.entries(cities)) {
        const landmarks = ct.landmarks || [];
        const matchedLandmark = landmarks.find(lm => {
          const cleanLm = lm.toLowerCase().trim();
          return cleanLm.includes(primaryToken) || primaryToken.includes(cleanLm) || isFuzzyMatch(cleanLm, primaryToken);
        });
        if (matchedLandmark) {
          matchedCity = ct;
          break;
        }
      }
    }

    // Try to find matching region only if no city (direct or landmark) was matched
    let matchedRegion = null;
    if (!matchedCity) {
      for (const [key, reg] of Object.entries(regions)) {
        if (destinationMatches(key, primaryToken)) {
          matchedRegion = reg;
          break;
        }
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

        const morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} and taking a guided stroll around the historic ${city.neighborhoods[nhIdx1]} neighborhood. Visit the nearby cultural site of ${city.culture[cultIdx]}.`;
        const afternoonDesc = `Head to the vibrant ${city.shopping[shopIdx]} area for shopping and sightseeing. Have a delicious local lunch tasting ${city.food[foodIdx]} at a well-rated local diner.`;
        const eveningDesc = `Enjoy the evening activity of ${city.activities[actIdx]}. Afterwards, relax and dine at a cozy restaurant in the lively ${city.neighborhoods[nhIdx2]} district.`;

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
        const syntheticPlans = [
          {
            morning: `Explore the old historic quarter of ${destName}, visiting the central heritage market street, the ancient stone church or temple, and a scenic viewpoint nearby.`,
            afternoon: `Head to the bustling riverside or waterfront district of ${destName}. Have a traditional local lunch at a family-run restaurant near the town square.`,
            evening: `Walk along the main evening promenade of ${destName}, visit the illuminated central square, and dine at a local eatery serving regional specialties.`
          },
          {
            morning: `Start with a guided walking tour through ${destName}'s historic streets, visiting the municipal museum, the local market hall, and a scenic overlook.`,
            afternoon: `Browse the artisan craft workshops and souvenir stalls in the old quarter of ${destName}. Enjoy lunch at a courtyard café known for its regional recipes.`,
            evening: `Experience the local night scene at a popular street or cultural center in ${destName}. Try regional desserts and evening street food at the night market area.`
          },
          {
            morning: `Visit a scenic nature reserve or local heritage site near ${destName} — known for its trails, viewpoints, and peaceful atmosphere.`,
            afternoon: `Relax in a central neighborhood of ${destName} — browse local boutique shops, visit an art gallery, and have a traditional lunch.`,
            evening: `Attend a local cultural event or evening ceremony in ${destName}. Dine at a rooftop restaurant with a panoramic view of the skyline.`
          }
        ];

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

    return {
      tripSummary: {
        destination: destName,
        totalDays: daysCount,
        travelStyle: 'mixed',
        estimatedTotalCost: { amount: budget, currency },
        bestTimeAdvice: `Generally, visiting ${destName} during the dry season offers the best climate.`
      },
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
        const response = await safeFetch('/api/generateTrip', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...details,
            preferredCurrency: user?.preferredCurrency || details.currency || 'INR',
            simplified: isSimplified
          }),
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
      setActiveItinerary(data.itinerary);
      
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
        setActiveItinerary(data.itinerary);

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
