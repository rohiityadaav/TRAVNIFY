import React from 'react';
import { Sparkles, Compass, ArrowRight } from 'lucide-react';

export default function Home({ setActiveTab }) {
  return (
    <div className="hero-section">
      {/* Sparkle Badge */}
      <div className="hero-badge">
        <Sparkles size={14} fill="#F26430" />
        <span>AI-Powered Travel Planning</span>
      </div>

      {/* Main Bold Headline */}
      <h1 className="hero-title">
        Dream a trip. <br />
        <span className="text-gradient">Travnify plans it.</span>
      </h1>

      {/* Expository Description */}
      <p className="hero-subtitle">
        Just tell us your destination, budget, and vibe — our AI plans your entire 
        trip from first flight to final return. Flights, hotels, food, fun, rentals — 
        everything within your budget.
      </p>

      {/* Navigation Triggers */}
      <div className="hero-ctas">
        <button className="btn btn-primary btn-lg" onClick={() => setActiveTab('plan')}>
          <span>Plan My Trip</span>
          <ArrowRight size={18} />
        </button>
        <button className="btn btn-outline-slate btn-lg" onClick={() => setActiveTab('explore')}>
          <Compass size={18} />
          <span>Explore Templates</span>
        </button>
      </div>
    </div>
  );
}
