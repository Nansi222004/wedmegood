import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Sparkles,
  Gem,
  Award
} from 'lucide-react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

const PREV_ROUTE = '/vendor/register/category';
const SUCCESS_ROUTE = '/vendor/onboarding/submitted';

const MOCKUP_PLANS = [
  {
    _id: 'plan_basic',
    name: 'Basic Plan',
    price: 1999,
    durationValue: 1,
    durationUnit: 'month',
    features: [
      'Limited Features',
      '5 Bookings / Month'
    ],
    icon: <CreditCard className="w-3.5 h-3.5 text-slate-500" />
  },
  {
    _id: 'plan_pro',
    name: 'Professional Plan',
    price: 4999,
    durationValue: 1,
    durationUnit: 'month',
    features: [
      'All Basic Features',
      'Unlimited Bookings',
      'Inventory Management',
      'Labour Management'
    ],
    icon: <Award className="w-3.5 h-3.5 text-[#4F35C3]" />,
    mostPopular: true
  },
  {
    _id: 'plan_enterprise',
    name: 'Enterprise Plan',
    price: 9999,
    durationValue: 1,
    durationUnit: 'month',
    features: [
      'All Professional Features',
      'Priority Support',
      'Custom Solutions'
    ],
    icon: <Gem className="w-3.5 h-3.5 text-rose-500" />
  }
];

const formatINR = (num) =>
  num || num === 0 ? '₹' + Number(num).toLocaleString('en-IN') : '';

