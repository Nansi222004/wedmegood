import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import { useToast } from '../../../components/ui/Toast';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import QuotationModal from '../../common/QuotationModal';

const GST_RATES = [
  { label: '0% (Exempt)', value: 0 },
  { label: '5% (Basic)', value: 5 },
  { label: '12% (Standard)', value: 12 },
  { label: '18% (Services GST)', value: 18 },
  { label: '28% (Luxury)', value: 28 },
  { label: 'Custom Amount', value: 'custom' }
];

const ADVANCE_PRESETS = [
  { label: '0% (No Advance)', value: 0 },
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
  { label: '25% (Standard)', value: 25 },
  { label: '30%', value: 30 },
  { label: '50% (High Priority)', value: 50 },
  { label: 'Custom Amount', value: 'custom' }
];

const VendorQuotes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const consumedPrefillRef = useRef(null);
  const { refreshData } = useVendorState();
  const { showToast, ToastComponent } = useToast();
  
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [quoteToDelete, setQuoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingQuoteId, setDownloadingQuoteId] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [items, setItems] = useState([
    { id: 1, service: '', description: '', quantity: 1, price: '' }
  ]);
  const [taxOption, setTaxOption] = useState('18');
  const [customTaxAmount, setCustomTaxAmount] = useState('0');
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percent'
  const [discountAmount, setDiscountAmount] = useState('0');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [advanceOption, setAdvanceOption] = useState('25');
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('0');
  const [validityDays, setValidityDays] = useState(14);
  const [notes, setNotes] = useState('');
  const [milestoneTerms, setMilestoneTerms] = useState('25% advance to confirm booking, 50% one week prior to event, 25% upon event day.');
  const [cancellationTerms, setCancellationTerms] = useState('Full refund if cancelled 30+ days before event. 50% refund if 15-29 days. Non-refundable within 14 days.');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const token = localStorage.getItem('vendorToken');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotesRes, leadsRes] = await Promise.all([
        vendorApi.getQuotes(token),
        vendorApi.getLeads(token)
      ]);

      if (quotesRes.success) setQuotes(quotesRes.data || []);
      if (leadsRes.success) setLeads(leadsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('Error syncing vendor quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    navigate(location.pathname, { replace: true, state: {} });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Handle prefill from leads
  useEffect(() => {
    const prefillId = location.state?.prefillLeadId;
    if (prefillId && leads.length > 0 && consumedPrefillRef.current !== prefillId) {
      consumedPrefillRef.current = prefillId;
      const found = leads.find(l => l._id === prefillId);
      if (found) {
        setSelectedLeadId(found._id);
        setItems([
          {
            id: Date.now(),
            service: found.serviceName || found.category || 'Wedding Service Package',
            description: found.message ? `Inquiry scope: ${found.message.slice(0, 100)}` : 'Comprehensive wedding service deliverables',
            quantity: 1,
            price: ''
          }
        ]);
        setShowModal(true);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, leads, navigate, location.pathname]);

  const handleLeadChange = (leadId) => {
    setSelectedLeadId(leadId);
    const found = leads.find(l => l._id === leadId);
    if (found && items.length === 1 && !items[0].service) {
      setItems([
        {
          id: Date.now(),
          service: found.serviceName || found.category || 'Wedding Package',
          description: found.message || '',
          quantity: 1,
          price: ''
        }
      ]);
    }
  };

  // Line Items Operations
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), service: '', description: '', quantity: 1, price: '' }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      showToast('Quotation must contain at least one line item', 'warning');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        return { ...it, [field]: value };
      }
      return it;
    }));
  };

  // Dynamic Live Calculation
  const calculation = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const q = Math.max(1, Number(it.quantity) || 1);
      const p = Math.max(0, Number(it.price) || 0);
      return sum + (q * p);
    }, 0);

    let calculatedDiscount = 0;
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
      calculatedDiscount = Math.round((subtotal * pct) / 100);
    } else {
      calculatedDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
    }

    const postDiscount = Math.max(0, subtotal - calculatedDiscount);

    let calculatedTax = 0;
    if (taxOption === 'custom') {
      calculatedTax = Math.max(0, Number(customTaxAmount) || 0);
    } else {
      const rate = Number(taxOption) || 0;
      calculatedTax = Math.round((postDiscount * rate) / 100);
    }

    const total = postDiscount + calculatedTax;

    let calculatedAdvance = 0;
    if (advanceOption === 'custom') {
      calculatedAdvance = Math.min(total, Math.max(0, Number(customAdvanceAmount) || 0));
    } else {
      const advRate = Number(advanceOption) || 0;
      calculatedAdvance = Math.round((total * advRate) / 100);
    }

    return {
      subtotal,
      discount: calculatedDiscount,
      tax: calculatedTax,
      total,
      advance: calculatedAdvance
    };
  }, [items, discountType, discountPercent, discountAmount, taxOption, customTaxAmount, advanceOption, customAdvanceAmount]);

  const handleSaveQuote = async () => {
    if (!selectedLeadId) {
      showToast('Please select a client inquiry.', 'warning');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.service.trim()) {
        showToast(`Line item #${i + 1} must have a service name.`, 'warning');
        return;
      }
      const numP = Number(it.price);
      if (!it.price || isNaN(numP) || numP <= 0) {
        showToast(`Line item #${i + 1} must have a valid price greater than ₹0.`, 'warning');
        return;
      }
    }

    const lead = leads.find(l => l._id === selectedLeadId);
    if (!lead) return;

    setIsSaving(true);
    try {
      const lineItems = items.map(it => ({
        service: it.service.trim(),
        description: (it.description || '').trim(),
        quantity: Math.max(1, Number(it.quantity) || 1),
        price: Number(it.price),
        amount: (Math.max(1, Number(it.quantity) || 1)) * Number(it.price)
      }));

      const quoteData = {
        leadId: lead._id,
        userId: lead.userId?._id || lead.userId,
        items: lineItems,
        subtotal: calculation.subtotal,
        discountAmount: calculation.discount,
        discountPercent: discountType === 'percent' ? Number(discountPercent) : 0,
        taxRatePercent: taxOption !== 'custom' ? Number(taxOption) : undefined,
        taxAmount: calculation.tax,
        totalAmount: calculation.total,
        advancePaymentPercent: advanceOption !== 'custom' ? Number(advanceOption) : undefined,
        advancePaymentAmount: calculation.advance,
        validUntil: new Date(Date.now() + (Number(validityDays) || 14) * 24 * 60 * 60 * 1000),
        milestonePaymentTerms: milestoneTerms.trim(),
        cancellationTerms: cancellationTerms.trim(),
        notes: notes.trim()
      };

      let res;
      if (isEditing && selectedQuoteId) {
        res = await vendorApi.updateQuote(selectedQuoteId, quoteData, token);
      } else {
        res = await vendorApi.createQuote(quoteData, token);
      }

      if (res.success) {
        showToast(isEditing ? 'Official quotation updated successfully.' : 'Official quotation generated & sent to client.', 'success');
        closeModal();
        fetchData();
        refreshData();
      } else {
        showToast(res.message || 'Failed to save proposal. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error saving quote:', err);
      showToast('Unable to save proposal. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (quote) => {
    setIsEditing(true);
    setSelectedQuoteId(quote._id);
    setSelectedLeadId(quote.leadId?._id || '');
    
    if (Array.isArray(quote.items) && quote.items.length > 0) {
      setItems(quote.items.map((it, idx) => ({
        id: idx + 1,
        service: it.service || '',
        description: it.description || '',
        quantity: it.quantity || 1,
        price: it.price !== undefined ? String(it.price) : ''
      })));
    } else {
      setItems([{
        id: 1,
        service: quote.leadId?.serviceName || 'Wedding Service Package',
        description: quote.notes || '',
        quantity: 1,
        price: String(quote.totalAmount || '')
      }]);
    }

    if (quote.taxRatePercent !== undefined && quote.taxRatePercent !== null) {
      setTaxOption(String(quote.taxRatePercent));
      setCustomTaxAmount('0');
    } else if (quote.taxAmount > 0) {
      setTaxOption('custom');
      setCustomTaxAmount(String(quote.taxAmount));
    } else {
      setTaxOption('0');
      setCustomTaxAmount('0');
    }

    if (quote.discountPercent > 0) {
      setDiscountType('percent');
      setDiscountPercent(String(quote.discountPercent));
      setDiscountAmount('0');
    } else if (quote.discountAmount > 0) {
      setDiscountType('amount');
      setDiscountAmount(String(quote.discountAmount));
      setDiscountPercent('0');
    } else {
      setDiscountType('amount');
      setDiscountAmount('0');
      setDiscountPercent('0');
    }

    if (quote.advancePaymentPercent !== undefined && quote.advancePaymentPercent !== null) {
      setAdvanceOption(String(quote.advancePaymentPercent));
      setCustomAdvanceAmount('0');
    } else if (quote.advancePaymentAmount > 0) {
      setAdvanceOption('custom');
      setCustomAdvanceAmount(String(quote.advancePaymentAmount));
    } else {
      setAdvanceOption('0');
      setCustomAdvanceAmount('0');
    }

    setMilestoneTerms(quote.milestonePaymentTerms || quote.terms || '25% advance to confirm booking, 50% one week prior to event, 25% upon event day.');
    setCancellationTerms(quote.cancellationTerms || 'Full refund if cancelled 30+ days before event. 50% refund if 15-29 days. Non-refundable within 14 days.');
    setNotes(quote.notes || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedQuoteId(null);
    setSelectedLeadId('');
    setItems([{ id: 1, service: '', description: '', quantity: 1, price: '' }]);
    setTaxOption('18');
    setCustomTaxAmount('0');
    setDiscountType('amount');
    setDiscountAmount('0');
    setDiscountPercent('0');
    setAdvanceOption('25');
    setCustomAdvanceAmount('0');
    setValidityDays(14);
    setNotes('');
    setMilestoneTerms('25% advance to confirm booking, 50% one week prior to event, 25% upon event day.');
    setCancellationTerms('Full refund if cancelled 30+ days before event. 50% refund if 15-29 days. Non-refundable within 14 days.');
  };

  const handleDeleteQuote = (id) => {
    setQuoteToDelete(id);
  };

  const confirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    try {
      setIsDeleting(true);
      const res = await vendorApi.deleteQuote(quoteToDelete, token);
      if (res.success) {
        setQuotes(prev => prev.filter(q => q._id !== quoteToDelete));
        refreshData();
        showToast('Quotation deleted successfully.', 'success');
        setQuoteToDelete(null);
      } else {
        showToast(res.message || 'Failed to delete quotation.', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Unable to delete quotation. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (quoteId) => {
    try {
      setDownloadingQuoteId(quoteId);
      await vendorApi.downloadQuotePdf(quoteId, token);
      showToast('Official quotation PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Failed to download PDF quotation.', 'error');
    } finally {
      setDownloadingQuoteId(null);
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = (q.userId?.fullName || q.userId?.name || q.leadId?.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (q.quotationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           q._id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const accepted = quotes.filter(q => q.status === 'Accepted').length;
    return { accepted, count: quotes.length };
  }, [quotes]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Proposals Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stat Strip */}
      <div className="grid grid-cols-2 gap-3">
         <div className="rounded-xl p-2.5 sm:p-3 h-16 sm:h-20 group border transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative overflow-hidden flex items-center justify-between shadow-2xs bg-[#F4FDF9] border-[#D1FAE5]">
            <div className="relative z-10 flex flex-col justify-center min-w-0 flex-1 py-0.5">
               <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-tight uppercase leading-none mb-1">Accepted</h3>
               <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0 mt-0.5 sm:mt-0">
                  <span className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate leading-none">{stats.accepted}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#10B981] truncate leading-none mt-0.5 sm:mt-0 uppercase tracking-wider">Booked Quotes</span>
               </div>
            </div>
            <div className="relative z-10 ml-1.5 sm:ml-2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0 group-hover:rotate-6 transition-transform duration-300 bg-[#10B981]">
               <Icon name="check" size="sm" color="currentColor" />
            </div>
         </div>

         <div className="rounded-xl p-2.5 sm:p-3 h-16 sm:h-20 group border transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative overflow-hidden flex items-center justify-between shadow-2xs bg-[#FFF5F6] border-[#FFE4E6]">
            <div className="relative z-10 flex flex-col justify-center min-w-0 flex-1 py-0.5">
               <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-tight uppercase leading-none mb-1">Conversion</h3>
               <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0 mt-0.5 sm:mt-0">
                  <span className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate leading-none">{stats.count > 0 ? ((stats.accepted / stats.count) * 100).toFixed(0) : 0}%</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#F43F5E] truncate leading-none mt-0.5 sm:mt-0 uppercase tracking-wider">Win Rate</span>
               </div>
            </div>
            <div className="relative z-10 ml-1.5 sm:ml-2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0 group-hover:rotate-6 transition-transform duration-300 bg-[#F43F5E]">
               <Icon name="trendingUp" size="sm" color="currentColor" />
            </div>
         </div>
      </div>

      {/* Advanced Filter & Search Row */}
      <div className="flex flex-col gap-3">
         <div className="flex gap-2.5 items-center w-full">
            <div className="relative flex-1 group">
               <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                  type="text"
                  placeholder="Search quotation #, client name, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-[#F8FAFC]/90 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] transition-all"
               />
            </div>
         </div>

         {/* Status Tabs */}
         <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-slate-200/60 justify-between items-center w-full">
            {['All', 'Sent', 'Accepted', 'Rejected'].map(status => (
               <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                     statusFilter.toLowerCase() === status.toLowerCase() 
                     ? 'bg-white text-[#7C3AED] shadow-sm border border-slate-100/50 font-extrabold' 
                     : 'text-slate-400 hover:text-slate-600'
                  }`}
               >
                  {status}
               </button>
            ))}
         </div>

         {/* Action button */}
         <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-full h-11 bg-[#7C3AED] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] hover:bg-[#6D28D9] transition-all cursor-pointer"
         >
            <Icon name="plus" size="xs" className="w-3.5 h-3.5" /> Create Official Quotation
         </button>
      </div>

      {/* Dynamic List Stack */}
      <div className="flex flex-col gap-3">
        {filteredQuotes.length === 0 ? (
          <div className="p-16 text-center bg-[#F8FAFC]/50 border border-dashed border-slate-200 rounded-xl">
            <div className="h-14 w-14 rounded-xl bg-white mx-auto flex items-center justify-center text-slate-300 mb-4 shadow-sm border border-slate-100">
               <Icon name="mail" size="md" color="currentColor" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Quotations Found</p>
            <p className="text-[11px] font-medium text-slate-400/80 mt-1">Generate professional itemized quotations with PDF export.</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const name = quote.userId?.fullName || quote.userId?.name || quote.leadId?.customerName || 'Customer';
            const quoteNum = quote.quotationNumber || `UTS-QT-${quote._id.slice(-6).toUpperCase()}`;
            const isAccepted = quote.status === 'Accepted';
            const isRejected = quote.status === 'Rejected';

            return (
              <div 
                key={quote._id} 
                className={`p-3.5 border rounded-2xl transition-all relative group shadow-xs ${
                  isAccepted ? 'bg-[#F4FDF9] border-[#D1FAE5]' : isRejected ? 'bg-[#FFF5F6] border-[#FFE4E6]' : 'bg-white border-slate-200 hover:border-[#7C3AED]/40'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isAccepted ? 'bg-emerald-100 text-emerald-700' : isRejected ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-[#7C3AED]'
                      }`}>
                         {name[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                         <div className="flex items-center gap-2">
                           <h3 className="text-xs font-extrabold text-slate-900 truncate">{name}</h3>
                           <span className="text-[10px] font-mono text-slate-400 font-semibold">{quoteNum}</span>
                         </div>
                         <p className="text-[10px] text-slate-500 truncate mt-0.5">
                           {quote.items?.[0]?.service || quote.leadId?.category || 'Wedding Package'} 
                           {quote.items?.length > 1 ? ` (+${quote.items.length - 1} more)` : ''}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                        isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {quote.status}
                      </span>
                   </div>
                </div>

                {/* Price Summary Line */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                   <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Quotation Value</span>
                      <span className="text-sm font-black text-slate-900">₹{(quote.totalAmount || 0).toLocaleString('en-IN')}</span>
                      {(quote.advancePaymentAmount || 0) > 0 && (
                        <span className="text-[10px] text-amber-700 font-bold ml-2">
                          (Adv: ₹{(quote.advancePaymentAmount).toLocaleString('en-IN')})
                        </span>
                      )}
                   </div>

                   {/* Action Buttons */}
                   <div className="flex items-center gap-1.5">
                      {/* View Modal Trigger */}
                      <button
                        onClick={() => setPreviewQuote(quote)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                        title="View Full Quotation Sheet"
                      >
                         <Icon name="eye" size="xs" /> View
                      </button>

                      {/* Download PDF */}
                      <button
                        disabled={downloadingQuoteId === quote._id}
                        onClick={() => handleDownloadPdf(quote._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Download PDF"
                      >
                         {downloadingQuoteId === quote._id ? (
                           <div className="w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <Icon name="download" size="xs" />
                         )}
                         PDF
                      </button>

                      {!isAccepted && (
                        <>
                          <button
                            onClick={() => openEditModal(quote)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors"
                            title="Edit Quote"
                          >
                            <Icon name="edit" size="xs" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Quote"
                          >
                            <Icon name="trash" size="xs" />
                          </button>
                        </>
                      )}
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Itemized Quotation Creator/Editor Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={closeModal}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-5 sm:p-7 overflow-y-auto max-h-[90vh] my-auto border border-slate-100">
             {/* Header */}
             <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {isEditing ? 'Revise Official Quotation' : 'Create Official Quotation'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Itemized Pricing, GST Breakdown & Payment Terms
                  </p>
                </div>
                <button onClick={closeModal} className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-500">
                   ✕
                </button>
             </div>

             <div className="space-y-4 mt-4 text-xs">
                {/* Inquiry Selector */}
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                     Client Inquiry *
                   </label>
                   <select 
                     disabled={isEditing}
                     className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all disabled:opacity-60"
                     value={selectedLeadId}
                     onChange={(e) => handleLeadChange(e.target.value)}
                   >
                      <option value="">Select client inquiry</option>
                      {leads.map(l => (
                        <option key={l._id} value={l._id}>
                          {l.customerName} — {l.serviceName || l.category || 'Event'} ({new Date(l.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                        </option>
                      ))}
                   </select>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Itemized Deliverables & Scope</span>
                     <button
                       type="button"
                       onClick={handleAddItem}
                       className="text-[10px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
                     >
                       <Icon name="plus" size="xs" /> Add Deliverable
                     </button>
                   </div>

                   <div className="space-y-2.5">
                     {items.map((it, idx) => (
                       <div key={it.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                         <div className="flex items-start gap-2">
                           <span className="text-[10px] font-bold text-slate-400 mt-2.5">{idx + 1}.</span>
                           <div className="flex-1 space-y-1.5">
                             <input 
                               type="text"
                               placeholder="Deliverable / Service Name (e.g. Traditional Photography + Album)"
                               value={it.service}
                               onChange={(e) => handleItemChange(it.id, 'service', e.target.value)}
                               className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#7C3AED]"
                             />
                             <input 
                               type="text"
                               placeholder="Description / Specific inclusion details (optional)"
                               value={it.description}
                               onChange={(e) => handleItemChange(it.id, 'description', e.target.value)}
                               className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:border-[#7C3AED]"
                             />
                           </div>
                           <button
                             type="button"
                             onClick={() => handleRemoveItem(it.id)}
                             className="text-slate-400 hover:text-rose-500 p-1 mt-1 transition-colors"
                             title="Remove item"
                           >
                             <Icon name="trash" size="xs" />
                           </button>
                         </div>

                         <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                           <div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">Unit Price (₹)</span>
                             <input 
                               type="number"
                               min="0"
                               placeholder="Price"
                               value={it.price}
                               onChange={(e) => handleItemChange(it.id, 'price', e.target.value)}
                               className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                             />
                           </div>
                           <div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">Quantity</span>
                             <input 
                               type="number"
                               min="1"
                               value={it.quantity}
                               onChange={(e) => handleItemChange(it.id, 'quantity', e.target.value)}
                               className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                             />
                           </div>
                           <div className="text-right flex flex-col justify-end">
                             <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                             <span className="text-xs font-extrabold text-[#7C3AED] h-8 flex items-center justify-end">
                               ₹{((Number(it.quantity) || 1) * (Number(it.price) || 0)).toLocaleString('en-IN')}
                             </span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Taxes & Discounts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {/* Tax Configuration */}
                   <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">GST / Tax Setting</span>
                      <select 
                        value={taxOption}
                        onChange={(e) => setTaxOption(e.target.value)}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#7C3AED]"
                      >
                         {GST_RATES.map(r => (
                           <option key={r.value} value={r.value}>{r.label}</option>
                         ))}
                      </select>
                      {taxOption === 'custom' && (
                        <div className="pt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Custom Tax Amount (₹)</span>
                          <input 
                            type="number"
                            min="0"
                            value={customTaxAmount}
                            onChange={(e) => setCustomTaxAmount(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      )}
                   </div>

                   {/* Discount Configuration */}
                   <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Promotional Discount</span>
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-[10px]">
                          <button 
                            type="button" 
                            onClick={() => setDiscountType('amount')} 
                            className={`px-2 py-0.5 font-bold ${discountType === 'amount' ? 'bg-[#7C3AED] text-white' : 'bg-white text-slate-600'}`}
                          >₹ Flat</button>
                          <button 
                            type="button" 
                            onClick={() => setDiscountType('percent')} 
                            className={`px-2 py-0.5 font-bold ${discountType === 'percent' ? 'bg-[#7C3AED] text-white' : 'bg-white text-slate-600'}`}
                          >% Pct</button>
                        </div>
                      </div>

                      {discountType === 'percent' ? (
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Discount Percent (%)</span>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Discount Amount (₹)</span>
                          <input 
                            type="number"
                            min="0"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      )}
                   </div>
                </div>

                {/* Advance Booking Policy & Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Advance Deposit Required</span>
                      <select 
                        value={advanceOption}
                        onChange={(e) => setAdvanceOption(e.target.value)}
                        className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#7C3AED]"
                      >
                         {ADVANCE_PRESETS.map(r => (
                           <option key={r.value} value={r.value}>{r.label}</option>
                         ))}
                      </select>
                      {advanceOption === 'custom' && (
                        <div className="pt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Custom Advance (₹)</span>
                          <input 
                            type="number"
                            min="0"
                            value={customAdvanceAmount}
                            onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                            className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      )}
                   </div>

                   <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">Quotation Validity</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          min="1"
                          max="90"
                          value={validityDays}
                          onChange={(e) => setValidityDays(e.target.value)}
                          className="w-20 h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                        <span className="text-slate-600 font-medium">Days from issue date</span>
                      </div>
                   </div>
                </div>

                {/* Live Authoritative Breakdown */}
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100 space-y-1.5">
                   <div className="flex justify-between text-slate-600 font-medium text-xs">
                     <span>Subtotal ({items.length} items):</span>
                     <span>₹{calculation.subtotal.toLocaleString('en-IN')}</span>
                   </div>
                   {calculation.discount > 0 && (
                     <div className="flex justify-between text-emerald-600 font-medium text-xs">
                       <span>Discount:</span>
                       <span>-₹{calculation.discount.toLocaleString('en-IN')}</span>
                     </div>
                   )}
                   {calculation.tax > 0 && (
                     <div className="flex justify-between text-slate-600 font-medium text-xs">
                       <span>GST / Tax:</span>
                       <span>+₹{calculation.tax.toLocaleString('en-IN')}</span>
                     </div>
                   )}
                   <div className="flex justify-between pt-2 border-t border-purple-200 text-sm font-black text-slate-900">
                     <span>Total Quotation Payable:</span>
                     <span className="text-[#7C3AED]">₹{calculation.total.toLocaleString('en-IN')}</span>
                   </div>
                   {calculation.advance > 0 && (
                     <div className="flex justify-between pt-1 text-amber-800 font-bold text-xs">
                       <span>Advance Deposit to Confirm:</span>
                       <span>₹{calculation.advance.toLocaleString('en-IN')}</span>
                     </div>
                   )}
                </div>

                {/* Milestone & Cancellation Terms */}
                <div className="space-y-2">
                   <div>
                     <span className="text-[9px] font-bold text-slate-400 uppercase">Payment Milestone Terms</span>
                     <input 
                       type="text"
                       value={milestoneTerms}
                       onChange={(e) => setMilestoneTerms(e.target.value)}
                       className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                     />
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-slate-400 uppercase">Cancellation & Refund Policy</span>
                     <input 
                       type="text"
                       value={cancellationTerms}
                       onChange={(e) => setCancellationTerms(e.target.value)}
                       className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                     />
                   </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                   <button 
                     disabled={isSaving}
                     onClick={handleSaveQuote}
                     className="w-full h-11 rounded-xl bg-[#7C3AED] text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#6D28D9] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                   >
                      {isSaving ? (
                         <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing Quotation...
                         </>
                      ) : (
                         <>
                            <Icon name="sparkles" size="xs" />
                            {isEditing ? 'Update & Resend Quotation' : 'Generate & Send Official Quotation'}
                         </>
                      )}
                   </button>
                </div>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Official Quotation View/Print Modal */}
      {previewQuote && (
        <QuotationModal 
          isOpen={Boolean(previewQuote)}
          onClose={() => setPreviewQuote(null)}
          quote={previewQuote}
          isVendor={true}
          token={token}
        />
      )}

      {/* Toast Component */}
      <ToastComponent />

      {/* Confirm Delete Proposal Modal */}
      <ConfirmModal
        isOpen={Boolean(quoteToDelete)}
        title="Delete Quotation?"
        message="Are you sure you want to permanently delete this quotation? This action cannot be undone."
        confirmText="Delete Quotation"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteQuote}
        onCancel={() => !isDeleting && setQuoteToDelete(null)}
      />
    </div>
  );
};

export default VendorQuotes;
