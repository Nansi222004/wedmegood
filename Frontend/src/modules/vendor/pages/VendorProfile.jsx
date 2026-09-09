import { useState, useEffect } from 'react';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import { computeProfileCompletion } from '../vendorStore';
import Icon from '../../../components/ui/Icon';
import { adminApi } from '../../admin/services/adminApi';

const VendorProfile = () => {
  const { vendorState, updateVendorState, refreshData } = useVendorState();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApprovedCelebration, setShowApprovedCelebration] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [tempProfile, setTempProfile] = useState({ 
    profileImage: null,
    fullName: '',
    businessName: '',
    category: '',
    city: '',
    phone: '',
    businessDetails: {
      years: '',
      teamSize: '',
      description: '',
      languages: [],
      serviceCities: []
    },
    bank: {
      accountName: '',
      accountNumber: '',
      ifsc: '',
      upiId: ''
    }
  });

  useEffect(() => {
    if (vendorState) {
      setTempProfile({
        profileImage: vendorState.profileImage || null,
        fullName: vendorState.fullName || '',
        businessName: vendorState.businessName || '',
        category: vendorState.category || '',
        city: vendorState.city || '',
        phone: vendorState.phone || '',
        businessDetails: {
          years: vendorState.businessDetails?.years || '',
          teamSize: vendorState.businessDetails?.teamSize || '',
          description: vendorState.businessDetails?.description || '',
          languages: vendorState.businessDetails?.languages || [],
          serviceCities: vendorState.businessDetails?.serviceCities || []
        },
        bank: {
          accountName: vendorState.bank?.accountName || '',
          accountNumber: vendorState.bank?.accountNumber || '',
          ifsc: vendorState.bank?.ifsc || '',
          upiId: vendorState.bank?.upiId || ''
        }
      });
    }
  }, [vendorState]);

  const handleCategoryFocus = async () => {
    if (categories.length === 0) {
      try {
        const res = await adminApi.getCategories();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error("Categories fetch failed", err);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalProfileImage = tempProfile.profileImage;
      
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('folder', 'utsavo/vendors/profile');
        formData.append('images', profileImageFile);
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const uploadRes = await fetch(`${BASE_URL}/upload/multiple`, { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data.length > 0) {
          finalProfileImage = uploadData.data[0].url;
        } else {
          alert(uploadData.message || 'Failed to upload profile image');
          setIsSaving(false);
          return;
        }
      }

      const token = localStorage.getItem('vendorToken');
      const payload = { ...tempProfile, profileImage: finalProfileImage };
      const res = await vendorApi.updateProfile(payload, token);
      if (res.success) {
        updateVendorState(res.data);
        setIsEditing(false);
        refreshData();
      } else {
        alert(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Network error while saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    if (keys.length === 1) {
      setTempProfile(prev => ({ ...prev, [keys[0]]: value }));
    } else {
      setTempProfile(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: value
        }
      }));
    }
  };

  const completion = computeProfileCompletion(vendorState);

  // Profile breakdown logic
  const getBreakdown = () => {
    const info = (vendorState.businessName && vendorState.category && vendorState.city) ? 40 : 10;
    const portfolio = (vendorState.portfolio?.length > 0) ? 30 : 5;
    const docs = (vendorState.documents?.idProof) ? 20 : 0;
    const reviews = (vendorState.reviews?.length > 0) ? 10 : 0;
    
    return [
      { label: 'Business Information', value: info, icon: 'store', color: 'indigo' },
      { label: 'Service & Portfolio', value: portfolio, icon: 'image', color: 'violet' },
      { label: 'Verification & Documents', value: docs, icon: 'shield', color: 'blue' },
      { label: 'Customer Reviews', value: reviews, icon: 'star', color: 'amber' }
    ];
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [vendorState]);

  return (
    <div className="max-w-2xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }

        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-active {
          opacity: 1;
          transform: translateY(0);
        }
        .section-box {
          background: #F8FAFF;
          border-radius: 1rem;
          padding: 1rem;
          border: 1px solid #E2E8F0;
        }
        .detail-card {
          background: white;
          border-radius: 0.6rem;
          padding: 0.85rem;
          border: 1px solid #F1F5F9;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
        }
        .detail-label {
          font-size: 8px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin-bottom: 0.2rem;
          display: block;
        }
        .detail-value {
          font-size: 13px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
      `}</style>

      {/* Ultra-Compact Header Card */}
      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-4">
        {/* Profile Image with Edit Pencil Icon */}
        <div className="relative w-16 h-16 rounded-full border-2 border-[#F5F3FF] shadow-sm bg-slate-100 flex-shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            {profileImageFile ? (
              <img src={URL.createObjectURL(profileImageFile)} alt="Profile" className="w-full h-full object-cover" />
            ) : tempProfile.profileImage ? (
              <img src={tempProfile.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Icon name="user" className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-6 h-6 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95 border-2 border-white">
            <Icon name="edit" className="w-3.5 h-3.5 text-white" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setProfileImageFile(e.target.files[0]);
                  // Instantly switch to edit mode so they know there are unsaved changes
                  setIsEditing(true);
                }
              }}
            />
          </label>
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[7.5px] font-black uppercase tracking-wider text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.5 rounded-sm">Management</span>
            <span className="text-[7.5px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100">Live</span>
          </div>
          <div>
            <h1 className="text-lg font-serif font-black text-slate-900 leading-none">Business Profile</h1>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Verified Identity & Operational Details</p>
          </div>
        </div>
      </div>

      {/* Section 01: Business Overview (Refined - Image 2 Style) */}
      <div className="section-box !bg-[#F8FAFF] !p-3 reveal-on-scroll mt-4">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-sm">
              <Icon name="store" size="xs" />
            </div>
            <h2 className="text-[12px] font-sans font-semibold text-slate-800 tracking-tight">Business Overview</h2>
          </div>
          <button 
            disabled={isSaving}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="h-7 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-md flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all active:scale-[0.97] shadow-sm shadow-violet-100 disabled:opacity-50"
          >
            {isSaving ? (
              <Icon name="loader" size="xs" className="animate-spin" />
            ) : (
              <Icon name={isEditing ? 'check' : 'edit'} size="xs" />
            )}
            {isSaving ? 'Saving...' : (isEditing ? 'Save' : 'Edit Business')}
          </button>
        </div>

        <div className="space-y-1">
          <div className="detail-card !p-2">
            <label className="detail-label !text-[7px] !font-medium">Legal Business Name</label>
            {isEditing ? (
              <input className="w-full bg-slate-50 border-none rounded-md px-2 py-0.5 text-[11.5px] font-medium text-slate-900 outline-none" value={tempProfile.businessName} onChange={(e) => handleChange('businessName', e.target.value)} />
            ) : (
              <p className="detail-value !text-[11.5px] !font-semibold !text-slate-700">{tempProfile.businessName || 'Not Provided'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="detail-card !p-2">
              <label className="detail-label !text-[7px] !font-medium">Operating Category</label>
              {isEditing ? (
                <select 
                  className="w-full bg-slate-50 border-none rounded-md px-2 py-0.5 text-[11.5px] font-medium text-slate-900 outline-none" 
                  value={tempProfile.category} 
                  onChange={(e) => handleChange('category', e.target.value)}
                  onFocus={handleCategoryFocus}
                  onClick={handleCategoryFocus}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <p className="detail-value !text-[11.5px] !font-semibold !text-slate-700">{tempProfile.category || 'N/A'}</p>
              )}
            </div>
            <div className="detail-card !p-2">
              <label className="detail-label !text-[7px] !font-medium">Base City</label>
              {isEditing ? (
                <input className="w-full bg-slate-50 border-none rounded-md px-2 py-0.5 text-[11.5px] font-medium text-slate-900 outline-none" value={tempProfile.city} onChange={(e) => handleChange('city', e.target.value)} />
              ) : (
                <p className="detail-value !text-[11.5px] !font-semibold !text-slate-700">{tempProfile.city || 'N/A'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div className="detail-card !p-2">
              <label className="detail-label !text-[7px] !font-medium">Exp. (Years)</label>
              {isEditing ? (
                <input type="number" min="0" className="w-full bg-slate-50 border-none rounded-md px-2 py-0.5 text-[11.5px] font-medium text-slate-900 outline-none" value={tempProfile.businessDetails?.years || ''} onChange={(e) => handleChange('businessDetails.years', e.target.value)} />
              ) : (
                <p className="detail-value !text-[11.5px] !font-semibold !text-slate-700">{tempProfile.businessDetails?.years || '0'} Years</p>
              )}
            </div>
            <div className="detail-card !p-2">
              <label className="detail-label !text-[7px] !font-medium">Core Team Size</label>
              {isEditing ? (
                <input type="number" min="1" className="w-full bg-slate-50 border-none rounded-md px-2 py-0.5 text-[11.5px] font-medium text-slate-900 outline-none" value={tempProfile.businessDetails?.teamSize || ''} onChange={(e) => handleChange('businessDetails.teamSize', e.target.value)} />
              ) : (
                <p className="detail-value !text-[11.5px] !font-semibold !text-slate-700">{tempProfile.businessDetails?.teamSize || '1'} Members</p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Profile Strength Breakdown (Refined - Medium Weight) */}
      <div className="section-box !bg-white !p-4 border-slate-100 reveal-on-scroll">
        <div className="flex items-center justify-between mb-4 px-0.5">
          <h2 className="text-[14px] font-sans font-bold text-slate-800 tracking-tight">Profile Strength Breakdown</h2>
          <span className="text-[7.5px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">{completion}% Complete</span>
        </div>

        <div className="space-y-3">
          {getBreakdown().map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-md bg-${item.color}-50/50 flex items-center justify-center text-${item.color}-500 border border-${item.color}-100/50`}>
                    <Icon name={item.icon} size="xs" />
                  </div>
                  <span className="text-[12px] font-medium text-slate-500 tracking-normal">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[11px] font-semibold text-slate-700 w-8 text-right">{item.value}%</span>
                   <div className="h-1 w-28 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                    <div 
                      className="h-full bg-violet-500 rounded-full transition-all duration-1000 delay-200" 
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration Popup Modal */}
      {showApprovedCelebration && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-300"
            onClick={() => setShowApprovedCelebration(false)}
          ></div>
          <div className="relative w-full max-w-sm bg-gradient-to-b from-white to-emerald-50/10 rounded-2xl border border-emerald-100 shadow-2xl p-6 overflow-hidden text-center animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center">
            {/* Spinning decorative background */}
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute inset-0 border border-dashed border-emerald-300/40 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
              <div className="h-16 w-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 relative z-10 scale-in duration-500">
                <Icon name="check" size="lg" />
              </div>
            </div>

            <h3 className="text-[17px] font-sans font-black text-slate-800 tracking-tight leading-tight">
              Portal Verified & Approved
            </h3>
            <p className="text-[10.5px] font-sans font-medium text-slate-500 mt-2 max-w-[280px] leading-relaxed">
              Congratulations! Your business is officially verified and approved by the WedMeGood editorial team. You now enjoy maximum operational perks:
            </p>

            <div className="mt-4 w-full bg-white/80 rounded-xl p-3 border border-slate-100 space-y-2.5 text-left">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700">
                <span className="h-4 w-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 flex-shrink-0 text-[8px]">✓</span>
                <span>Verified Badge on Live Listing</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700">
                <span className="h-4 w-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 flex-shrink-0 text-[8px]">✓</span>
                <span>Priority in Search Results & Filters</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700">
                <span className="h-4 w-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 flex-shrink-0 text-[8px]">✓</span>
                <span>Unlimited Customer Quote Requests</span>
              </div>
            </div>

            <button 
              onClick={() => setShowApprovedCelebration(false)} 
              className="mt-5 w-full h-9 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              Great
            </button>
          </div>
        </div>
      )}
      {/* Sign Out Card */}
      <div className="section-box !bg-rose-50/40 !border-rose-100/60 !p-3 flex items-center justify-between gap-3 reveal-on-scroll">
        <div className="space-y-0.5">
          <h2 className="text-[11.5px] font-sans font-bold text-slate-800 tracking-tight">Active Session</h2>
          <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">Securely sign out of your Utsavo Vendor portal</p>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('vendorToken');
            window.location.href = '/vendor/login';
          }}
          className="h-8 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider transition-all active:scale-[0.97] shadow-md shadow-rose-100/50"
        >
          <Icon name="logout" size="xs" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default VendorProfile;
