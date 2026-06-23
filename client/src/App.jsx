import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { ShieldCheck, Info, FileText, Heart, Shield, RefreshCw, X, Sparkles } from 'lucide-react';

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
import Admin from './pages/Admin';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Footer from './components/Footer';
import { safeFetch } from './lib/api';

import { useAuth } from './context/AuthContext';
import { initAnalytics, trackPageView, trackEvent } from './lib/analytics';
import posthog from 'posthog-js';
import { getCurrencySymbol, INR_TO_CURRENCY } from './lib/currency';
import knownCitiesDb from '../../server/data/known_cities.json';

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

function getCityLocalTransitTips(cityName, destArea) {
  const nameLower = cityName.toLowerCase().trim();
  const destName = destArea || 'your destination';
  if (nameLower === 'delhi' || nameLower === 'new delhi') {
    return {
      walking: `Since you’re already in Delhi, you don’t need a flight or train. The best way to reach ${destName} is walking, which takes just a few minutes, or a quick auto-rickshaw ride.`,
      medium: `Since you’re already in Delhi, you don’t need a flight or train. The best way to reach ${destName} is taking the Delhi Metro (such as the Yellow Line) to avoid traffic. Alternatively, you can take a direct cab or auto-rickshaw for door-to-door comfort.`,
      long: `Since you’re already in Delhi, you don’t need a flight or train. The best way to cross the city to ${destName} is using the Delhi Metro network for the main stretch, then taking a short auto or cab for the last mile. Direct app-based cabs are also highly convenient.`
    };
  }
  if (nameLower === 'mumbai') {
    return {
      walking: `Since you’re already in Mumbai, you don’t need a flight or train. The best way to reach ${destName} is walking or taking a quick auto-rickshaw/local taxi.`,
      medium: `Since you’re already in Mumbai, you don’t need a flight or train. The best way to reach ${destName} is taking the Mumbai Metro or the local train network. A cab or auto-rickshaw is also a great option for door-to-door transit.`,
      long: `Since you’re already in Mumbai, you don’t need a flight or train. The best way to cross the city to ${destName} is using the local trains or Metro to bypass traffic, then taking a taxi or auto for the last mile.`
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
    walking: `Since you’re already in ${cityName}, you don’t need a flight or train. The best way to reach ${destName} is walking, which takes just a few minutes. For convenience, a short local taxi or public bus ride is also easily available.`,
    medium: `Since you’re already in ${cityName}, you don’t need a flight or train. The best way to reach ${destName} is using the city's local metro/subway, tram, or bus network. Alternatively, you can take a direct taxi or app-based cab for door-to-door comfort.`,
    long: `Since you’re already in ${cityName}, you don’t need a flight or train. The best way to travel across the city to ${destName} is taking local transit (metro/subway or express bus) to bypass traffic, then a short taxi or walk for the last mile.`
  };
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'plan' | 'explore' | 'near-me' | 'my-trips'
  const skeletonTimerRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const activeAbortControllerRef = useRef(null);
  
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [tripError, setTripError] = useState(null);
  const [fallbackWarning, setFallbackWarning] = useState(null);

  // Debug state change listeners with precise millisecond timestamps
  useEffect(() => {
    console.log(`[DEBUG Loading] [${new Date().toISOString()}] State Change - isGenerating:`, isGenerating);
  }, [isGenerating]);

  useEffect(() => {
    console.log(`[DEBUG Loading] [${new Date().toISOString()}] State Change - showSkeleton:`, showSkeleton);
  }, [showSkeleton]);

  useEffect(() => {
    console.log(`[DEBUG Loading] [${new Date().toISOString()}] State Change - activeItinerary:`, activeItinerary ? "object" : "null");
  }, [activeItinerary]);

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


  // Silent refresh loop every 12 minutes
  useEffect(() => {
    let refreshInterval;
    if (isAuthenticated) {
      refreshInterval = setInterval(async () => {
        try {
          const localRefreshToken = localStorage.getItem('refreshToken');
          const res = await safeFetch('/api/auth/refresh', { 
            method: 'POST',
            body: JSON.stringify({ refreshToken: localRefreshToken }),
            headers: { 'Content-Type': 'application/json' }
          });
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

  const cleanNameForMatching = (name) => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/\(.*\)/g, '') // remove parentheses content
      .replace(/\b(village|town|district|station|metro|airport|railway|junction|terminal|west|east|north|south|central|market|street|road|avenue|square|park|palace|castle|fort|temple|church|mosque|tomb|gardens|monument|bridge|lake|harbor|valley|hills|caves|dargah|tower)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
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
  };

  const normalizeCountry = (c) => {
    if (!c) return '';
    const low = c.toLowerCase().trim();
    if (low === 'usa' || low === 'united states' || low === 'united states of america' || low === 'u.s.a.' || low === 'u.s.') {
      return 'united states';
    }
    if (low === 'uk' || low === 'united kingdom' || low === 'u.k.') {
      return 'united kingdom';
    }
    return low;
  };

  const isKnownCountry = (countryName) => {
    if (!countryName) return false;
    const cities = knownCitiesDb.cities || {};
    const cNameLower = countryName.toLowerCase().trim();
    for (const ct of Object.values(cities)) {
      if ((ct.country || '').toLowerCase().trim() === cNameLower) {
        return true;
      }
    }
    const regions = knownCitiesDb.regions || {};
    for (const reg of Object.values(regions)) {
      if ((reg.country || '').toLowerCase().trim() === cNameLower) {
        return true;
      }
    }
    const commonCountries = ['usa', 'united states', 'uk', 'united kingdom', 'india', 'france', 'germany', 'japan', 'china', 'australia', 'canada', 'brazil', 'spain', 'italy'];
    if (commonCountries.includes(cNameLower)) return true;
    return false;
  };

  const resolveCityAndCountry = (destName) => {
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
  };

  const getCityLocalTransitTips = (cityName, destArea) => {
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
          morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} and walking through the ${city.neighborhoods[nhIdx1]} neighborhood. Visit the free-entry cultural site of ${city.culture[cultIdx]}.`;
          afternoonDesc = `Head to the vibrant ${city.shopping[shopIdx]} area for budget-friendly window shopping. For lunch, sample local street eats or taste ${city.food[foodIdx]} at an affordable neighborhood diner.`;
          eveningDesc = `Enjoy a relaxed evening activity of ${city.activities[actIdx]} (utilizing cheap local transport). Afterwards, dine at a local cafe in the lively ${city.neighborhoods[nhIdx2]} district.`;
        } else if (budgetTier === 'high') {
          morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} with a private guide, followed by a personalized tour of the ${city.neighborhoods[nhIdx1]} neighborhood. Visit the premier cultural exhibition at ${city.culture[cultIdx]}.`;
          afternoonDesc = `Head to the upscale boutiques in the ${city.shopping[shopIdx]} area for premium shopping. Enjoy a gourmet lunch featuring refined preparations of ${city.food[foodIdx]} at a highly-acclaimed signature restaurant.`;
          eveningDesc = `Indulge in a premium evening experience of ${city.activities[actIdx]} via private transport. Afterwards, unwind with a multi-course dinner at a top-tier restaurant in the exclusive ${city.neighborhoods[nhIdx2]} district.`;
        } else {
          morningDesc = `Begin the morning exploring ${city.landmarks[lmIdx1]} and walking through the ${city.neighborhoods[nhIdx1]} neighborhood. Visit the nearby cultural site of ${city.culture[cultIdx]}.`;
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
            morning: `Take a morning walk through the streets of ${destName}, exploring the main public plazas and taking photos from a free scenic viewpoint.`,
            afternoon: `Wander through the bustling market streets of ${destName} to browse budget-friendly local stalls. Enjoy a budget lunch at a popular street food joint or local eatery.`,
            evening: `Take a relaxing evening stroll along the central plaza of ${destName}, and enjoy a dinner at a casual neighborhood restaurant.`
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
            morning: `Explore the central quarter of ${destName}, walking down the main heritage streets, visiting the municipal museum, and stopping at a scenic city viewpoint.`,
            afternoon: `Visit the central market square of ${destName} to explore local stalls. Have a traditional local lunch at a popular family-run restaurant nearby.`,
            evening: `Take an evening walk along the central plaza of ${destName}, and enjoy dinner at a highly-rated local eatery serving regional specialties.`
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
    const startCountry = localStorage.getItem('userCountry') || (currency === 'INR' ? 'India' : 'United Kingdom');
    const startLat = localStorage.getItem('userLat');
    const startLng = localStorage.getItem('userLng');

    const resolvedStart = resolveCityAndCountry(startCity);
    const resolvedDest = resolveCityAndCountry(destName);

    // Integrate client geocoding from details
    if (details.resolvedDestCity) {
      if (!resolvedDest.city || resolvedDest.city.toLowerCase() === destName.toLowerCase()) {
        resolvedDest.city = details.resolvedDestCity;
        resolvedDest.country = details.resolvedDestCountry || resolvedDest.country;
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
    const destCityClean = cleanCity(resolvedDest.city || destName);

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
    const dLatVal = details.destLat !== undefined ? details.destLat : null;
    const dLngVal = details.destLng !== undefined ? details.destLng : null;

    if (startLat && startLng) {
      let dLat = dLatVal;
      let dLng = dLngVal;
      if (dLat === null || dLng === null || isNaN(dLat) || isNaN(dLng)) {
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

    let clientHowToReach;

    if (isSameCity) {
      const finalDistance = resolvedDest.area ? 10 : 2;
      clientHowToReach = computeHowToReach(
        resolvedDest.city || destCityClean || destName,
        resolvedDest.country || startCountry,
        resolvedDest.city || destCityClean || destName,
        resolvedDest.country,
        finalDistance,
        budgetTier,
        currency,
        resolvedDest.area || destName
      );
    } else {
      const finalDistance = distanceKm || estimateDistance(
        resolvedStart.city || startCity,
        resolvedStart.country || startCountry,
        resolvedDest.city,
        resolvedDest.country,
        startLat,
        startLng
      );

      clientHowToReach = computeHowToReach(
        resolvedStart.city || startCity,
        resolvedStart.country || startCountry,
        resolvedDest.city,
        resolvedDest.country,
        finalDistance,
        budgetTier,
        currency,
        resolvedDest.area || destName
      );
    }

    // Defensive pass for same-city
    if (isSameCity && clientHowToReach) {
      const recModeLower = (clientHowToReach.recommendedMode || '').toLowerCase();
      const startTerminalLower = (clientHowToReach.nearestStartTerminal || '').toLowerCase();
      const endTerminalLower = (clientHowToReach.nearestEndTerminal || '').toLowerCase();
      const detailsLower = (clientHowToReach.details || '').toLowerCase();

      const hasFlightOrAirport = 
        recModeLower.includes('flight') || 
        recModeLower.includes('plane') || 
        recModeLower.includes('airport') ||
        startTerminalLower.includes('airport') || 
        endTerminalLower.includes('airport') ||
        detailsLower.includes('airport') ||
        detailsLower.includes('flight');

      if (hasFlightOrAirport) {
        const finalDistance = resolvedDest.area ? 10 : 2;
        clientHowToReach = computeHowToReach(
          resolvedDest.city || destCityClean || destName,
          resolvedDest.country || startCountry,
          resolvedDest.city || destCityClean || destName,
          resolvedDest.country,
          finalDistance,
          budgetTier,
          currency,
          resolvedDest.area || destName
        );

        if (clientHowToReach.details) {
          clientHowToReach.details = clientHowToReach.details
            .replace(/\bflight\b/gi, 'local transit')
            .replace(/\bflights\b/gi, 'local transit options')
            .replace(/\bairport\b/gi, 'metro station/pickup point')
            .replace(/\bairports\b/gi, 'metro stations/pickup points');
        }
        if (clientHowToReach.summary) {
          clientHowToReach.summary = clientHowToReach.summary
            .replace(/\bflight\b/gi, 'local transit')
            .replace(/\bflights\b/gi, 'local transit options')
            .replace(/\bairport\b/gi, 'metro station/pickup point');
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
      console.log("[DEBUG Loading] handleGenerateTrip called - details:", details);
      posthog.capture('trip_generate_clicked', {
        destination: details.destination,
        has_dates: !!(details.startDate && details.endDate),
        budgetTier: details.budgetTier
      });
      
      if (!details.startDate || !details.endDate) {
        setTripError("Please select both FROM and TO dates to generate your trip.");
        return;
      }
      if (details.startDate > details.endDate) {
        setTripError("FROM date cannot be after TO date.");
        return;
      }

      setIsGenerating(true);
      setShowSkeleton(false);
      setTripError(null);

      // Geocode destination first to enrich details for both online and offline paths
      let resolvedDestCity = '';
      let resolvedDestCountry = '';
      let destLat = null;
      let destLng = null;

      try {
        const destQuery = details.destination || '';
        if (destQuery) {
          const controllerGeocode = new AbortController();
          const timeoutGeocode = setTimeout(() => controllerGeocode.abort(), 2000);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destQuery)}&format=json&limit=1&addressdetails=1`, {
            signal: controllerGeocode.signal
          });
          clearTimeout(timeoutGeocode);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const addr = data[0].address || {};
              resolvedDestCity = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || addr.state || '';
              resolvedDestCountry = addr.country || '';
              destLat = Number(data[0].lat);
              destLng = Number(data[0].lon);
              console.log("[DEBUG Geocoding] Resolved destination:", resolvedDestCity, resolvedDestCountry, destLat, destLng);
            }
          }
        }
      } catch (err) {
        console.warn("[DEBUG Geocoding] Failed to geocode destination:", err);
      }

      const enrichedDetails = {
        ...details,
        resolvedDestCity,
        resolvedDestCountry,
        destLat,
        destLng
      };

      setActiveTripDetails(enrichedDetails);

      // Compute trip length in days
      const lengthInDays = calculateLengthInDays(enrichedDetails.startDate, enrichedDetails.endDate);
      
      // Check if user is Premium for long trips (> 92 days)
      if (lengthInDays > 92 && (!user || !user.isPremium)) {
        setIsGenerating(false);
        openPricingModal();
        return;
      }

      // Clear any existing timers
      if (skeletonTimerRef.current) {
        clearTimeout(skeletonTimerRef.current);
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }

      let isAbortedByTimeout = false;

      // Start 5-second timer for Stage 2 (skeleton screen)
      const skeletonTimerStart = Date.now();
      console.log(`[DEBUG Loading] [${new Date().toISOString()}] Starting 5-second skeletonTimer`);
      skeletonTimerRef.current = setTimeout(() => {
        const elapsed = Date.now() - skeletonTimerStart;
        console.log(`[DEBUG Loading] [${new Date().toISOString()}] skeletonTimer fired after ${elapsed}ms - setting showSkeleton=true, activeItinerary=null`);
        setShowSkeleton(true);
        setActiveItinerary(null);
      }, 5000);

      // Start 50-second timer for fallback (gives Render/AI pipeline ample time to complete)
      console.log(`[DEBUG Loading] [${new Date().toISOString()}] Starting 50-second fallbackTimer`);
      fallbackTimerRef.current = setTimeout(() => {
        console.log(`[DEBUG Loading] [${new Date().toISOString()}] 50-second fallbackTimer fired - aborting active request and loading fallback`);
        isAbortedByTimeout = true;
        if (activeAbortControllerRef.current) {
          activeAbortControllerRef.current.abort();
        }
        setIsGenerating(false);
        setShowSkeleton(false);

        // Final fallback: show a basic template itinerary generated on the client
        const fallbackItinerary = generateClientItineraryTemplate(enrichedDetails);
        fallbackItinerary.generationSource = 'client_fallback';
        setActiveItinerary(fallbackItinerary);
        setFallbackWarning("We had trouble reaching our AI planner (connection timed out). We've loaded a lighter offline plan, but you can retry the AI generation.");
      }, 50000);

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const makeRequest = async (isSimplified = false) => {
        const controller = new AbortController();
        activeAbortControllerRef.current = controller;

        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 45000); // Align with backend's 45-second timeout

        try {
          const userLat = localStorage.getItem('userLat');
          const userLng = localStorage.getItem('userLng');
          const startCity = localStorage.getItem('userCity');
          const startCountry = localStorage.getItem('userCountry');

          const bodyPayload = {
            ...enrichedDetails,
            preferredCurrency: user?.preferredCurrency || enrichedDetails.currency || 'INR',
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
          const responseJson = await response.json();
          console.log("generateTrip response", responseJson);
          return responseJson;
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      };

      try {
        // First attempt
        console.log("[DEBUG Loading] First attempt started");
        const data = await makeRequest(false);
        console.log("[DEBUG Loading] First attempt resolved successfully");
        
        // Clear all timers on successful resolution
        if (skeletonTimerRef.current) {
          clearTimeout(skeletonTimerRef.current);
          skeletonTimerRef.current = null;
        }
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setIsGenerating(false);
        setShowSkeleton(false);
        setFallbackWarning(null);

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
        posthog.capture('trip_generated_success', {
          destination: details.destination,
          days: data.itinerary?.summary?.totalDays || details.days || 3,
          budgetTier: details.budgetTier,
          method: 'ai'
        });

        // Sync limits left on profile if logged in
        if (data.user && setUser) {
          setUser(data.user);
        } else {
          syncUserCredits();
        }
      } catch (err) {
        if (isAbortedByTimeout) {
          console.log("[DEBUG Loading] First attempt aborted because of 10s fallback timeout. Skipping retry.");
          return;
        }

        console.warn('[DEBUG Loading] First attempt failed. Error:', err.message);
        
        // If it's a premium gate error from the server, handle immediately without retrying or fallback
        if (err.code === 'NEED_PREMIUM_FOR_LONG_TRIP' || err.message?.includes('NEED_PREMIUM_FOR_LONG_TRIP')) {
          console.log("[DEBUG Loading] Premium gate error - aborting and showing modal");
          if (skeletonTimerRef.current) {
            clearTimeout(skeletonTimerRef.current);
            skeletonTimerRef.current = null;
          }
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          setIsGenerating(false);
          setShowSkeleton(false);
          openPricingModal();
          return;
        }

        // If it's normal credit limit error, handle immediately
        if (err.code === 'LIMIT_EXCEEDED' || err.code === 'FREE_LIMIT_REACHED') {
          console.log("[DEBUG Loading] Limit exceeded error - aborting and showing modal");
          if (skeletonTimerRef.current) {
            clearTimeout(skeletonTimerRef.current);
            skeletonTimerRef.current = null;
          }
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          setIsGenerating(false);
          setShowSkeleton(false);
          openPricingModal();
          syncUserCredits();
          return;
        }

        // Retry once with simplified flag - DO NOT reset or clear fallback/skeleton timers here.
        console.log('[DEBUG Loading] Retrying once with simplified flag...');
        try {
          const data = await makeRequest(true);
          console.log("[DEBUG Loading] Retry attempt resolved successfully");
          
          if (skeletonTimerRef.current) {
            clearTimeout(skeletonTimerRef.current);
            skeletonTimerRef.current = null;
          }
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          setIsGenerating(false);
          setShowSkeleton(false);
          setFallbackWarning(null);

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
          posthog.capture('trip_generated_success', {
            destination: details.destination,
            days: data.itinerary?.summary?.totalDays || details.days || 3,
            budgetTier: details.budgetTier,
            method: 'ai_retry_simplified'
          });

          if (data.user && setUser) {
            setUser(data.user);
          } else {
            syncUserCredits();
          }
        } catch (retryErr) {
          if (isAbortedByTimeout) {
            console.log("[DEBUG Loading] Retry attempt aborted by timeout. Aborting flow.");
            return;
          }

          console.error('[DEBUG Loading] Retry attempt also failed. Error:', retryErr.message);
          
          if (skeletonTimerRef.current) {
            clearTimeout(skeletonTimerRef.current);
            skeletonTimerRef.current = null;
          }
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          setIsGenerating(false);
          setShowSkeleton(false);

          // Final fallback: show a basic template itinerary generated on the client
          const fallbackItinerary = generateClientItineraryTemplate(enrichedDetails);
          fallbackItinerary.generationSource = 'client_fallback';
          setActiveItinerary(fallbackItinerary);
          setFallbackWarning("We had trouble reaching our AI planner (connection timed out). We've loaded a lighter offline plan, but you can retry the AI generation.");
          
          // Track fallback generation
          trackEvent('plan_created', {
            days: fallbackItinerary?.tripSummary?.totalDays || 3,
            destinationCount: enrichedDetails.destination ? enrichedDetails.destination.split(',').length : 1,
            fallback: true
          });
          posthog.capture('trip_generated_failed', {
            destination: details.destination,
            error: retryErr.message || 'Unknown generation error'
          });
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
      const userLat = localStorage.getItem('userLat');
      const userLng = localStorage.getItem('userLng');
      const startCity = localStorage.getItem('userCity');
      const startCountry = localStorage.getItem('userCountry');

      const bodyPayload = {
        originalItinerary: activeItinerary,
        action
      };

      if (userLat && userLng) {
        bodyPayload.userLat = Number(userLat);
        bodyPayload.userLng = Number(userLng);
      }
      if (startCity) bodyPayload.startCity = startCity;
      if (startCountry) bodyPayload.startCountry = startCountry;
      if (activeTripDetails) {
        bodyPayload.resolvedDestCity = activeTripDetails.resolvedDestCity;
        bodyPayload.resolvedDestCountry = activeTripDetails.resolvedDestCountry;
        bodyPayload.destLat = activeTripDetails.destLat;
        bodyPayload.destLng = activeTripDetails.destLng;
        bodyPayload.budgetTier = activeTripDetails.budgetTier;
      }

      const response = await safeFetch('/api/refineTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
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
    setActiveTab('plan');
    setActiveItinerary(null);
    setTripError(null);
    setFallbackWarning(null);

    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const details = {
      prompt: template.prompt,
      destination: template.destination || 'Selected Destination',
      budget: template.budget || 25000,
      currency: template.currency || 'INR',
      startDate: today,
      endDate: threeDaysLater,
      interests: template.interests || ['general']
    };

    handleGenerateTrip(details);
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
            if (tab !== 'plan') {
              setActiveItinerary(null);
            }
            setShowSkeleton(false);
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
                <>
                  {fallbackWarning && (
                    <div style={{
                      padding: '1.2rem',
                      background: '#FFFBEB',
                      border: '1px solid #FCD34D',
                      borderRadius: '16px',
                      color: '#B45309',
                      fontSize: '0.92rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      maxWidth: '800px',
                      margin: '1.5rem auto 1rem auto',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>🧭</span>
                        <div>
                          <strong>Lighter offline plan loaded.</strong> {fallbackWarning}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          disabled={isGenerating}
                          onClick={() => {
                            handleGenerateTrip(activeTripDetails);
                          }}
                          style={{
                            background: '#F59E0B',
                            border: 'none',
                            color: '#FFFFFF',
                            padding: '0.45rem 1.2rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            opacity: isGenerating ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          {isGenerating && <RefreshCw size={14} className="animate-spin" />}
                          {isGenerating ? 'Retrying...' : 'Retry AI Plan'}
                        </button>
                        <button
                          disabled={isGenerating}
                          onClick={() => setFallbackWarning(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#B45309',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            opacity: isGenerating ? 0.5 : 1
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                  <ItineraryViewer
                    itinerary={activeItinerary}
                    user={user}
                    isRefining={isRefining}
                    onSave={handleSaveTrip}
                    onRefine={handleRefineTrip}
                    onDownloadPDF={handleDownloadPDF}
                    onBack={() => {
                      setActiveItinerary(null);
                      setFallbackWarning(null);
                      setShowSkeleton(false);
                    }}
                    openPricingModal={openPricingModal}
                    openAuthModal={openAuthModal}
                  />
                </>
              ) : (
                /* Primary Page Tabs */
                <>
                  {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
                  
                  {activeTab === 'plan' && (
                    <ProtectedRoute fallbackTab="home" setActiveTab={setActiveTab} message="Create a free TRAVNIFY account to start planning trips.">
                      {(() => {
                        console.log(`[DEBUG Loading] [${new Date().toISOString()}] Plan Tab Render - isGenerating: ${isGenerating}, showSkeleton: ${showSkeleton}`);
                        if (isGenerating) {
                          if (showSkeleton) {
                            console.log(`[DEBUG Loading] [${new Date().toISOString()}] Render branch: returning ItinerarySkeleton`);
                            return <ItinerarySkeleton />;
                          } else {
                            console.log(`[DEBUG Loading] [${new Date().toISOString()}] Render branch: returning GeneratingLoader`);
                            return <GeneratingLoader />;
                          }
                        } else {
                          console.log(`[DEBUG Loading] [${new Date().toISOString()}] Render branch: returning PlanTrip form`);
                          return (
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
                              <PlanTrip onGenerate={handleGenerateTrip} isLoading={isGenerating} user={user} />
                            </>
                          );
                        }
                      })()}
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

                  {activeTab === 'admin' && (
                    user?.role === 'admin'
                      ? <Admin user={user} />
                      : (
                        <div style={{
                          textAlign: 'center', padding: '4rem 1.5rem',
                          background: 'rgba(239,68,68,0.06)',
                          borderRadius: '16px', border: '1px solid rgba(239,68,68,0.15)',
                          maxWidth: '480px', margin: '2rem auto'
                        }}>
                          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                          <h2 style={{ color: '#EF4444', marginBottom: '0.5rem' }}>Access Denied</h2>
                          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                            You do not have admin privileges. Contact the site owner if you believe this is an error.
                          </p>
                        </div>
                      )
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

function GeneratingLoader() {
  console.log(`[DEBUG Loading] [${new Date().toISOString()}] GeneratingLoader rendered`);
  const [textIndex, setTextIndex] = useState(0);
  const messages = [
    "Finding the best places for your perfect trip...",
    "Matching your budget with unforgettable experiences...",
    "Designing your personalized travel story..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % messages.length);
    }, 2500); // Rotate every 2.5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      padding: '2rem',
      textAlign: 'center',
      gap: '2.2rem'
    }}>
      {/* Premium Segment Spinner */}
      <div className="premium-spin-container" style={{
        position: 'relative',
        width: '90px',
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {Array.from({ length: 20 }).map((_, idx) => {
          const angle = idx * (360 / 24);
          const delay = -((24 - idx) * (1.2 / 24)).toFixed(3);
          return (
            <div
              key={idx}
              className="segment-dash"
              style={{
                position: 'absolute',
                width: '3.5px',
                height: '11px',
                borderRadius: '999px',
                transform: `rotate(${angle}deg) translateY(-32px)`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>

      {/* Rotating Animated Loading Text */}
      <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p
          key={textIndex}
          className="loading-text-anim"
          style={{
            color: '#475569',
            fontSize: '1.05rem',
            fontWeight: '600',
            maxWidth: '440px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}
        >
          {messages[textIndex]}
        </p>
      </div>
    </div>
  );
}

function ItinerarySkeleton() {
  console.log(`[DEBUG Loading] [${new Date().toISOString()}] ItinerarySkeleton rendered`);
  return (
    <div className="itinerary-container" style={{ opacity: 0.8, textAlign: 'left' }}>
      {/* Back button skeleton placeholder */}
      <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
        <div className="shimmer-block" style={{ height: '36px', width: '150px', borderRadius: '8px' }}></div>
      </div>

      {/* Summary Panel Skeleton */}
      <div className="itinerary-summary-panel" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Destination Title */}
          <div className="shimmer-block" style={{ height: '32px', width: '60%', borderRadius: '6px' }}></div>
          {/* Subtitle description */}
          <div className="shimmer-block" style={{ height: '16px', width: '80%', borderRadius: '4px' }}></div>
          
          {/* Metric boxes */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: '1 1 100px', height: '70px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                <div className="shimmer-block" style={{ height: '18px', width: '40%', borderRadius: '4px' }}></div>
                <div className="shimmer-block" style={{ height: '12px', width: '60%', borderRadius: '3px' }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Allocation Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center' }}>
          <div className="shimmer-block" style={{ height: '16px', width: '50%', borderRadius: '4px', marginBottom: '0.4rem' }}></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="shimmer-block" style={{ height: '12px', width: '30%', borderRadius: '3px' }}></div>
                <div className="shimmer-block" style={{ height: '12px', width: '15%', borderRadius: '3px' }}></div>
              </div>
              <div className="shimmer-block" style={{ height: '8px', width: '100%', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Transit Card Skeleton */}
      <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.2rem', marginTop: '1.2rem', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div className="shimmer-block" style={{ height: '20px', width: '200px', borderRadius: '4px' }}></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div className="shimmer-block" style={{ height: '12px', width: '100px', borderRadius: '3px' }}></div>
            <div className="shimmer-block" style={{ height: '16px', width: '150px', borderRadius: '4px' }}></div>
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div className="shimmer-block" style={{ height: '12px', width: '100px', borderRadius: '3px' }}></div>
            <div className="shimmer-block" style={{ height: '16px', width: '150px', borderRadius: '4px' }}></div>
          </div>
          <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div className="shimmer-block" style={{ height: '12px', width: '120px', borderRadius: '3px' }}></div>
            <div className="shimmer-block" style={{ height: '16px', width: '250px', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>

      {/* Safety & Logistics Tips Panel Skeleton */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginTop: '1.2rem', marginBottom: '1.2rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="shimmer-block" style={{ height: '16px', width: '120px', borderRadius: '4px' }}></div>
            <div className="shimmer-block" style={{ height: '12px', width: '100%', borderRadius: '3px' }}></div>
            <div className="shimmer-block" style={{ height: '12px', width: '90%', borderRadius: '3px' }}></div>
          </div>
        ))}
      </div>

      {/* Day Cards Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map(dayIdx => (
          <div key={dayIdx} className="day-card" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="day-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%' }}>
                <div className="shimmer-block" style={{ width: '28px', height: '28px', borderRadius: '50%' }}></div>
                <div className="shimmer-block" style={{ height: '18px', width: '40%', borderRadius: '4px' }}></div>
                <div className="shimmer-block" style={{ height: '14px', width: '120px', borderRadius: '4px' }}></div>
              </div>
              <div className="shimmer-block" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
            </div>
            
            {dayIdx === 1 && (
              <div className="day-body" style={{ padding: '1.2rem', background: '#FFFFFF', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {[1, 2, 3].map(bIdx => (
                  <div key={bIdx} style={{ display: 'flex', gap: '1rem' }}>
                    {/* Time Window column */}
                    <div style={{ width: '90px', display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                      <div className="shimmer-block" style={{ height: '16px', width: '100%', borderRadius: '4px' }}></div>
                    </div>
                    {/* Activity content card */}
                    <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="shimmer-block" style={{ height: '18px', width: '50%', borderRadius: '4px' }}></div>
                        <div className="shimmer-block" style={{ height: '16px', width: '80px', borderRadius: '4px' }}></div>
                      </div>
                      <div className="shimmer-block" style={{ height: '12px', width: '95%', borderRadius: '3px' }}></div>
                      <div className="shimmer-block" style={{ height: '12px', width: '85%', borderRadius: '3px' }}></div>
                      <div className="shimmer-block" style={{ height: '14px', width: '110px', borderRadius: '4px', marginTop: '0.4rem' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
