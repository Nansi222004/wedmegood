import { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';

const VendorEarnings = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    platformCommission: 0,
    availableBalance: 0,
    lockedBalance: 0,
    totalWithdrawn: 0,
    netEarnings: 0,
    currency: 'INR'
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
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

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('BankTransfer');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const fetchEarnings = useCallback(async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) return;

      const [earningsRes, withdrawalsRes, meRes] = await Promise.all([
        vendorApi.getEarnings(token),
        vendorApi.getWithdrawals(token).catch(() => ({ success: false })),
        vendorApi.getMe(token).catch(() => ({ success: false }))
      ]);

      if (earningsRes.success) {
        setEarnings(earningsRes.data);
      }
      if (withdrawalsRes?.success && Array.isArray(withdrawalsRes.data)) {
        setWithdrawals(withdrawalsRes.data);
      }
      if (meRes?.success && meRes.data?.vendor) {
        const v = meRes.data.vendor;
        const bank = v.bank || v.bankDetails || {};
        setBankDetails({
          accountName: bank.accountName || v.businessName || '',
          accountNumber: bank.accountNumber || '',
          ifsc: bank.ifsc || '',
          upiId: bank.upiId || ''
        });
      }
    } catch (err) {
      console.error('Error fetching earnings and withdrawals:', err);
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
    
    if (!bankDetails.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    } else if (!/^[a-zA-Z\s]{3,50}$/.test(bankDetails.accountName)) {
      newErrors.accountName = 'Must be at least 3 letters (no numbers/symbols)';
    }

    if (!bankDetails.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18) {
      newErrors.accountNumber = 'Must be between 9 and 18 digits';
    }

    if (!bankDetails.ifsc) {
      newErrors.ifsc = 'IFSC is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifsc.toUpperCase())) {
      newErrors.ifsc = 'Format should be like SBIN0001234 (11 chars)';
    }

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
      finalValue = value.replace(/\D/g, '').slice(0, 18);
    } else if (name === 'ifsc') {
      finalValue = value.toUpperCase().slice(0, 11);
    } else if (name === 'accountName') {
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
           setShowSuccessPopup(true);
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

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    const available = Number(earnings.availableBalance || 0);

    if (!amount || amount <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      return;
    }
    if (amount > available) {
      setWithdrawError(`Cannot withdraw more than your available balance of ₹${available.toLocaleString('en-IN')}`);
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError('');
    setWithdrawSuccess('');

    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.requestWithdrawal({
        amount,
        payoutMethod: withdrawMethod,
        bankDetails
      }, token);

      if (res.success) {
        setWithdrawSuccess(`Payout request for ₹${amount.toLocaleString('en-IN')} submitted successfully!`);
        setWithdrawAmount('');
        await fetchEarnings();
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawSuccess('');
        }, 1800);
      } else {
        setWithdrawError(res.message || 'Failed to submit withdrawal request.');
      }
    } catch (err) {
      setWithdrawError(err.message || 'Error communicating with payout node.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Financial Ledger...</p>
      </div>
    );
  }

  const availableBal = Number(earnings.availableBalance || 0);

  return (
    <div className="pb-24 space-y-4 animate-in fade-in duration-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .cal { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes calUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cal-in { animation: calUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header with Quick Actions */}
      <div className="cal cal-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">Financials & Treasury</p>
          <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-tight mt-0.5">Earnings & Payouts</h2>
          <p className="text-[9px] font-medium text-slate-400 mt-0.5">Real-time balances, pending settlements & payout registry</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBankModal(true)}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            Bank Details
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={availableBal <= 0}
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* Available Balance Hero Banner */}
      <div className="cal cal-in bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-wider mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Settled & Available
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Available Balance for Withdrawal</p>
            <h1 className="text-3xl font-black text-white tracking-tight mt-1">
              ₹{availableBal.toLocaleString('en-IN')}
            </h1>
            <p className="text-[8.5px] text-slate-400 mt-1">
              Eligible funds ready for immediate bank transfer. (Zero withdrawal fee)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={availableBal <= 0}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              Withdraw ₹{availableBal.toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Financial Stats Grid */}
      <div className="cal cal-in grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Card 1: Total Gross Earnings */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-6 w-6 rounded-lg bg-violet-50 flex items-center justify-center text-[#7C3AED] border border-violet-100">
              <Icon name="money" className="w-3.5 h-3.5" />
            </div>
            <span className="text-[6.5px] font-black uppercase tracking-wider bg-violet-50 text-[#7C3AED] px-1.5 py-0.5 rounded">All-Time</span>
          </div>
          <div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Gross Earnings</p>
            <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">
              ₹{(earnings.totalEarnings || 0).toLocaleString('en-IN')}
            </h3>
          </div>
        </div>

        {/* Card 2: Pending Settlements */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
              <Icon name="clock" className="w-3.5 h-3.5" />
            </div>
            <span className="text-[6.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">In Escrow</span>
          </div>
          <div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending Settlement</p>
            <h3 className="text-[15px] font-black text-amber-600 tracking-tight leading-none">
              ₹{(earnings.pendingBalance ?? earnings.pendingPayments ?? 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[7px] font-bold text-slate-400 mt-1">Releases upon event completion</p>
          </div>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Icon name="check" className="w-3.5 h-3.5" />
            </div>
            <span className="text-[6.5px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Settled</span>
          </div>
          <div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Withdrawn</p>
            <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">
              ₹{(earnings.totalWithdrawn || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[7px] font-bold text-slate-400 mt-1">Direct to verified bank</p>
          </div>
        </div>

        {/* Card 4: Platform Commission */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Icon name="chart" className="w-3.5 h-3.5" />
            </div>
            <span className="text-[6.5px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">10% Fee</span>
          </div>
          <div>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Platform Commission</p>
            <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">
              ₹{(earnings.platformCommission || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[7px] font-bold text-slate-400 mt-1">Retained by platform</p>
          </div>
        </div>
      </div>

      {/* Payout Requests History Table */}
      <div className="cal cal-in bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Payout Registry & Settlements</h3>
            <p className="text-[8.5px] text-slate-400 font-medium">History of your withdrawal requests and settlements</p>
          </div>
          <span className="text-[8.5px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
            {withdrawals.length} Records
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No withdrawal requests yet</p>
            <p className="text-[8.5px] text-slate-400 mt-0.5">When you request a payout from your available balance, it will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[8px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-2">Request ID</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Method</th>
                  <th className="py-3 px-2">Reference / UTR</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[10px] font-bold text-slate-700">
                {withdrawals.map((w) => {
                  const statusColors = {
                    Paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    Approved: 'bg-blue-50 text-blue-600 border-blue-200',
                    Processing: 'bg-indigo-50 text-indigo-600 border-indigo-200',
                    Requested: 'bg-amber-50 text-amber-600 border-amber-200',
                    Rejected: 'bg-rose-50 text-rose-600 border-rose-200'
                  };
                  return (
                    <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-2 font-mono text-[9px] text-slate-900">
                        #{w._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-2 font-black text-slate-900">
                        ₹{Number(w.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {w.payoutMethod || 'BankTransfer'}
                      </td>
                      <td className="py-3 px-2 font-mono text-[9px] text-slate-500">
                        {w.payoutReference || 'Pending UTR'}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${statusColors[w.status] || 'bg-slate-50 text-slate-600'}`}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Request Vendor Payout</h3>
                <p className="text-[9px] font-bold text-emerald-600">Available: ₹{availableBal.toLocaleString('en-IN')}</p>
              </div>
              <button 
                onClick={() => { setShowWithdrawModal(false); setWithdrawError(''); setWithdrawSuccess(''); }} 
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="p-6 space-y-4">
              {withdrawError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px] font-bold text-rose-600">
                  {withdrawError}
                </div>
              )}
              {withdrawSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-600">
                  {withdrawSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Withdrawal Amount (₹)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={availableBal}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`e.g. ${availableBal > 0 ? availableBal : 5000}`}
                    className="w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-[12px] font-bold focus:ring-2 focus:ring-[#7C3AED]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(availableBal))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-black uppercase tracking-wider rounded-lg"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payout Destination</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full h-11 rounded-xl bg-slate-50 border-0 px-4 text-[11px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  <option value="BankTransfer">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI Transfer</option>
                </select>
              </div>

              {/* Bank Summary Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Receiving Account</p>
                {bankDetails.accountNumber ? (
                  <div>
                    <p className="font-bold text-slate-800">{bankDetails.accountName || 'Primary Account'}</p>
                    <p className="font-mono text-[9px] text-slate-500">A/C: •••• {bankDetails.accountNumber.slice(-4)} | IFSC: {bankDetails.ifsc}</p>
                  </div>
                ) : (
                  <div className="text-amber-600 font-bold">
                    No bank account configured. Please verify bank details first.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isWithdrawing || availableBal <= 0 || !bankDetails.accountNumber}
                  className="w-full py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? 'Reserving Balance...' : 'Confirm & Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
               <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-100 shadow-sm animate-bounce">
                  <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="3" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
               </div>
               
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Verification Submitted</h3>
               <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6">
                  Your bank account details have been successfully received. We will verify your account and process payouts once the verification checks are complete.
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
