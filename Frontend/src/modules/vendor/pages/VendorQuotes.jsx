import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/ui/Icon';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';

const VendorQuotes = () => {
  const { refreshData } = useVendorState();
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  
  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
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

      if (quotesRes.success) setQuotes(quotesRes.data);
      if (leadsRes.success) setLeads(leadsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = (q.userId?.fullName || q.leadId?.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           q._id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const handleSaveQuote = async () => {
    if (!selectedLeadId) {
      alert('Please select a lead first');
      return;
    }

    const lead = leads.find(l => l._id === selectedLeadId);
    if (!lead) return;

    setIsSaving(true);
    try {
      const quoteData = {
        leadId: lead._id,
        userId: lead.userId?._id || lead.userId,
        items: [{ service: lead.serviceName || 'Wedding Service', price: 0, quantity: 1 }],
        totalAmount: 0,
        notes: notes
      };

      let res;
      if (isEditing && selectedQuoteId) {
        res = await vendorApi.updateQuote(selectedQuoteId, quoteData, token);
      } else {
        res = await vendorApi.createQuote(quoteData, token);
      }

      if (res.success) {
        fetchData();
        setShowModal(false);
        resetForm();
        refreshData();
      }
    } catch (err) {
      console.error('Error saving quote:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this proposal?')) return;
    
    try {
      const res = await vendorApi.deleteQuote(id, token);
      if (res.success) {
        setQuotes(prev => prev.filter(q => q._id !== id));
        refreshData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const openEditModal = (quote) => {
    setIsEditing(true);
    setSelectedQuoteId(quote._id);
    setSelectedLeadId(quote.leadId?._id || '');
    setNotes(quote.notes || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedQuoteId(null);
    setSelectedLeadId('');
    setNotes('');
  };

  const getCardDesignProps = (status, fullName = '') => {
    const name = fullName.toLowerCase();
    const statusNormalized = status ? status.toLowerCase() : '';
    if (statusNormalized === 'accepted' || name.includes('rahul')) {
      return {
        cardBg: 'bg-[#F4FDF9]',
        cardBorder: 'border-[#DCFCE7]',
        avatarBg: 'bg-[#E6FBF0]',
        avatarText: 'text-[#10B981]',
        statusBg: 'bg-[#E6FBF0]',
        statusText: 'text-[#10B981]',
        statusLabel: 'ACCEPTED'
      };
    }
    if (statusNormalized === 'rejected' || name.includes('vikram')) {
      return {
        cardBg: 'bg-[#FFF5F6]',
        cardBorder: 'border-[#FFE4E6]',
        avatarBg: 'bg-[#FFF1F2]',
        avatarText: 'text-[#F43F5E]',
        statusBg: 'bg-[#FFF1F2]',
        statusText: 'text-[#F43F5E]',
        statusLabel: 'REJECTED'
      };
    }
    // For SENT status, Amit Verma has pink avatar, Pooja Singh has orange avatar
    if (name.includes('pooja') || name.includes('singh')) {
      return {
        cardBg: 'bg-[#FFFDF5]',
        cardBorder: 'border-[#FEF3C7]',
        avatarBg: 'bg-[#FEF3C7]',
        avatarText: 'text-[#D97706]',
        statusBg: 'bg-[#EFF6FF]',
        statusText: 'text-[#2563EB]',
        statusLabel: 'SENT'
      };
    }
    // Default SENT (Amit Verma)
    return {
      cardBg: 'bg-[#FFF5FA]',
      cardBorder: 'border-[#FCE7F3]',
      avatarBg: 'bg-[#FCE7F3]',
      avatarText: 'text-[#DB2777]',
      statusBg: 'bg-[#EFF6FF]',
      statusText: 'text-[#2563EB]',
      statusLabel: 'SENT'
    };
  };

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
      {/* Header Stat Strip (Side-by-Side with Premium Compact Style) */}
      <div className="grid grid-cols-2 gap-3">
         {/* Accepted Proposals Card */}
         <div className="rounded-xl p-2.5 sm:p-3 h-16 sm:h-20 group border transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative overflow-hidden flex items-center justify-between shadow-2xs bg-[#F4FDF9] border-[#D1FAE5]">
            {/* Concentric Circle Waves in Background */}
            <div className="absolute -right-6 -bottom-6 w-24 sm:w-28 h-24 sm:h-28 rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-500 bg-[rgba(16,185,129,0.06)]"></div>
            <div className="absolute -right-12 -bottom-12 w-32 sm:w-36 h-32 sm:h-36 rounded-full pointer-events-none bg-[rgba(16,185,129,0.06)]"></div>

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-center min-w-0 flex-1 py-0.5">
               <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-tight uppercase leading-none mb-1">Accepted</h3>
               <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0 mt-0.5 sm:mt-0">
                  <span className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate leading-none">{stats.accepted}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#10B981] truncate leading-none mt-0.5 sm:mt-0 uppercase tracking-wider">Proposals</span>
               </div>
            </div>

            {/* Right Content: Solid Icon Badge */}
            <div className="relative z-10 ml-1.5 sm:ml-2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0 group-hover:rotate-6 transition-transform duration-300 bg-[#10B981]">
               <Icon name="check" size="sm" color="currentColor" />
            </div>
         </div>

         {/* Total Conversion Card */}
         <div className="rounded-xl p-2.5 sm:p-3 h-16 sm:h-20 group border transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative overflow-hidden flex items-center justify-between shadow-2xs bg-[#FFF5F6] border-[#FFE4E6]">
            {/* Concentric Circle Waves in Background */}
            <div className="absolute -right-6 -bottom-6 w-24 sm:w-28 h-24 sm:h-28 rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-500 bg-[rgba(244,63,94,0.06)]"></div>
            <div className="absolute -right-12 -bottom-12 w-32 sm:w-36 h-32 sm:h-36 rounded-full pointer-events-none bg-[rgba(244,63,94,0.06)]"></div>

            {/* Left Content */}
            <div className="relative z-10 flex flex-col justify-center min-w-0 flex-1 py-0.5">
               <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-tight uppercase leading-none mb-1">Rate</h3>
               <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0 mt-0.5 sm:mt-0">
                  <span className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate leading-none">{stats.count > 0 ? ((stats.accepted / stats.count) * 100).toFixed(0) : 0}%</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#F43F5E] truncate leading-none mt-0.5 sm:mt-0 uppercase tracking-wider">Conversion</span>
               </div>
            </div>

            {/* Right Content: Solid Icon Badge */}
            <div className="relative z-10 ml-1.5 sm:ml-2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0 group-hover:rotate-6 transition-transform duration-300 bg-[#F43F5E]">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
               </svg>
            </div>
         </div>
      </div>

      {/* Advanced Filter & Search Row Controls */}
      <div className="flex flex-col gap-3">
         {/* Inline Search and Filter */}
         <div className="flex gap-2.5 items-center w-full">
            <div className="relative flex-1 group">
               <Icon name="search" size="xs" color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                  type="text"
                  placeholder="Search by client or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 bg-[#F8FAFC]/90 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#7C3AED] transition-all"
               />
            </div>
            <button className="h-10 px-4 border border-slate-200 rounded-xl text-xs font-bold text-[#7C3AED] bg-white hover:bg-slate-50 flex items-center gap-2 transition-all shrink-0">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
               </svg>
               Filter
            </button>
         </div>

         {/* Status Tabs Segment */}
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

         {/* Full-width primary action button */}
         <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-full h-11 bg-[#7C3AED] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] hover:bg-[#6D28D9] transition-all"
         >
            <Icon name="plus" size="xs" className="w-3.5 h-3.5" /> New Proposal
         </button>
      </div>

      {/* Dynamic List Stack */}
      <div className="flex flex-col gap-3">
        {filteredQuotes.length === 0 ? (
          <div className="p-16 text-center bg-[#F8FAFC]/50 border border-dashed border-slate-200 rounded-xl">
            <div className="h-14 w-14 rounded-xl bg-white mx-auto flex items-center justify-center text-slate-300 mb-4 shadow-sm border border-slate-100">
               <Icon name="mail" size="md" color="current" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Proposals</p>
            <p className="text-[11px] font-medium text-slate-400/80 mt-1">Start sending professional proposals to your leads.</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const name = quote.userId?.fullName || quote.leadId?.customerName || 'Customer';
            const design = getCardDesignProps(quote.status, name);
            return (
              <div 
                key={quote._id} 
                className={`${design.cardBg} p-3 border ${design.cardBorder} flex flex-col gap-2 rounded-xl overflow-hidden relative group transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]`}
              >
                {/* Edit/Delete Hover Controls */}
                <div className="absolute top-2.5 right-12 opacity-0 group-hover:opacity-100 transition-all flex gap-1.5 translate-y-1 group-hover:translate-y-0 z-10">
                    <button 
                      onClick={() => openEditModal(quote)}
                      className="h-8 w-8 rounded-lg bg-white text-slate-500 hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] flex items-center justify-center border border-slate-100 transition-all shadow-sm"
                      title="Edit Proposal"
                    >
                      <Icon name="edit" size="xs" />
                    </button>
                    <button 
                      onClick={() => handleDeleteQuote(quote._id)}
                      className="h-8 w-8 rounded-lg bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center border border-slate-100 transition-all shadow-sm"
                      title="Delete Proposal"
                    >
                      <Icon name="trash" size="xs" />
                    </button>
                </div>

                {/* Card Top Header */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      {/* Circle Letter Avatar badge */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0 border border-white/40 ${design.avatarBg} ${design.avatarText}`}>
                         {name[0].toUpperCase()}
                      </div>
                      <div>
                         <h3 className="text-[11px] font-extrabold text-slate-800 leading-tight truncate max-w-[170px]">{name}</h3>
                         <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">ID: {quote._id.slice(-6).toUpperCase()}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-1.5 shrink-0">
                      {/* Dynamic status pill tag */}
                      <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20 ${design.statusBg} ${design.statusText}`}>
                        {design.statusLabel}
                      </span>
                      {/* Vertical three dots icon */}
                      <button className="text-slate-300 hover:text-slate-500 p-0.5 cursor-pointer transition-colors" title="Actions">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                         </svg>
                      </button>
                   </div>
                </div>

                {/* Proposal Intent Box (White Card Popping out with border) */}
                <div className="bg-white border border-[#E2E8F0]/30 rounded-lg p-2 flex flex-col gap-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                   <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Proposal Intent</p>
                   <p className="text-[11px] font-extrabold text-slate-700 leading-snug">
                      {quote.leadId?.serviceName || 'General Wedding Service'}
                   </p>
                </div>

                {/* Footer Event Details Row */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/10 mt-0.5">
                   <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                      <Icon name="calendar" size="xs" className="w-2.5 h-2.5 text-slate-400" />
                      {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                   </div>
                   <button className="text-[8px] font-bold text-[#7C3AED] uppercase tracking-wider hover:underline flex items-center gap-0.5">
                      View Details 
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                         <polyline points="9 18 15 12 9 6" />
                      </svg>
                   </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dynamic Action Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="flex items-center justify-between mb-5 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{isEditing ? 'Reconfigure Proposal' : 'New Proposal'}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{isEditing ? 'Update existing proposal details' : 'Draft a professional proposal'}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100">
                   <Icon name="close" size="sm" />
                </button>
             </div>

             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Active Inquiry</label>
                   <div className="relative group">
                      <select 
                        disabled={isEditing}
                        className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#7C3AED] appearance-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        value={selectedLeadId}
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                      >
                         <option value="" className="font-bold">Select a client</option>
                         {leads.map(l => (
                           <option key={l._id} value={l._id} className="font-bold">{l.customerName} — {l.serviceName || 'Wedding Service'}</option>
                         ))}
                      </select>
                      {!isEditing && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-[#7C3AED] transition-colors">
                           <Icon name="chevron-down" size="xs" />
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message to Client</label>
                   <textarea 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#7C3AED] transition-all placeholder:text-slate-300 min-h-[100px] resize-none"
                     placeholder="Type your personalized message here..."
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                   />
                </div>

                {selectedLeadId && leads.find(l => l._id === selectedLeadId) && (
                    <div className="p-3 bg-purple-50/30 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon name="calendar" size="xs" className="w-3.5 h-3.5 text-[#7C3AED]" />
                            <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Target Event Date</span>
                        </div>
                        <p className="text-xs font-bold text-slate-600">
                            {new Date(leads.find(l => l._id === selectedLeadId).eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                )}

                <div className="pt-2">
                   <button 
                     disabled={isSaving}
                     onClick={handleSaveQuote}
                     className="w-full h-11 rounded-xl bg-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm hover:bg-[#6D28D9] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {isSaving ? (
                         <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Synchronizing
                         </>
                      ) : (
                         <>
                            <Icon name="sparkles" size="xs" />
                            {isEditing ? 'Update Proposal' : 'Send Proposal'}
                         </>
                      )}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorQuotes;
