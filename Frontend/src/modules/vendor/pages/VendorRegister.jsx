import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Autocomplete from 'react-google-autocomplete';
import {
  ClipboardList,
  Flower2,
  Camera,
  Sparkles,
  Utensils,
  Music,
  Sun,
  Mail,
  Car,
  Tent,
  Gift,
  Building2,
  Gem,
  ArrowLeft,
  ChevronRight,
  Check,
  User,
  Store,
  Phone,
  CalendarDays,
  ClipboardCheck,
  HelpCircle,
  Video,
  Globe,
  Radio,
  Clapperboard,
  Scissors,
  ShoppingBag,
  ChefHat,
  Wine,
  Cake,
  Sliders,
  Mic2,
  Lock
} from 'lucide-react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import { adminApi } from '../../admin/services/adminApi';

// Bespoke, high-fidelity vector illustrations matching a premium Lucide/Feather-style icon pack.
const getCategoryMockupDetails = (catName) => {
  switch (catName) {
    case 'Wedding Planners':
    case 'Wedding Planning':
      return {
        label: 'Wedding Planning',
        color: '#7C3AED',
        icon: <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#7C3AED" strokeWidth={1.8} fill="#7C3AED" fillOpacity={0.1} />
      };
    case 'Decorators':
    case 'Decoration':
      return {
        label: 'Decoration',
        color: '#0D9488',
        icon: <Flower2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#0D9488" strokeWidth={1.8} fill="#0D9488" fillOpacity={0.1} />
      };
    case 'Photographers':
    case 'Photography & Media':
      return {
        label: 'Photography & Media',
        color: '#475569',
        icon: <Camera className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#475569" strokeWidth={1.8} fill="#475569" fillOpacity={0.1} />
      };
    case 'Makeup Artists':
    case 'Beauty & Fashion':
      return {
        label: 'Beauty & Fashion',
        color: '#EA580C',
        icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#EA580C" strokeWidth={1.8} fill="#EA580C" fillOpacity={0.1} />
      };
    case 'Catering':
    case 'Catering & Food':
      return {
        label: 'Catering & Food',
        color: '#10B981',
        icon: <Utensils className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#10B981" strokeWidth={1.8} fill="#10B981" fillOpacity={0.1} />
      };
    case 'Choreographers':
    case 'Entertainment':
      return {
        label: 'Entertainment',
        color: '#6366F1',
        icon: <Music className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#6366F1" strokeWidth={1.8} fill="#6366F1" fillOpacity={0.1} />
      };
    case 'Mehendi Artists':
    case 'Traditional Services':
      return {
        label: 'Traditional Services',
        color: '#E11D48',
        icon: <Sun className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#E11D48" strokeWidth={1.8} fill="#E11D48" fillOpacity={0.1} />
      };
    case 'Wedding Invitations':
    case 'Invitations & Printing':
      return {
        label: 'Invitations & Printing',
        color: '#E11D48',
        icon: <Mail className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#E11D48" strokeWidth={1.8} fill="#E11D48" fillOpacity={0.1} />
      };
    case 'Groom Wear':
    case 'Travel & Hospitality':
      return {
        label: 'Travel & Hospitality',
        color: '#2563EB',
        icon: <Car className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#2563EB" strokeWidth={1.8} fill="#2563EB" fillOpacity={0.1} />
      };
    case 'Music & DJs':
    case 'Event Setup & Rentals':
      return {
        label: 'Event Setup & Rentals',
        color: '#4F35C3',
        icon: <Tent className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#4F35C3" strokeWidth={1.8} fill="#4F35C3" fillOpacity={0.1} />
      };
    case 'Bridal Wear':
    case 'Gifts & Shopping':
      return {
        label: 'Gifts & Shopping',
        color: '#F43F5E',
        icon: <Gift className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#F43F5E" strokeWidth={1.8} fill="#F43F5E" fillOpacity={0.1} />
      };
    case 'Venues':
    case 'Corporate Events':
      return {
        label: 'Corporate Events',
        color: '#0284C7',
        icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#0284C7" strokeWidth={1.8} fill="#0284C7" fillOpacity={0.1} />
      };
    case 'Jewellery':
    default:
      return {
        label: 'Jewellery',
        color: '#D97706',
        icon: <Gem className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" stroke="#D97706" strokeWidth={1.8} fill="#D97706" fillOpacity={0.1} />
      };
  }
};

