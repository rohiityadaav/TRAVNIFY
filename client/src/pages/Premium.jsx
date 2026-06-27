import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, RefreshCw, Star, Gem, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';
import { safeFetch } from '../lib/api';

export default function Premium({ setActiveTab }) {
  const { user, setUser, isAuthenticated, openAuthModalWithMessage } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  // 1. Determine active currency from user context (default to USD)
  const currency = user?.currency || 'USD';

  // 2. Price configuration matching the requirement
  const prices = {
    INR: {
      premiumMonthly: 199,
      premiumYearly: 999,
    },
    USD: {
      premiumMonthly: 5,
      premiumYearly: 49,
    },
  };

  const activePlanId = billingPeriod === 'yearly' ? 'premiumYearly' : 'premiumMonthly';
  const planPrices = prices[currency] || prices.USD;
  const displayPrice = planPrices[activePlanId];
  
  const currencySymbols = {
    INR: '₹',
    USD: '$'
  };
  const symbol = currencySymbols[currency] || '$';
  const periodLabel = billingPeriod === 'monthly' ? 'month' : 'year';

  const handleGetPremium = async () => {
    setErrorMsg('');
    
    // Ensure user is logged in
    if (!isAuthenticated) {
      openAuthModalWithMessage('signup', 'Create a free TRAVNIFY account to purchase Premium.');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Call backend to create Razorpay subscription
      const orderResponse = await safeFetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: billingPeriod
        })
      });

      const orderData = await orderResponse.json();
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to initialize subscription.');
      }

      // Check for Sandbox Simulation Mode
      if (orderData.sandbox) {
        console.log('Sandbox payment detected. Simulating verification.');
        
        // Simulating loading state for mock checkout
        setTimeout(async () => {
          try {
            const verifyRes = await safeFetch('/api/billing/verify-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_subscription_id: orderData.subscription_id,
                razorpay_payment_id: `pay_sandbox_${Math.random().toString(36).substring(2, 10)}`,
                razorpay_signature: '', // Sandbox simulation accepts empty signature
                plan: billingPeriod
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Sandbox payment verification failed.');
            }

            // Sync user state
            setUser(verifyData.user);
            trackEvent('premium_upgraded', { plan: billingPeriod, currency: currency, sandbox: true });
            setPaymentSuccess(true);
          } catch (err) {
            setErrorMsg(err.message);
          } finally {
            setIsLoading(false);
          }
        }, 1500);

      } else {
        // Production / Test Mode with Real Razorpay script
        if (typeof window.Razorpay === 'undefined') {
          throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
        }

        const options = {
          key: orderData.keyId,
          subscription_id: orderData.subscription_id,
          recurring: 1,
          name: "TRAVNIFY Premium",
          description: `Unlock Premium Membership (${billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'})`,
          image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F26430'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/%3E%3C/svg%3E",
          prefill: {
            name: orderData.user?.name || '',
            email: orderData.user?.email || ''
          },
          theme: {
            color: "#F26430"
          },
          handler: async function (response) {
            try {
              setIsLoading(true);
              const verifyRes = await safeFetch('/api/billing/verify-subscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: billingPeriod
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                setUser(verifyData.user);
                trackEvent('premium_upgraded', { plan: billingPeriod, currency: currency, sandbox: false });
                setPaymentSuccess(true);
              } else {
                setErrorMsg(verifyData.error || 'Subscription verification failed.');
              }
            } catch (err) {
              setErrorMsg('Verification Error: ' + err.message);
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
              trackEvent('premium_checkout_cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (err) {
      setErrorMsg(err.message);
      setIsLoading(true);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your Premium subscription? You will retain Premium access until the end of your current billing cycle.')) {
      return;
    }

    setIsCancelling(true);
    setErrorMsg('');
    setCancelSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await safeFetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription.');
      }
      setUser(data.user);
      setCancelSuccessMsg('Your subscription has been successfully cancelled. It will not renew at the end of the billing period.');
      trackEvent('premium_subscription_cancelled');
    } catch (err) {
      setErrorMsg('Cancellation failed: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const premiumFeatures = [
    { text: 'Unlimited AI travel plan generations (Never run out of limits!)' },
    { text: 'Unlimited "Refine Plan" (cheaper, relaxed, fun) modifications' },
    { 
      text: 'Hidden Gems: Discover AI-curated secrets and unexplored locations worldwide.',
      isNew: true,
      icon: 'gem'
    },
    { text: 'High-fidelity styled PDF downloads of your complete itineraries' },
    { text: 'Permanent saving of generated travel plans in your personal dashboard' },
    { text: 'Complete premium ad-free browsing experience' }
  ];

  if (paymentSuccess || (user && user.isPremium && !paymentSuccess)) {
    const planText = user?.subscriptionType === 'yearly' ? 'Yearly Pass' : 'Monthly Pass';
    const amountSymbol = user?.preferredCurrency === 'USD' ? '$' : '₹';
    const planAmount = user?.subscriptionType === 'yearly'
      ? (user?.preferredCurrency === 'USD' ? '49' : '999')
      : (user?.preferredCurrency === 'USD' ? '5' : '199');
    const billingAmountStr = `${amountSymbol}${planAmount} per ${user?.subscriptionType === 'yearly' ? 'year' : 'month'}`;

    return (
      <div className="premium-success-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem', background: '#FFFFFF', borderRadius: '16px', boxShadow: 'var(--card-shadow)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <ShieldCheck size={48} color="#10B981" />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>TRAVNIFY Premium Active</h2>
        <p style={{ color: 'var(--text-medium)', fontSize: '1rem', lineHeight: '1.5', marginBottom: '2rem' }}>
          Welcome to the inner circle! All premium privileges are now unlocked. You can now refine itineraries endlessly, access exclusive Hidden Gems, and save maps to PDF.
        </p>

        <div style={{ background: '#F8FAFC', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)', textAlign: 'left', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.92rem' }}>
          <div><strong>Active Account:</strong> {user?.email}</div>
          <div><strong>License Type:</strong> Travnify Premium ({planText})</div>
          <div><strong>Billing Amount:</strong> {billingAmountStr}</div>
          {user?.subscriptionEnd && (
            <div>
              <strong>{user?.subscriptionStatus === 'cancelled' ? 'Expires On:' : 'Next Renewal Date:'}</strong>{' '}
              {new Date(user.subscriptionEnd).toLocaleDateString()}
            </div>
          )}
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ 
              textTransform: 'capitalize', 
              color: user?.subscriptionStatus === 'cancelled' ? '#EF4444' : '#10B981', 
              fontWeight: '700' 
            }}>
              {user?.subscriptionStatus || 'active'}
            </span>
          </div>
        </div>

        {cancelSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '1rem', color: '#10B981', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {cancelSuccessMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '1rem', color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {errorMsg}
          </div>
        )}

        {user?.subscriptionStatus !== 'cancelled' ? (
          <button 
            className={`btn btn-secondary ${isCancelling ? 'btn-disabled' : ''}`}
            onClick={handleCancelSubscription}
            disabled={isCancelling}
            style={{ width: '100%', borderColor: '#EF4444', color: '#EF4444', marginBottom: '1rem' }}
          >
            {isCancelling ? <RefreshCw size={18} className="animate-spin" style={{ marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} /> : null}
            <span>Cancel Subscription</span>
          </button>
        ) : null}

        <button className="btn btn-primary" onClick={() => setActiveTab('plan')} style={{ width: '100%' }}>
          <span>Start Premium Planning</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '1rem auto 3rem auto' }}>
      {/* Back Button */}
      <button 
        onClick={() => setActiveTab('home')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', background: 'transparent', color: 'var(--text-medium)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '1.5rem', padding: '0.5rem 0' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      {/* Main Page Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Intro Hero */}
        <div style={{ textAlign: 'center' }}>
          <div className="pricing-badge" style={{ display: 'inline-flex', background: 'rgba(242, 100, 48, 0.1)', color: 'var(--primary)', padding: '0.4rem 1.2rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '1rem', border: '1px solid rgba(242, 100, 48, 0.15)' }}>
            <Star size={14} fill="#F26430" style={{ marginRight: '0.3rem', alignSelf: 'center' }} />
            <span>Elevate Your Journeys</span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.2', color: 'var(--text-dark)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            Go Premium, Explore Boldly
          </h1>
          <p style={{ color: 'var(--text-medium)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Ditch the limits. Access state-of-the-art AI refinement modifiers, localized maps, high-fidelity PDFs, and our exclusive global Hidden Gems dashboard.
          </p>
        </div>

        {/* Pricing Layout Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }} className="responsive-premium-grid">
          
          {/* Main Plan Card */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid var(--primary-glow)', borderRadius: '20px', padding: '2.5rem', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', overflow: 'hidden' }}>
            
            {/* Savings Accent Ribbon */}
            {billingPeriod === 'yearly' && (
              <div style={{ position: 'absolute', top: '20px', right: '-35px', background: 'var(--primary)', color: '#FFFFFF', padding: '0.3rem 3rem', transform: 'rotate(45deg)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                Best Value
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)' }}>TRAVNIFY Premium Pass</h3>
                <p style={{ color: 'var(--text-medium)', fontSize: '0.9rem' }}>Pricing based on your country settings</p>
              </div>

              {/* Billing Cycle Selector Buttons */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.3rem', borderRadius: '99px', border: '1px solid rgba(0,0,0,0.03)' }}>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  style={{
                    background: billingPeriod === 'monthly' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    padding: '0.5rem 1.2rem',
                    borderRadius: '99px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: billingPeriod === 'monthly' ? 'var(--text-dark)' : 'var(--text-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: billingPeriod === 'monthly' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  style={{
                    background: billingPeriod === 'yearly' ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    padding: '0.5rem 1.2rem',
                    borderRadius: '99px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: billingPeriod === 'yearly' ? 'var(--text-dark)' : 'var(--text-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: billingPeriod === 'yearly' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  Yearly <span style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: '800', marginLeft: '0.2rem' }}>Save 20%</span>
                </button>
              </div>
            </div>

            {/* Price block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '1.5rem', borderRadius: '14px', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '3.2rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-1px' }}>{symbol}{displayPrice}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-medium)', fontWeight: '500', marginLeft: '0.3rem' }}>/ {periodLabel}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-medium)', fontWeight: '600', background: 'rgba(0,0,0,0.02)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                Active Currency: <strong style={{ color: 'var(--text-dark)' }}>{currency}</strong>
              </div>
            </div>

            {/* Premium Benefits List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-dark)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>All Included Privileges:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }} className="premium-feature-grid">
                {premiumFeatures.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                    {feat.icon === 'gem' ? (
                      <Gem size={18} style={{ color: '#D97706', marginTop: '0.2rem', flexShrink: 0 }} fill="#D97706" />
                    ) : (
                      <CheckCircle size={18} style={{ color: 'var(--success)', marginTop: '0.2rem', flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: '1rem', color: 'var(--text-medium)', textAlign: 'left', lineHeight: '1.5' }}>
                      {feat.text}
                      {feat.isNew && (
                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(242, 100, 48, 0.1)', color: 'var(--primary)', border: '1px solid rgba(242, 100, 48, 0.2)', marginLeft: '0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '800', display: 'inline-block', verticalAlign: 'middle' }}>
                          New
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--danger)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Sandbox Simulation indicator */}
            <div style={{ display: 'flex', gap: '0.8rem', background: 'rgba(30, 41, 59, 0.04)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-medium)', lineHeight: '1.4', alignItems: 'center' }}>
              <ShieldCheck size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <div>
                <strong>Secured via Razorpay:</strong> All interactions use 256-bit secure gateway tunnels. Testing is simulated via local sandbox bypass.
              </div>
            </div>

            {/* Main Buy Button */}
            <button
              onClick={handleGetPremium}
              disabled={isLoading}
              className={`btn btn-primary ${isLoading ? 'btn-disabled' : ''}`}
              style={{ width: '100%', height: '52px', fontSize: '1.1rem', fontWeight: '700' }}
            >
              {isLoading ? (
                <RefreshCw size={20} className="animate-spin" style={{ marginRight: '0.5rem' }} />
              ) : null}
              <span>{isLoading ? 'Processing Order...' : `Get Premium Pass`}</span>
            </button>

            {/* Compliance Disclaimer */}
            <p style={{
              fontSize: '0.74rem',
              color: '#64748B',
              textAlign: 'center',
              lineHeight: '1.4',
              margin: '0.6rem auto 0 auto',
              maxWidth: '380px'
            }}>
              Renews automatically every {periodLabel}. You can cancel anytime from your account settings or payment app.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
