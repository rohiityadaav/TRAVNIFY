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

    const dayByDayPlan = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      dayByDayPlan.push({
        dayNumber: i + 1,
        date: dateStr,
        title: `Explore ${destName}`,
        theme: 'EXPLORE',
        morning: {
          description: `Morning sightseeing and exploring central attractions of ${destName}.`,
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
        },
        afternoon: {
          description: `Afternoon visit to local spots, historical sites, and regional lunch.`,
          estimatedCost: { amount: Math.round(avgDaily * 0.3), currency }
        },
        evening: {
          description: `Evening walk, shopping in local markets, and traditional dinner.`,
          estimatedCost: { amount: Math.round(avgDaily * 0.4), currency }
        },
        notes: [
          'Wear comfortable shoes for walking.',
          'Agree on fares or use taxi apps for transport.'
        ]
      });
    }

    return {
      tripSummary: {
        destination: destName,
        totalDays: daysCount,
        travelStyle: 'mixed',
        estimatedTotalCost: { amount: budget, currency },
        bestTimeAdvice: 'Generally, visiting during local dry seasons offers the best climate.'
      },
      dayByDayPlan,
      safetyAndLogistics: {
        localTransportTips: 'Taxis, public transit and walking are the best ways to get around.',
        areaSafetyNotes: 'Safe area. Just take standard precautions with personal belongings in crowded spots.',
        moneySavingTips: 'Enjoy street food, utilize public transit, and visit free attractions like public parks.'
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
      if (user && !user.isPremium) {
        setUser({ 
          ...user, 
          freeTripsGenerated: user.freeTripsGenerated + 1,
          dailyCreditsUsed: (user.dailyCreditsUsed || 0) + 1
        });
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

        if (user && !user.isPremium) {
          setUser({ 
            ...user, 
            freeTripsGenerated: user.freeTripsGenerated + 1,
            dailyCreditsUsed: (user.dailyCreditsUsed || 0) + 1
          });
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

        if (user && !user.isPremium) {
          setUser({ 
            ...user, 
            freeTripsGenerated: user.freeTripsGenerated + 1,
            dailyCreditsUsed: (user.dailyCreditsUsed || 0) + 1
          });
        }
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