// Dynamic categories now come from the backend database.

const renderSubCategoryIcon = (iconName, isSelected) => {
  const iconProps = { 
    className: `w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 flex-shrink-0 transition-colors duration-200 ${
      isSelected ? 'text-[#4F35C3]' : 'text-slate-600'
    }`, 
    strokeWidth: 1.8 
  };
  
  const name = String(iconName).toLowerCase();
  
  if (name.includes('photo') || name.includes('candid')) return <Camera {...iconProps} />;
  if (name.includes('video') || name.includes('cinema')) return <Clapperboard {...iconProps} />;
  if (name.includes('makeup') || name.includes('airbrush') || name.includes('hair')) return <Sparkles {...iconProps} />;
  if (name.includes('banquet') || name.includes('hotel') || name.includes('resort')) return <Building2 {...iconProps} />;
  if (name.includes('lawn') || name.includes('outdoor')) return <Tent {...iconProps} />;
  if (name.includes('floral') || name.includes('decor')) return <Flower2 {...iconProps} />;
  if (name.includes('light') || name.includes('sound')) return <Radio {...iconProps} />;
  if (name.includes('cater') || name.includes('veg') || name.includes('cuisine')) return <ChefHat {...iconProps} />;
  if (name.includes('dessert') || name.includes('cake')) return <Cake {...iconProps} />;
  if (name.includes('plan') || name.includes('manage')) return <ClipboardCheck {...iconProps} />;
  if (name.includes('lehenga') || name.includes('saree') || name.includes('gown') || name.includes('wear')) return <ShoppingBag {...iconProps} />;
  if (name.includes('sherwani') || name.includes('suit') || name.includes('kurta')) return <User {...iconProps} />;
  if (name.includes('mehendi') || name.includes('henna')) return <Sun {...iconProps} />;
  if (name.includes('dance') || name.includes('choreograph')) return <Music {...iconProps} />;
  if (name.includes('dj') || name.includes('band') || name.includes('singer')) return <Mic2 {...iconProps} />;

  // fallback
  return <Check {...iconProps} />;
};

