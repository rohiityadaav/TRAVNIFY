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

  // Helper to generate a basic fallback template itinerary on the client
  const generateClientItineraryTemplate = (details) => {
    const destName = details.destination || 'Selected Destination';
    const daysCount = calculateLengthInDays(details.startDate, details.endDate);
    const budget = Number(details.budget) || 15000;
    const currency = details.currency || 'INR';
    const avgDaily = Math.round(budget / daysCount);
    const baseDate = details.startDate ? new Date(details.startDate) : new Date();

    const knownDestinationsMockData = {
      "delhi": {
        morning: [
          "Walk through the historic lanes of Chandni Chowk, taking in the sights and scents.",
          "Explore the majestic Red Fort and learn about its Mughal architecture.",
          "Visit the serene Lotus Temple and spend some quiet time meditating.",
          "Stroll around Connaught Place (CP) and admire the colonial-era architecture.",
          "Explore the ruins and lush greenery of Lodhi Gardens.",
          "Visit Humayun's Tomb, a magnificent precursor to the Taj Mahal.",
          "Head to Qutub Minar, the world's tallest brick minaret, and check out the ruins."
        ],
        afternoon: [
          "Have delicious paranthas at the famous Paranthe Wali Gali in Old Delhi.",
          "Enjoy a classic lunch at Karim's near Jama Masjid, trying their legendary kebabs.",
          "Browse handicrafts and regional cuisines from different states at Dilli Haat INA.",
          "Shop for bargain fashion at the bustling Sarojini Nagar Market.",
          "Explore the high-street brands and cafes in Connaught Place Inner Circle.",
          "Visit the Crafts Museum and enjoy a traditional Indian meal at Lota Cafe.",
          "Wander around Khan Market, checking out boutique bookstores and upscale cafes."
        ],
        evening: [
          "Enjoy the vibrant nightlife at Hauz Khas Village, hopping between rooftop bars.",
          "Experience a sufi music night or dine at a fine-dining spot in Aerocity.",
          "Walk near India Gate, enjoy a street-side ice cream, and see the illuminated war memorial.",
          "Visit the lively CyberHub in Gurugram for drinks, pub food, and live DJ sets.",
          "Check out the nightlife and cocktail bars in Greater Kailash (GK) M-Block market.",
          "Indulge in a premium Mughlai dinner at Al Jawahar or Moti Mahal.",
          "Relax at a trendy lounge or microbrewery in Connaught Place."
        ]
      },
      "paris": {
        morning: [
          "Walk around the iconic Eiffel Tower and take photos from Trocadéro Gardens.",
          "Stroll through the artistic streets of Montmartre up to the Sacré-Cœur Basilica.",
          "Visit the world-famous Louvre Museum to admire the Mona Lisa and other masterpieces.",
          "Wander along the Seine River and check out the historic booksellers (bouquinistes).",
          "Explore the beautiful Luxembourg Gardens, watching locals play chess and sail toy boats.",
          "Visit the Notre-Dame Cathedral area and stroll through Île de la Cité.",
          "Walk down the grand Avenue des Champs-Élysées towards the Arc de Triomphe."
        ],
        afternoon: [
          "Grab fresh croissants and coffee at a cozy sidewalk bistro in the Latin Quarter.",
          "Enjoy a picnic with French cheese and baguettes in the Champ de Mars park.",
          "Browse the designer shops and historic boutiques in Le Marais district.",
          "Visit the Musée d'Orsay to see the stunning collection of Impressionist art.",
          "Have lunch at a classic brasserie like Bouillon Chartier, tasting traditional French onion soup.",
          "Explore the historic covered passages of Paris, like Passage des Panoramas.",
          "Visit the Palais Garnier opera house and shop at the nearby Galeries Lafayette."
        ],
        evening: [
          "Enjoy a cruise along the Seine River as the city lights up and monuments glow.",
          "Experience Paris's wine culture at a local cave à vin (wine bar) in Saint-Germain-des-Prés.",
          "Walk around the lively Pigalle area and dine at a trendy bistro.",
          "Dine at a premium restaurant in Le Marais, enjoying fine French cuisine and pastries.",
          "Attend a live jazz performance at Le Caveau de la Huchette in the Latin Quarter.",
          "Relax with a glass of champagne at a rooftop bar overlooking the sparkling Eiffel Tower.",
          "Take an evening stroll through the illuminated courtyard of the Louvre."
        ]
      },
      "new york": {
        morning: [
          "Walk across the iconic Brooklyn Bridge and enjoy skyline views of Manhattan.",
          "Stroll through Central Park, visiting Bethesda Fountain and the Strawberry Fields memorial.",
          "Visit the historic Statue of Liberty and Ellis Island by taking the ferry.",
          "Walk the High Line, an elevated public park built on a historic freight rail line.",
          "Visit the Top of the Rock observation deck at Rockefeller Center for panoramic city views.",
          "Explore the grand Beaux-Arts building of the New York Public Library and Bryant Park.",
          "Walk through the Charging Bull and Wall Street in the Financial District."
        ],
        afternoon: [
          "Grab a classic New York slice of pizza in Greenwich Village or Soho.",
          "Explore the galleries and museums along the Museum Mile, including the Met or MoMA.",
          "Browse the boutique shops and art galleries in the trendy neighborhood of Soho.",
          "Have a pastrami sandwich at a legendary NYC deli, trying classic local specialties.",
          "Wander through the bustling streets of Chinatown and Little Italy.",
          "Visit Grand Central Terminal and have lunch at the Grand Central Oyster Bar.",
          "Shop along Fifth Avenue or explore the unique shops in Chelsea Market."
        ],
        evening: [
          "See the bright neon lights of Times Square and catch a Broadway musical show.",
          "Enjoy craft cocktails at a speakeasy bar in the East Village.",
          "Experience the nightlife and live music at a jazz club in Greenwich Village.",
          "Dine at a trendy restaurant in the Meatpacking District or Williamsburg, Brooklyn.",
          "Take an evening cruise or walk along the Hudson River Park to watch the sunset.",
          "Grab a local craft beer at a rooftop lounge with views of the Empire State Building.",
          "Dine at a classic steakhouse or modern eatery in Midtown Manhattan."
        ]
      },
      "manali": {
        morning: [
          "Walk through the pine-scented trails of Van Vihar National Park near the Beas River.",
          "Visit the historic wooden Hadimba Temple nestled amidst giant deodar forests.",
          "Take a scenic drive to the Solang Valley and enjoy the crisp mountain air.",
          "Walk around the rustic lanes of Old Manali, taking photos of traditional wooden houses.",
          "Visit the serene Nyingmapa Buddhist Monastery and spin the prayer wheels.",
          "Head to Vashisht Village to see the natural hot water springs.",
          "Start a short trek up to the beautiful Jogini Waterfalls near Vashisht."
        ],
        afternoon: [
          "Have lunch at a cozy cafe in Old Manali, enjoying wood-fired trout or local Himachali Siddu.",
          "Explore Mall Road, shopping for woolen shawls, wooden crafts, and local apricots.",
          "Enjoy paragliding or zorbing in the Solang Valley activity grounds.",
          "Sit by the banks of the Beas River, listening to the rushing water and enjoying a hot cup of tea.",
          "Visit the Himalayan Nyinmapa Tibetan Buddhist Temple and browse local shops nearby.",
          "Have lunch at Cafe 1947 or Dylan's Toasted & Roasted Coffee House in Old Manali.",
          "Wander through the peaceful orchards and pine forests of Manu Temple road."
        ],
        evening: [
          "Stroll along the lively Mall Road, tasting local street food like momos and softies.",
          "Enjoy live music and craft beer at a vibrant pub/lounge in Old Manali.",
          "Relax around a cozy bonfire at your cottage or resort, enjoying a hearty dinner.",
          "Dine at a rooftop restaurant overlooking the valley, watching the stars and town lights.",
          "Visit a local German Bakery for delicious apple pie and hot chocolate.",
          "Spend a quiet evening at a riverside cafe in Old Manali, chatting with other travelers.",
          "Try local fruit wines and traditional dishes at a heritage Himachali kitchen."
        ]
      },
      "kasol": {
        morning: [
          "Walk along the roaring Parvati River, enjoying the misty pine forest vibes.",
          "Hike the scenic nature trail from Kasol to the peaceful village of Chalal.",
          "Visit the nearby holy site of Manikaran Sahib Gurudwara and see the hot springs.",
          "Start a short trek to Rasol village or towards the high viewpoints of the valley.",
          "Walk through the local Kasol market and enjoy the laid-back hippie culture.",
          "Find a quiet spot by the river for morning meditation or photography.",
          "Drive to the start of the Tosh village trail and enjoy the dramatic mountain views."
        ],
        afternoon: [
          "Have lunch at an Israeli cafe in Kasol, trying Shakshuka, Hummus, and pita bread.",
          "Shop for bohemian clothes, crystals, incense, and dreamcatchers in the Kasol bazaar.",
          "Enjoy a warm bath in the natural hot springs of Manikaran.",
          "Relax at the famous Evergreen Cafe or Jim Morrison Cafe, enjoying music and food.",
          "Explore the rustic pine-wood houses and Apple orchards of Chalal village.",
          "Sip herbal tea or local coffee while reading a book in a riverside cafe.",
          "Walk up the Tosh trail, stopping at local hillside dhabas for instant noodles and tea."
        ],
        evening: [
          "Dine at a vibrant cafe in Kasol with chill psychedelic trance music and cozy floor seating.",
          "Gather around a riverside bonfire under a clear starry night sky.",
          "Relax at a local German bakery, enjoying cinnamon rolls and hot chocolate.",
          "Take a peaceful evening stroll along the Kasol-Manikaran road, watching the sunset.",
          "Socialize with international travelers at local cafes like Moon Dance or Little Italy.",
          "Dine at a local trout fish kitchen, tasting freshly caught river fish.",
          "Enjoy the serene mountain silence from a wooden cafe balcony overlooking the Parvati valley."
        ]
      },
      "rishikesh": {
        morning: [
          "Attend an early morning yoga or meditation session at a peaceful ashram by the Ganges.",
          "Walk across the iconic suspension bridge Laxman Jhula and watch the sunrise over the river.",
          "Take a holy dip in the cool waters of the Ganges at Triveni Ghat.",
          "Explore the ruins of the famous Beatles Ashram (Chaurasi Kutia) and its colorful graffiti.",
          "Visit the 13-story Trayambakeshwar Temple near Laxman Jhula.",
          "Embark on a white-water rafting adventure starting from Shivpuri down the rapids.",
          "Hike to the scenic Neer Garh Waterfall for a refreshing morning bath."
        ],
        afternoon: [
          "Have lunch at a health food cafe overlooking the river, trying Ayurvedic thalis or smoothies.",
          "Browse the spiritual bookshops, crystal stores, and yoga wear shops in Ram Jhula.",
          "Visit the historic Swarg Ashram and learn about its spiritual history.",
          "Enjoy a quiet lunch at the Beatles Cafe or Freedom Cafe, enjoying the river view.",
          "Take a walking tour of the local spice and incense markets.",
          "Relax at a riverside beach, watching rafters navigate the rapids.",
          "Visit the Vashishta Gufa cave along the banks of the Ganges for deep quietude."
        ],
        evening: [
          "Witness the mesmerizing and spiritual Ganga Aarti ceremony at Parmarth Niketan or Triveni Ghat.",
          "Sip ginger lemon honey tea at a rooftop cafe in Laxman Jhula, listening to the temple bells.",
          "Dine at Chotiwala restaurant, enjoying a traditional North Indian thali.",
          "Stroll along the river ghats in the cool evening breeze, listening to devotional music.",
          "Dine at a premium organic cafe, enjoying organic wood-fired pizza and herbal teas.",
          "Relax with a sound healing session or watch a classical sitar performance.",
          "Enjoy the serene, alcohol-free nightlife, chatting with fellow seekers in cozy cafes."
        ]
      },
      "bihar": {
        morning: [
          "Begin the morning exploring Patna, visiting the historic Patna Museum and seeing the ancient relics, then walking around the famous Golghar structure.",
          "Head to Bodh Gaya to visit the sacred Mahabodhi Temple complex, meditate near the Bodhi Tree, and view the massive 80-foot Giant Great Buddha Statue.",
          "Explore the majestic ruins of ancient Nalanda University, checking out the historic Nalanda Archaeological Museum and its surrounding excavations.",
          "Drive to Rajgir and take the scenic ropeway chairlift up to the magnificent Vishwa Shanti Stupa on top of Ratnagiri Hill.",
          "Visit the historic Vishnupad Temple in Gaya, followed by a walk along the peaceful ghats of the Phalgu River."
        ],
        afternoon: [
          "Have a delicious lunch trying traditional Litti Chokha at the popular Maurya Lok street food complex in Patna.",
          "Enjoy a peaceful vegetarian lunch at the Root Institute Cafe in Bodh Gaya, followed by visiting the beautiful Thai and Bhutanese Buddhist Monasteries.",
          "Have lunch at a local garden restaurant in Nalanda, then explore the historic temples of Kundalpur nearby.",
          "Relax with a leisurely lunch at a hillside eatery in Rajgir, followed by a visit to the historic hot springs at Saptaparni Cave.",
          "Try local sweets like Tilkut and Anarsa at a famous heritage kitchen in Gaya town."
        ],
        evening: [
          "Take a scenic evening walk along Gandhi Ghat on the Ganges River in Patna, watching the daily Ganga Aarti ceremony.",
          "Stroll through the local Bodh Gaya Market, shopping for handicrafts and ending the evening at the peaceful Japanese Nippon Temple.",
          "Dine at the traditional Nalanda Retreat Restaurant, trying regional Bihari delicacies and local specialties.",
          "Explore the ancient Bimbisara Jail ruins in Rajgir and take a relaxing evening walk near the Cyclopean Wall.",
          "Visit the sacred Mangla Gauri Temple in Gaya, followed by dining at a popular traditional diner in the central bazaar."
        ]
      },
      "himachal pradesh": {
        morning: [
          "Walk down the famous Ridge in Shimla, taking in views of Christ Church and hiking up to the hilltop Jakhoo Temple.",
          "Explore the pine-scented trails of Van Vihar National Park in Manali, visiting the wooden Hadimba Temple.",
          "Visit the peaceful Tsuglagkhang Complex (Dalai Lama Temple) in McLeod Ganj, walking the spiritual Kora path.",
          "Start the day at the beautiful Khajjiar Lake near Dalhousie, walking through the lush cedar forest surrounds.",
          "Take a scenic drive through the apple orchards of Kasauli, visiting the historic Christ Church."
        ],
        afternoon: [
          "Enjoy a traditional Himachali lunch of Siddu and local food at Cafe Shimla Times, then stroll down Mall Road.",
          "Have lunch at Dylan's Toasted & Roasted Cafe in Old Manali, then sit by the rushing waters of the Beas River.",
          "Have lunch trying delicious Tibetan momos and Thukpa at the popular Tibet Kitchen in McLeod Ganj.",
          "Enjoy a picnic lunch on the green lawns of Khajjiar, followed by a horse ride through the valley.",
          "Have lunch at a cozy cafe on Kasauli Mall Road, then hike to the Gilbert Trail viewpoint."
        ],
        evening: [
          "Watch the sunset from Scandal Point in Shimla, followed by shopping for wooden crafts at Lakkar Bazar.",
          "Relax around a cozy bonfire at a riverside cafe in Old Manali, enjoying live local acoustic music.",
          "Sip herbal butter tea at Illiterati Cafe in McLeod Ganj, enjoying spectacular sunset views of the Dhauladhar range.",
          "Explore the Gandhi Chowk market in Dalhousie, picking up woolen shawls and local souvenirs.",
          "Take in panoramic views of the plains from Sunset Point in Kasauli, followed by a quiet dinner."
        ]
      },
      "goa": {
        morning: [
          "Visit the historic Basilica of Bom Jesus and Se Cathedral in Old Goa, then walk through the colorful Fontainhas Latin Quarter.",
          "Stroll along Calangute Beach and Baga Beach, taking photos and watching early morning fishermen.",
          "Hike up to the ancient lighthouse at the historic Fort Aguada ruins, enjoying panoramic sea views.",
          "Explore the quiet, scenic shores of Palolem Beach and take a dolphin-spotting boat trip to Butterfly Beach.",
          "Start your morning with a guided tour of a lush local Spice Plantation in Ponda."
        ],
        afternoon: [
          "Dine at Mum's Kitchen in Panaji, enjoying a traditional Goan fish thali and local vindaloo.",
          "Have a beachside lunch at Britto's on Baga Beach, trying Goan prawn curry and seafood.",
          "Enjoy a relaxed lunch at a garden cafe in Candolim, followed by shopping for local shell crafts.",
          "Have a fresh seafood lunch at a beach shack on Palolem Beach, then relax on a sunbed.",
          "Enjoy a traditional Goan buffet lunch at the Sahakari Spice Farm."
        ],
        evening: [
          "Embark on a scenic sunset boat cruise on the Mandovi River in Panaji, enjoying Goan folk dances.",
          "Browse the lively Anjuna Flea Market, watching the fire dancers and enjoying drinks at a beach bar.",
          "Take a sunset walk along the sandy Miramar Beach, followed by dinner at a popular Panaji bistro.",
          "Enjoy a quiet beach bonfire and candlelit dinner under the stars at a beach restaurant in Colva.",
          "Dine at a premium hilltop restaurant in Vagator, overlooking the illuminated Chapora Fort."
        ]
      },
      "rajasthan": {
        morning: [
          "Visit the iconic Hawa Mahal (Palace of Winds) and the grand Amer Fort in Jaipur, admiring Rajput architecture.",
          "Take a scenic boat ride on Lake Pichola in Udaipur, visiting the historic Jag Mandir palace.",
          "Explore the towering Mehrangarh Fort in Jodhpur, looking down at the famous blue-painted streets.",
          "Explore the spectacular Jaisalmer Fort (Golden Fort) and walk through its historic living sandcastle streets.",
          "Walk around the sacred Pushkar Lake and visit the rare Brahma Temple during sunrise."
        ],
        afternoon: [
          "Have traditional Dal Baati Churma at Laxmi Mishthan Bhandar in Johri Bazar in Jaipur.",
          "Enjoy lunch at a lakeview rooftop restaurant in Udaipur, then tour the magnificent City Palace.",
          "Try classic local Mawa Kachoris at Janta Sweet Home near the clock tower in Jodhpur.",
          "Have a traditional Rajasthani thali at a desert restaurant in Jaisalmer, then visit Patwon Ki Haveli.",
          "Have lunch at a rooftop cafe in Pushkar, shopping for silver jewelry and colorful clothes in the bazaar."
        ],
        evening: [
          "Watch the sunset over the Pink City from Nahargarh Fort, followed by shopping at Bapu Bazar.",
          "Watch a traditional Rajasthani puppet and folk dance show at Bagore Ki Haveli in Udaipur.",
          "Stroll around the bustling Jodhpur Clock Tower market, and dine at a rooftop garden restaurant.",
          "Embark on an evening camel safari in the Sam Sand Dunes of Jaisalmer, watching traditional folk dances.",
          "Watch the evening aarti prayers at Varaha Ghat in Pushkar, enjoying the peaceful chanting."
        ]
      },
      "kerala": {
        morning: [
          "Stroll around Fort Kochi to see the giant Chinese Fishing Nets and visit the historic Santa Cruz Basilica.",
          "Explore the misty, emerald tea gardens of Munnar, visiting the Lockhart Tea Museum.",
          "Board a traditional Kettuvallam houseboat for a scenic cruise through the peaceful backwaters of Alleppey.",
          "Take a walk along the spectacular cliffside of Varkala Beach, listening to the crashing waves.",
          "Explore the wildlife trails of Periyar National Park in Thekkady, looking for birds and elephants."
        ],
        afternoon: [
          "Have lunch trying Kerala parotta and vegetable stew at a historic warehouse cafe in Jew Town Kochi.",
          "Dine at Rapsy Restaurant in Munnar, then take a walk around the scenic Mattupetty Dam.",
          "Enjoy a traditional Kerala lunch served on a fresh banana leaf on board your Alleppey houseboat.",
          "Enjoy a fresh coconut water and local meal at a clifftop restaurant in Varkala.",
          "Visit the spice markets in Kumily, trying local cardamom tea and buying spices."
        ],
        evening: [
          "Watch a mesmerizing Kathakali dance performance at the Kerala Kathakali Centre in Fort Kochi.",
          "Watch the sunset over the tea hills from the scenic Echo Point in Munnar.",
          "Stroll along the sandy Alleppey Beach, watching the sunset near the historic lighthouse.",
          "Watch the sunset into the Arabian Sea from Varkala Beach, followed by a candlelit seafood dinner.",
          "Enjoy a traditional martial arts performance (Kalaripayattu) in Thekkady."
        ]
      },
      "karnataka": {
        morning: [
          "Explore the lush greenery of Lalbagh Botanical Garden and visit the historic Bangalore Palace in Bengaluru.",
          "Explore the grand Mysore Palace in Mysuru, followed by a drive up the historic Chamundi Hill.",
          "Explore the spectacular ruins of Virupaksha Temple and the Stone Chariot at Vittala Temple in Hampi.",
          "Take a walk to Abbey Falls in Coorg, surrounded by coffee plantations and misty hills.",
          "Walk along the crescent-shaped beaches of Gokarna, visiting the sacred Mahabaleshwar Temple."
        ],
        afternoon: [
          "Have a South Indian filter coffee and masala dosa at Vidyarthi Bhavan or MTR in Bengaluru.",
          "Enjoy a delicious Mysore Masala Dosa at the famous Mylari restaurant in Mysuru.",
          "Have a local meal at a heritage cafe in Hampi, then cross the Tungabhadra River in a coracle boat.",
          "Have lunch at a local coffee estate restaurant in Madikeri, tasting local Coorg specialties.",
          "Enjoy a fresh seafood lunch at Om Beach in Gokarna."
        ],
        evening: [
          "Explore the lively cafes and shopping districts of Indiranagar and Brigade Road in Bengaluru.",
          "Stroll through the illuminated Brindavan Gardens in Mysuru, watching the musical fountain show.",
          "Climb up Matanga Hill in Hampi to watch the spectacular sunset over the historic ruins.",
          "Visit Raja's Seat in Madikeri to watch the sunset over the Coorg valley hills.",
          "Watch the sunset over the Arabian Sea from Gokarna beach, relaxing at Om Beach."
        ]
      },
      "maharashtra": {
        morning: [
          "Walk past the historic Gateway of India and take photos of the Taj Mahal Palace Hotel in Mumbai.",
          "Visit the ancient Shaniwar Wada fort ruins and the Dagadusheth Halwai Ganapati Temple in Pune.",
          "Explore the historic Bhaja Caves and take in the views from Duke's Nose viewpoint in Lonavala.",
          "Visit the spectacular UNESCO World Heritage rock-cut Ajanta Caves near Aurangabad.",
          "Take a morning walk through the vineyards of Nashik, visiting the Sula Vineyards."
        ],
        afternoon: [
          "Dine at the historic Leopold Cafe in Mumbai, trying street delicacies like Pav Bhaji and Vada Pav.",
          "Enjoy a traditional Maharashtrian thali at Durvankur or try Shrewsbury biscuits from Pune Camp.",
          "Enjoy a rustic lunch in Lonavala and try the famous local Cooper's fudge and chikki.",
          "Have a traditional lunch in Aurangabad, then visit the magnificent Daulatabad Fort.",
          "Enjoy wine tasting and lunch at a vineyard bistro in Nashik."
        ],
        evening: [
          "Take a sunset walk along the famous Marine Drive promenade, followed by street food at Juhu Beach.",
          "Explore the lively markets of Fergusson College Road in Pune, dining at a cozy garden restaurant.",
          "Enjoy the sunset from Tiger's Point in Lonavala, tasting hot tea and freshly fried onion pakoras.",
          "Visit the beautiful Bibi Ka Maqbara (Tomb of the Lady) in Aurangabad, watching the sunset.",
          "Relax near the peaceful Godavari River ghats in Nashik, listening to the evening temple prayers."
        ]
      }
    };

    const cleanDest = destName.toLowerCase().trim();
    let isKnown = false;
    let knownKey = "";
    for (const key of Object.keys(knownDestinationsMockData)) {
      if (cleanDest.includes(key)) {
        isKnown = true;
        knownKey = key;
        break;
      }
    }

    const dayByDayPlan = [];
    const safeInterests = details.interests && details.interests.length > 0 ? details.interests : ['general'];

    for (let i = 0; i < daysCount; i++) {
      const activeInterest = safeInterests[i % safeInterests.length];
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      if (isKnown) {
        const pool = knownDestinationsMockData[knownKey];
        const morningDesc = pool.morning[i % pool.morning.length];
        const afternoonDesc = pool.afternoon[i % pool.afternoon.length];
        const eveningDesc = pool.evening[i % pool.evening.length];

        const notesPool = [
          `Use authorized local transport or walking to explore the unique corners of ${destName}.`,
          `Wear comfortable walking shoes for the day's sightseeing across ${destName}.`,
          `Check local entry times and carry some cash for street purchases in ${destName}.`,
          `Ask the locals for the best hidden viewpoints and local eateries in ${destName}.`,
          `Dress respectfully when visiting religious and heritage sites in ${destName}.`
        ];

        dayByDayPlan.push({
          dayNumber: i + 1,
          date: dateStr,
          title: `Explore ${destName} - Day ${i + 1}`,
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
        // GLOBAL DYNAMIC SYNTHETIC GENERATOR
        const townList = [
          `Old ${destName}`,
          `Central ${destName}`,
          `Scenic ${destName} Valley`,
          `${destName} Waterfront`,
          `${destName} Heights`
        ];
        const town = townList[i % townList.length];

        const mornings = [
          `Begin the morning exploring the ancient ${town} Fort ruins and walking through the historic ${town} Heritage Quarter, visiting the scenic ${town} Sun Temple.`,
          `Take an early morning walk through the lush green paths of ${town} Botanical Gardens, visiting the nearby peaceful ${town} Sanctuary and the historic ${town} Clock Tower.`,
          `Start your day at the famous ${town} Archaeological Museum, followed by a visit to the sacred ${town} Temple Complex and its traditional courtyard.`,
          `Embark on a morning trek up the scenic ${town} Ridge Trail, pausing at the spectacular ${town} Peak Viewpoint and the rustic ${town} Forest Reserve.`,
          `Explore the old cultural lanes of ${town} Old Bazaar, stopping at the historic ${town} Memorial Gateway and the peaceful ${town} Monastery.`
        ];

        const afternoons = [
          `Head to the bustling ${town} Spice & Textile Market. Enjoy local specialty food like a traditional thali and fresh regional dishes at the renowned ${town} Heritage Kitchen.`,
          `Visit the artisan workshops at the popular ${town} Craft Bazaar, followed by a leisurely lunch at the cozy ${town} Bistro near the central square.`,
          `Explore the vibrant shops of the ${town} Shopping Promenade. Enjoy a delicious local lunch at the highly-rated ${town} Food Junction, trying their famous local street food.`,
          `Have a relaxing lunch at the scenic ${town} Riverside Cafe, followed by a visit to the local ${town} Arts and Crafts Center.`,
          `Grab lunch at the traditional ${town} Spice Court, then explore the unique boutique stores and art galleries in the creative district of ${town}.`
        ];

        const evenings = [
          `Relax at the spectacular ${town} Sunset Viewpoint, followed by a traditional dinner at the premium ${town} Garden Restaurant.`,
          `Experience the local night scene at the lively ${town} Tavern & Pub, enjoying live music, craft drinks, and late-night street food at the nearby ${town} Night Market.`,
          `Take a peaceful evening stroll along the beautiful ${town} Waterfront Promenade/Lakeside path, then dine at the popular ${town} Royal Diner.`,
          `Indulge in a premium regional dinner at the famous ${town} Palace Restro, followed by dessert at the local ${town} German Bakery.`,
          `Join local travelers at the vibrant ${town} Music Lounge, followed by a late-evening walk around the illuminated ${town} Fountain Square.`
        ];

        const notesPool = [
          `Use authorized local transport or walk to get the most authentic feel of ${town}.`,
          `Keep small changes in local currency handy for street shopping in ${town}.`,
          `Dress respectfully when visiting religious and heritage sites in ${town}.`,
          `Ask locals for food recommendations; they know the best hidden culinary spots in ${town}.`,
          `Start your days early in ${town} to beat the mid-day crowd at popular spots.`,
          `Keep a water bottle and comfortable walking shoes ready for exploring ${town}.`,
          `Check the local weather forecast daily before planning outdoor activities in ${town}.`
        ];

        const morningIdx = i % mornings.length;
        const afternoonIdx = (i + 2) % afternoons.length;
        const eveningIdx = (i + 4) % evenings.length;

        dayByDayPlan.push({
          dayNumber: i + 1,
          date: dateStr,
          title: `Discover ${destName} - Day ${i + 1}`,
          theme: activeInterest.toUpperCase(),
          morning: {
            description: mornings[morningIdx],
            estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
          },
          afternoon: {
            description: afternoons[afternoonIdx],
            estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
          },
          evening: {
            description: evenings[eveningIdx],
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