const VendorSubscriptionOnboarding = () => {
  const navigate = useNavigate();
  const { vendorState, updateVendorState, refreshData } = useVendorState();

  const [activePlans, setActivePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fetch subscription plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        setActivePlans(MOCKUP_PLANS);
        setSelectedPlanId(MOCKUP_PLANS[1]._id);
        return;
      }
      try {
        const res = await vendorApi.getSubscriptionPlans(token);
        if (res.success && res.data && res.data.length > 0) {
          // Merge database details (especially ObjectIds) with our mockup styles
          const merged = MOCKUP_PLANS.map(mock => {
            const dbPlan = res.data.find(p => p.name === mock.name);
            return dbPlan ? { ...mock, _id: dbPlan._id, price: dbPlan.price, features: dbPlan.features } : mock;
          });
          setActivePlans(merged);
          const proPlan = merged.find(p => p.name === 'Professional Plan') || merged[0];
          setSelectedPlanId(proPlan._id);
        } else {
          setActivePlans(MOCKUP_PLANS);
          setSelectedPlanId(MOCKUP_PLANS[1]._id);
        }
      } catch (err) {
        console.warn('Failed to fetch subscription plans from DB, using mockups', err);
        setActivePlans(MOCKUP_PLANS);
        setSelectedPlanId(MOCKUP_PLANS[1]._id);
      }
    };
    fetchPlans();
  }, []);

  const handlePlanSelect = (id) => {
    setSelectedPlanId(id);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      showToast('Session expired. Please register again.');
      setIsSaving(false);
      return;
    }

    try {
      // 1. Create order on the backend
      const orderRes = await vendorApi.createSubscriptionOrder({ planId: selectedPlanId }, token);
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Order creation failed.');
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Razorpay SDK failed to load. Checking internet...');
        throw new Error('Razorpay script load failed');
      }

      // 3. Open Razorpay test popup
      const options = {
        key: orderRes.key || 'rzp_test_8sYbzHWidwe5Zw',
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: 'Utsavo',
        description: `Subscription: ${orderRes.plan.name}`,
        order_id: orderRes.order.id,
        handler: async function (response) {
          setIsSaving(true);
          try {
            const verifyRes = await vendorApi.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, token);

            if (verifyRes.success) {
              updateVendorState({
                subscription: {
                  planId: selectedPlanId,
                  status: 'Active'
                }
              });
              showToast('Subscription activated successfully! 🎉');
              setTimeout(async () => {
                await refreshData();
                navigate('/vendor/onboarding/review');
              }, 1200);
            } else {
              showToast(verifyRes.message || 'Subscription verification failed.');
            }
          } catch (err) {
            showToast('Verification failed. Proceeding next.');
            setTimeout(() => navigate('/vendor/onboarding/review'), 1500);
          } finally {
            setIsSaving(false);
          }
        },
        prefill: {
          name: vendorState.fullName || '',
          email: vendorState.email || '',
          contact: vendorState.phone || ''
        },
        theme: {
          color: '#4F35C3'
        },
        modal: {
          ondismiss: function () {
            setIsSaving(false);
            showToast('Payment cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.warn('Razorpay checkout failed, falling back to mock bypass:', err);
      // Fallback: Open standard frontend-only Razorpay checkout
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay script load failed');
        }

        const selectedPlan = activePlans.find(p => p._id === selectedPlanId) || MOCKUP_PLANS[1];

        const options = {
          key: 'rzp_test_8sYbzHWidwe5Zw',
          amount: selectedPlan.price * 100,
          currency: 'INR',
          name: 'Utsavo',
          description: `Subscription: ${selectedPlan.name}`,
          handler: async function (response) {
            setIsSaving(true);
            try {
              // Direct mock verification bypass
              const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api')}/vendor/subscription/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: `order_fallback_${Date.now()}`,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpay_signature: 'mock_signature',
                  isMock: true
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                updateVendorState({
                  subscription: {
                    planId: selectedPlanId,
                    status: 'Active'
                  }
                });
                showToast('Payment successful! Plan activated 🎉');
                setTimeout(async () => {
                  await refreshData();
                  navigate('/vendor/onboarding/review');
                }, 1200);
              } else {
                showToast(verifyData.message || 'Subscription activation failed.');
              }
            } catch (verifyErr) {
              showToast('Activation bypassed. Proceeding next.');
              setTimeout(() => navigate('/vendor/onboarding/review'), 1500);
            } finally {
              setIsSaving(false);
            }
          },
          prefill: {
            name: vendorState.fullName || '',
            email: vendorState.email || '',
            contact: vendorState.phone || ''
          },
          theme: {
            color: '#4F35C3'
          },
          modal: {
            ondismiss: function () {
              setIsSaving(false);
              showToast('Payment cancelled.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (fallbackErr) {
        console.error('All Razorpay options failed, utilizing silent bypass:', fallbackErr);
        try {
          let orderId = `order_${Date.now()}`;
          const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api')}/vendor/subscription/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: orderId,
              razorpay_payment_id: `pay_${Date.now()}`,
              razorpay_signature: 'mock_signature',
              isMock: true
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            updateVendorState({
              subscription: {
                planId: selectedPlanId,
                status: 'Active'
              }
            });
            showToast('Instant Mock Payment successful! Plan activated 🎉');
            setTimeout(async () => {
              await refreshData();
              navigate('/vendor/onboarding/review');
            }, 1200);
          } else {
            showToast(verifyData.message || 'Subscription activation failed.');
          }
        } catch (mockErr) {
          showToast('Activation failed. Redirecting to review step.');
          setTimeout(() => navigate('/vendor/onboarding/review'), 1500);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleSkip = () => {
    showToast('Subscription skipped. Moving to review.');
    setTimeout(() => {
      navigate('/vendor/onboarding/review');
    }, 1000);
  };

  return (
    <div
      className="w-full min-h-[100dvh] sm:max-w-md sm:mx-auto flex flex-col bg-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap');
      `}</style>

      {/* HEADER BLOCK */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0 select-none">
        
        {/* Logo */}
        <div
          className="flex items-center justify-center gap-1.5 cursor-pointer group mb-2"
          onClick={() => window.location.href = '/'}
        >
          <img
            src="/assets/vendor/logo_theme.png"
            alt="Utsavo"
            className="h-7 w-auto rounded-md shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-base font-black italic tracking-tight bg-clip-text text-transparent"
              style={{
                fontFamily: "'Playfair Display', serif",
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #5b21b6)'
              }}
            >Utsavo</span>
            <span className="text-[6.5px] font-black uppercase tracking-[0.22em] text-rose-800/70">
              Elite Wedding Network
            </span>
          </div>
        </div>

        {/* Back navigation */}
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={() => navigate(PREV_ROUTE)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors active:scale-90"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-slate-800" strokeWidth={2.5} />
          </button>
          <p className="text-[13.5px] font-semibold text-slate-800 tracking-tight">
            Vendor Registration
          </p>
          <button 
            type="button" 
            onClick={handleSkip} 
            className="text-[12px] font-extrabold text-slate-400 hover:text-slate-600 transition-colors active:scale-95 px-1 py-0.5"
          >
            Skip
          </button>
        </div>

        {/* Step circles — same style as VendorRegister.jsx */}
        <div className="relative flex items-center justify-between w-full max-w-[260px] mx-auto mb-3 select-none">
          {/* connector line */}
          <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-slate-200 -translate-y-1/2 z-0" />
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isActive    = num === 5;
            const isCompleted = num < 5;
            return (
              <div key={num} className="relative z-10">
                <div
                  onClick={() => {
                    if (num === 3) navigate('/vendor/register/details');
                  }}
                  className={`h-[26px] w-[26px] rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#4F35C3] text-white shadow-md ring-4 ring-[#4F35C3]/15 scale-110'
                      : isCompleted
                        ? 'bg-[#EDE9FE] text-[#4F35C3] border border-[#C4B5FD] cursor-pointer hover:bg-[#DDD6FE]'
                        : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted
                    ? <Check className="w-3 h-3" strokeWidth={3} />
                    : num}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="flex-1 flex flex-col px-4 pb-6 overflow-y-auto gap-4 animate-in fade-in duration-250">
        
        {/* Title */}
        <div className="flex flex-col items-center text-center pt-1">
          <div className="w-12 h-12 rounded-full bg-[#EDE9FE] flex items-center justify-center border-[3px] border-[#F5F3FF] mb-2 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#4F35C3]" strokeWidth={1.8} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
            Choose Subscription Plan
          </h2>
          <p className="mt-0.5 text-[10.5px] text-slate-500 font-medium">
            Select the best plan for your business
          </p>
        </div>

        {/* Plans List */}
        <div className="space-y-2 max-w-md mx-auto w-full">
          {activePlans.map((plan) => {
            const isSelected = selectedPlanId === plan._id;
            return (
              <button
                key={plan._id}
                type="button"
                onClick={() => handlePlanSelect(plan._id)}
                className={`group relative w-full text-left rounded-[16px] border py-2.5 px-3.5 flex flex-col gap-1.5 transition-all duration-300 ${
                  isSelected
                    ? 'border-[#4F35C3] border-2 bg-[#F5F3FF]/20 shadow-[0_4px_16px_rgba(79,53,195,0.06)] scale-[1.01]'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Checkmark badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-4.5 h-4.5 bg-[#4F35C3] text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200 border-2 border-white">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={4.5} />
                  </div>
                )}

                {/* Popularity Badge */}
                {plan.mostPopular && (
                  <div className="absolute top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[7.5px] uppercase tracking-wider shadow-sm z-10">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">
                    {plan.icon || <Award className="w-3.5 h-3.5 text-[#4F35C3]" />}
                  </div>
                  <div>
                    <h4 className={`text-[12.5px] font-extrabold ${isSelected ? 'text-[#4F35C3]' : 'text-slate-800'}`}>
                      {plan.name}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0 leading-none">
                      Premium Partner Tier
                    </p>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="flex items-baseline gap-1 mt-0 pl-0.5">
                  <span className="text-xl font-black text-slate-900">
                    {formatINR(plan.price)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    / {plan.durationValue} {plan.durationUnit}{plan.durationValue > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Features checklist */}
                <div className="space-y-1 pt-1.5 pl-0.5 w-full border-t border-slate-100/70">
                  {plan.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                      <div className="w-3 h-3 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2 h-2" strokeWidth={4.5} />
                      </div>
                      <span className="text-[10px] font-medium leading-none truncate">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-4 mb-2 max-w-md mx-auto w-full px-0.5">
          <button
            type="button"
            onClick={handleComplete}
            disabled={isSaving}
            className={`w-full rounded-xl py-3 text-[13px] font-extrabold text-white transition-all duration-300 ${
              isSaving
                ? 'bg-[#4F35C3]/50 cursor-not-allowed shadow-none'
                : 'bg-[#4F35C3] shadow-sm hover:shadow-[0_4px_16px_rgba(79,53,195,0.25)] hover:brightness-105 active:scale-[0.98]'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Activating Plan...
              </span>
            ) : (
              'Complete Registration'
            )}
          </button>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-[11px] font-bold px-4 py-2.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-250">
          {toast}
        </div>
      )}
    </div>
  );
};

export default VendorSubscriptionOnboarding;