const VendorRegister = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const { vendorState, updateVendorState } = useVendorState();
  const hasToken = !!localStorage.getItem('vendorToken');
  const [formState, setFormState] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    city: '',
    category: '', // Kept for backward compatibility
    subCategory: '',
    selectedCategories: [], // Array of { categoryId, categoryName, subcategories: [{ subcategoryId, subcategoryName }] }
    password: '',
    emailOtp: '',
    phoneOtp: '',
    serviceCities: '',
    languages: '',
    hasDocuments: false
  });
  
  const [activeCategoryForSubSelect, setActiveCategoryForSubSelect] = useState(null); // The category currently having subcategories selected
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [gstFile, setGstFile] = useState(null);
  const [localImages, setLocalImages] = useState([]);
  // OTP States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // If a user lands on the registration page while having an old token, wipe it to start fresh.
  useEffect(() => {
    if (localStorage.getItem('vendorToken')) {
      localStorage.removeItem('vendorToken');
      window.location.href = '/vendor/register/category';
    }
  }, []);

  // Refs for auto-scrolling to newly revealed fields
  const businessNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const locationRef = useRef(null);
  const passwordRef = useRef(null);
  const portfolioRef = useRef(null);

  const scrollToRef = (ref) => {
    if (ref?.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  };

  const handleCategoryToggle = (category, categoryId) => {
    const isSelected = formState.selectedCategories.some(c => c.categoryId === categoryId);
    let newSelected;
    if (isSelected) {
      newSelected = formState.selectedCategories.filter(c => c.categoryId !== categoryId);
    } else {
      newSelected = [...formState.selectedCategories, { categoryId, categoryName: category, subcategories: [] }];
    }
    const updated = { ...formState, selectedCategories: newSelected };
    setFormState(updated);
    updateVendorState({ registration: updated });
  };

  const handleSubCategoryToggle = (catId, subCatName, subCatId) => {
    const newCats = formState.selectedCategories.map(cat => {
      if (cat.categoryId === catId) {
        const isSelected = cat.subcategories.some(s => s.subcategoryId === subCatId);
        let newSubs;
        if (isSelected) {
          newSubs = cat.subcategories.filter(s => s.subcategoryId !== subCatId);
        } else {
          newSubs = [...cat.subcategories, { subcategoryId: subCatId, subcategoryName: subCatName }];
        }
        return { ...cat, subcategories: newSubs };
      }
      return cat;
    });
    const updated = { ...formState, selectedCategories: newCats };
    setFormState(updated);
    updateVendorState({ registration: updated });
  };

  const validateStep2 = () => {
    return formState.selectedCategories.length > 0 && formState.selectedCategories.every(c => c.subcategories.length > 0);
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile({
        file,
        url: URL.createObjectURL(file)
      });
    }
  };

  const handlePortfolioUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newLocalImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setLocalImages(prev => [...prev, ...newLocalImages]);
    e.target.value = '';
  };

  const removeLocalImage = (index) => {
    setLocalImages(prev => prev.filter((_, i) => i !== index));
  };


  // Auto-scroll to newly revealed fields
  useEffect(() => {
    if (formState.fullName.length > 2) scrollToRef(businessNameRef);
  }, [formState.fullName.length > 2]);

  useEffect(() => {
    if (formState.businessName.length > 2) scrollToRef(emailRef);
  }, [formState.businessName.length > 2]);

  useEffect(() => {
    if (formState.email.includes('@')) scrollToRef(phoneRef);
  }, [formState.email.includes('@')]);

  useEffect(() => {
    if (formState.phone.length === 10) scrollToRef(locationRef);
  }, [formState.phone]);

  useEffect(() => {
    if (formState.city.length > 2) scrollToRef(passwordRef);
  }, [formState.city]);

  const { stepId } = useParams();
  
  // Clean multi-step navigation controller:
  // Step 1: Main Category Selection
  // Step 2: Sub Category Selection
  // Step 3: Registration Profile Details Form
  const currentStep = stepId === 'subcategory' ? 2 : stepId === 'details' ? 3 : 1;

  useEffect(() => {
    if (stepId === 'subcategory' && (!formState.selectedCategories || formState.selectedCategories.length === 0)) {
      navigate('/vendor/register/category', { replace: true });
    } else if (stepId === 'details' && (!formState.selectedCategories || formState.selectedCategories.length === 0 || !validateStep2())) {
      navigate('/vendor/register/category', { replace: true });
    }
  }, [stepId, formState.selectedCategories, navigate]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await adminApi.getCategories();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error("Categories fetch failed", err);
      }
    };
    fetchCats();
  }, []);

  const handleChange = (field, value) => {
    const updated = { ...formState, [field]: value };
    setFormState(updated);
    updateVendorState({ registration: updated });
  };


  const handleSendOtp = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formState.phone)) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      setTimeout(() => setOtpError(''), 3000);
      return;
    }
    
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const response = await vendorApi.sendRegistrationOtp(formState.phone);
      if (response.success) {
        setIsOtpSent(true);
      } else {
        setOtpError(response.message || 'Failed to send OTP.');
        setTimeout(() => setOtpError(''), 3000);
      }
    } catch (error) {
      setOtpError('Network error. Please try again.');
      setTimeout(() => setOtpError(''), 3000);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) {
      setOtpError('Please enter the OTP.');
      setTimeout(() => setOtpError(''), 3000);
      return;
    }
    
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const response = await vendorApi.verifyRegistrationOtp(formState.phone, otpValue);
      if (response.success) {
        setIsPhoneVerified(true);
        setIsOtpSent(false); // Hide OTP field on success
      } else {
        setOtpError(response.message || 'Invalid OTP.');
        setTimeout(() => setOtpError(''), 3000);
      }
    } catch (error) {
      setOtpError('Network error. Please try again.');
      setTimeout(() => setOtpError(''), 3000);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleBackNavigation = () => {
    if (currentStep === 3) {
      navigate('/vendor/register/subcategory');
    } else if (currentStep === 2) {
      navigate('/vendor/register/category');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] sm:h-auto sm:max-w-xl sm:mx-auto flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="bg-white min-h-[100dvh] sm:min-h-0 sm:h-auto w-full rounded-none sm:rounded-[28px] shadow-none sm:shadow-[0_12px_40px_rgba(124,58,237,0.08)] border-0 sm:border border-slate-100 flex flex-col transition-all duration-300">
        
        <div className="flex flex-col items-center justify-center pt-2.5 pb-1 select-none flex-shrink-0">
          <div className="pointer-events-auto flex items-center gap-1.5 cursor-pointer group" onClick={() => window.location.href = '/'}>
            <div className="relative">
              <img src="/assets/vendor/logo_theme.png" alt="Utsavo Logo" className="h-8 sm:h-11 w-auto rounded-lg shadow-sm transition-all duration-300 group-hover:scale-105" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg sm:text-2xl font-black italic tracking-tighter bg-clip-text text-transparent leading-none" style={{
                fontFamily: "'Playfair Display', serif",
                backgroundImage: 'linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6)'
              }}>Utsavo</h1>
              <div className="mt-0.5 flex items-center gap-0.5">
                <div className="h-[1px] w-4 bg-gradient-to-r from-rose-700/40 to-transparent"></div>
                <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.25em] text-rose-800/80 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Elite Wedding Network
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pt-2.5 pb-1 mt-1 relative select-none flex-shrink-0">
          <button 
            type="button"
            onClick={handleBackNavigation} 
            className="p-0.5 rounded-lg text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5.5 h-5.5 text-slate-900" strokeWidth={2.5} />
          </button>
          <h2 className="text-[15px] sm:text-[17px] text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>
            Vendor Registration
          </h2>
          <div className="w-8" />
        </div>

        <div className="px-4 sm:px-6 pb-6 sm:pb-8 flex-1">
          {currentStep === 1 ? (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="text-center px-3 mb-1 select-none flex-shrink-0">
                <h2 className="text-[17px] sm:text-2xl text-slate-900 tracking-tight leading-snug max-w-[320px] mx-auto" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 750 }}>
                  Choose Your Main Categories
                </h2>
                <p className="mt-0.5 text-[8.5px] sm:text-[10px] text-slate-400 max-w-[320px] mx-auto font-semibold leading-normal">
                  Select one or more categories that best describe your business
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
                {categories.map((cat, index) => {
                  const uiDetails = getCategoryMockupDetails(cat.name);
                  const isSelected = formState.selectedCategories.some(c => c.categoryId === cat._id);
                  
                  return (
                    <div 
                      key={cat._id || index}
                      onClick={() => handleCategoryToggle(cat.name, cat._id)}
                      className={`relative group flex flex-col items-center justify-center p-2 sm:p-3 h-24 sm:h-28 rounded-[1rem] cursor-pointer transition-all duration-300 transform outline-none select-none border
                        ${isSelected 
                          ? 'bg-[#EEECFF] border-[#7C3AED] shadow-[0_4px_12px_rgba(124,58,237,0.15)] scale-[1.02] z-10' 
                          : 'bg-[#F9F8FF] border-[#EAE6FF] hover:border-[#7C3AED]/40 hover:bg-[#F2F0FF]'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:scale-110 text-[#4F35C3]">
                         {React.cloneElement(uiDetails.icon, {
                             className: "w-6 h-6 sm:w-8 sm:h-8",
                             stroke: "#4F35C3",
                             fill: "none",
                             strokeWidth: 2
                         })}
                      </div>
                      
                      <span className={`text-[9px] sm:text-[11px] font-bold text-center leading-tight transition-colors duration-200 px-1
                        ${isSelected ? 'text-[#7C3AED]' : 'text-[#1E293B] group-hover:text-[#0F172A]'}
                      `}>
                        {cat.name}
                      </span>
                      
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#7C3AED] rounded-full flex items-center justify-center shadow-sm animate-in fade-in zoom-in duration-200">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex-shrink-0 flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={formState.selectedCategories.length === 0}
                  onClick={() => navigate('/vendor/register/subcategory')}
                  className={`w-full rounded-2xl py-3 text-sm sm:text-base font-bold text-white shadow-sm transition-all duration-200 ${
                    formState.selectedCategories.length === 0 
                      ? 'bg-[#BDB4ED] cursor-not-allowed text-white/90' 
                      : 'bg-[#4F35C3] hover:bg-[#3f2aa6] hover:shadow-md active:scale-95'
                  }`}
                >
                  Next
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/vendor/login')} 
                  className="text-[11px] sm:text-sm font-bold text-[#4F35C3] hover:text-[#3f2aa6] transition-colors leading-none py-1 mt-1"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            <div className="flex flex-col h-full animate-in fade-in duration-300 select-none">
              
              {!activeCategoryForSubSelect ? (
                // VIEW: List of selected categories
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="text-center px-3 mb-4 flex-shrink-0">
                    <h2 className="text-[18px] sm:text-[22px] text-slate-900 tracking-tight font-bold leading-tight max-w-[280px] mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Selected Categories
                    </h2>
                    <p className="mt-1 text-[10.5px] sm:text-[12.5px] text-slate-500 max-w-[320px] mx-auto font-medium leading-normal">
                      Select subcategories for each of your selected categories.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:gap-3.5 w-full mt-3 sm:mt-4 max-h-[50vh] overflow-y-auto pr-1 pb-4 custom-scrollbar">
                    {formState.selectedCategories.map((selCat, idx) => {
                      const isComplete = selCat.subcategories && selCat.subcategories.length > 0;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setActiveCategoryForSubSelect(selCat.categoryId)}
                          className={`group flex items-center p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border select-none bg-white hover:bg-slate-50 border-slate-200`}
                        >
                          <div className="flex-1">
                            <h4 className="text-[14px] sm:text-[16px] font-bold text-slate-800">
                              {selCat.categoryName}
                            </h4>
                            <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1">
                              {isComplete ? `${selCat.subcategories.length} subcategories selected` : 'Pending selection'}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex items-center justify-center">
                            {isComplete ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 max-w-md mx-auto w-full px-1 flex-shrink-0 flex flex-col items-center gap-2.5">
                    <button
                      type="button"
                      disabled={!validateStep2()}
                      onClick={() => navigate('/vendor/register/details')}
                      className={`w-full rounded-xl py-2.5 sm:py-3 text-[13px] sm:text-[15px] font-extrabold text-white shadow-sm transition-all duration-200 ${
                        !validateStep2()
                          ? 'bg-[#4F35C3]/40 cursor-not-allowed text-white/80' 
                          : 'bg-[#4F35C3] hover:shadow-[0_4px_16px_rgba(79,53,195,0.2)] hover:brightness-105 active:scale-95'
                      }`}
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              ) : (
                // VIEW: Subcategory selection for a specific category
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  {(() => {
                    const activeCatDetails = formState.selectedCategories.find(c => c.categoryId === activeCategoryForSubSelect);
                    const catObj = categories.find(c => c._id === activeCategoryForSubSelect);
                    const subCats = catObj?.subCategories || [];
                    
                    return (
                      <>
                        <div className="flex justify-center mb-2.5 flex-shrink-0">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#EEECFF] flex items-center justify-center relative border-4 border-[#F5F3FF] transition-all duration-300 overflow-hidden">
                            {React.cloneElement(getCategoryMockupDetails(activeCatDetails.categoryName)?.icon || <Sparkles />, {
                              className: "w-6.5 h-6.5 sm:w-8 sm:h-8 text-[#4F35C3]",
                              stroke: "#4F35C3",
                              strokeWidth: 1.8,
                              fill: "#4F35C3",
                              fillOpacity: 0.15
                            })}
                          </div>
                        </div>

                        <div className="text-center px-3 mb-4 flex-shrink-0">
                          <h2 className="text-[18px] sm:text-[22px] text-slate-900 tracking-tight font-bold leading-tight max-w-[280px] mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {activeCatDetails.categoryName}
                          </h2>
                          <p className="mt-1 text-[10.5px] sm:text-[12.5px] text-slate-500 max-w-[320px] mx-auto font-medium leading-normal">
                            Select multiple subcategories that apply to your business
                          </p>
                        </div>

                        <div className="flex flex-col gap-2.5 sm:gap-3.5 w-full mt-3 sm:mt-4 max-h-[50vh] overflow-y-auto pr-1 pb-4 custom-scrollbar">
                          {subCats.map((subOption, idx) => {
                            const isSelected = activeCatDetails.subcategories.some(s => s.subcategoryId === subOption._id);
                            
                            return (
                              <div 
                                key={idx}
                                onClick={() => handleSubCategoryToggle(activeCategoryForSubSelect, subOption.name, subOption._id)}
                                className={`group flex items-center p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border select-none
                                  ${isSelected 
                                    ? 'bg-[#4F35C3]/5 border-[#4F35C3] shadow-[0_4px_12px_rgba(79,53,195,0.08)]' 
                                    : 'bg-white border-slate-100 hover:border-[#4F35C3]/40 hover:bg-[#4F35C3]/[0.02] hover:shadow-sm'
                                  }
                                `}
                              >
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 mr-3.5 sm:mr-4
                                  ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-sm'}
                                `}>
                                  {renderSubCategoryIcon(subOption.name, isSelected)}
                                </div>

                                <div className="min-w-0 flex-1 pl-1">
                                  <h4 className={`text-[12px] sm:text-[14px] font-bold transition-colors duration-200 ${
                                    isSelected ? 'text-[#4F35C3]' : 'text-slate-800'
                                  }`}>
                                    {subOption.name}
                                  </h4>
                                  <p className="text-[10px] sm:text-[11.5px] text-slate-500 font-normal leading-normal mt-0.5 break-words">
                                    {subOption.desc}
                                  </p>
                                </div>

                                {/* Selection indication */}
                                <div className="flex-shrink-0">
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-md bg-[#4F35C3] flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-md border-2 border-slate-300"></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Done Button for returning to categories */}
                        <div className="mt-4 max-w-md mx-auto w-full px-1 flex-shrink-0 flex flex-col items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setActiveCategoryForSubSelect(null)}
                            className={`w-full rounded-xl py-2.5 sm:py-3 text-[13px] sm:text-[15px] font-extrabold text-white shadow-sm transition-all duration-200 bg-[#4F35C3] hover:shadow-[0_4px_16px_rgba(79,53,195,0.2)] hover:brightness-105 active:scale-95`}
                          >
                            Done Selecting
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : currentStep === 3 ? (
            <div className="space-y-4 animate-in fade-in duration-300 pb-2">
              
              {/* Title Step 3 */}
              <div className="text-center px-3 mt-4 sm:mt-5 mb-2 sm:mb-2.5 select-none flex-shrink-0">
                <h2 className="text-[17px] sm:text-xl text-slate-800 tracking-tight leading-snug" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700 }}>
                  Register Your Business
                </h2>
                <p className="mt-0.5 text-[9px] sm:text-[11px] text-slate-400 max-w-[280px] mx-auto font-semibold leading-normal">
                  Enter your professional details to set up your profile.
                </p>
              </div>

              {/* Inline Error Banner */}
              {submitError && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in duration-200">
                  <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-rose-500 flex items-center justify-center">
                    <span className="text-white text-[8px] font-black">!</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-rose-700 leading-snug">{submitError}</p>
                    {submitError.toLowerCase().includes('email') && (
                      <button
                        type="button"
                        onClick={() => navigate('/vendor/login')}
                        className="mt-1 text-[10px] font-extrabold text-[#4F35C3] underline"
                      >
                        Sign in instead →
                      </button>
                    )}
                    {submitError.toLowerCase().includes('phone') && (
                      <button
                        type="button"
                        onClick={() => navigate('/vendor/login')}
                        className="mt-1 text-[10px] font-extrabold text-[#4F35C3] underline"
                      >
                        Sign in instead →
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError('')}
                    className="flex-shrink-0 text-rose-400 hover:text-rose-600 text-[14px] font-black leading-none"
                  >×</button>
                </div>
              )}

              {/* Profile Image */}
              <div className="flex flex-col items-center mb-4 relative">
                <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3px] border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 hover:border-[#4F35C3] hover:bg-slate-50">
                  {profileImageFile ? (
                    <>
                      <img src={profileImageFile.url} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white mb-1" />
                        <span className="text-[9px] font-bold text-white tracking-wider">CHANGE</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-[#4F35C3] mb-1.5 transition-colors" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 group-hover:text-[#4F35C3] px-2 text-center leading-tight">
                        Upload Profile Photo
                      </span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Full name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                  </div>
                  <input
                    autoFocus
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                    value={formState.fullName}
                    onChange={(event) => handleChange('fullName', event.target.value.replace(/[^a-zA-Z ]/g, ''))}
                    placeholder="e.g. Aditi Kapoor"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div ref={businessNameRef} className="flex flex-col animate-in fade-in duration-150 mt-3.5">
                <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Business name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                    <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                  </div>
                  <input
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                    value={formState.businessName}
                    onChange={(event) => handleChange('businessName', event.target.value)}
                    placeholder="e.g. Emerald Studio"
                  />
                </div>
              </div>

              {/* Email */}
              <div ref={emailRef} className="flex flex-col animate-in fade-in duration-150 mt-3.5">
                <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Email address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                    <Mail className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                  </div>
                  <input
                    type="email"
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                    value={formState.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="hello@emeraldstudio.in"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col animate-in fade-in duration-150 mt-3.5">
                <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                    <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    className="w-full rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                    value={formState.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Create a secure password"
                  />
                </div>
              </div>

              {/* Phone and OTP Flow */}
              <div ref={phoneRef} className="flex flex-col animate-in fade-in duration-150 mt-3.5">
                <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Phone number</label>
                <div className="relative group flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#4F35C3]">
                    <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                  </div>
                  <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">+91</span>
                  </div>
                  <input
                    className={`w-full rounded-xl pl-[4.2rem] pr-24 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border ${isPhoneVerified ? 'border-green-400 bg-green-50/20' : 'border-slate-200 bg-slate-50/20'} focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150`}
                    value={formState.phone}
                    onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange('phone', val);
                        setIsPhoneVerified(false);
                        setIsOtpSent(false);
                    }}
                    placeholder="9876543210"
                    disabled={isPhoneVerified || isOtpSent}
                  />
                  
                  {isPhoneVerified ? (
                    <div className="absolute right-3 flex items-center text-green-600 font-bold text-[10px]">
                      <Check className="w-4 h-4 mr-1" />
                      Verified
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || formState.phone.length !== 10}
                      className="absolute right-1.5 px-3 py-1 bg-[#4F35C3] text-white rounded-lg text-[10px] font-bold shadow-sm hover:bg-[#3f2aa6] disabled:opacity-50 transition-all"
                    >
                      {isSendingOtp ? 'Sending...' : (isOtpSent ? 'Resend' : 'Send OTP')}
                    </button>
                  )}
                </div>
                
                {otpError && (
                  <p className="text-rose-500 text-[10px] ml-1 mt-1 font-semibold">{otpError}</p>
                )}
                
                {isOtpSent && !isPhoneVerified && (
                  <div className="relative mt-2 flex items-center animate-in slide-in-from-top-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
                    </div>
                    <input
                      className="w-full rounded-xl pl-10 pr-20 py-2 text-xs sm:text-sm font-semibold border border-indigo-200 bg-indigo-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/10 outline-none transition-all duration-150"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpValue.length < 4}
                      className="absolute right-1.5 px-3 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold shadow-sm hover:bg-green-600 disabled:opacity-50 transition-all"
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                )}
              </div>

              {/* Location */}
              <div ref={locationRef} className="mt-3.5 animate-in fade-in duration-150 relative">
                <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Location</label>
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
                  onPlaceSelected={(place) => {
                    const city = place.address_components?.find(c => c.types.includes('locality'))?.long_name 
                                 || place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : '');
                    handleChange('city', city);
                  }}
                  onChange={(e) => handleChange('city', e.target.value)}
                  options={{
                    types: ['(cities)'],
                    componentRestrictions: { country: "in" },
                  }}
                  defaultValue={formState.city}
                  className="w-full rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                  placeholder="e.g. Mumbai"
                />
              </div>



              {/* Service Cities */}
              <div className="mt-3.5 animate-in fade-in duration-150">
                <div className="flex flex-col">
                  <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Service Cities (Comma separated)</label>
                  <input
                    className="w-full rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                    value={formState.serviceCities}
                    onChange={(e) => handleChange('serviceCities', e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Pune"
                  />
                </div>
              </div>

              {/* Preferred Languages */}
              <div className="mt-3.5 animate-in fade-in duration-150">
                <div className="flex flex-col">
                  <label className="text-[10px] sm:text-[11.5px] font-bold uppercase tracking-wider ml-1 text-slate-500 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>Preferred Languages (Comma separated)</label>
                  <input
                    className="w-full rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/20 focus:border-[#4F35C3] focus:bg-white focus:ring-2 focus:ring-[#4F35C3]/5 outline-none transition-all duration-150"
                    value={formState.languages}
                    onChange={(e) => handleChange('languages', e.target.value)}
                    placeholder="e.g. English, Hindi, Marathi"
                  />
                </div>
              </div>





              {/* Action Buttons for Step 3 */}
              <div className="mt-3 flex flex-col items-center gap-2 select-none">
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={`w-full rounded-2xl py-3 text-sm sm:text-base font-bold text-white shadow-sm transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-[#4F35C3]/40 cursor-not-allowed text-white/80' 
                      : 'bg-[#4F35C3] hover:shadow-[0_4px_12px_rgba(79,53,195,0.15)] hover:brightness-105 active:scale-95'
                  }`}
                  onClick={async () => {
                    if (!formState.fullName || !formState.businessName || !formState.email || !formState.phone || !formState.city) {
                      setSubmitError('Please fill in all required fields to continue.');
                      setTimeout(() => setSubmitError(''), 5000);
                      return;
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formState.email)) {
                      setSubmitError('Please enter a valid email address.');
                      setTimeout(() => setSubmitError(''), 5000);
                      return;
                    }
                    const phoneRegex = /^[6-9]\d{9}$/;
                    if (!phoneRegex.test(formState.phone)) {
                      setSubmitError('Mobile number must be 10 digits and start with 6, 7, 8, or 9.');
                      setTimeout(() => setSubmitError(''), 5000);
                      return;
                    }
                    if (!isPhoneVerified) {
                      setSubmitError('Please verify your mobile number with OTP first.');
                      setTimeout(() => setSubmitError(''), 5000);
                      return;
                    }

                    setIsSubmitting(true);
                    setSubmitError('');
                    
                      try {
                        let profileImageUrl = null;
                        let portfolioUrls = [];

                        let idProofUrl = null;
                        let gstUrl = null;

                        if (profileImageFile) {
                          const res = await vendorApi.uploadPublicMedia(profileImageFile.file);
                          if (res.success) profileImageUrl = res.data.url;
                        }

                        if (localImages.length > 0) {
                          const files = localImages.map(img => img.file);
                          const res = await vendorApi.uploadPublicMultipleMedia(files);
                          if (res.success) {
                            portfolioUrls = res.data.map(img => ({
                              type: 'Photo',
                              title: 'Portfolio Image',
                              url: img.url
                            }));
                          }
                        }

                        const payload = { 
                          ...formState, 
                          profileImage: profileImageUrl,
                          portfolio: portfolioUrls
                        };
                        
                        // Remove empty or deprecated fields from payload
                        const fieldsToRemove = ['category', 'subCategory', 'emailOtp', 'phoneOtp'];
                        fieldsToRemove.forEach(field => {
                          if (payload[field] === '') {
                            delete payload[field];
                          }
                        });
                        
                        // Ensure password is not overridden if provided by user
                        if (!payload.password) {
                          payload.password = 'UtsavoPassword123!';
                        }
                        const registerRes = await vendorApi.register(payload);
                        
                        if (registerRes.success) {
                            localStorage.setItem('vendorToken', registerRes.token);
                            localStorage.removeItem('vendor_registration_temp');
                            
                            if (registerRes.vendor) {
                                updateVendorState(registerRes.vendor);
                            }
                            
                            navigate('/vendor/onboarding/subscription');
                        } else {
                            setSubmitError(registerRes.message || 'Registration failed. Please try again.');
                        }
                    } catch (err) {
                      setSubmitError('Unable to connect to server. Please check your internet and try again.');
                      setTimeout(() => setSubmitError(''), 6000);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  Get Started {isSubmitting ? '⏳' : '✨'}
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/vendor/login')} 
                  className="text-[10px] sm:text-xs font-extrabold text-[#4F35C3] hover:text-[#3f2aa6] transition-colors leading-none py-1"
                >
                  Already have an account? Sign In
                </button>
              </div>

            </div>
          ) : null}
        </div>

      </div>
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <button 
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRegister;
