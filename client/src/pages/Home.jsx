import React, { useEffect } from 'react';
import { 
  Sparkles, 
  Compass, 
  ArrowRight, 
  DollarSign, 
  MapPin, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Globe 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home({ setActiveTab }) {
  const { isAdmin } = useAuth();
  const showSentryTrigger = import.meta.env.DEV || isAdmin;

  useEffect(() => {
    document.title = "Travnify — AI Travel Planner & Budget-Disciplined Itineraries";
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Plan personalized, budget-disciplined travel itineraries globally with Travnify. Plan routes like Delhi to Goa, London to Paris, and New York to Tokyo.');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', width: '100%' }}>
      {/* 1. HERO SECTION */}
      <div className="hero-section" style={{ padding: '5rem 1rem 3rem 1rem' }}>
        {/* Sparkle Badge */}
        <div className="hero-badge">
          <Sparkles size={14} fill="#F26430" />
          <span>AI-Powered Travel Architect</span>
        </div>

        {/* Main Bold Headline & Value Proposition */}
        <h1 className="hero-title" style={{ fontSize: '3.6rem', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          Dream your next trip. <br />
          <span className="text-gradient">Travnify plans it.</span>
        </h1>

        {/* Value Prop Description */}
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-medium)', maxWidth: '680px', margin: '1.5rem auto' }}>
          Personalized, destination-aware travel itineraries tailored to your budget, dates, and vibe. Plan trips from India, Europe, the US, and anywhere in the world to global destinations in seconds.
        </p>

        {/* Navigation Triggers */}
        <div className="hero-ctas" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => setActiveTab('plan')}>
            <span>Plan your trip now</span>
            <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline-slate btn-lg" onClick={() => setActiveTab('explore')}>
            <Compass size={18} />
            <span>Explore Templates</span>
          </button>
          {showSentryTrigger && (
            <button 
              onClick={() => { throw new Error("Sentry Test Error from Travnify React Frontend!"); }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <span>Trigger Test Error</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS OVERLAY SECTION */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid var(--card-border)',
        boxShadow: 'var(--card-shadow)',
        padding: '2rem 3rem',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '2rem',
        textAlign: 'center'
      }}>
        <div>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 800 }}>12,000+</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', fontWeight: 500 }}>Trips Planned Successfully</p>
        </div>
        <div style={{ borderRight: '1px solid rgba(0,0,0,0.06)', display: 'block', height: '50px', alignSelf: 'center' }} className="stats-divider-desktop"></div>
        <div>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--secondary)', fontWeight: 800 }}>98.4%</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', fontWeight: 500 }}>Traveler Satisfaction Rate</p>
        </div>
        <div style={{ borderRight: '1px solid rgba(0,0,0,0.06)', display: 'block', height: '50px', alignSelf: 'center' }} className="stats-divider-desktop"></div>
        <div>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 800 }}>180+</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', fontWeight: 500 }}>Global Destinations Active</p>
        </div>
      </div>

      {/* 2b. POPULAR ROUTES SECTION (GEO Optimization) */}
      <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1rem' }}>Popular AI Travel Routes</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-medium)', marginBottom: '2.5rem' }}>
          Explore some of our most generated flight and train itineraries planned by travelers worldwide.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          {[
            { from: "Delhi", to: "Goa", mode: "Flight & Train Options" },
            { from: "London", to: "Paris", mode: "Eurostar & Flight Options" },
            { from: "New York", to: "Tokyo", mode: "International Flight Options" }
          ].map((route, i) => (
            <div key={i} style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.25rem 2rem',
              border: '1px solid var(--card-border)',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              minWidth: '220px'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>{route.mode}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>{route.from} ➔ {route.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HOW IT WORKS SECTION */}
      <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get your custom-tailored travel map in three simple steps</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          marginTop: '3rem'
        }}>
          {/* Step 1 */}
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '20px',
            padding: '2.5rem 1.8rem',
            border: '1px solid rgba(242, 100, 48, 0.04)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative'
          }}>
            <div style={{
              background: 'var(--primary-light-bg)',
              color: 'var(--primary)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem'
            }}>1</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>Select Destination & Vibe</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Provide your destination, travel dates, overall budget, and your choice of vibes (food, nature, party, shopping, etc.).
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '20px',
            padding: '2.5rem 1.8rem',
            border: '1px solid rgba(242, 100, 48, 0.04)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative'
          }}>
            <div style={{
              background: 'var(--primary-light-bg)',
              color: 'var(--primary)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem'
            }}>2</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>AI Customizes Itinerary</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Our destination-aware AI architect designs a custom day-by-day plan with specific local attractions, eateries, and transit notes.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '20px',
            padding: '2.5rem 1.8rem',
            border: '1px solid rgba(242, 100, 48, 0.04)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative'
          }}>
            <div style={{
              background: 'var(--primary-light-bg)',
              color: 'var(--primary)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem'
            }}>3</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem' }}>Export, Sync & Travel</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Save trips to your account, tweak schedule blocks, view transit maps, and export premium PDFs for offline travel access.
            </p>
          </div>
        </div>
      </div>

      {/* 4. PREMIUM FEATURES GRID */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div className="section-header">
          <h2 className="section-title">Why Use Travnify?</h2>
          <p className="section-subtitle">Engineered to deliver high-quality, budget-disciplined travel itineraries</p>
        </div>

        <div className="grid-cards" style={{ marginTop: '3rem' }}>
          {/* Feature 1: Destination Aware */}
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-light-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Destination-Aware AI</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Never get vague "visit local market" text. Get real local sites, specific streets, historical spots, and highly-rated restaurants.
            </p>
          </div>

          {/* Feature 2: Smart Budgeting */}
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-light-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Smart Budget Discipline</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Our engine estimates costs dynamically and structures activities to fit comfortably within your daily and total budget limits.
            </p>
          </div>

          {/* Feature 3: Multi-Currency */}
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-light-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Multi-Currency Planning</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Choose your preferred currency (INR, USD, EUR, GBP, etc.) to view daily schedules and estimates without needing manual conversion.
            </p>
          </div>

          {/* Feature 4: PDF Export */}
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-light-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Offline PDF Export</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Download beautifully formatted, high-fidelity PDF guides containing your complete schedule, budgets, tips, and safety guidelines.
            </p>
          </div>

          {/* Feature 5: Real-time Discovery */}
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-light-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Transit & "Near Me" Finder</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              Quickly pull up nearby restaurants, public parks, and transit maps based on your active destination or browser location.
            </p>
          </div>

          {/* Feature 6: Secure Sync */}
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ color: 'var(--primary)', background: 'var(--primary-light-bg)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Secure Account Sync</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5 }}>
              All saved itineraries, profile settings, and payment details are synced via Firebase Auth and stored securely.
            </p>
          </div>
        </div>
      </div>

      {/* About & FAQ Section (GEO & AEO Optimization) */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '3rem'
      }}>
        {/* About segment */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '24px',
          padding: '2.5rem 3rem',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1rem' }}>About Travnify</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-medium)', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            Based in India and serving a worldwide audience, Travnify is designed for global citizens seeking structured, cost-aware travel itineraries. Our AI travel architect bridges geographical distances and provides smart recommendations for flights, trains, and local explorations globally.
          </p>
        </div>

        {/* FAQ segment */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', textAlign: 'center', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.6rem' }}>What is Travnify and how does it work?</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                Travnify is an AI-powered travel planning assistant that creates personalized, budget-disciplined day-by-day itineraries. Users input their destination, dates, budget tier, and vibes, and our engine automatically structures local attractions, optimal travel routes, and estimated daily costs into a shareable offline guide.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.6rem' }}>How does Travnify generate transport and "How to Reach" suggestions?</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                Travnify structures transit logic dynamically using spatial coordinates and geographic distances. Local recommendations focus on walkable paths and public transit routes. Intercity and international recommendations calculate train line paths or global flight connections, providing estimated travel times and budget requirements for the journey.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.6rem' }}>How does Travnify handle payments with Razorpay?</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                Travnify processes all premium upgrades and subscriptions securely via the Razorpay payment gateway. We do not store sensitive credit card or UPI details on our servers. Razorpay handles transaction security and card processing directly, complying with industry-standard PCI-DSS regulations to guarantee secure financial operations.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.6rem' }}>Where is my data stored and is it secure?</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                User data, profiles, and saved itineraries are stored in a secure Supabase Postgres database using enterprise-grade encryption. Passwords are encrypted with bcrypt, and session authorization is managed via Firebase Authentication. We enforce strict data controls and delete user records immediately upon request.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.6rem' }}>Can I export my itinerary as a PDF and what are the limits?</h3>
              <p style={{ fontSize: '0.98rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                Yes, you can export your complete day-by-day travel itinerary as a high-fidelity PDF guide. While free users can view itineraries online, premium subscribers have unlimited PDF downloads. These exported documents list travel details, local transit hints, packing checklists, and budget summaries for offline access.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM CALL TO ACTION */}
      <div style={{
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)',
        color: '#FFFFFF',
        borderRadius: '30px',
        padding: '5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto 2rem auto',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        <h2 style={{ fontSize: '2.5rem', color: '#FFFFFF', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.2 }}>
          Ready to discover your next adventure?
        </h2>
        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.8)', maxWidth: '580px', margin: '0 auto 1rem auto', lineHeight: 1.6 }}>
          Generate your comprehensive, budget-disciplined AI travel guide in less than 30 seconds. Plan for free today!
        </p>
        <button className="btn btn-primary btn-lg" style={{ background: 'var(--primary)', border: 'none' }} onClick={() => setActiveTab('plan')}>
          <span>Generate my itinerary</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
