import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, DollarSign, Tag, PlaneTakeoff, Heart } from 'lucide-react';
import { CURRENCIES } from '../lib/currency';

export default function PlanTrip({ onGenerate, isLoading, user }) {
  console.log(`[DEBUG Loading] [${new Date().toISOString()}] PlanTrip rendered - isLoading: ${isLoading}`);
  const [prompt, setPrompt] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  // Pre-select user's preferred currency; fall back to INR
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'INR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [dateError, setDateError] = useState('');

  // Sync currency to user's preferredCurrency when user data loads
  useEffect(() => {
    if (user?.preferredCurrency) {
      setCurrency(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  useEffect(() => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        setDateError("FROM date cannot be after TO date.");
      } else {
        setDateError('');
      }
    } else if (startDate || endDate) {
      setDateError("Please select both FROM and TO dates to generate your trip.");
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const interestList = [
    { id: 'beach', label: 'Beach 🏖️' },
    { id: 'trek', label: 'Mountain Trek ⛰️' },
    { id: 'food', label: 'Food Tasting 🍲' },
    { id: 'nightlife', label: 'Nightlife 🍻' },
    { id: 'shopping', label: 'Shopping 🛍️' },
    { id: 'culture', label: 'Culture/History 🏛️' }
  ];

  const samplePrompts = [
    "Mujhe Bali jaana hai, budget 60,000 ₹, 7 din ke liye, beach + party + shopping.",
    "Manali trip 5 days, budget 15k, trekking aur mountain views chahiye.",
    "Paris for 5 days, $1500 budget, museums, cafes, Eiffel Tower, romantic vibe.",
    "Goa weekend trip 3 days, budget 12k, beach parties aur seafood."
  ];

  const handleInterestToggle = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSampleClick = (sample) => {
    setPrompt(sample);
    
    // Auto-parse rough details to fill inputs where possible
    if (sample.toLowerCase().includes('bali')) {
      setDestination('Bali, Indonesia');
      setBudget('60000');
      setCurrency('INR');
      setSelectedInterests(['beach', 'nightlife', 'shopping']);
    } else if (sample.toLowerCase().includes('manali')) {
      setDestination('Manali, India');
      setBudget('15000');
      setCurrency('INR');
      setSelectedInterests(['trek']);
    } else if (sample.toLowerCase().includes('paris')) {
      setDestination('Paris, France');
      setBudget('1500');
      setCurrency('USD');
      setSelectedInterests(['culture', 'food']);
    } else if (sample.toLowerCase().includes('goa')) {
      setDestination('Goa, India');
      setBudget('12000');
      setCurrency('INR');
      setSelectedInterests(['beach', 'nightlife', 'food']);
    }
  };

  const showInterestsTip = selectedInterests.length > 3;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setDateError("Please select both FROM and TO dates to generate your trip.");
      return;
    }
    if (startDate > endDate) {
      setDateError("FROM date cannot be after TO date.");
      return;
    }
    if (!prompt.trim() && !destination.trim()) return;

    setDateError('');
    onGenerate({
      prompt: prompt || `Trip to ${destination} within budget ${budget} ${currency}`,
      destination: destination || (prompt.toLowerCase().includes('bali') ? 'Bali' : prompt.toLowerCase().includes('manali') ? 'Manali' : prompt.toLowerCase().includes('paris') ? 'Paris' : prompt.toLowerCase().includes('goa') ? 'Goa' : 'Destination'),
      budget: budget ? Number(budget) : (prompt.toLowerCase().includes('60,000') || prompt.toLowerCase().includes('60k') ? 60000 : prompt.toLowerCase().includes('15k') || prompt.toLowerCase().includes('15,000') ? 15000 : prompt.toLowerCase().includes('1500') ? 1500 : prompt.toLowerCase().includes('12k') || prompt.toLowerCase().includes('12,000') ? 12000 : 15000),
      currency: currency || (prompt.includes('$') || prompt.toLowerCase().includes('usd') ? 'USD' : 'INR'),
      startDate,
      endDate,
      interests: selectedInterests.length > 0 ? selectedInterests : ['general']
    });
  };

  return (
    <div className="plan-wizard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Build version chip — confirms latest deployment is active */}
      <div style={{
        position: 'absolute', top: '0.5rem', right: '0.75rem',
        fontSize: '0.6rem', color: 'rgba(148,163,184,0.6)',
        background: 'rgba(0,0,0,0.04)', borderRadius: '99px',
        padding: '0.2rem 0.55rem', letterSpacing: '0.04em', userSelect: 'none'
      }}>
        Build: auth-roles-v1
      </div>
      <h2 className="wizard-title">Where do you want to go?</h2>
      <p className="wizard-subtitle" style={{ marginBottom: user ? '0.5rem' : '1.5rem' }}>
        Describe your dream trip in any language — our AI will handle the rest
      </p>

      {user && (
        user.isPremium ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.9rem',
            background: '#FFF7ED',
            color: '#C2410C',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 2px rgba(249, 115, 22, 0.05)'
          }}>
            <span>⭐ Travnify Premium Active</span>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.9rem',
            background: '#F1F5F9',
            color: '#475569',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <span>
              ⚡ Daily AI Credits: {user.dailyCreditsUsed || 0} / 5 used
              {user.dailyCreditsUsed >= 5 && user.freeCreditsResetInMinutes > 0 && (
                ` (Resets in ${Math.floor(user.freeCreditsResetInMinutes / 60)}h ${user.freeCreditsResetInMinutes % 60}m)`
              )}
            </span>
          </div>
        )
      )}

      <form onSubmit={handleSubmit} className="input-box-wrapper">
        {/* Main Natural Language Text Area */}
        <textarea
          className="wizard-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "Mujhe Bali jaana hai, budget 60,000 ₹, 7 din ke liye, beach + party..."'
          disabled={isLoading}
        ></textarea>

        {/* Structured Inputs (Collapsible or visible for high flexibility) */}
        <div className="structured-inputs-grid">
          <div className="form-group form-group-destination">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><PlaneTakeoff size={12} /> Destination</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Goa, Paris, Manali"
              disabled={isLoading}
            />
          </div>

          <div className="form-group form-group-budget">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><DollarSign size={12} /> Max Budget</span>
            </label>
            <div className="budget-input-group">
              <input
                type="number"
                className="form-input budget-limit-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Limit"
                disabled={isLoading}
              />
              <select
                className="form-input currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isLoading}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group form-group-dates">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Calendar size={12} /> Dates</span>
            </label>
            <div className="date-range-group">
              <input
                type="date"
                className="form-input date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                required
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                className="form-input date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
        </div>

        {/* Interests Selector */}
        <div className="form-group" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '1rem' }}>
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Tag size={12} /> Select Vibe / Interests</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
            {interestList.map((interest) => {
              const active = selectedInterests.includes(interest.id);
              return (
                <div
                  key={interest.id}
                  className={`filter-pill ${active ? 'active' : ''}`}
                  onClick={() => !isLoading && handleInterestToggle(interest.id)}
                  style={{ padding: '0.35rem 1rem', fontSize: '0.8rem', margin: 0 }}
                >
                  <span>{interest.label}</span>
                </div>
              );
            })}
          </div>
          {showInterestsTip && (
            <p style={{ color: '#F59E0B', fontSize: '0.82rem', fontWeight: '500', marginTop: '0.6rem', textAlign: 'left' }}>
              ⚠️ For best results, we recommend choosing up to 3 interests. Extra selections will be trimmed automatically.
            </p>
          )}
        </div>

        {dateError && (
          <div style={{ color: '#EF4444', fontSize: '0.875rem', fontWeight: '500', marginTop: '0.5rem', marginBottom: '0.5rem', textAlign: 'left' }}>
            ⚠️ {dateError}
          </div>
        )}

        {/* CTA Generate Button */}
        <button
          type="submit"
          className={`btn btn-primary btn-lg ${(!prompt.trim() && !destination.trim()) || !startDate || !endDate || startDate > endDate ? 'btn-disabled' : ''}`}
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={(!prompt.trim() && !destination.trim()) || !startDate || !endDate || startDate > endDate}
        >
          <Sparkles size={18} fill="#FFFFFF" />
          <span>Generate My Trip Plan</span>
        </button>
      </form>

      {/* Quick Prompts List */}
      <div className="try-prompts-section">
        <div className="try-title">
          <Heart size={14} fill="#F26430" color="#F26430" />
          <span>Try one of these:</span>
        </div>
        <div className="prompts-tags-flex">
          {samplePrompts.map((sample, idx) => (
            <button
              key={idx}
              className="prompt-tag"
              onClick={() => handleSampleClick(sample)}
              disabled={isLoading}
              type="button"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
