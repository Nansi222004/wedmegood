import { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import { adminApi } from '../../admin/services/adminApi';

const steps = [
  { id: 'category', label: 'Choose Main Category' },
  { id: 'subcategory', label: 'Choose Subcategory' },
  { id: 'services', label: 'Select Services' },
  { id: 'business', label: 'Business Details' },
  { id: 'portfolio', label: 'Portfolio & Packages' },
  { id: 'subscription', label: 'Business Subscription' },
  { id: 'submitted', label: 'Registration Submitted' }
];

const subcategoryOptions = {
  Photography: ['Photographer', 'Videographer', 'Drone Photography', 'Live Streaming', 'Wedding Reel Creator'],
  Decoration: ['Stage Decor', 'Floral Decor', 'Lighting', 'Fabric Draping', 'Entrance Decor'],
  'Beauty & Fashion': ['Bridal Makeup', 'Groom Styling', 'Hair Styling', 'Pre-Wedding Glam', 'Fashion Shoot'],
  'Catering & Food': ['Buffet Service', 'Dessert Counter', 'Live Kitchen', 'Beverages', 'Custom Cakes'],
  Entertainment: ['DJ', 'Live Band', 'Dance Group', 'Hosts & MCs', 'Photobooth'],
  'Event Setup & Rentals': ['Lighting', 'Sound', 'Furniture', 'Tent Setup', 'AV Support'],
  default: ['Standard Service', 'Premium Service', 'Custom Package', 'Consultation']
};

const getSubcategories = (mainCategory) => {
  return subcategoryOptions[mainCategory] || subcategoryOptions.default;
};

const VendorOnboarding = () => {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const { vendorState, updateVendorState, loading } = useVendorState();
  const currentStepIndex = Math.max(0, steps.findIndex((step) => step.id === stepId));
  const [categories, setCategories] = useState([]);
  const [subCategory, setSubCategory] = useState(vendorState.registration?.subCategory || '');

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ show: true, message, type });
    if (duration > 0) {
      setTimeout(() => setToast((prev) => (prev.message === message ? { ...prev, show: false } : prev)), duration);
    }
  }, []);

  const [newItem, setNewItem] = useState({ title: '', tag: '' });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    basePrice: '',
    inclusions: ['', '']
  });
  const fileInputRef = useRef(null);
  const docInputRefs = {
    idProof: useRef(null),
    gst: useRef(null),
    contract: useRef(null)
  };

  const [activePlans, setActivePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const token = localStorage.getItem('vendorToken');
      if (token) {
        try {
          const res = await vendorApi.getSubscriptionPlans(token);
          if (res.success) {
            setActivePlans(res.data);
            if (vendorState.subscription?.planId) {
              setSelectedPlanId(vendorState.subscription.planId);
            } else if (res.data.length > 0) {
              const firstPlanId = res.data[0]._id;
              setSelectedPlanId(firstPlanId);
              updateVendorState({ subscription: { ...vendorState.subscription, planId: firstPlanId } });
            }
          }
        } catch (err) {
          console.error('Failed to fetch plans:', err);
        }
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await adminApi.getCategories();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error('Category fetch failed', err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (stepId === 'business' && !vendorState.registration.category) {
      navigate('/vendor/onboarding/category');
    } else if (stepId === 'subcategory' && !vendorState.registration.category) {
      navigate('/vendor/onboarding/category');
    } else if (stepId === 'services' && !vendorState.registration.subCategory) {
      navigate('/vendor/onboarding/subcategory');
    }
  }, [stepId, vendorState.registration.category, vendorState.registration.subCategory, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stepId]);

  useEffect(() => {
    if (showServiceModal) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [showServiceModal]);

  const handleSaveService = () => {
    if (!newService.name || !newService.category || !newService.basePrice) {
      alert('Please fill in all basic fields.');
      return;
    }
    const serviceToAdd = {
      id: `s-${Date.now()}`,
      name: newService.name,
      category: newService.category,
      basePrice: Number(newService.basePrice),
      packages: [
        { name: 'Standard', price: Number(newService.basePrice) },
        { name: 'Premium', price: Number(newService.basePrice) * 1.5 }
      ],
      inclusions: newService.inclusions.filter(Boolean)
    };
    updateVendorState({ services: [...vendorState.services, serviceToAdd] });
    setShowServiceModal(false);
    setNewService({ name: '', category: '', basePrice: '', inclusions: ['', ''] });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocClick = (key) => {
    docInputRefs[key].current?.click();
  };

  const handleDocChange = async (key, event) => {
    const file = event.target.files?.[0];
    const token = localStorage.getItem('vendorToken');
    if (file && token) {
      showToast(`Uploading ${key === 'idProof' ? 'ID Proof' : key === 'gst' ? 'GST' : 'Agreement'}...`, 'loading', 0);
      try {
        const res = await vendorApi.uploadMedia(file, token);
        if (res.success && res.url) {
          updateVendorState({ documents: { ...vendorState.documents, [key]: res.url } });
          showToast('Document uploaded successfully! ✨', 'success');
          event.target.value = '';
        } else {
          showToast(res.message || 'Upload failed', 'error');
        }
      } catch (err) {
        showToast('Server error during document upload', 'error');
      }
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    const token = localStorage.getItem('vendorToken');
    if (file && newItem.title && token) {
      showToast('Uploading to portfolio...', 'loading', 0);
      try {
        const res = await vendorApi.uploadMedia(file, token);
        if (res.success && res.url) {
          updateVendorState({
            portfolio: [
              ...vendorState.portfolio,
              { id: Date.now().toString(), type: 'Photo', title: newItem.title, tag: newItem.tag || 'General', url: res.url }
            ]
          });
          setNewItem({ title: '', tag: '' });
          showToast('Portfolio item added! ✨', 'success');
          event.target.value = '';
        } else {
          showToast(res.message || 'Upload failed', 'error');
        }
      } catch (err) {
        showToast('Server error during upload', 'error');
      }
    } else if (!newItem.title) {
      showToast('Please enter a project title first', 'info');
    }
  };

  const isStepComplete = (id) => {
    switch (id) {
      case 'category':
        return !!vendorState.registration.category;
      case 'subcategory':
        return !!subCategory;
      case 'services':
        return vendorState.services.length > 0;
      case 'business':
        const { description, years, teamSize, languages } = vendorState.businessDetails;
        return description && years && teamSize && languages.some(l => l.trim()) && 
               vendorState.businessDetails.serviceCities.some(l => l.trim()) && 
               !!vendorState.registration.city;
      case 'portfolio':
        return vendorState.portfolio.length > 0;
      case 'review':
      case 'submitted':
        return true;
      default:
        return true;
    }
  };

  const canNavigateTo = (targetIndex) => {
    if (targetIndex <= currentStepIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!isStepComplete(steps[i].id)) {
        return { complete: false, stepLabel: steps[i].label };
      }
    }
    return { complete: true };
  };

  const handleStepClick = (e, index, id) => {
    if (index === currentStepIndex) {
      e.preventDefault();
      return;
    }
    const check = canNavigateTo(index);
    if (!check.complete) {
      e.preventDefault();
      alert(`⚠️ Please complete "${check.stepLabel}" before moving forward.`);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleNext = async () => {
    if (stepId === 'business') {
      const desc = vendorState.businessDetails.description || '';
      if (desc.length < 100) {
        showToast(`Description too short (${desc.length}/100). Please provide more detail about your services.`, 'error');
        return;
      }
    }

    const check = canNavigateTo(currentStepIndex + 1);
    const token = localStorage.getItem('vendorToken');

    if (!check.complete) {
      alert(`⚠️ Requirement Missing: Please finish "${check.stepLabel}" to continue.`);
      return;
    }

    if (stepId === 'business') {
      const desc = vendorState.businessDetails.description || '';
      if (desc.length < 100) {
        showToast(`Description too short (${desc.length}/100). Please provide more detail about your services.`, 'error');
        return;
      }
    }

    const backendSteps = ['business', 'services', 'portfolio'];
    const stepData = backendSteps.includes(stepId) ? (stepId === 'business' ? vendorState.businessDetails : vendorState[stepId]) : null;

    if (backendSteps.includes(stepId) && token && stepData) {
      try {
        const res = await vendorApi.updateOnboarding(stepId, stepData, token);
        if (res.success) {
          updateVendorState({ vendor: res.data });
        }
      } catch (err) {
        console.error('Failed to sync onboarding step with backend:', err);
      }
    }

    if (stepId === 'review') {
      navigate('/vendor/onboarding/submitted');
      return;
    }

    if (currentStepIndex === steps.length - 1) {
      navigate('/vendor/dashboard');
    } else {
      navigate('/vendor/onboarding/' + steps[currentStepIndex + 1].id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-4 px-1 sm:px-2 relative z-10">
      <div className="rounded-3xl p-4 sm:p-6 min-h-[60vh] sm:min-h-0 flex flex-col shadow-[0_20px_60px_rgba(124, 58, 237,0.15)] relative overflow-hidden transition-all duration-700" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(124, 58, 237, 0.1)'
      }}>
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-2 rounded-t-[2.5rem]" style={{
          background: 'linear-gradient(90deg, #7c3aed, #f182a5, #f4a0bb, #7c3aed)',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 4s ease infinite'
        }}></div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] drop-shadow-sm" style={{ color: '#7c3aed' }}>Vendor Registration</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5 drop-shadow-md">Finish your vendor onboarding</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[#7c3aed]">STEP {currentStepIndex + 1} of {steps.length}</span>
              <span>{steps[currentStepIndex]?.label}</span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <img src="/assets/vendor/success.png" alt="Celebration" className="h-20 sm:h-32 w-auto absolute -top-12 sm:-top-20 -right-2 sm:-right-8 animate-[pulse-glow_4s_ease-in-out_infinite] img-transparent-fix" />
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-100/80 border border-slate-200 p-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
            <span>Onboarding progress</span>
            <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#f472b6] transition-all" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center w-full px-2 sm:px-4 max-w-full mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : 'flex-none'}`}>
              <NavLink
                to={'/vendor/onboarding/' + step.id}
                onClick={(e) => handleStepClick(e, index, step.id)}
                className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-md z-10"
                style={index === currentStepIndex
                  ? { background: 'linear-gradient(135deg, #7c3aed, #7c3aed)', color: 'white', border: '2px solid white', boxShadow: '0 4px 15px rgba(159, 18, 57, 0.4)', transform: 'scale(1.15)' }
                  : index < currentStepIndex
                    ? { background: 'white', color: '#7c3aed', border: '2px solid #7c3aed' }
                    : { background: 'rgba(255, 255, 255, 0.9)', color: '#64748b', border: '2px dashed #cbd5e1' }
                }
              >
                {index < currentStepIndex ? '✓' : index + 1}
              </NavLink>
              {index < steps.length - 1 && (
                <div className="h-0.5 rounded w-full flex-1 shrink mx-1.5 sm:mx-3 transition-all shadow-inner" style={{
                  background: index < currentStepIndex ? 'linear-gradient(90deg, #7c3aed, #7c3aed)' : 'rgba(255, 255, 255, 0.5)'
                }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Centered Step Heading */}
        <div className="mt-1 mb-2 flex flex-col items-center justify-center text-center px-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {steps[currentStepIndex]?.label}
          </h2>
          <div className="h-1 w-12 rounded-full mt-2" style={{ background: '#7c3aed' }}></div>
        </div>

        <div className="mt-3 flex-1">
          {stepId === 'category' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="rounded-3xl border border-[#ede9fe] p-6 bg-white/90 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7c3aed]">Main Category</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Choose the category that best suits your business</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const iconMap = {
                      'Wedding Planning': 'plan',
                      'Decoration': 'decoration',
                      'Photography & Media': 'camera',
                      'Beauty & Fashion': 'makeup',
                      'Catering & Food': 'cart',
                      'Entertainment': 'party',
                      'Traditional Services': 'lightbulb',
                      'Invitations & Printing': 'invitation',
                      'Travel & Hospitality': 'globe',
                      'Event Setup & Rentals': 'venue',
                      'Gifts & Shopping': 'bag',
                      'Corporate Events': 'building'
                    };
                    const iconName = iconMap[cat.name] || 'star';

                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => updateVendorState({ registration: { ...vendorState.registration, category: cat.name } })}
                        className={`flex items-center gap-4 rounded-xl border p-3 text-left transition-all ${vendorState.registration.category === cat.name ? 'border-[#7c3aed] bg-[#eef2ff] shadow-md' : 'border-slate-200 bg-white hover:shadow-sm'}`}
                      >
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-white border border-[#f3e9ff] flex items-center justify-center">
                          <Icon name={iconName} size="lg" color="#7c3aed" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Loading categories...</div>
                )}
              </div>
            </div>
          )}

          {stepId === 'subcategory' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="rounded-3xl border border-[#ede9fe] p-6 bg-white/90 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7c3aed]">Subcategory</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Select the option that best matches your business</h2>
              </div>
              <div className="grid gap-3 grid-cols-2">
                {getSubcategories(vendorState.registration.category).map((item) => {
                  const key = item || '';
                  const iconFor = (text) => {
                    const t = (text || '').toLowerCase();
                    if (t.includes('photo') || t.includes('photographer') || t.includes('camera')) return 'camera';
                    if (t.includes('video') || t.includes('videographer') || t.includes('stream')) return 'video';
                    if (t.includes('makeup') || t.includes('bridal') || t.includes('beauty')) return 'makeup';
                    if (t.includes('cater') || t.includes('food') || t.includes('cake')) return 'cart';
                    if (t.includes('dj') || t.includes('band') || t.includes('music') || t.includes('entertain')) return 'party';
                    if (t.includes('decor') || t.includes('stage') || t.includes('floral')) return 'decoration';
                    if (t.includes('invitat') || t.includes('print')) return 'invitation';
                    if (t.includes('travel') || t.includes('hospital') || t.includes('hotel')) return 'globe';
                    if (t.includes('groom') || t.includes('wear') || t.includes('clothing')) return 'bag';
                    if (t.includes('jewel') || t.includes('jewellery')) return 'rings';
                    return 'star';
                  };
                  const iconName = iconFor(item);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSubCategory(item);
                        updateVendorState({ registration: { ...vendorState.registration, subCategory: item } });
                      }}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${subCategory === item ? 'border-[#7c3aed] bg-[#eef2ff] shadow-md' : 'border-slate-200 bg-white hover:shadow-sm'}`}
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-white border border-[#f3e9ff] flex items-center justify-center">
                        <Icon name={iconName} size="md" color="#7c3aed" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item}</p>
                        <p className="mt-1 text-xs text-slate-500">{item} services and packages.</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {stepId === 'business' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* 1. Description */}
              <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>
                  Business description <span style={{ color: '#7c3aed' }}>*</span>
                </label>
                <textarea
                  autoFocus
                  className="w-full rounded-2xl px-5 py-4 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20 resize-none"
                  style={{
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    minHeight: '120px'
                  }}
                  value={vendorState.businessDetails.description}
                  onChange={(event) => updateVendorState({
                    businessDetails: { ...vendorState.businessDetails, description: event.target.value }
                  })}
                  placeholder="Describe your journey, specialized skills, and what makes your service exceptional..."
                />
                <div className="flex justify-end mt-1 px-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${vendorState.businessDetails.description?.length >= 100 ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {vendorState.businessDetails.description?.length || 0} / 100 Characters
                  </span>
                </div>
              </div>

              {/* 2. Experience & Team - Reveal when description has content */}
              {vendorState.businessDetails.description?.length > 10 && (
                <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>
                      Years of experience <span style={{ color: '#7c3aed' }}>*</span>
                    </label>
                    <input
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                      style={{
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)'
                      }}
                      value={vendorState.businessDetails.years}
                      placeholder="e.g. 5"
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(event) => updateVendorState({
                        businessDetails: { ...vendorState.businessDetails, years: event.target.value.replace(/[^0-9]/g, '') }
                      })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>
                      Team size <span style={{ color: '#7c3aed' }}>*</span>
                    </label>
                    <input
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                      style={{
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)'
                      }}
                      value={vendorState.businessDetails.teamSize}
                      placeholder="e.g. 8"
                      onKeyDown={(e) => {
                        if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(event) => updateVendorState({
                        businessDetails: { ...vendorState.businessDetails, teamSize: event.target.value.replace(/[^0-9]/g, '') }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* 3. Professional Details - Reveal when stats are filled */}
              {vendorState.businessDetails.years && vendorState.businessDetails.teamSize && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>
                      Languages spoken <span style={{ color: '#7c3aed' }}>*</span>
                    </label>
                    <input
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                      style={{
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)'
                      }}
                      value={vendorState.businessDetails.languages.join(', ')}
                      onKeyDown={(e) => {
                        if (e.key >= '0' && e.key <= '9') e.preventDefault();
                      }}
                      onChange={(event) => {
                        const val = event.target.value.replace(/[0-9]/g, '');
                        updateVendorState({
                          businessDetails: { ...vendorState.businessDetails, languages: val.split(',').map(s => s.trimStart()) }
                        });
                      }}
                      placeholder="e.g. Hindi, English"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>
                      Base location <span style={{ color: '#7c3aed' }}>*</span>
                    </label>
                    <input
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                      style={{
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)'
                      }}
                      value={vendorState.registration.city}
                      onChange={(event) => updateVendorState({
                        registration: { ...vendorState.registration, city: event.target.value }
                      })}
                      placeholder="e.g. Hyderabad, Telangana"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>
                      Service cities <span style={{ color: '#7c3aed' }}>*</span>
                    </label>
                    <input
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                      style={{
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        background: 'rgba(255, 255, 255, 0.95)'
                      }}
                      value={vendorState.businessDetails.serviceCities.join(', ')}
                      onKeyDown={(e) => {
                        if (e.key >= '0' && e.key <= '9') e.preventDefault();
                      }}
                      onChange={(event) => {
                        const val = event.target.value.replace(/[0-9]/g, '');
                        updateVendorState({
                          businessDetails: { ...vendorState.businessDetails, serviceCities: val.split(',').map(s => s.trimStart()) }
                        });
                      }}
                      placeholder="e.g. Indore, Bhopal"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {stepId === 'services' && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#ede9fe] bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7c3aed]">Select Services</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Select all the services you provide</h2>
                <p className="mt-2 text-sm text-slate-500">Pick your main offerings, then add additional details for each service.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {vendorState.services.length === 0 ? (
                  <div className="col-span-2 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                    <div className="mb-3 text-4xl">✨</div>
                    <p className="font-bold text-slate-900">No services added yet</p>
                    <p className="mt-2 text-sm">Add your first service to move ahead.</p>
                  </div>
                ) : vendorState.services.map((service) => (
                  <div key={service.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{service.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{service.category}</p>
                      </div>
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-semibold text-[#7c3aed]">Added</span>
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                      {service.packages?.map((pkg) => pkg.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="rounded-3xl bg-gradient-to-r from-[#7c3aed] to-[#d946ef] px-6 py-4 text-sm font-bold text-white shadow-xl transition-all hover:shadow-[#7c3aed]/30 active:scale-[0.98]"
                onClick={() => setShowServiceModal(true)}
              >
                + Add a service
              </button>

              {showServiceModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto" style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}>
                  <div className="w-full max-w-xl rounded-[2.5rem] p-8 sm:p-10 shadow-3xl relative my-8 overflow-hidden" style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.55)), url("/assets/vendor/download (2).jpeg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                    {/* Glassmorphic inner container for content */}
                    <div className="absolute inset-0 backdrop-blur-md -z-10"></div>

                    <div className="flex items-center justify-between mb-8">
                      <div className="relative">
                        <h3 className="text-2xl font-bold text-slate-900 leading-none drop-shadow-sm">Add New Service</h3>
                        <p className="text-sm font-bold mt-2" style={{ color: '#1e293b' }}>Create a new service listing for your profile.</p>
                      </div>
                      <button
                        onClick={() => setShowServiceModal(false)}
                        className="h-10 w-10 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 transition-all active:scale-95 bg-white/80 border border-white"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>Service Name</label>
                          <input
                            className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                            style={{
                              border: '1px solid rgba(124, 58, 237, 0.2)',
                              background: 'rgba(255, 255, 255, 0.95)'
                            }}
                            placeholder="e.g. Royal Stage Decor"
                            value={newService.name}
                            onKeyDown={(e) => {
                              if (e.key >= '0' && e.key <= '9') e.preventDefault();
                            }}
                            onChange={(e) => setNewService({ ...newService, name: e.target.value.replace(/[0-9]/g, '') })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>Category</label>
                          <div className="relative">
                            <div
                              className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-sm"
                              style={{
                                borderColor: 'rgba(124, 58, 237, 0.2)',
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#7c3aed'
                              }}
                              onClick={() => setOpenDropdown(!openDropdown)}
                            >
                              {newService.category || 'Select Category'}
                              <Icon name="chevronDown" size="xs" color="#7c3aed" className={`transition-transform duration-300 ${openDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Custom Dropdown Menu */}
                            {openDropdown && (
                              <>
                                <div className="fixed inset-0 z-[90]" onClick={() => setOpenDropdown(false)}></div>
                                <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-2xl border border-[#7c3aed20] transition-all z-[100] overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                  {['Decoration', 'Photography', 'Catering', 'Venue'].map((cat) => (
                                    <div
                                      key={cat}
                                      className={`px-4 py-2.5 text-sm font-bold cursor-pointer transition-colors flex items-center gap-3 ${newService.category === cat ? 'bg-[#7c3aed10] text-[#7c3aed]' : 'text-slate-600 hover:bg-[#7c3aed08] hover:text-[#7c3aed]'
                                        }`}
                                      onClick={() => {
                                        setNewService({ ...newService, category: cat });
                                        setOpenDropdown(false);
                                      }}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${newService.category === cat ? 'bg-[#7c3aed] scale-100' : 'bg-transparent scale-0'}`}></div>
                                      {cat}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>Starting Price (₹)</label>
                        <input
                          type="number"
                          className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/20"
                          style={{
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            background: 'rgba(255, 255, 255, 0.95)'
                          }}
                          placeholder="e.g. 50000"
                          value={newService.basePrice}
                          onChange={(e) => setNewService({ ...newService, basePrice: e.target.value })}
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>Key Inclusions</p>
                        <div className="space-y-3">
                          {newService.inclusions.map((inc, idx) => (
                            <input
                              key={idx}
                              placeholder={`Service Feature ${idx + 1}`}
                              className="w-full rounded-2xl px-5 py-3 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-rose-500/20"
                              style={{
                                border: '1px solid rgba(124, 58, 237, 0.15)',
                                background: 'rgba(255, 255, 255, 0.95)'
                              }}
                              value={inc}
                              onChange={(e) => {
                                const incs = [...newService.inclusions];
                                incs[idx] = e.target.value;
                                setNewService({ ...newService, inclusions: incs });
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        className="vendor-cta w-full rounded-2xl py-5 font-bold text-lg mt-6 active:scale-95 transition-all shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #7c3aed)' }}
                        onClick={handleSaveService}
                      >
                        ✨ Save Service
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {vendorState.services.length === 0 ? (
                <div className="rounded-3xl border border-dashed p-8 sm:p-16 text-center shadow-inner" style={{
                  borderColor: 'rgba(159, 18, 57, 0.4)',
                  background: 'rgba(255, 255, 255, 0.95)'
                }}>
                  <div className="text-3xl mb-3">✨</div>
                  <p className="text-xs sm:text-sm font-bold" style={{ color: '#7c3aed' }}>No services added yet. Click &quot;Add service&quot; to get started.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {vendorState.services.map((service) => (
                    <div key={service.id} className="rounded-3xl p-6 relative group transition-all hover:scale-[1.02]" style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(124, 58, 237, 0.1)',
                      boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)'
                    }}>
                      <button
                        onClick={() => updateVendorState({ services: vendorState.services.filter(s => s.id !== service.id) })}
                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        style={{
                          background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                          border: '1px solid rgba(124, 58, 237, 0.2)',
                          color: '#7c3aed'
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-lg">{service.name}</h4>
                        <span className="rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{
                          background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#7c3aed'
                        }}>{service.category}</span>
                      </div>
                      <p className="mt-3 text-sm font-bold" style={{ color: '#7c3aed' }}>Base price: ₹{service.basePrice.toLocaleString()}</p>
                      <div className="mt-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#334155' }}>Packages: <span style={{ color: '#64748b' }}>{service.packages.map((pkg) => pkg.name).join(', ')}</span></div>
                      {service.inclusions && service.inclusions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {service.inclusions.map((inc, i) => (
                            <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold" style={{
                              background: 'rgba(253, 242, 248, 0.5)',
                              border: '1px solid rgba(124, 58, 237, 0.08)',
                              color: '#64748b'
                            }}>{inc}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {stepId === 'pricing' && (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#334155' }}>
                  Price range <span style={{ color: '#7c3aed' }}>*</span>
                </label>
                <input
                  className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all"
                  style={{
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                  value={vendorState.pricing.range}
                  placeholder="e.g. ₹50k - ₹2L"
                  onChange={(event) => updateVendorState({ pricing: { ...vendorState.pricing, range: event.target.value } })}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#334155' }}>Pricing notes</label>
                <textarea
                  className="h-32 w-full rounded-2xl px-5 py-4 text-sm font-semibold transition-all resize-none"
                  style={{
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                  value={vendorState.pricing.notes}
                  placeholder="Any additional details about your pricing approach or travel charges..."
                  onChange={(event) => updateVendorState({ pricing: { ...vendorState.pricing, notes: event.target.value } })}
                />
              </div>
            </div>
          )}

          {stepId === 'portfolio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/85 backdrop-blur-md shadow-sm p-4 sm:p-6 rounded-3xl border border-[#ede9fe]">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide drop-shadow-sm">Manage Portfolio</p>
                  <p className="text-[10px] sm:text-xs font-bold mt-1" style={{ color: '#475569' }}>Upload your work samples.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-[2.5rem] border border-white/40 p-5 sm:p-8 shadow-xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(244,223,223,0.5))' }}>
                    <div className="absolute inset-0 backdrop-blur-sm -z-10"></div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#7c3aed' }}>Add new showcase</p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>Project Title</label>
                        <input
                          className="w-full rounded-2xl px-5 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/10"
                          style={{ border: '1px solid rgba(124, 58, 237, 0.2)', background: 'rgba(255, 255, 255, 0.95)' }}
                          placeholder="e.g. Royal Palace Wedding"
                          value={newItem.title}
                          onKeyDown={(e) => {
                            if (e.key >= '0' && e.key <= '9') e.preventDefault();
                          }}
                          onChange={(e) => setNewItem({ ...newItem, title: e.target.value.replace(/[0-9]/g, '') })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#1e293b' }}>Category Tag</label>
                        <input
                          className="w-full rounded-2xl px-5 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-rose-500/10"
                          style={{ border: '1px solid rgba(124, 58, 237, 0.2)', background: 'rgba(255, 255, 255, 0.95)' }}
                          placeholder="e.g. Reception, Ceremony"
                          value={newItem.tag}
                          onKeyDown={(e) => {
                            if (e.key >= '0' && e.key <= '9') e.preventDefault();
                          }}
                          onChange={(e) => setNewItem({ ...newItem, tag: e.target.value.replace(/[0-9]/g, '') })}
                        />
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        className="vendor-cta w-full rounded-2xl py-2.5 font-bold text-sm mt-2 active:scale-95 transition-all"
                        onClick={handleUploadClick}
                      >
                        Select & Upload Media
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2 h-fit">
                  {vendorState.portfolio.length === 0 ? (
                    <div className="col-span-2 rounded-[2rem] border-2 border-dashed p-12 text-center flex flex-col items-center justify-center shadow-inner" style={{
                      borderColor: 'rgba(159, 18, 57, 0.3)',
                      background: 'rgba(255, 255, 255, 0.95)'
                    }}>
                      <div className="text-4xl mb-3">📷</div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7c3aed' }}>Your portfolio is empty</p>
                    </div>
                  ) : (
                    vendorState.portfolio.map((item) => (
                      <div key={item.id} className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#f5f3ff]">
                        <img src={item.url} alt={item.title} className="h-40 w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <p className="text-sm font-bold text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-[#ddd6fe] font-bold mt-0.5 tracking-wider uppercase">{item.tag}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {stepId === 'review' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="rounded-3xl border border-[#ede9fe] p-6 bg-white/90 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7c3aed]">Review Your Details</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">Confirm your details before submit</h2>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Category</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{vendorState.registration.category || 'Not selected'}</p>
                  <p className="mt-1 text-sm text-slate-500">{vendorState.registration.subCategory || subCategory || 'Select a subcategory'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Services</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{vendorState.services.length} service(s) added</p>
                  {vendorState.services.slice(0, 3).map((service) => (
                    <p key={service.id} className="mt-1 text-sm text-slate-500">• {service.name}</p>
                  ))}
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Business</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{vendorState.vendor?.businessName || vendorState.registration.businessName || 'Not provided'}</p>
                  <p className="mt-2 text-sm text-slate-500">{vendorState.businessDetails.description || 'No business description added.'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Location</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{vendorState.registration.city || 'Not provided'}</p>
                  <p className="mt-1 text-sm text-slate-500">{vendorState.businessDetails.serviceCities.join(', ') || 'No service areas added.'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Portfolio & Pricing</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{vendorState.portfolio.length} portfolio item(s)</p>
                  <p className="mt-1 text-sm text-slate-500">Pricing range: {vendorState.pricing.range || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}

          {stepId === 'submitted' && (
            <div className="space-y-6 max-w-2xl mx-auto text-center">
              <div className="rounded-[2.5rem] border border-[#ede9fe] p-10 bg-white/95 shadow-xl">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#eff6ff] text-4xl text-[#7c3aed]">✓</div>
                <h2 className="text-3xl font-bold text-slate-900">Registration Submitted</h2>
                <p className="mt-3 text-sm text-slate-500">Thank you for registering with us. Our team will review your details and get back to you soon.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-slate-700">What&apos;s next?</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-500 list-disc list-inside">
                  <li>Profile review in progress</li>
                  <li>You will get a notification once approved</li>
                  <li>Once approved, you can log in and receive bookings</li>
                </ul>
              </div>
            </div>
          )}

          {stepId === 'documents' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-md shadow-sm p-4 sm:p-6 rounded-3xl border border-[#ede9fe]">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide drop-shadow-sm">Required Uploads</p>
                  <p className="text-[10px] sm:text-xs font-bold mt-1" style={{ color: '#475569' }}>Identity and business verification.</p>
                </div>
              </div>
              {['idProof', 'gst', 'contract'].map((docKey) => (
                <div key={docKey} className="flex items-center justify-between rounded-3xl p-6 transition-all hover:scale-[1.02]" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(124, 58, 237, 0.1)',
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)'
                }}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #7c3aed)' }}>
                        {docKey === 'idProof' ? '1' : docKey === 'gst' ? '2' : '3'}
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {docKey === 'idProof' ? 'ID Proof (Aadhar/PAN)' : docKey === 'gst' ? 'GST Certificate' : 'Service Agreement'}
                      </p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider ml-9" style={{ color: '#334155' }}>PDF, JPG (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    ref={(el) => (docInputRefs[docKey].current = el)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocChange(docKey, e)}
                  />
                  <button
                    type="button"
                    className="rounded-2xl px-5 py-3 text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                    style={vendorState.documents[docKey]
                      ? { background: 'linear-gradient(135deg, #7c3aed, #7c3aed)', color: 'white', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }
                      : { background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.15)' }}
                    onClick={() => handleDocClick(docKey)}
                  >
                    {vendorState.documents[docKey] ? '✓ Uploaded' : 'Upload File'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {stepId === 'bank' && (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-md shadow-sm p-6 rounded-3xl border border-[#ede9fe]">
                <div>
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-wide drop-shadow-sm">Payment Information</p>
                  <p className="text-xs sm:text-sm font-bold mt-1" style={{ color: '#334155' }}>Provide your banking information for secure payments.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#334155' }}>Account name <span style={{ color: '#7c3aed' }}>*</span></label>
                <input
                  className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all"
                  style={{ border: '1px solid rgba(124, 58, 237, 0.15)', background: 'rgba(255, 255, 255, 0.9)' }}
                  value={vendorState.bank.accountName}
                  placeholder="Name as per bank records"
                  onChange={(event) => updateVendorState({
                    bank: { ...vendorState.bank, accountName: event.target.value.replace(/[^a-zA-Z ]/g, '') }
                  })}
                  onKeyDown={(e) => {
                    if (e.key >= '0' && e.key <= '9') e.preventDefault();
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#334155' }}>Account number <span style={{ color: '#7c3aed' }}>*</span></label>
                <input
                  className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all"
                  style={{ border: '1px solid rgba(124, 58, 237, 0.15)', background: 'rgba(255, 255, 255, 0.9)' }}
                  value={vendorState.bank.accountNumber}
                  placeholder="Enter 12-16 digit account number"
                  onChange={(event) => updateVendorState({ bank: { ...vendorState.bank, accountNumber: event.target.value.replace(/[^0-9]/g, '') } })}
                  onKeyDown={(e) => {
                    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#334155' }}>IFSC Code <span style={{ color: '#7c3aed' }}>*</span></label>
                <input
                  className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all"
                  style={{ border: '1px solid rgba(124, 58, 237, 0.15)', background: 'rgba(255, 255, 255, 0.9)' }}
                  value={vendorState.bank.ifsc}
                  placeholder="e.g. SBIN0001234"
                  onChange={(event) => updateVendorState({ bank: { ...vendorState.bank, ifsc: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') } })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider ml-1" style={{ color: '#334155' }}>UPI ID</label>
                <input
                  className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all"
                  style={{ border: '1px solid rgba(124, 58, 237, 0.15)', background: 'rgba(255, 255, 255, 0.9)' }}
                  value={vendorState.bank.upiId}
                  placeholder="e.g. name@upi"
                  onChange={(event) => updateVendorState({ bank: { ...vendorState.bank, upiId: event.target.value.toLowerCase().replace(/[^a-z0-9.@-]/g, '') } })}
                />
              </div>
            </div>
          )}

          {stepId === 'subscription' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select Your Business Tier</h3>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Choose the acceleration path that fits your growth</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activePlans.map((plan) => (
                  <div 
                    key={plan._id}
                    onClick={() => {
                      setSelectedPlanId(plan._id);
                      updateVendorState({ subscription: { ...vendorState.subscription, planId: plan._id } });
                    }}
                    className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col ${
                      selectedPlanId === plan._id 
                      ? 'border-[#7c3aed] bg-white shadow-[0_20px_50px_rgba(124, 58, 237,0.2)]' 
                      : 'border-slate-200 bg-white/70 hover:border-[#7c3aed]/40 hover:shadow-xl'
                    }`}
                  >
                    {/* Decorative Background Element */}
                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full transition-all duration-700 ${selectedPlanId === plan._id ? 'bg-[#7c3aed]/10 scale-150' : 'bg-slate-50 group-hover:bg-[#7c3aed]/5 group-hover:scale-110'}`}></div>

                    {selectedPlanId === plan._id && (
                      <div className="absolute top-6 right-6">
                        <div className="h-7 w-7 rounded-full bg-[#7c3aed] text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="mb-8">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${selectedPlanId === plan._id ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {plan.name}
                        </span>
                        <div className="flex items-baseline gap-1 mt-6">
                          <span className="text-4xl font-black text-slate-900">₹{plan.price.toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-400">/ {plan.durationValue} {plan.durationUnit}(s)</span>
                        </div>
                      </div>

                      <div className="space-y-4 py-8 border-y border-slate-100 flex-1">
                        {(plan.features || []).map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-slate-700 leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        className={`w-full mt-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                          selectedPlanId === plan._id 
                          ? 'bg-[#7c3aed] text-white shadow-[0_10px_25px_rgba(124, 58, 237,0.3)]' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {selectedPlanId === plan._id ? 'Current Selection' : 'Choose This Plan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-widest">
                * Secured by Razorpay • Instant Verification • Auto-Renewal Options
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderColor: 'rgba(124, 58, 237, 0.1)' }}>
          <div className="flex items-center gap-2 text-[#7c3aed]">
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Progress is saved automatically</span>
          </div>
          <button
            type="button"
            className="w-full sm:w-auto rounded-2xl px-16 py-4 text-sm font-black uppercase tracking-[0.15em] text-white shadow-2xl transition-all active:scale-95 hover:shadow-[#7c3aed]/40 hover:-translate-y-0.5"
            style={{ 
              background: 'linear-gradient(135deg, #7c3aed 0%, #d84d77 100%)',
              boxShadow: '0 12px 35px -8px rgba(124, 58, 237, 0.4)'
            }}
            onClick={handleNext}
          >
            {stepId === 'review' ? 'Submit for Verification' : stepId === 'submitted' ? 'Go to Dashboard' : 'Continue to Next Step →'}
          </button>
        </div>

        {/* Global Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 min-w-max"
              style={{
                background: toast.type === 'error'
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(135deg, #7c3aed, #7c3aed, #a855f7)',
                color: 'white',
                boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.4)'
              }}>
              {toast.type === 'loading' ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : toast.type === 'success' ? (
                <div className="h-6 w-6 flex items-center justify-center rounded-full bg-white/20 text-xs text-white">✓</div>
              ) : (
                <div className="text-xl">✨</div>
              )}
              <p className="font-bold text-xs sm:text-sm uppercase tracking-wider">{toast.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorOnboarding;
