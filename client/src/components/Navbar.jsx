import React, { useState } from 'react';
import { Map, Star, MapPin, Compass as ExploreIcon, BookOpen, LogOut, Shield, ChevronDown, User, Sparkles, Menu, X } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, openAuthModal, openPricingModal }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      {/* Brand Logo */}
      <a href="#" className="nav-brand" onClick={() => handleNavClick('home')} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        {/* Orange rounded-square with Lucide Map icon — exact match of uploaded logo */}
        <div style={{
          background: '#F26430',
          borderRadius: '12px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(242, 100, 48, 0.30)',
        }}>
          <Map size={22} color="#FFFFFF" strokeWidth={2} />
        </div>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.5rem', color: 'var(--text-dark)', letterSpacing: '0.5px' }}>TRAVNIFY</span>
      </a>

      {/* Main Tab Navigations */}
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <div
          className={`nav-item ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => handleNavClick('plan')}
        >
          <Sparkles size={16} />
          <span>Plan Trip</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => handleNavClick('explore')}
        >
          <ExploreIcon size={16} />
          <span>Explore</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'near-me' ? 'active' : ''}`}
          onClick={() => handleNavClick('near-me')}
        >
          <MapPin size={16} />
          <span>Near Me</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'my-trips' ? 'active' : ''}`}
          onClick={() => handleNavClick('my-trips')}
        >
          <BookOpen size={16} />
          <span>My Trips</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'premium' ? 'active' : ''}`}
          onClick={() => handleNavClick('premium')}
        >
          <Star size={16} fill={activeTab === 'premium' ? '#F59E0B' : 'transparent'} color="#F59E0B" />
          <span>Premium</span>
        </div>
      </nav>

      {/* Actions / Auth States */}
      <div className={`nav-actions ${menuOpen ? 'open' : ''}`}>
        {user && (
          <button 
            type="button" 
            className="btn-premium-nav" 
            onClick={() => { setMenuOpen(false); handleNavClick('premium'); }}
          >
            <Star size={14} fill="#F59E0B" color="#F59E0B" />
            <span>Premium</span>
          </button>
        )}
        {user ? (
          <div className="user-menu-wrapper">
            <div 
              className="user-avatar-circle" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.4rem 0.8rem', width: 'auto', borderRadius: '99px' }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getInitials(user.name)}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', paddingLeft: '0.2rem', paddingRight: '0.2rem' }}>
                {user.name}
              </span>
              <ChevronDown size={14} />
            </div>

            {dropdownOpen && (
              <div className="user-menu-dropdown">
                <div style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#94A3B8', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  Logged in as <strong style={{ color: '#475569' }}>{user.email}</strong>
                  {user.isPremium && (
                    <div style={{ marginTop: '0.4rem', color: '#F26430', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Shield size={12} fill="#F26430" /> Premium Active
                    </div>
                  )}
                </div>
                
                <button className="dropdown-item" onClick={() => handleNavClick('my-trips')}>
                  <BookOpen size={14} />
                  <span>My Planned Trips</span>
                </button>
                
                {!user.isPremium && (
                  <button className="dropdown-item" onClick={() => { setMenuOpen(false); setDropdownOpen(false); handleNavClick('premium'); }} style={{ color: '#F26430', fontWeight: '600' }}>
                    <Shield size={14} />
                    <span>Get Premium</span>
                  </button>
                )}
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); setDropdownOpen(false); onLogout(); }} style={{ color: '#EF4444' }}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => { setMenuOpen(false); openAuthModal('login'); }}>
              <User size={14} />
              <span>Sign In</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setMenuOpen(false); setActiveTab('plan'); }}>
              <Sparkles size={14} />
              <span>Start Planning</span>
            </button>
          </>
        )}
      </div>

      {/* Mobile Hamburger Menu Toggle Button */}
      <button
        type="button"
        className="navbar-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  );
}
