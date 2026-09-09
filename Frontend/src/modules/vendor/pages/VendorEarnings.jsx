import { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';

const VendorEarnings = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    platformCommission: 0,
    currency: 'INR'
  });
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    ifsc: '',
    upiId: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const fetchEarnings = useCallback(async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getEarnings(token);
      if (res.success) {
        setEarnings(res.data);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const validateField = (name, value) => {
    let errorMsg = '';
    
    if (name === 'accountName') {
      if (!value.trim()) {
        errorMsg = 'Account name is required';
      } else if (!/^[a-zA-Z\s]{3,50}$/.test(value)) {
        errorMsg = 'Must be at least 3 letters (no numbers/symbols)';
      }
    }

    if (name === 'accountNumber') {
      if (!value) {
        errorMsg = 'Account number is required';
      } else if (value.length < 9) {
        errorMsg = 'Must be at least 9 digits';
      } else if (value.length > 18) {
        errorMsg = 'Cannot exceed 18 digits';
      }
    }

    if (name === 'ifsc') {
      if (!value) {
        errorMsg = 'IFSC is required';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
        errorMsg = 'Format should be like SBIN0001234 (11 chars)';
      }
    }

    if (name === 'upiId') {
      if (value && !/^[\w.-]+@[\w.-]+$/.test(value)) {
        errorMsg = 'Invalid UPI ID format (e.g. name@bank)';
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Account Name
    if (!bankDetails.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    } else if (!/^[a-zA-Z\s]{3,50}$/.test(bankDetails.accountName)) {
      newErrors.accountName = 'Must be at least 3 letters (no numbers/symbols)';
    }

    // Account Number
    if (!bankDetails.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18) {
      newErrors.accountNumber = 'Must be between 9 and 18 digits';
    }

    // IFSC Code
    if (!bankDetails.ifsc) {
      newErrors.ifsc = 'IFSC is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifsc.toUpperCase())) {
      newErrors.ifsc = 'Format should be like SBIN0001234 (11 chars)';
    }

    // UPI ID
    if (bankDetails.upiId && !/^[\w.-]+@[\w.-]+$/.test(bankDetails.upiId)) {
      newErrors.upiId = 'Invalid UPI ID format (e.g. name@bank)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).every(key => !newErrors[key]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'accountNumber') {
      // Numbers only, max 18 digits
      finalValue = value.replace(/\D/g, '').slice(0, 18);
    } else if (name === 'ifsc') {
      // Auto uppercase, max 11 chars
      finalValue = value.toUpperCase().slice(0, 11);
    } else if (name === 'accountName') {
      // Max 50 chars
      finalValue = value.slice(0, 50);
    }
    
    setBankDetails(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    validateField(name, finalValue);
  };

  const handleBankUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSaving(true);
    setSaveStatus('');
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/vendor/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bank: bankDetails })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('success');
        setTimeout(() => {
           setShowBankModal(false);
           setSaveStatus('');
           setErrors({});
           setShowSuccessPopup(true); // Open success modal popup
        }, 1000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating your success...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-3 animate-in fade-in duration-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .cal { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes calUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cal-in { animation: calUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="cal cal-in pb-0.5">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">Financials</p>
        <h2 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight mt-0.5">Earnings Summary</h2>
        <p className="text-[8.5px] font-medium text-slate-400 mt-0.5">Track your income, payouts & platform fees</p>
      </div>

      {/* 3-Column Stats Grid */}
      <div className="cal cal-in grid grid-cols-3 gap-2">
        {/* Card 1: Total Earnings */}
        <div className="bg-white rounded-2xl p-2 xs:p-2.5 sm:p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-5 w-5 xs:h-6 xs:w-6 rounded-lg bg-violet-50/50 flex items-center justify-center text-[#7C3AED] border border-violet-100/50">
                <Icon name="money" className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
              </div>
              <span className="text-[5.5px] xs:text-[6.5px] font-black uppercase tracking-wider bg-violet-50 text-[#7C3AED] px-1 py-0.5 rounded">Real-Time</span>
            </div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total Earnings</p>
            <h3 className="text-[11.5px] xs:text-[13px] sm:text-[15px] font-black text-slate-800 tracking-tight leading-none">₹{(earnings.totalEarnings || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="mt-1">
            <p className="text-[7.5px] xs:text-[8px] font-bold text-emerald-600 flex items-center gap-0.5 leading-none">
              <span>↑</span> 12.5%<span className="hidden xs:inline text-[7px] text-slate-400"> vs last month</span>
            </p>
            <svg className="w-full h-4 xs:h-5 mt-1" viewBox="0 0 120 20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,17 Q15,5 30,12 T60,5 T90,15 T120,3 L120,20 L0,20 Z" fill="url(#purpleGrad)" />
              <path d="M0,17 Q15,5 30,12 T60,5 T90,15 T120,3" fill="none" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="120" cy="3" r="1.5" fill="#7C3AED" />
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Payout */}
        <div className="bg-white rounded-2xl p-2 xs:p-2.5 sm:p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-5 w-5 xs:h-6 xs:w-6 rounded-lg bg-amber-50/50 flex items-center justify-center text-amber-500 border border-amber-100/50">
                <Icon name="clock" className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
              </div>
              <span className="text-[5.5px] xs:text-[6.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 px-1 py-0.5 rounded">Pending</span>
            </div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Pending Payout</p>
            <h3 className="text-[11.5px] xs:text-[13px] sm:text-[15px] font-black text-slate-800 tracking-tight leading-none">₹{(earnings.pendingPayments || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="mt-1">
            <p className="text-[7.5px] xs:text-[8px] font-bold text-slate-400 flex items-center gap-0.5 leading-none">
              <span className="h-1 w-1 rounded-full bg-amber-400 inline-block" /> No pending<span className="hidden xs:inline"> payouts</span>
            </p>
            <svg className="w-full h-4 xs:h-5 mt-1" viewBox="0 0 120 20" preserveAspectRatio="none">
              <line x1="0" y1="10" x2="120" y2="10" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="120" cy="10" r="1.5" fill="#F59E0B" />
            </svg>
          </div>
        </div>

        {/* Card 3: Platform Fee */}
        <div className="bg-white rounded-2xl p-2 xs:p-2.5 sm:p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-5 w-5 xs:h-6 xs:w-6 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                <Icon name="chart" className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
              </div>
              <span className="text-[5.5px] xs:text-[6.5px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-1 py-0.5 rounded">Real-Time</span>
            </div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Platform Fee</p>
            <h3 className="text-[11.5px] xs:text-[13px] sm:text-[15px] font-black text-slate-800 tracking-tight leading-none">₹{(earnings.platformCommission || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="mt-1">
            <p className="text-[7.5px] xs:text-[8px] font-bold text-[#10B981] flex items-center gap-0.5 leading-none">
              <span>↓</span> 8%<span className="hidden xs:inline text-[7px] text-slate-400"> vs last month</span>
            </p>
            <svg className="w-full h-4 xs:h-5 mt-1" viewBox="0 0 120 20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,15 Q20,18 40,8 T80,5 T120,4 L120,20 L0,20 Z" fill="url(#blueGrad)" />
              <path d="M0,15 Q20,18 40,8 T80,5 T120,4" fill="none" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="120" cy="4" r="1.5" fill="#2563EB" />
            </svg>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Section */}
      <div className="cal cal-in bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Earnings Breakdown</h3>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[8.5px] font-bold text-slate-600 outline-none">
            <option>This Month</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {[
            { label: 'Gross Earnings', value: `₹${(earnings.totalEarnings + earnings.platformCommission).toLocaleString('en-IN')}`, icon: 'trendUp', sub: '↑ 15.4%', iconColor: '#10B981', iconBg: '#E6F4EA', subColor: 'text-emerald-500' },
            { label: 'Platform Fee', value: `₹${(earnings.platformCommission).toLocaleString('en-IN')}`, icon: 'minus', sub: '↓ 8.0%', iconColor: '#EF4444', iconBg: '#FCE8E6', subColor: 'text-rose-500' },
            { label: 'Other Deductions', value: '₹0', icon: 'checkList', sub: '— 0%', iconColor: '#F59E0B', iconBg: '#FEF7E0', subColor: 'text-slate-400' },
            { label: 'Net Earnings', value: `₹${(earnings.totalEarnings).toLocaleString('en-IN')}`, icon: 'money', sub: '↑ 12.5%', iconColor: '#7C3AED', iconBg: '#F3E8FF', subColor: 'text-emerald-500' }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center px-0.5 first:pl-0 last:pr-0">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-1.5" style={{ background: item.iconBg, color: item.iconColor }}>
                {item.icon === 'trendUp' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 7.443-4.253m0 0H15.75m5.25 0V16.5" />
                  </svg>
                ) : item.icon === 'minus' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                ) : (
                  <Icon name={item.icon} size="xs" />
                )}
              </div>
              <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">{item.label}</p>
              <h4 className="text-[11px] xs:text-[12.5px] sm:text-[14px] font-black text-slate-800 leading-tight mb-0.5">{item.value}</h4>
              <p className={`text-[8px] font-black ${item.subColor}`}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card / Payout Policy */}
      <div className="cal cal-in bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden shadow-md">
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <Icon name="chart" size="3xl" />
         </div>
         <div className="relative z-10">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#A78BFA] mb-1">Payout Policy</h3>
            <p className="text-[9px] text-slate-400 font-medium leading-relaxed max-w-md">
               Earnings are processed every Tuesday. A standard 10% platform commission is deducted from each successful booking. Ensure your bank details are verified to avoid payment delays.
            </p>
            <button 
               onClick={() => setShowBankModal(true)}
               className="mt-3.5 bg-rose-500 hover:bg-rose-600 text-white text-[8px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 shadow-md shadow-rose-900/10"
            >
               Verify Bank Account
            </button>
         </div>
      </div>

      {/* Bank Verification Input Modal */}
      {showBankModal && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Verify Bank Account</h3>
                  <button onClick={() => { setShowBankModal(false); setErrors({}); }} className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                     <Icon name="close" size="xs" />
                  </button>
               </div>
               <form onSubmit={handleBankUpdate} className="p-6 space-y-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Account Holder Name</label>
                     <input 
                        required
                        type="text" 
                        name="accountName"
                        value={bankDetails.accountName}
                        onChange={handleInputChange}
                        className={`w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-[11px] font-bold focus:ring-1 transition-all ${
                          errors.accountName ? 'ring-1 ring-rose-500' : 'ring-rose-200'
                        }`}
                        placeholder="e.g. John Doe"
                     />
                     {errors.accountName && (
                       <p className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wide leading-none mt-1">
                         {errors.accountName}
                       </p>
                     )}
                  </div>
                  
                  {/* Account Number field */}
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Account Number</label>
                     <input 
                        required
                        type="text" 
                        name="accountNumber"
                        maxLength={18}
                        value={bankDetails.accountNumber}
                        onChange={handleInputChange}
                        className={`w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-[11px] font-bold focus:ring-1 transition-all ${
                          errors.accountNumber ? 'ring-1 ring-rose-500' : 'ring-rose-200'
                        }`}
                        placeholder="0000 0000 0000"
                     />
                     {errors.accountNumber && (
                       <p className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wide leading-none mt-1">
                         {errors.accountNumber}
                       </p>
                     )}
                  </div>
                  
                  {/* IFSC & UPI row */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">IFSC Code</label>
                        <input 
                           required
                           type="text" 
                           name="ifsc"
                           value={bankDetails.ifsc}
                           onChange={handleInputChange}
                           className={`w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-[11px] font-bold focus:ring-1 transition-all ${
                             errors.ifsc ? 'ring-1 ring-rose-500' : 'ring-rose-200'
                           }`}
                           placeholder="SBIN0000..."
                        />
                        {errors.ifsc && (
                          <p className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wide leading-tight mt-1">
                            {errors.ifsc}
                          </p>
                        )}
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">UPI ID (Optional)</label>
                        <input 
                           type="text" 
                           name="upiId"
                           value={bankDetails.upiId}
                           onChange={handleInputChange}
                           className={`w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-[11px] font-bold focus:ring-1 transition-all ${
                             errors.upiId ? 'ring-1 ring-rose-500' : 'ring-rose-200'
                           }`}
                           placeholder="name@upi"
                        />
                        {errors.upiId && (
                          <p className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wide leading-tight mt-1">
                            {errors.upiId}
                          </p>
                        )}
                     </div>
                  </div>

                  <div className="pt-4">
                     <button 
                        disabled={isSaving}
                        type="submit"
                        className="w-full h-12 bg-[#7C3AED] hover:bg-[#5b21b6] text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {isSaving ? 'Connecting to Node...' : 'Submit for Verification'}
                     </button>
                     {saveStatus === 'error' && (
                        <p className="text-[9px] font-bold text-rose-500 text-center mt-2 uppercase">Packet delivery failed. Try again.</p>
                     )}
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Success / Approval Confirmation Popup */}
      {showSuccessPopup && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 p-6 text-center animate-in zoom-in-95 duration-300">
               {/* Animated Success Checkmark Ring */}
               <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-100 shadow-sm animate-bounce">
                  <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="3" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
               </div>
               
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Verification Submitted</h3>
               <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6">
                  Your bank account details have been successfully received. We will verify your account and process payouts once the verification checks are complete. (usually takes 24 hours).
               </p>

               <button 
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
               >
                  Okay, Got It
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default VendorEarnings;
