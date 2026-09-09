import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  Store,
  MapPin,
  Compass,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

const PREV_ROUTE = '/vendor/onboarding/subscription';
const SUCCESS_ROUTE = '/vendor/onboarding/submitted';

const VendorReviewOnboarding = () => {
  const navigate = useNavigate();
  const { vendorState, updateVendorState } = useVendorState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle category and subcategory parsing from both top-level and registration object
  const cats = vendorState.selectedCategories?.length > 0 
    ? vendorState.selectedCategories 
    : vendorState.registration?.selectedCategories?.length > 0 
      ? vendorState.registration.selectedCategories 
      : [];

  const mainCategory = cats.length > 0 
    ? cats.map(c => c.categoryName).filter(Boolean).join(', ') 
    : vendorState.category || vendorState.registration?.category || null;

  const subcategory = cats.length > 0 
    ? cats.map(c => c.subcategories?.map(s => s.subcategoryName).join(', ')).filter(Boolean).join(' | ')
    : vendorState.subCategory || vendorState.registration?.subCategory || null;
  
  const servicesCount = vendorState.services?.length || 0;
  const businessName = vendorState.businessName || vendorState.registration?.businessName || null;
  const location = vendorState.city || vendorState.registration?.city || null;
  
  // Service Areas could be an array in businessDetails or registration, or a string in registration
  let serviceAreasCount = 0;
  if (vendorState.serviceCities?.length > 0) serviceAreasCount = vendorState.serviceCities.length;
  else if (vendorState.businessDetails?.serviceCities?.length > 0) serviceAreasCount = vendorState.businessDetails.serviceCities.length;
  else if (Array.isArray(vendorState.registration?.serviceCities) && vendorState.registration.serviceCities.length > 0) serviceAreasCount = vendorState.registration.serviceCities.length;
  else if (typeof vendorState.registration?.serviceCities === 'string' && vendorState.registration.serviceCities.trim()) {
    serviceAreasCount = vendorState.registration.serviceCities.split(',').length;
  }
  
  const packagesCount = vendorState.pricing?.range ? 1 : 0; 
  
  const portfolioCount = vendorState.portfolio?.length || 0;

  const rawReviewItems = [
    {
      label: 'Main Category',
      value: mainCategory,
      icon: <Briefcase className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Subcategory',
      value: subcategory,
      icon: <Layers className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Services',
      value: servicesCount > 0 ? `${servicesCount} Services Selected` : null,
      icon: <Sparkles className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Business Name',
      value: businessName,
      icon: <Store className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Location',
      value: location,
      icon: <MapPin className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Service Areas',
      value: serviceAreasCount > 0 ? `${serviceAreasCount} Areas` : null,
      icon: <Compass className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Pricing info',
      value: packagesCount > 0 ? `Pricing Added` : null,
      icon: <Package className="w-4 h-4 text-violet-600" />
    },
    {
      label: 'Portfolio',
      value: portfolioCount > 0 ? `${portfolioCount} Images` : null,
      icon: <ImageIcon className="w-4 h-4 text-violet-600" />
    }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('vendorToken');
    if (token) {
      try {
        await vendorApi.updateOnboarding('completed', {}, token);
        updateVendorState({ status: 'Approved', onboardingStep: 'completed' });
      } catch (err) {
        console.error('Failed to submit registration completed state:', err);
      }
    }
    setTimeout(() => {
      setIsSubmitting(false);
      navigate(SUCCESS_ROUTE);
    }, 1200);
  };

  const reviewItems = rawReviewItems.filter(item => item.value);

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
          <div className="w-8" />
        </div>

        {/* Step circles — same style as VendorRegister.jsx */}
        <div className="relative flex items-center justify-between w-full max-w-[260px] mx-auto mb-3 select-none">
          {/* connector line */}
          <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-slate-200 -translate-y-1/2 z-0" />
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isActive    = num === 6;
            const isCompleted = num < 6;
            return (
              <div key={num} className="relative z-10">
                <div
                  onClick={() => {
                    if (num === 5) navigate('/vendor/onboarding/subscription');
                    else if (num === 3) navigate('/vendor/register/details');
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
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">
            Review Your Details
          </h2>
          <p className="mt-0.5 text-[10.5px] text-slate-500 font-medium">
            Please confirm your details before submit
          </p>
        </div>

        {/* Details List */}
        <div className="space-y-2 max-w-md mx-auto w-full">
          {reviewItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-[14px] border border-slate-100 bg-white px-3.5 py-3.5 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    {item.label}
                  </p>
                  <p className="text-[12.5px] font-bold text-slate-800 mt-1.5 leading-tight">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button & Verification Pill */}
        <div className="mt-auto max-w-md mx-auto w-full px-0.5 pt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full rounded-xl py-3 text-[13.5px] font-extrabold text-white transition-all duration-300 ${
              isSubmitting
                ? 'bg-emerald-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 shadow-sm hover:shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:brightness-105 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Submitting Profile...
              </span>
            ) : (
              'Submit for Verification'
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 py-1 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[9.5px] font-bold text-slate-400 leading-none">
              Our team will verify your details and activate your account.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorReviewOnboarding;
