import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Compass, Zap, Gem, Umbrella, Mountain,
  Building2, PartyPopper, ShoppingBag, Sparkles,
  MapPin, AlertCircle, Lock, Calendar, Sparkle, ArrowRight
} from 'lucide-react';
import { safeFetch } from '../lib/api';
import { tripsDatabase } from '../data/tripsDatabase';
import TripDetailsModal from '../components/TripDetailsModal';
import { trackEvent } from '../lib/analytics';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────── */
const FILTERS = ['All', 'Beach', 'Mountain', 'City', 'Party', 'Shopping'];

const FILTER_ICONS = {
  All:      <Sparkles size={14} />,
  Beach:    <Umbrella size={14} />,
  Mountain: <Mountain size={14} />,
  City:     <Building2 size={14} />,
  Party:    <PartyPopper size={14} />,
  Shopping: <ShoppingBag size={14} />,
};

const ACTIVITY_CHIPS = ['Bungee jumping', 'Scuba diving', 'Best sunsets', 'Foodie cities', 'Nightlife', 'Skiing'];
const HIDDEN_CHIPS   = ['hidden beach towns in Asia', 'underrated hill stations in India', 'hidden gems near Bali'];

/* ─────────────────────────────────────────────────────────────
   TAB ANIMATION VARIANTS
   ───────────────────────────────────────────────────────────── */
const tabAnim = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────────────────────
   DYNAMIC UNSPLASH PLACEHOLDER IMAGES
   ───────────────────────────────────────────────────────────── */
const getPlaceImage = (name, country) => {
  const text = `${name} ${country}`.toLowerCase();
  if (text.includes('beach') || text.includes('scuba') || text.includes('snorkel') || text.includes('island') || text.includes('bali') || text.includes('goa') || text.includes('maldives') || text.includes('phuket')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('mountain') || text.includes('trek') || text.includes('hiking') || text.includes('snow') || text.includes('ski') || text.includes('hill') || text.includes('swiss') || text.includes('alps') || text.includes('himachal')) {
    return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80';
  }
  if (text.includes('city') || text.includes('paris') || text.includes('tokyo') || text.includes('london') || text.includes('new york') || text.includes('temple') || text.includes('culture') || text.includes('museum')) {
    return 'https://images.unsplash.com/photo-1499856871958-5b9647a6406a?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
};

// Map tags exactly as described in the screenshots to look pixel-for-pixel identical
const TAGS_OVERRIDE = {
  trip_1: ['Beach', 'Party', 'Culture'],
  trip_9: ['Trekking', 'Mountains', 'Adventure'],
  trip_7: ['City', 'Culture', 'Nightlife'],
  trip_8: ['Beach', 'Party', 'Food'],
};

/* ─────────────────────────────────────────────────────────────
   SKELETON CARD (used in AI result sections)
   ───────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card animate-pulse" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
      <div className="card-img-wrapper" style={{ height: '180px', background: '#E2E8F0' }}></div>
      <div className="card-body" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ height: '18px', width: '70%', background: '#CBD5E1', borderRadius: '4px' }}></div>
        <div style={{ height: '12px', width: '40%', background: '#CBD5E1', borderRadius: '4px' }}></div>
        <div style={{ height: '12px', width: '100%', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px' }}></div>
        <div style={{ height: '12px', width: '90%', background: '#E2E8F0', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────────────────── */

export function ExploreHero() {
  return (
    <div className="hero-section" style={{ padding: '3.5rem 1rem 1rem 1rem' }}>
      <div className="hero-badge">
        <Sparkle size={14} />
        <span>TRAVNIFY DISCOVER</span>
      </div>
      <h1 className="hero-title" style={{ fontSize: '3.6rem', fontWeight: '800' }}>
        Explore
      </h1>
      <p className="hero-subtitle" style={{ fontSize: '1.2rem' }}>
        Templates, activities, and secret spots — all in one place
      </p>
    </div>
  );
}

export function ExploreTabs({ activeTab, setActiveTab }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '2.5rem' }}>
      <div 
        style={{ 
          background: 'rgba(30, 41, 59, 0.04)', 
          borderRadius: '99px', 
          padding: '0.4rem', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.4rem',
          border: '1px solid rgba(30, 41, 59, 0.06)'
        }}
      >
        {/* Tab 1: Trip Templates */}
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`nav-item ${activeTab === 'templates' ? 'active' : ''}`}
          style={{ border: 'none', background: activeTab === 'templates' ? undefined : 'transparent' }}
        >
          <Compass size={16} />
          <span>Trip Templates</span>
        </button>

        {/* Tab 2: Activity Explorer */}
        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`nav-item ${activeTab === 'activities' ? 'active' : ''}`}
          style={{ border: 'none', background: activeTab === 'activities' ? undefined : 'transparent' }}
        >
          <Zap size={16} fill={activeTab === 'activities' ? '#FFFFFF' : 'none'} />
          <span>Activity Explorer</span>
        </button>

        {/* Tab 3: Hidden Gems */}
        <button
          type="button"
          onClick={() => setActiveTab('hidden')}
          className={`nav-item ${activeTab === 'hidden' ? 'active' : ''}`}
          style={{ border: 'none', background: activeTab === 'hidden' ? undefined : 'transparent' }}
        >
          <Gem size={16} fill={activeTab === 'hidden' ? '#FFFFFF' : 'none'} />
          <span>Hidden Gems</span>
          <span 
            className="badge-tag"
            style={{ 
              marginLeft: '0.3rem', 
              fontSize: '0.7rem', 
              padding: '0.15rem 0.5rem', 
              background: activeTab === 'hidden' ? 'rgba(255, 255, 255, 0.25)' : 'var(--primary)',
              color: '#FFFFFF'
            }}
          >
            Pro
          </span>
        </button>
      </div>
    </div>
  );
}

