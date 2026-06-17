import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, RefreshCw, Star, Gem } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { safeFetch } from '../lib/api';
import { PLAN_PRICES, RAZORPAY_SUPPORTED_CURRENCIES, formatPrice, getCurrencySymbol, convertFromINR } from '../lib/currency';

export default function PricingModal({ isOpen, onClose, user, onUpgradeSuccess }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Determine user's preferred currency
  const prefCurrency = user?.preferredCurrency || 'INR';
  const activePlanId = billingPeriod === 'yearly' ? 'premiumYearly' : 'premiumMonthly';
  const periodLabel = billingPeriod === 'monthly' ? 'month' : 'year';

  // Get the plan price in user's preferred currency
  const planPriceMap = PLAN_PRICES[activePlanId] || {};
  const displayPrice = planPriceMap[prefCurrency] ?? planPriceMap['USD'];
  const displayPriceStr = formatPrice(displayPrice, prefCurrency);
  const prefSymbol = getCurrencySymbol(prefCurrency);

  // INR base prices (for reference note when user is non-INR)
  const BASE_INR = { premiumMonthly: 199, premiumYearly: 999 };
  const basePriceINR = BASE_INR[activePlanId];
  const showINRNote = prefCurrency !== 'INR';

  // Razorpay will be charged in prefCurrency if supported, else INR
  const chargeInPrefCurrency = RAZORPAY_SUPPORTED_CURRENCIES.has(prefCurrency);
  const chargeNote = chargeInPrefCurrency
    ? `Charged in ${prefCurrency} via Razorpay`
    : `Charged in INR (₹${basePriceINR}) — converted at checkout`;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // 1. Create order on the backend (pass preferredCurrency)
      const token = localStorage.getItem('token');
      const orderResponse = await safeFetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          planId: activePlanId,
          currency: prefCurrency
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment.');
      }

      if (orderData.sandbox) {
        // --- DEVELOPMENT SANDBOX MOCK CODE BLOCK ---
        setTimeout(async () => {
          try {
            const verifyRes = await safeFetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: orderData.orderId,
                razorpay_payment_id: `pay_sandbox_${Math.random().toString(36).substring(2, 10)}`,
                razorpay_signature: '',
                planId: activePlanId,
                billingPeriod
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Signature verification failed.');
            }

            onUpgradeSuccess(verifyData.user);
            onClose();
            alert('🚀 Congratulations! Your TRAVNIFY Premium Membership is now ACTIVE.');
          } catch (err) {
            alert('Payment verification failed: ' + err.message);
          } finally {
            setIsLoading(false);
          }
        }, 1500);
      } else {
        // --- PRODUCTION RAZORPAY CODE BLOCK ---
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "TRAVNIFY Premium",
          description: `Upgrade to Premium (${billingPeriod})`,
          order_id: orderData.orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || ''
          },
          theme: {
            color: "#F26430"
          },
          handler: async function (response) {
            try {
              const verifyRes = await safeFetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: activePlanId,
                  billingPeriod
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                onUpgradeSuccess(verifyData.user);
                onClose();
                alert('🚀 Congratulations! Your TRAVNIFY Premium Membership is now ACTIVE.');
              } else {
                alert('Payment verification failed: ' + (verifyData.error || 'Unknown error'));
              }
            } catch (err) {
              alert('Payment verification error: ' + err.message);
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (err) {
      alert('Error during subscription setup: ' + err.message);
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    { text: 'Unlimited AI travel plan generations' },
    { text: 'Unlimited "Refine Plan" (cheaper, relaxed, fun) modifications' },
    { 
      text: 'Hidden Gems: Unlock AI‑curated secret spots and unexplored places worldwide.',
      isNew: true,
      icon: 'gem'
    },
    { text: 'High-fidelity styled PDF downloads of your itineraries' },
    { text: 'Permanent saving of generated travel plans in your dashboard' },
    { text: 'Complete premium ad-free browsing experience' }
  ];

  return (
    <div className="modal-overlay premium-modal-overlay">
      <div className="modal-content premium-modal-content" style={{ maxWidth: '460px' }}>
        <button className="modal-close-btn premium-close-btn" onClick={onClose} disabled={isLoading} aria-label="Close premium details">
          <X size={20} />
        </button>

        <div className="premium-scroll-area">
          <div className="pricing-card-details">
            {/* Header */}
            <div className="pricing-badge">
              <Star size={12} fill="#F26430" style={{ display: 'inline-block', marginRight: '0.2rem', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>Premium access</span>
            </div>

            <h3 className="modal-title premium-title" style={{ marginBottom: '0.2rem' }}>TRAVNIFY Premium</h3>
            <p className="premium-subtitle" style={{ color: '#475569', fontSize: '0.88rem', marginTop: '-0.3rem', textTransform: 'capitalize' }}>
              Unleash the full power of AI for your global trips
            </p>

            {/* Billing Switch Toggle */}
            <div className="premium-billing-toggle" style={{ display: 'flex', background: '#F1F5F9', padding: '0.3rem', borderRadius: '99px', marginTop: '0.4rem', border: '1px solid rgba(0,0,0,0.03)' }}>
              <button
                type="button"
                onClick={() => !isLoading && setBillingPeriod('monthly')}
                className={`premium-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
                style={{
                  background: billingPeriod === 'monthly' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  padding: '0.4rem 1.2rem',
                  borderRadius: '99px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: billingPeriod === 'monthly' ? 'var(--text-dark)' : 'var(--text-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => !isLoading && setBillingPeriod('yearly')}
                className={`premium-toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
                style={{
                  background: billingPeriod === 'yearly' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  padding: '0.4rem 1.2rem',
                  borderRadius: '99px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: billingPeriod === 'yearly' ? 'var(--text-dark)' : 'var(--text-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Yearly <span style={{ color: '#F26430', fontSize: '0.7rem', fontWeight: '800' }}>Save 20%</span>
              </button>
            </div>

            {/* Large Price Display */}
            <div className="pricing-amount-row" style={{ marginTop: '0.5rem' }}>
              <span className="price-big-number">{displayPriceStr}</span>
              <span className="price-period">/ {periodLabel}</span>
            </div>

            {/* Secondary charge note */}
            <div style={{
              fontSize: '0.78rem',
              color: '#94A3B8',
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              flexWrap: 'wrap'
            }}>
              {showINRNote && (
                <span style={{ color: '#64748B' }}>≈ ₹{basePriceINR} / {periodLabel}</span>
              )}
              {showINRNote && <span>•</span>}
              <span>{chargeNote}</span>
            </div>

            {/* Feature list */}
            <div className="pricing-features-list">
              {premiumFeatures.map((feat, idx) => (
                <div key={idx} className="feature-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  {feat.icon === 'gem' ? (
                    <Gem size={15} className="feature-icon-check" style={{ color: '#D97706', marginTop: '0.2rem', flexShrink: 0 }} fill="#D97706" />
                  ) : (
                    <CheckCircle size={15} className="feature-icon-check" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '0.92rem', lineHeight: '1.4', textAlign: 'left' }}>
                    {feat.text}
                    {feat.isNew && (
                      <span 
                        className="badge-tag" 
                        style={{ 
                          fontSize: '0.68rem', 
                          padding: '0.1rem 0.4rem', 
                          background: 'var(--primary-light-bg)', 
                          color: 'var(--primary)', 
                          border: '1px solid rgba(242, 100, 48, 0.2)',
                          marginLeft: '0.4rem',
                          textTransform: 'uppercase',
                          fontWeight: '800',
                          display: 'inline-block',
                          verticalAlign: 'middle'
                        }}
                      >
                        New
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Sandbox Info Bar */}
            <div className="sandbox-alert-flag">
              <ShieldCheck size={16} className="feature-icon-check" style={{ color: '#1D4ED8' }} />
              <div style={{ lineHeight: '1.3' }}>
                <strong>Sandbox Checkout Active:</strong> Simulated payments enabled. Upgrades your profile instantly for immediate testing.
              </div>
            </div>

            {/* CTA Upgrade Trigger */}
            <button
              className={`btn btn-primary premium-cta-btn ${isLoading ? 'btn-disabled' : ''}`}
              onClick={handleUpgrade}
              disabled={isLoading}
              style={{ width: '100%', height: '48px', fontSize: '1.02rem' }}
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : null}
              <span>{isLoading ? 'Activating...' : `Get Premium – ${displayPriceStr} / ${periodLabel}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
