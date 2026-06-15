import React from 'react';
import { MapPin, Calendar, DollarSign, Trash2, ExternalLink, Compass } from 'lucide-react';

export default function MyTrips({ savedTrips, user, onDelete, onViewTrip, setActiveTab, openAuthModal }) {
  
  const handleViewClick = (trip) => {
    onViewTrip(trip);
  };

  const getUnsplashPlaceholder = (dest) => {
    if (dest.toLowerCase().includes('bali')) return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80';
    if (dest.toLowerCase().includes('manali')) return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80';
    if (dest.toLowerCase().includes('paris')) return 'https://images.unsplash.com/photo-1499856871958-5b9647a6406a?auto=format&fit=crop&w=600&q=80';
    if (dest.toLowerCase().includes('goa')) return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="section-title" style={{ textAlign: 'left' }}>My Trips</h2>
          <p className="section-subtitle" style={{ textAlign: 'left' }}>All your planned adventures in one place</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('plan')}>
          <span>Plan New Trip</span>
        </button>
      </div>

      {!user ? (
        /* Logged out state */
        <div style={{ background: '#FFFFFF', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--card-shadow)' }}>
          <Compass size={44} className="text-gradient" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>Access Your Saved Adventures</h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Create an account or sign in to save your custom AI itineraries, export them to PDF, and manage all your past plans!
          </p>
          <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
            <span>Sign In to Continue</span>
          </button>
        </div>
      ) : savedTrips.length === 0 ? (
        /* Empty saved trips state */
        <div style={{ background: '#FFFFFF', border: '1px solid var(--card-border)', borderRadius: '24px', padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--card-shadow)' }}>
          <Compass size={44} className="text-light" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Planned Adventures Yet</h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            It looks like you haven't generated or saved any trip itineraries. Let's create your first premium day-by-day plan now!
          </p>
          <button className="btn btn-primary" onClick={() => setActiveTab('plan')}>
            <span>Plan a Trip Now</span>
          </button>
        </div>
      ) : (
        /* Saved Trips Card Grid - Matches Screen 5 layout */
        <div className="grid-cards">
          {savedTrips.map((trip) => {
            const days = trip.itinerary.summary.totalDays;
            const cost = trip.itinerary.summary.approxTotalCost;
            const currencySymbol = trip.itinerary.summary.currency === 'USD' ? '$' : '₹';

            return (
              <div key={trip.id} className="card">
                {/* Planned Status tag top-left, matching Figma Screen 5 */}
                <div className="card-status-badge">Planned</div>

                <div className="card-img-wrapper">
                  <img src={getUnsplashPlaceholder(trip.destination)} alt={trip.destination} className="card-img" />
                  <div className="card-badges">
                    {trip.interests && trip.interests.map((tag, idx) => (
                      <span key={idx} className="badge-tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="card-title" style={{ fontSize: '1.1rem', fontWeight: '700', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {trip.itinerary.summary.destination}
                  </h3>
                  <div className="card-details-row">
                    <span><MapPin size={14} className="text-gradient" /> {trip.destination}</span>
                  </div>
                  <div className="card-details-row" style={{ marginTop: '-0.3rem' }}>
                    <span><Calendar size={14} /> {days} days</span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="card-price" style={{ fontSize: '1.15rem' }}>
                    {currencySymbol}{cost.toLocaleString()}
                  </div>
                  <div className="card-actions">
                    <button className="btn btn-outline-slate btn-sm" onClick={() => handleViewClick(trip)} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ExternalLink size={12} />
                      <span>View Plan</span>
                    </button>
                    <button 
                      className="btn-icon-danger" 
                      onClick={() => onDelete(trip.id)} 
                      title="Delete Trip"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