export function ExploreSearch({ query, setQuery }) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search 
          size={18} 
          style={{ position: 'absolute', left: '1.2rem', color: 'var(--text-light)', pointerEvents: 'none' }} 
        />
        <input
          type="text"
          className="form-input orange-focus-glow"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search destinations..."
          style={{ 
            paddingLeft: '3rem', 
            height: '52px', 
            borderRadius: '16px',
            border: '1.5px solid rgba(30, 41, 59, 0.1)',
            background: '#FFFFFF',
            fontSize: '1rem',
            color: 'var(--text-dark)',
            width: '100%'
          }}
        />
      </div>
    </div>
  );
}

export function ExploreCategories({ activeFilter, setActiveFilter }) {
  return (
    <div className="filter-pills-row" style={{ marginTop: '0.5rem', marginBottom: '2.5rem' }}>
      {FILTERS.map(f => {
        const active = activeFilter === f;
        return (
          <button
            type="button"
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`filter-pill ${active ? 'active' : ''}`}
            style={{ border: 'none', background: active ? undefined : '#FFFFFF', cursor: 'pointer' }}
          >
            {FILTER_ICONS[f]}
            <span>{f}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DestinationCard({ trip, onOpen, onUseTemplate, index }) {
  const displayTags = TAGS_OVERRIDE[trip.id] || trip.tags;
  const description = trip.description || `Explore the beautiful attractions of ${trip.destination}. Perfect for a ${trip.days}-day getaway.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onOpen(trip)}
      className="card"
      style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div className="card-img-wrapper" style={{ height: '190px' }}>
        <img
          src={trip.image}
          alt={trip.title}
          className="card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="card-badges">
          {displayTags.map((tag, i) => (
            <span key={i} className="badge-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="card-body" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>
          {trip.title}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: '1.5', flex: '1', margin: 0 }}>
          {description}
        </p>
        <div className="card-details-row" style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
          <span>Duration: {trip.days} Days</span>
          <span>•</span>
          <span>Budget: {trip.minBudget}</span>
        </div>
      </div>

      <div className="card-footer" style={{ borderTop: '1px solid rgba(30, 41, 59, 0.06)', padding: '1rem 1.2rem' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUseTemplate(trip);
          }}
          className="btn btn-primary"
          style={{ width: '100%', border: 'none', padding: '0.6rem' }}
        >
          <Sparkles size={14} />
          <span>Use this template</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI RESULT CARD (used in Activity Explorer & Hidden Gems)
   ───────────────────────────────────────────────────────────── */
function AIResultCard({ place, index, onPlan, activity, isGem }) {
  const description = isGem ? place.shortDescription : place.whyItIsGreat;
  const bestTime = isGem ? place.bestTimeToVisit : place.bestSeason;
  const budget = isGem ? place.typicalBudgetLevel : place.approxCostBand;
  const image = getPlaceImage(place.name, place.countryOrRegion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {isGem && (
        <div className="card-status-badge" style={{ background: 'var(--primary-light-bg)', color: 'var(--primary)', borderColor: 'rgba(242,100,48,0.2)' }}>
          Rare Gem
        </div>
      )}
      
      <div className="card-img-wrapper" style={{ height: '180px' }}>
        <img
          src={image}
          alt={place.name}
          className="card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="card-badges">
          <span className="badge-tag">
            Season: {bestTime}
          </span>
          <span className="badge-tag">
            Budget: {budget}
          </span>
        </div>
      </div>

      <div className="card-body" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>
          {place.name}
        </h3>
        
        <div className="card-details-row" style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>
          <span><MapPin size={12} style={{ display: 'inline-block', marginRight: '2px', verticalAlign: 'text-bottom' }} /> {place.countryOrRegion}</span>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: '1.5', flex: '1', marginTop: '0.3rem', margin: 0 }}>
          {description}
        </p>
      </div>

      <div className="card-footer" style={{ borderTop: '1px solid rgba(30, 41, 59, 0.06)', padding: '1rem 1.2rem' }}>
        <button
          type="button"
          onClick={() => onPlan(place, activity)}
          className="btn btn-primary"
          style={{ width: '100%', border: 'none', padding: '0.6rem' }}
        >
          <Sparkles size={14} />
          <span>Plan a trip here</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOCKED OVERLAY (Hidden Gems for non-premium)
   ───────────────────────────────────────────────────────────── */
function LockedOverlay({ user, openAuthModal, openPricingModal }) {
  return (
    <div className="relative" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem' }}>
      {/* blurred card grid background */}
      <div 
        className="grid-cards" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          pointerEvents: 'none', 
          opacity: 0.12, 
          filter: 'blur(6px)', 
          zIndex: 1 
        }}
      >
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ height: '320px' }}>
            <div className="card-img-wrapper" style={{ height: '180px', background: '#CBD5E1' }}></div>
            <div className="card-body">
              <div style={{ height: '18px', width: '60%', background: '#94A3B8', borderRadius: '4px', marginBottom: '8px' }}></div>
              <div style={{ height: '12px', width: '40%', background: '#CBD5E1', borderRadius: '4px', marginBottom: '12px' }}></div>
              <div style={{ height: '12px', width: '90%', background: '#E2E8F0', borderRadius: '4px', marginBottom: '6px' }}></div>
              <div style={{ height: '12px', width: '80%', background: '#E2E8F0', borderRadius: '4px' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Premium upgrade card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ 
          zIndex: 2, 
          maxWidth: '440px', 
          width: '100%', 
          padding: '2.5rem 2rem', 
          textAlign: 'center', 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1.5px solid var(--primary-glow)',
          boxShadow: '0 20px 40px -15px rgba(242, 100, 48, 0.15)'
        }}
      >
        <div 
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'var(--primary-light-bg)', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1.5rem auto'
          }}
        >
          <Lock size={26} />
        </div>
        <h3 className="section-title" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.8rem' }}>
          Unlock Hidden Gems
        </h3>
        <p style={{ color: 'var(--text-medium)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          Gain exclusive access to crowd-free spots and unique destinations curated by our advanced AI.
        </p>
        <button
          type="button"
          onClick={() => { if (!user) openAuthModal('signup'); else openPricingModal(); }}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', border: 'none' }}
        >
          <Sparkles size={16} />
          <span>Upgrade to TRAVNIFY Premium</span>
        </button>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
   ───────────────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, body }) {
  return (
    <div 
      className="card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '4rem 2rem', 
        textAlign: 'center', 
        maxWidth: '600px', 
        margin: '2rem auto' 
      }}
    >
      <div 
        style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '16px', 
          background: 'var(--primary-light-bg)', 
          color: 'var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '1.2rem' 
        }}
      >
        <Icon size={26} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '0.5rem', margin: 0 }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-medium)', fontSize: '0.9rem', maxWidth: '380px', lineHeight: '1.5', marginTop: '0.4rem', margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 2: ACTIVITY EXPLORER VIEW COMPONENT
   ───────────────────────────────────────────────────────────── */
export function ActivityExplorer({
  activityQuery,
  setActivityQuery,
  handleActivitySearch,
  isActivityLoading,
  setIsActivityLoading,
  activityResults,
  activityError,
  searchedActivity,
  activityShowUpsell,
  handlePlanForPlace,
  user,
  openAuthModal,
  openPricingModal,
  activityLoadingTime
}) {
  return (
    <motion.div
      key="activities"
      variants={tabAnim}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mt-2 w-full"
    >
      <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h2 className="section-title" style={{ textAlign: 'left' }}>Activity Explorer</h2>
        <p className="section-subtitle" style={{ textAlign: 'left' }}>
          Discover the best places in the world for the activities you love.
        </p>
      </div>

      {/* Nicely styled search bar */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', minWidth: '280px' }}>
          <Search 
            size={18} 
            style={{ position: 'absolute', left: '1.2rem', color: 'var(--text-light)', pointerEvents: 'none', zIndex: 3 }} 
          />
          <input
            type="text"
            className="form-input orange-focus-glow"
            value={activityQuery}
            onChange={e => setActivityQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleActivitySearch()}
            placeholder="Search activities or destinations..."
            style={{ 
              paddingLeft: '3rem', 
              height: '52px', 
              borderRadius: '16px',
              border: '1.5px solid rgba(30, 41, 59, 0.1)',
              background: '#FFFFFF',
              fontSize: '1rem',
              color: 'var(--text-dark)',
              width: '100%'
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => handleActivitySearch()}
          disabled={isActivityLoading}
          className={`btn btn-primary ${isActivityLoading ? 'btn-disabled' : ''}`}
          style={{ height: '52px', padding: '0 1.8rem', border: 'none' }}
        >
          <Search size={16} />
          <span>Search</span>
        </button>
      </div>

      {/* Pill-style chips for common tags using existing filter-pill component */}
      <div className="filter-pills-row" style={{ justifyContent: 'flex-start', marginTop: '0.5rem', marginBottom: '2.5rem' }}>
        {ACTIVITY_CHIPS.map(chip => (
          <button
            type="button"
            key={chip}
            onClick={() => { setActivityQuery(chip); handleActivitySearch(chip); }}
            disabled={isActivityLoading}
            className="filter-pill"
            style={{ border: '1px solid rgba(30, 41, 59, 0.1)', background: '#FFFFFF', cursor: 'pointer' }}
          >
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isActivityLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-cards">
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
            {activityLoadingTime > 8 && (
              <div style={{ padding: '1rem', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', color: '#B45309', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                <span>⚠️ The search is taking longer than usual (elapsed: {activityLoadingTime}s). The AI service may be cold-starting. Please wait...</span>
                <button 
                  onClick={() => setIsActivityLoading(false)} 
                  style={{ background: '#F59E0B', border: 'none', color: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  Cancel & Try Again
                </button>
              </div>
            )}
          </div>
        ) : activityError ? (
          <div className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-100 rounded-2xl p-4 text-sm font-semibold">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            {activityError}
          </div>
        ) : activityResults.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Top for "{searchedActivity}"
              </span>
              <span className="badge-tag" style={{ background: 'var(--bg-warm-secondary)', color: 'var(--primary)', border: '1px solid rgba(242, 100, 48, 0.15)', textTransform: 'none' }}>
                {activityResults.length} found
              </span>
            </div>
            <div className="grid-cards">
              {activityResults.map((place, i) => (
                <AIResultCard 
                  key={i} 
                  place={place} 
                  index={i} 
                  onPlan={handlePlanForPlace} 
                  activity={searchedActivity} 
                  isGem={false} 
                />
              ))}
            </div>
            {activityShowUpsell && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="premium-upsell-banner"
                style={{ background: 'var(--bg-warm-secondary)', borderColor: 'var(--primary)', marginTop: '2rem' }}
              >
                <div className="upsell-info">
                  <h4 className="upsell-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Sparkle size={16} fill="var(--primary)" color="var(--primary)" /> 
                    <span>Unlock more results</span>
                  </h4>
                  <p className="upsell-desc" style={{ margin: 0, marginTop: '2px' }}>Upgrade for up to 6 AI suggestions per search.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { if (!user) openAuthModal('signup'); else openPricingModal(); }}
                  className="btn btn-primary btn-sm"
                  style={{ border: 'none' }}
                >
                  Upgrade Now
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <EmptyState icon={Zap} title="Discover your next activity" body='Search for something like "scuba diving in Asia" or click a suggestion above.' />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 3: HIDDEN GEMS VIEW COMPONENT (Always displays search & pills)
   ───────────────────────────────────────────────────────────── */
export function HiddenGems({
  hiddenQuery,
  setHiddenQuery,
  handleHiddenSearch,
  isHiddenLoading,
  setIsHiddenLoading,
  hiddenResults,
  hiddenError,
  searchedHidden,
  handlePlanForGem,
  user,
  openAuthModal,
  openPricingModal,
  hiddenLoadingTime
}) {
  return (
    <motion.div
      key="hidden"
      variants={tabAnim}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mt-2 w-full"
    >
      {/* Title + Premium badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
        <h2 className="section-title" style={{ textAlign: 'left', margin: 0 }}>Hidden Gems</h2>
        <span
          className="badge-tag"
          style={{ 
            fontSize: '0.78rem', 
            fontWeight: '700', 
            padding: '0.3rem 0.8rem', 
            background: 'var(--primary-light-bg)', 
            color: 'var(--primary)',
            border: '1px solid rgba(242, 100, 48, 0.15)',
            textTransform: 'none'
          }}
        >
          Premium
        </span>
      </div>
      <p className="section-subtitle" style={{ textAlign: 'left', marginTop: '-1.5rem', marginBottom: '2rem' }}>
        Secret spots and unexplored destinations curated just for you.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Search row */}
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', minWidth: '280px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '1.2rem', color: 'var(--text-light)', pointerEvents: 'none', zIndex: 3 }} 
            />
            <input
              type="text"
              className="form-input orange-focus-glow"
              value={hiddenQuery}
              onChange={e => setHiddenQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (!user || !user.isPremium) {
                    if (!user) openAuthModal('signup');
                    else openPricingModal();
                  } else {
                    handleHiddenSearch();
                  }
                }
              }}
              placeholder="Find hidden gems in..."
              style={{ 
                paddingLeft: '3rem', 
                height: '52px', 
                borderRadius: '16px',
                border: '1.5px solid rgba(30, 41, 59, 0.1)',
                background: '#FFFFFF',
                fontSize: '1rem',
                color: 'var(--text-dark)',
                width: '100%'
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!user || !user.isPremium) {
                if (!user) openAuthModal('signup');
                else openPricingModal();
              } else {
                handleHiddenSearch();
              }
            }}
            className="btn btn-primary"
            style={{ height: '52px', padding: '0 1.8rem', border: 'none' }}
          >
            <Gem size={16} />
            <span>Discover</span>
          </button>
        </div>

        {/* Suggestion pills inside Hidden Gems */}
        <div className="filter-pills-row" style={{ justifyContent: 'flex-start', marginTop: '0.5rem', marginBottom: '2.5rem' }}>
          {HIDDEN_CHIPS.map(chip => (
            <button
              type="button"
              key={chip}
              onClick={() => {
                if (!user || !user.isPremium) {
                  if (!user) openAuthModal('signup');
                  else openPricingModal();
                } else {
                  setHiddenQuery(chip);
                  handleHiddenSearch(chip);
                }
              }}
              className="filter-pill"
              style={{ border: '1px solid rgba(30, 41, 59, 0.1)', background: '#FFFFFF', cursor: 'pointer' }}
            >
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* Results or Lock Overlay */}
        {!user || !user.isPremium ? (
          <LockedOverlay user={user} openAuthModal={openAuthModal} openPricingModal={openPricingModal} />
        ) : (
          <AnimatePresence mode="wait">
            {isHiddenLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="grid-cards">
                  <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
                {hiddenLoadingTime > 8 && (
                  <div style={{ padding: '1rem', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', color: '#B45309', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
                    <span>⚠️ Discovering gems is taking longer than usual (elapsed: {hiddenLoadingTime}s). The AI service may be cold-starting. Please wait...</span>
                    <button 
                      onClick={() => setIsHiddenLoading(false)} 
                      style={{ background: '#F59E0B', border: 'none', color: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                    >
                      Cancel & Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : hiddenError ? (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-100 rounded-2xl p-4 text-sm font-semibold">
                <AlertCircle size={17} className="shrink-0 mt-0.5" />
                {hiddenError}
              </div>
            ) : hiddenResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Secret gems for "{searchedHidden}"
                  </span>
                  <span className="badge-tag" style={{ background: 'var(--bg-warm-secondary)', color: 'var(--primary)', border: '1px solid rgba(242, 100, 48, 0.15)', textTransform: 'none' }}>
                    {hiddenResults.length} revealed
                  </span>
                </div>
                <div className="grid-cards">
                  {hiddenResults.map((place, i) => (
                    <AIResultCard key={i} place={place} index={i} onPlan={handlePlanForGem} isGem />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={Gem} title="Unearth secret locations" body="Search or tap a suggestion to reveal hidden gems." />
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPLORE PAGE (Unified State & Visual Rebuild)
   ───────────────────────────────────────────────────────────── */
export default function Explore({ onSelectTemplate, user, openPricingModal, openAuthModal }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTrip, setSelectedTrip] = useState(null);

  /* ── Tab A state ─────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredTrips = useMemo(() => {
    return tripsDatabase.filter(trip => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || trip.destination.toLowerCase().includes(q)
        || trip.title.toLowerCase().includes(q)
        || trip.location.toLowerCase().includes(q)
        || trip.tags.some(t => t.toLowerCase().includes(q));
      const matchCat = activeFilter === 'All'
        || trip.tags.some(t => t.toLowerCase() === activeFilter.toLowerCase())
        || (activeFilter === 'Mountain' && trip.tags.includes('Mountains'))
        || (activeFilter === 'City'     && trip.tags.includes('Culture'));
      return matchSearch && matchCat;
    });
  }, [searchQuery, activeFilter]);

  const sortedTrips = useMemo(() => {
    // Sort specific trips to the front to match the screenshots exactly on first load
    const priorityIds = ['trip_1', 'trip_9', 'trip_7', 'trip_8'];
    const baseList = filteredTrips;
    return [...baseList].sort((a, b) => {
      const idxA = priorityIds.indexOf(a.id);
      const idxB = priorityIds.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [filteredTrips]);

  const handleUseTemplate = trip => {
    setSelectedTrip(null);
    onSelectTemplate({
      prompt: `Plan a trip to ${trip.destination}. Budget: ${trip.minBudget}. Duration: ${trip.days} days. Focus: ${trip.tags.join(', ')}`,
      destination: trip.destination,
      budget: trip.numericBudget,
      currency: trip.currency,
    });
  };

  /* ── Tab B state ─────────────────────────── */
  const [activityQuery,       setActivityQuery]       = useState('');
  const [isActivityLoading,   setIsActivityLoading]   = useState(false);
  const [activityResults,     setActivityResults]     = useState([]);
  const [activityError,       setActivityError]       = useState('');
  const [activityShowUpsell,  setActivityShowUpsell]  = useState(false);
  const [searchedActivity,    setSearchedActivity]    = useState('');
  const [activityLoadingTime, setActivityLoadingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isActivityLoading) {
      setActivityLoadingTime(0);
      interval = setInterval(() => {
        setActivityLoadingTime(prev => {
          const next = prev + 1;
          if (next >= 15) {
            setIsActivityLoading(false);
            setActivityError("We couldn’t search for this activity right now. Please try again.");
            clearInterval(interval);
          }
          return next;
        });
      }, 1000);
    } else {
      setActivityLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isActivityLoading]);

  const handleActivitySearch = async term => {
    const q = term || activityQuery;
    if (!q.trim()) return;
    setIsActivityLoading(true); setActivityError(''); setActivityShowUpsell(false); setSearchedActivity(q);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res  = await safeFetch('/api/discover/best-for-activity', { method:'POST', headers, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setActivityResults(data.places || []);
      if (data.premiumUpsell) setActivityShowUpsell(true);
      
      // Track Activity Explorer Search Success
      trackEvent('activity_explorer_search', { query: q });
    } catch (err) {
      const errorMsg = (err.status >= 500 || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('timeout'))
        ? "We couldn’t search for this activity right now. Please try again."
        : (err.message || "Something went wrong.");
      setActivityError(errorMsg);
    } finally { setIsActivityLoading(false); }
  };

  const handlePlanForPlace = (place, activity) => {
    onSelectTemplate({
      prompt: `Plan a trip to ${place.name}, ${place.countryOrRegion} for ${activity || 'leisure'}.`,
      destination: `${place.name}, ${place.countryOrRegion}`,
    });
  };

  /* ── Tab C state ─────────────────────────── */
  const [hiddenQuery,       setHiddenQuery]       = useState('');
  const [isHiddenLoading,   setIsHiddenLoading]   = useState(false);
  const [hiddenResults,     setHiddenResults]     = useState([]);
  const [hiddenError,       setHiddenError]       = useState('');
  const [searchedHidden,    setSearchedHidden]    = useState('');
  const [hiddenLoadingTime, setHiddenLoadingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isHiddenLoading) {
      setHiddenLoadingTime(0);
      interval = setInterval(() => {
        setHiddenLoadingTime(prev => {
          const next = prev + 1;
          if (next >= 15) {
            setIsHiddenLoading(false);
            setHiddenError("We couldn’t discover hidden gems right now. Please try again.");
            clearInterval(interval);
          }
          return next;
        });
      }, 1000);
    } else {
      setHiddenLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isHiddenLoading]);

  const handleHiddenSearch = async term => {
    const q = term || hiddenQuery;
    if (!q.trim()) return;
    setIsHiddenLoading(true); setHiddenError(''); setSearchedHidden(q);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res  = await safeFetch('/api/discover/hidden-gems', { method:'POST', headers, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setHiddenResults(data.places || []);
      
      // Track Hidden Gems Search Success
      trackEvent('hidden_gem_search', { query: q, isPremium: user?.isPremium || false });
    } catch (err) {
      const errorMsg = (err.status >= 500 || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('timeout'))
        ? "We couldn’t discover hidden gems right now. Please try again."
        : (err.message || "Something went wrong.");
      setHiddenError(errorMsg);
    } finally { setIsHiddenLoading(false); }
  };

  const handlePlanForGem = place => {
    onSelectTemplate({
      prompt: `Plan a customized trip to ${place.name}, ${place.countryOrRegion}. Focus on hidden local spots.`,
      destination: `${place.name}, ${place.countryOrRegion}`,
    });
  };

  /* ── render ──────────────────────────────── */
  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>

      {/* Hero Title & Subtitle */}
      <ExploreHero />

      {/* Floating Segmented Pill Tabs Navigation */}
      <ExploreTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content Enclosed in Main Page Container */}
      <div style={{ width: '100%', minHeight: '400px' }}>
        <AnimatePresence mode="wait">

          {/* ────────────────────────────
              TAB 1 — TRIP TEMPLATES
          ──────────────────────────── */}
          {activeTab === 'templates' && (
            <motion.div key="templates" variants={tabAnim} initial="initial" animate="animate" exit="exit" style={{ width: '100%' }}>

              {/* Search Bar */}
              <ExploreSearch query={searchQuery} setQuery={setSearchQuery} />

              {/* Category Filter Pills */}
              <ExploreCategories activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

              {/* Destination Cards Grid */}
              {sortedTrips.length === 0 ? (
                <EmptyState icon={Search} title="No templates found" body="Try adjusting your search query or filter tag." />
              ) : (
                <div className="grid-cards">
                  {sortedTrips.map((trip, i) => (
                    <DestinationCard
                      key={trip.id}
                      trip={trip}
                      index={i}
                      onOpen={setSelectedTrip}
                      onUseTemplate={handleUseTemplate}
                    />
                  ))}
                </div>
              )}

              {/* Custom trip CTA */}
              <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-medium)', fontWeight: '600', fontSize: '1rem', margin: 0 }}>
                  Don't see what you're looking for?
                </p>
                <button
                  type="button"
                  onClick={() => onSelectTemplate({ prompt:'', interests:[] })}
                  className="btn btn-primary btn-lg"
                  style={{ border: 'none' }}
                >
                  <Sparkles size={16} />
                  <span>Plan Custom Trip</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────
              TAB 2 — ACTIVITY EXPLORER
          ──────────────────────────── */}
          {activeTab === 'activities' && (
            <ActivityExplorer
              activityQuery={activityQuery}
              setActivityQuery={setActivityQuery}
              handleActivitySearch={handleActivitySearch}
              isActivityLoading={isActivityLoading}
              setIsActivityLoading={setIsActivityLoading}
              activityResults={activityResults}
              activityError={activityError}
              searchedActivity={searchedActivity}
              activityShowUpsell={activityShowUpsell}
              handlePlanForPlace={handlePlanForPlace}
              user={user}
              openAuthModal={openAuthModal}
              openPricingModal={openPricingModal}
              activityLoadingTime={activityLoadingTime}
            />
          )}

          {/* ────────────────────────────
              TAB 3 — HIDDEN GEMS
          ──────────────────────────── */}
          {activeTab === 'hidden' && (
            <HiddenGems
              hiddenQuery={hiddenQuery}
              setHiddenQuery={setHiddenQuery}
              handleHiddenSearch={handleHiddenSearch}
              isHiddenLoading={isHiddenLoading}
              setIsHiddenLoading={setIsHiddenLoading}
              hiddenResults={hiddenResults}
              hiddenError={hiddenError}
              searchedHidden={searchedHidden}
              handlePlanForGem={handlePlanForGem}
              user={user}
              openAuthModal={openAuthModal}
              openPricingModal={openPricingModal}
              hiddenLoadingTime={hiddenLoadingTime}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Trip details modal */}
      <TripDetailsModal
        isOpen={!!selectedTrip}
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
