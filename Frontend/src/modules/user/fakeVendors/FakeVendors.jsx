import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const COMPLAINT_CATEGORIES = ['Overcharging', 'No-Show', 'Cancellation', 'Quality', 'Behavior', 'Safety', 'Other'];

const EMPTY_REPORT = {
  name: '',
  businessName: '',
  phone: '',
  city: '',
  category: '',
  complaintCategory: 'Other',
  description: ''
};

const loadRazorpayScript = () => new Promise((resolve) => {
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

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const FakeVendors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [access, setAccess] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paying, setPaying] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getFakeVendors(debouncedSearch);
      setListings(res.data?.listings || []);
      setAccess(res.data?.access || null);
      setLocked(false);
    } catch (err) {
      if (err.status === 402) {
        // Free views used up: show the paywall
        setLocked(true);
        setAccess(err.data?.data?.access || null);
        setListings([]);
      } else {
        setError(getFriendlyErrorMessage(err, 'Unable to load the fake vendors list.'));
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleUnlock = async () => {
    setPaying(true);
    try {
      const orderRes = await userApi.createFakeVendorAccessOrder();
      const { order, key, amount, days } = orderRes.data || {};
      if (!order) throw new Error(orderRes.message || 'Could not start the payment');

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Razorpay failed to load. Please check your internet connection.');

      const rzp = new window.Razorpay({
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Utsavo',
        description: `Fake Vendors list access · ${days} days`,
        order_id: order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: '#4F1325' },
        handler: async (response) => {
          try {
            const verifyRes = await userApi.verifyFakeVendorAccessPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success(verifyRes.message || `Access unlocked for ₹${amount}`);
            await loadListings();
          } catch (verErr) {
            toast.error(getFriendlyErrorMessage(verErr, 'Payment verification failed. Please contact support.'));
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) }
      });
      rzp.on('payment.failed', (failRes) => {
        toast.error(failRes.error?.description || 'Payment was unsuccessful. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Could not start the payment'));
      setPaying(false);
    }
  };

  const handleReportChange = (field, value) => setReport(prev => ({ ...prev, [field]: value }));

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!report.name.trim() || !report.phone.trim()) {
      toast.warning("Please enter the vendor's name and phone number.");
      return;
    }
    if (report.description.trim().length < 10) {
      toast.warning('Please describe what happened (at least 10 characters).');
      return;
    }
    setSubmittingReport(true);
    try {
      await userApi.createComplaint({
        category: report.complaintCategory,
        description: report.description.trim(),
        externalVendor: {
          name: report.name.trim(),
          businessName: report.businessName.trim(),
          phone: report.phone.trim(),
          city: report.city.trim(),
          category: report.category.trim()
        }
      });
      toast.success('Thank you. Our team will review your report.');
      setShowReport(false);
      setReport(EMPTY_REPORT);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Could not submit your report.'));
    } finally {
      setSubmittingReport(false);
    }
  };

  const accessNote = access?.hasPaidAccess
    ? `Access active until ${formatDate(access.paidUntil)}`
    : access?.inFreeView
      ? `Free view · ${access.freeViewsLeft} free view${access.freeViewsLeft === 1 ? '' : 's'} left`
      : null;

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5DC] bg-white text-xs font-medium text-[#2E1026] placeholder:text-[#B5A6B1] focus:outline-none focus:border-[#551E43]';

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 pt-3 max-w-2xl mx-auto space-y-4 bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/home'))}
          className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] active:scale-95 transition-all shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <Icon name="chevronLeft" size="sm" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Fake Vendor Alerts
          </h1>
          <p className="text-xs text-[#7A6876] mt-0.5">Vendors confirmed as fake by the Utsavo team.</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#FFF5F6] border border-[#F5D0D8] flex gap-3">
        <div className="w-9 h-9 rounded-full bg-white text-[#BE185D] flex items-center justify-center shrink-0 shadow-xs">
          <Icon name="warning" size="sm" />
        </div>
        <div className="text-xs text-[#5C4A57] leading-relaxed">
          Check a vendor here before you pay an advance. Know a fake vendor in the market?
          <button
            onClick={() => setShowReport(true)}
            className="block mt-1.5 font-bold text-[#BE185D] underline cursor-pointer"
          >
            Report a fake vendor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#551E43] border-t-transparent animate-spin rounded-full mb-3" />
          <p className="text-xs font-semibold text-[#7A6876]">Loading fake vendor alerts...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadListings} className="font-bold underline cursor-pointer">Retry</button>
        </div>
      ) : locked ? (
        /* Paywall */
        <div className="p-6 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-[#F3EBF9] text-[#7A2A70] flex items-center justify-center mx-auto mb-3">
            <Icon name="lock" size="md" />
          </div>
          <h2 className="text-lg font-bold text-[#401332]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            You have used your free view
          </h2>
          <p className="text-xs text-[#7A6876] mt-1.5 leading-relaxed max-w-xs mx-auto">
            Unlock the full list of fake vendors for {access?.accessDays ?? 30} days and check any vendor as often as you need.
          </p>
          <button
            onClick={handleUnlock}
            disabled={paying}
            className="mt-5 w-full py-3 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white text-sm font-bold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            {paying ? 'Opening payment...' : `Unlock for ₹${access?.price ?? 99} · ${access?.accessDays ?? 30} days`}
          </button>
        </div>
      ) : (
        <>
          {accessNote && (
            <p className="text-[11px] font-semibold text-[#7A2A70] bg-[#F3EBF9] border border-[#E9D6F0] rounded-full px-3 py-1 inline-block">
              {accessNote}
            </p>
          )}

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B5A6B1]">
              <Icon name="search" size="xs" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, city or category"
              className={`${inputClass} pl-9`}
            />
          </div>

          {listings.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-[#F2E5EC] px-6 shadow-sm">
              <div className="w-12 h-12 bg-[#DCFCE7] text-[#15803D] rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="check" size="md" />
              </div>
              <h3 className="text-sm font-bold text-[#401332]">
                {debouncedSearch ? 'No fake vendor matches your search' : 'No fake vendors listed yet'}
              </h3>
              <p className="text-xs text-[#7A6876] mt-1">Always confirm details before paying any vendor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l._id} className="p-4 rounded-2xl bg-white border border-[#F5D0D8] shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#2E1026] leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {l.businessName || l.name}
                      </h3>
                      {l.businessName && <p className="text-xs text-[#7A6876] mt-0.5">{l.name}</p>}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-100 shrink-0">
                      Fake
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-[#5C4A57]">
                    {l.phone && <span className="flex items-center gap-1"><Icon name="phone" size="xs" /> {l.phone}</span>}
                    {l.city && <span className="flex items-center gap-1"><Icon name="location" size="xs" /> {l.city}</span>}
                    {l.category && <span>{l.category}</span>}
                  </div>

                  <p className="text-xs text-[#4A3D47] leading-relaxed mt-2.5 bg-[#FAF6F0] rounded-xl p-3 border border-[#F2E5EC]">
                    {l.reason}
                  </p>

                  <p className="text-[10px] text-[#8A7987] mt-2">
                    Listed {formatDate(l.createdAt)}
                    {l.complaintCount > 0 ? ` · ${l.complaintCount} complaint${l.complaintCount === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Report a fake vendor (works for vendors not on the app) */}
      {showReport && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitReport}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F2E5EC] max-h-[90vh] overflow-y-auto space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#2E1026]">Report a Fake Vendor</h3>
                <p className="text-xs text-[#7A6876] mt-0.5">Our team reviews every report before listing a vendor.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <input className={inputClass} placeholder="Vendor's name *" value={report.name} onChange={(e) => handleReportChange('name', e.target.value)} maxLength={120} />
            <input className={inputClass} placeholder="Business name" value={report.businessName} onChange={(e) => handleReportChange('businessName', e.target.value)} maxLength={120} />
            <input className={inputClass} placeholder="Phone number *" type="tel" value={report.phone} onChange={(e) => handleReportChange('phone', e.target.value)} maxLength={20} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} placeholder="City" value={report.city} onChange={(e) => handleReportChange('city', e.target.value)} maxLength={80} />
              <input className={inputClass} placeholder="Service (e.g. DJ)" value={report.category} onChange={(e) => handleReportChange('category', e.target.value)} maxLength={80} />
            </div>
            <select
              className={inputClass}
              value={report.complaintCategory}
              onChange={(e) => handleReportChange('complaintCategory', e.target.value)}
            >
              {COMPLAINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              placeholder="What happened? *"
              value={report.description}
              onChange={(e) => handleReportChange('description', e.target.value)}
              maxLength={2000}
            />

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReport}
                className="px-5 py-2 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FakeVendors;
