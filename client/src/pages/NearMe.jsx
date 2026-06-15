import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Bike, 
  Hotel, 
  Music, 
  Coffee, 
  Utensils, 
  ShoppingBag, 
  Camera, 
  Sun, 
  Car, 
  Sparkles, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export default function NearMe({ destinationCity }) {
  const [hasLocation, setHasLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(destinationCity || 'Delhi, India');
  const [coords, setCoords] = useState(null); // stores { lat, lng }
  const [activeCategory, setActiveCategory] = useState('cafes');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { id: 'scooter', label: 'Scooter Rental', icon: Bike },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'clubs', label: 'Clubs & Nightlife', icon: Music },
    { id: 'cafes', label: 'Cafes', icon: Coffee },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
    { id: 'attractions', label: 'Attractions', icon: Camera },
    { id: 'beaches', label: 'Beaches', icon: Sun },
    { id: 'car', label: 'Car Rental', icon: Car },
    { id: 'spa', label: 'Spa & Wellness', icon: Sparkles }
  ];

  const handleUseMyLocation = () => {
    setIsLoading(true);
    setErrorMessage('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Delhi';
              const country = data.address.country || 'India';
              setDetectedLocation(`${city}, ${country}`);
            } else {
              setDetectedLocation('Delhi, India');
            }
          } catch (err) {
            console.error('Error reverse geocoding:', err);
            setDetectedLocation('Delhi, India');
          }
          setHasLocation(true);
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation permission denied or error:', error);
          setDetectedLocation('Delhi, India');
          setCoords(null); // Fall back to Delhi defaults on backend
          setHasLocation(true);
          setIsLoading(false);
        },
        { timeout: 8000 }
      );
    } else {
      setDetectedLocation('Delhi, India');
      setCoords(null);
      setHasLocation(true);
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    if (catId) {
      fetchNearbyRecommendations(catId, searchQuery);
    }
  };

  const handleChangeLocation = () => {
    const newLoc = prompt('Enter city or location manually:', detectedLocation);
    if (newLoc && newLoc.trim() !== '') {
      setDetectedLocation(newLoc.trim());
      setCoords(null); // Clear coordinates so backend geocodes the new city name
      setPlaces([]);
      setHasSearched(false);
      setErrorMessage('');
    }
  };

  const fetchNearbyRecommendations = async (category, query) => {
    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage('');
    try {
      const q = query || '';
      let url = `/api/nearbyPlaces?category=${category || ''}&query=${encodeURIComponent(q)}&locationName=${encodeURIComponent(detectedLocation)}`;
      
      if (coords) {
        url += `&latitude=${coords.lat}&longitude=${coords.lng}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch nearby recommendations.');
      }

      setPlaces(data);
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      setErrorMessage(err.message);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNearbyRecommendations(activeCategory, searchQuery);
  };

  const handlePlaceClick = (place) => {
    if (place.place_id && place.lat && place.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}&query_place_id=${place.place_id}`, "_blank");
    } else if (place.lat && place.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.area)}`, "_blank");
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {!hasLocation ? (
        /* Allow Location Card - Screen 4 styled card */
        <div className="discover-wrapper" style={{ marginTop: '2rem' }}>
          <div className="discover-card">
            <div className="discover-icon-circle">
              <Navigation size={32} fill="#F26430" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Allow Location Access</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem' }}>We need your location to find places near you.</p>
            </div>
            <button 
              className={`btn btn-primary ${isLoading ? 'btn-disabled' : ''}`} 
              onClick={handleUseMyLocation}
              disabled={isLoading}
              style={{ padding: '0.8rem 1.8rem' }}
            >
              <Navigation size={16} fill="#FFFFFF" style={{ transform: 'rotate(45deg)' }} />
              <span>{isLoading ? 'Detecting Location...' : 'Use My Location'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Premium YatrAI "Near Me" Full Page Layout */
        <div className="nearme-container">
          
          {/* 1. Hero Title & Subtitle */}
          <div>
            <h2 className="nearme-hero-title">Find Near Me</h2>
            <p className="nearme-hero-subtitle">Discover hotels, cafes, clubs, rentals & more around you</p>
          </div>

          {/* 2. Centered Location Status Bar */}
          <div className="location-bar-container">
            <div className="location-info">
              <MapPin size={18} fill="#F26430" className="location-pin-icon" />
              <span>{detectedLocation}</span>
            </div>
            <button className="location-change-btn" onClick={handleChangeLocation}>
              <RefreshCw size={14} />
              <span>Change</span>
            </button>
          </div>

          {/* 3. Rounded Search Bar Section */}
          <form className="search-section-container" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <Search size={18} className="search-input-icon" />
              <input
                type="text"
                className="search-input-field"
                placeholder="Search anything... e.g. vegan restaurant, spa"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="search-action-btn">
              <Search size={16} />
              <span>Search</span>
            </button>
          </form>

          {/* 4. Center-aligned Category Pills */}
          <div className="category-pills-container">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill-item ${isActive ? 'active-pill' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <IconComp size={15} className="category-pill-icon" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.8rem 1.2rem', borderRadius: '10px', width: '100%', maxWidth: '600px', margin: '0 auto 1.5rem auto', textAlign: 'left', fontWeight: '500', lineHeight: '1.4' }}>
              <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>⚠️</span>
              <div>
                <strong>Error Searching:</strong> {errorMessage}
                <div style={{ fontSize: '0.78rem', color: '#7F1D1D', marginTop: '0.2rem', fontWeight: '400' }}>
                  Ensure both Google Places API and Google Geocoding API are fully enabled in your Google Cloud Console for this API key.
                </div>
              </div>
            </div>
          )}

          {/* 5. Results List or Screenshot-Exact Empty State Locator */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#F26430', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
              <p>Searching verified coordinates...</p>
            </div>
          ) : hasSearched && places.length > 0 ? (
            /* Discovery results */
            <div className="discover-list" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#10B981', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.6rem 1rem', borderRadius: '10px', marginBottom: '1.2rem', fontWeight: '500' }}>
                <ShieldCheck size={14} />
                <span>Showing verified search recommendations near: <strong>{detectedLocation}</strong></span>
              </div>

              {places.map((place, idx) => (
                <div 
                  key={idx} 
                  className="discover-item" 
                  style={{ width: '100%', cursor: 'pointer', position: 'relative' }}
                  onClick={() => handlePlaceClick(place)}
                  title="Open in Google Maps"
                >
                  <div className="discover-item-info">
                    <h4 className="discover-item-name">{place.name}</h4>
                    <div className="discover-item-meta">
                      <span className="rating-badge">★ {place.rating}</span>
                      <span>•</span>
                      <span style={{ fontWeight: '500' }}>{place.type}</span>
                      <span>•</span>
                      <span>{place.area}</span>
                    </div>
                  </div>
                  <div className="discover-item-aside">
                    <span className="price-level">{place.priceLevel}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>{place.distance}</span>
                    <span style={{ fontSize: '0.7rem', color: '#3B82F6', marginTop: '0.4rem', fontWeight: '500' }}>Open in Maps ↗</span>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched && places.length === 0 && !errorMessage ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              <MapPin size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '0.5rem' }}>No places found</h3>
              <p>We couldn't find any results for "{searchQuery || activeCategory}" near this location.</p>
            </div>
          ) : (
            /* Screenshot-Exact Waiting / Search state Empty Locator */
            <div className="empty-state-container">
              <MapPin size={52} strokeWidth={1.5} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}
