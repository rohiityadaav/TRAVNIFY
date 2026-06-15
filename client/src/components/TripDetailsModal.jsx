import React from 'react';
import { X, MapPin, Clock, Wallet, Sparkles, Map, CheckCircle2 } from 'lucide-react';

export default function TripDetailsModal({ isOpen, trip, onClose, onUseTemplate }) {
  if (!isOpen || !trip) return null;

  // Split itinerary by newline for a beautiful day-by-day timeline view
  const itinerarySteps = trip.itinerary
    ? trip.itinerary.split('\n').filter((line) => line.trim().length > 0)
    : [];

  return (
    <div className="modal-overlay" style={{ zIndex: '200' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '650px', 
          width: '90%', 
          padding: '0', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'col',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          background: '#ffffff'
        }}
      >
        {/* Top Hero Section */}
        <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden' }}>
          <img 
            src={trip.image} 
            alt={trip.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' 
            }} 
          />
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="modal-close-btn" 
            style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px', 
              background: 'rgba(0,0,0,0.5)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.2s ease',
              padding: '0'
            }}
            aria-label="Close template details"
          >
            <X size={18} />
          </button>

          {/* Heading overlay */}
          <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px', color: '#ffffff' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {trip.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    background: 'rgba(242, 100, 48, 0.85)', 
                    color: '#ffffff', 
                    padding: '3px 10px', 
                    borderRadius: '99px' 
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)', lineHeight: '1.2' }}>
              {trip.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', opacity: '0.9', fontWeight: '500' }}>
              <MapPin size={13} style={{ color: '#F26430' }} />
              <span>{trip.location}</span>
            </div>
          </div>
        </div>

        {/* Scrollable details container */}
        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Key Metrics */}
          <div style={{ display: 'flex', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.05em' }}>Duration</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: '700', fontSize: '15px' }}>
                <Clock size={16} style={{ color: '#F26430' }} />
                <span>{trip.days} Days</span>
              </div>
            </div>
            <div style={{ width: '1px', background: '#E2E8F0' }} />
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.05em' }}>Min Budget</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: '700', fontSize: '15px' }}>
                <Wallet size={16} style={{ color: '#10B981' }} />
                <span>{trip.minBudget}</span>
              </div>
            </div>
            <div style={{ width: '1px', background: '#E2E8F0' }} />
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.05em' }}>Route</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Map size={16} style={{ color: '#3B82F6' }} />
                <span title={trip.route || trip.location} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {trip.route || trip.location}
                </span>
              </div>
            </div>
          </div>

          {/* Places Covered & Key Activities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Places */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F26430' }}></span>
                Places Covered
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {trip.placesCovered.map((place, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      fontSize: '12px', 
                      background: '#EFF6FF', 
                      color: '#2563EB', 
                      padding: '4px 12px', 
                      borderRadius: '8px', 
                      fontWeight: '600',
                      border: '1px solid #DBEAFE'
                    }}
                  >
                    {place}
                  </span>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                Key Activities
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {trip.activities.map((activity, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      fontSize: '12px', 
                      background: '#ECFDF5', 
                      color: '#059669', 
                      padding: '4px 12px', 
                      borderRadius: '8px', 
                      fontWeight: '600',
                      border: '1px solid #D1FAE5'
                    }}
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline / Itinerary section */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} style={{ color: '#F26430' }} />
              Itinerary Highlights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
              {/* Vertical timeline line */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  bottom: '8px', 
                  left: '6px', 
                  width: '2px', 
                  background: '#E2E8F0' 
                }} 
              />
              
              {itinerarySteps.map((step, idx) => {
                const parts = step.split(':');
                const title = parts[0];
                const desc = parts.slice(1).join(':').trim();

                return (
                  <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* Timeline bullet dot */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        left: '-20px', 
                        top: '4px', 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: '#F26430',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 0 2px #FFE4E6'
                      }} 
                    />
                    <strong style={{ fontSize: '13.5px', color: '#1E293B', fontWeight: '700' }}>
                      {title}
                    </strong>
                    {desc && (
                      <span style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                        {desc}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Sticky CTA Action Section */}
        <div 
          style={{ 
            padding: '16px 24px', 
            background: '#F8FAFC', 
            borderTop: '1px solid #E2E8F0', 
            display: 'flex', 
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <button 
            onClick={onClose} 
            className="btn" 
            style={{ 
              background: '#ffffff', 
              border: '1px solid #CBD5E1', 
              color: '#475569', 
              padding: '10px 20px', 
              borderRadius: '99px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onUseTemplate(trip)}
            className="btn btn-primary" 
            style={{ 
              background: '#F26430', 
              color: '#ffffff', 
              padding: '10px 24px', 
              borderRadius: '99px',
              fontSize: '14px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(242, 100, 48, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>Use This Template</span>
          </button>
        </div>

      </div>
    </div>
  );
}
