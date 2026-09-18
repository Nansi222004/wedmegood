import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import Icon from '../../../components/ui/Icon';
import { useToast } from '../../../components/ui/Toast';

const statusOptions = ['New', 'Contacted', 'Quote Sent', 'Rejected'];

const VendorLeads = () => {
  const { refreshData, vendorState } = useVendorState();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [phoneModalLead, setPhoneModalLead] = useState(null);
  const [scheduleModalLead, setScheduleModalLead] = useState(null);
  const [editModalLead, setEditModalLead] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'New', isImportant: false, notes: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchLeads = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('vendorToken');
      if (!token) return;
      const res = await vendorApi.getLeads(token);
      if (res.success && Array.isArray(res.data)) {
        setLeads(prev => {
          // If a new lead arrived during silent refresh, notify the vendor
          if (silent && res.data.length > prev.length) {
            showToast('🔔 New inquiry received from customer!', 'success');
          }
          return res.data;
        });
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch leads:', err);
        showToast('Failed to load leads: ' + (err.message || 'Server error'), 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Live auto-refresh when vendor switches to or focuses the tab
    const handleTabFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchLeads(true);
      }
    };
    window.addEventListener('visibilitychange', handleTabFocus);
    window.addEventListener('focus', handleTabFocus);

    // Background polling every 6 seconds for real-time inquiry streaming
    const livePoll = setInterval(() => {
      fetchLeads(true);
    }, 6000);

    return () => {
      clearInterval(livePoll);
      window.removeEventListener('visibilitychange', handleTabFocus);
      window.removeEventListener('focus', handleTabFocus);
    };
  }, []);

  const isAnyModalOpen = Boolean(phoneModalLead || scheduleModalLead || editModalLead);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPhoneModalLead(null);
        setScheduleModalLead(null);
        setEditModalLead(null);
      }
    };

    if (isAnyModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  const updateStatus = async (leadId, payload) => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.updateLeadStatus(leadId, payload, token);
      if (res.success && res.data) {
        setLeads(prev => prev.map(l => (l._id === leadId ? { ...l, ...res.data } : l)));
        refreshData();
        return res.data;
      } else {
        throw new Error(res.message || 'Update failed');
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
      showToast(err.message || 'Failed to update lead', 'error');
      throw err;
    }
  };

  const handleToggleImportant = async (lead, e) => {
    if (e) e.stopPropagation();
    const newImportant = !lead.isImportant;
    try {
      await updateStatus(lead._id, { isImportant: newImportant });
      showToast(newImportant ? 'Lead marked as important ★' : 'Lead removed from important', 'success');
    } catch {
      // Toast already handled in updateStatus
    }
  };

  const handleCall = (lead) => {
    const rawPhone = lead.phone || lead.customerPhone || '';
    const isMasked = !rawPhone || rawPhone.includes('*') || rawPhone.toLowerCase().includes('not');

    if (isMasked) {
      setPhoneModalLead(lead);
    } else {
      window.location.href = `tel:${rawPhone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleChat = (lead) => {
    const userId = lead.userId?._id || lead.userId || lead.customerProfile?.id;
    if (!userId) {
      showToast('This inquiry was submitted without a registered user account. Please use phone or email once booked.', 'info', 4000);
      return;
    }
    navigate('/vendor/chat', {
      state: {
        leadId: lead._id,
        userId: userId,
        customerName: lead.customerName || lead.customerProfile?.name || 'Customer'
      }
    });
  };

  const handleSchedule = (lead) => {
    setScheduleModalLead(lead);
  };

  const handleOpenEdit = (lead) => {
    setEditModalLead(lead);
    setEditForm({
      status: lead.status || 'New',
      isImportant: Boolean(lead.isImportant),
      notes: lead.notes || lead.requirements || ''
    });
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editModalLead) return;

    setIsSavingEdit(true);
    try {
      await updateStatus(editModalLead._id, editForm);
      showToast('Lead updated successfully', 'success');
      setEditModalLead(null);
    } catch {
      // Error handled in updateStatus
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const searchLower = searchQuery.toLowerCase();
      const customerName = (l.customerName || l.customerProfile?.name || '').toLowerCase();
      const phone = (l.phone || '').toLowerCase();
      const location = (l.eventLocation || l.customerProfile?.city || '').toLowerCase();
      const category = (l.category || '').toLowerCase();
      const message = (l.message || '').toLowerCase();

      const matchesSearch =
        customerName.includes(searchLower) ||
        phone.includes(searchLower) ||
        location.includes(searchLower) ||
        category.includes(searchLower) ||
        message.includes(searchLower);

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Important' && l.isImportant) ||
        l.status === statusFilter ||
        (statusFilter === 'Quoted' && (l.status === 'Quote Sent' || l.status === 'Quoted')) ||
        (statusFilter === 'Confirmed' && (l.status === 'Booked' || l.status === 'Confirmed')) ||
        (statusFilter === 'Lost' && (l.status === 'Rejected' || l.status === 'Not converted' || l.status === 'Lost')) ||
        (statusFilter === 'New' && l.status === 'New') ||
        (statusFilter === 'Contacted' && l.status === 'Contacted');

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      new: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      confirmed: leads.filter(l => l.status === 'Booked' || l.status === 'Confirmed').length,
      quotations: leads.filter(l => l.status === 'Quote Sent' || l.status === 'Quoted').length,
      important: leads.filter(l => l.isImportant).length,
      total: leads.length
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streaming Leads Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 relative">

      {/* Header & Search Group */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1e293b] tracking-tight leading-tight">Leads Management</h1>
            <p className="text-[11px] font-medium text-slate-500">Track, quote, and communicate with verified customer enquiries</p>
          </div>
          <button 
            onClick={fetchLeads}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-1.5"
            title="Refresh leads list"
          >
            <Icon name="refresh" size="xs" /> Refresh
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-1.5 px-1 overflow-x-auto no-scrollbar">
          <div className="relative flex-shrink-0">
            <Icon name="search" size="xs" color="#94a3b8" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-52 h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
            {[
              { label: 'All', value: 'All' },
              { label: '★ Starred', value: 'Important' },
              { label: 'New', value: 'New' },
              { label: 'Contacted', value: 'Contacted' },
              { label: 'Quoted', value: 'Quoted' },
              { label: 'Confirmed', value: 'Confirmed' },
              { label: 'Lost', value: 'Lost' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${
                  statusFilter === opt.value 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 scale-105' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 px-1">
        {[
          { label: 'Total Enquiries', value: stats.total, trend: 'All Time', color: 'indigo', icon: 'zap' },
          { label: 'New Enquiries', value: stats.new, trend: 'Action Required', color: 'violet', icon: 'sparkles' },
          { label: 'Contacted', value: stats.contacted, trend: 'In Discussion', color: 'blue', icon: 'messageSquare' },
          { label: 'Quotations', value: stats.quotations, trend: 'Pending Response', color: 'orange', icon: 'fileText' },
          { label: 'Confirmed', value: stats.confirmed, trend: 'Booked', color: 'emerald', icon: 'checkCircle' },
          { label: '★ Starred', value: stats.important, trend: 'High Priority', color: 'rose', icon: 'star' }
        ].map((item, i) => {
          const colorStyles = {
            indigo: { bg: 'bg-indigo-50/80', border: 'border-indigo-100', iconBg: 'bg-indigo-100', text: 'text-indigo-600', trend: 'text-indigo-500' },
            violet: { bg: 'bg-violet-50/80', border: 'border-violet-100', iconBg: 'bg-violet-100', text: 'text-violet-600', trend: 'text-violet-500' },
            blue: { bg: 'bg-blue-50/80', border: 'border-blue-100', iconBg: 'bg-blue-100', text: 'text-blue-600', trend: 'text-blue-500' },
            orange: { bg: 'bg-orange-50/80', border: 'border-orange-100', iconBg: 'bg-orange-100', text: 'text-orange-600', trend: 'text-orange-500' },
            emerald: { bg: 'bg-emerald-50/80', border: 'border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-600', trend: 'text-emerald-500' },
            rose: { bg: 'bg-rose-50/80', border: 'border-rose-100', iconBg: 'bg-rose-100', text: 'text-rose-600', trend: 'text-rose-500' }
          };
          const style = colorStyles[item.color] || colorStyles.indigo;
          
          return (
            <div key={i} className={`p-2.5 rounded-xl border transition-all hover:shadow-md ${style.border} ${style.bg} flex flex-col justify-between min-h-[75px]`}>
              <div className="flex items-center justify-between mb-1">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shadow-sm ${style.iconBg} ${style.text} border border-white/50`}>
                  <Icon name={item.icon} size="xs" />
                </div>
                <span className={`text-[19px] font-semibold tracking-tight ${style.text}`}>{item.value}</span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-800 leading-none">{item.label}</p>
                <p className={`text-[9px] font-medium mt-0.5 ${style.trend}`}>{item.trend}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leads List Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[14px] font-bold text-slate-900">All Enquiries ({filteredLeads.length})</h2>
      </div>

      {/* Lead Cards List */}
      <div className="space-y-2.5 px-1">
        {filteredLeads.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="mail" size="md" color="#cbd5e1" />
            </div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No matching enquiries found</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const customerName = lead.customerName || lead.customerProfile?.name || 'Customer';
            const profileImg = lead.customerImage || lead.customerProfile?.profileImage || null;
            const isHot = lead.status === 'New';
            const isBooked = lead.status === 'Booked';
            const leadScore = isBooked ? 100 : (isHot ? 92 : (lead.status === 'Contacted' ? 78 : 45));

            // Customer initials avatar fallback
            const initials = customerName.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';

            // Safe event date string
            const formattedDate = lead.eventDate 
              ? new Date(lead.eventDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'Date TBD';

            // Safe location string
            const eventLoc = lead.eventLocation || lead.customerProfile?.city || 'Location TBD';

            // Safe guest count string
            const guestText = (lead.guestCount && lead.guestCount > 0) 
              ? `${lead.guestCount} Guests`
              : (lead.guests ? `${lead.guests} Guests` : 'Guests TBD');

            // Safe budget string
            const budgetText = (lead.budget && lead.budget > 0)
              ? `₹${Number(lead.budget).toLocaleString('en-IN')}`
              : (lead.totalAmount ? `₹${Number(lead.totalAmount).toLocaleString('en-IN')}` : 'Budget TBD');

            return (
              <div 
                key={lead._id} 
                className={`bg-white rounded-xl border p-3.5 shadow-sm relative transition-all hover:shadow-md ${
                  lead.isImportant ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    {/* Actual Customer Profile Image or Initials Avatar */}
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {profileImg ? (
                        <img 
                          src={profileImg} 
                          alt={customerName} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerText = initials;
                          }}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-bold text-slate-900 leading-tight">{customerName}</h3>
                        
                        {/* Status Badge */}
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          isBooked 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : isHot 
                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        }`}>
                          {lead.status}
                        </span>

                        {/* Starred Badge */}
                        {lead.isImportant && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                            ★ Starred
                          </span>
                        )}

                        {lead.assignedType && (
                          <span className="text-[8px] font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                            {lead.assignedType}
                          </span>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Icon name="calendar" size="xs" color="#64748b" /> {formattedDate}
                        </span>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="location" size="xs" color="#64748b" /> {eventLoc}
                        </span>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="users" size="xs" color="#64748b" /> {guestText}
                        </span>
                        <span className="opacity-30">•</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-600">
                          {lead.category || 'Wedding'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Budget & Quality Score */}
                  <div className="flex gap-3 items-center flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Budget</p>
                      <p className="text-[13px] font-bold text-slate-900 leading-none">{budgetText}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="relative h-8 w-8">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="4"></circle>
                          <circle 
                            cx="18" 
                            cy="18" 
                            r="16" 
                            fill="none" 
                            className="stroke-emerald-500" 
                            strokeWidth="4" 
                            strokeDasharray={`${leadScore}, 100`} 
                            strokeLinecap="round"
                          ></circle>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-emerald-600">{leadScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Inquiry Message */}
                {(lead.message || lead.requirements) && (
                  <div className="mt-2.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-600 leading-relaxed italic">
                      "{lead.message || lead.requirements}"
                    </p>
                  </div>
                )}

                {/* Internal Vendor Notes if any */}
                {lead.notes && (
                  <div className="mt-1.5 px-2.5 py-1 bg-amber-50/70 rounded-lg border border-amber-200/50">
                    <p className="text-[9px] text-amber-800 font-medium">
                      <span className="font-bold">Notes:</span> {lead.notes}
                    </p>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. Call Action */}
                    <button
                      type="button"
                      onClick={() => handleCall(lead)}
                      title={isBooked ? `Call ${customerName} (${lead.phone})` : "Customer phone masked until booking"}
                      className={`h-7 px-2.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold shadow-sm transition-all active:scale-95 ${
                        isBooked 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <Icon name="phone" size="xs" />
                      <span>{isBooked ? (lead.phone || 'Call') : 'Call (Protected)'}</span>
                    </button>

                    {/* 2. In-App Chat Action */}
                    <button
                      type="button"
                      onClick={() => handleChat(lead)}
                      title="Open In-App Chat with Customer"
                      className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                    >
                      <Icon name="chat" size="xs" />
                      <span>Chat</span>
                    </button>

                    {/* 3. Send Official Quote Action */}
                    <button
                      type="button"
                      onClick={() => navigate('/vendor/quotes', { state: { prefillLeadId: lead._id } })}
                      title="Create & Send Official Quote"
                      className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition-all active:scale-95"
                    >
                      <Icon name="fileText" size="xs" />
                      <span>Quote</span>
                    </button>

                    {/* 4. Schedule & Event Details Action */}
                    <button
                      type="button"
                      onClick={() => handleSchedule(lead)}
                      title="View Event Schedule & Calendar"
                      className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold bg-orange-500 text-white hover:bg-orange-600 shadow-sm transition-all active:scale-95"
                    >
                      <Icon name="calendar" size="xs" />
                      <span>Schedule</span>
                    </button>

                    {/* 5. Edit & Update Action */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(lead)}
                      title="Edit Inquiry Details & Notes"
                      className="h-7 px-2 rounded-lg flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-sm transition-all active:scale-95"
                    >
                      <Icon name="edit" size="xs" />
                      <span>Edit</span>
                    </button>

                    {/* 6. Shortlist / Mark as Important Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleImportant(lead, e)}
                      title={lead.isImportant ? "Remove from Starred" : "Mark as Important"}
                      className={`h-7 px-2 rounded-lg flex items-center gap-1 text-[10px] font-semibold shadow-sm transition-all active:scale-95 border ${
                        lead.isImportant 
                          ? 'bg-amber-400 text-amber-950 border-amber-500' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>★</span>
                      <span>{lead.isImportant ? 'Starred' : 'Star'}</span>
                    </button>
                  </div>

                  <span className="text-[9px] font-bold text-slate-400">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Masked Phone Notice */}
      {phoneModalLead && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setPhoneModalLead(null)}
          />

          {/* Dialog Container */}
          <div className="relative z-10 bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Icon name="shield" size="md" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Customer Contact Protected</h3>
                <p className="text-[11px] text-slate-500">{phoneModalLead.customerName}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-2">
              <p>
                Phone: <span className="font-mono font-bold text-slate-800">{phoneModalLead.phone || 'Masked'}</span>
              </p>
              <p className="text-slate-500 leading-normal">
                To protect client privacy, customer direct phone numbers remain masked until an official quotation is accepted and the booking is confirmed.
              </p>
              <p className="font-medium text-emerald-700">
                You can communicate directly with this customer right now using the in-app chat.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetLead = phoneModalLead;
                  setPhoneModalLead(null);
                  handleChat(targetLead);
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Icon name="chat" size="xs" /> Open Chat
              </button>
              <button
                type="button"
                onClick={() => setPhoneModalLead(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Event Schedule & Booking Workflow */}
      {scheduleModalLead && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setScheduleModalLead(null)}
          />

          {/* Dialog Container */}
          <div className="relative z-10 bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Icon name="calendar" size="xs" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Event Schedule Details</h3>
                  <p className="text-[11px] text-slate-500">Lead #{scheduleModalLead._id?.slice(-6)}</p>
                </div>
              </div>
              <button 
                onClick={() => setScheduleModalLead(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Customer</p>
                <p className="font-semibold text-slate-800">{scheduleModalLead.customerName}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Event Date</p>
                <p className="font-semibold text-orange-600">
                  {scheduleModalLead.eventDate 
                    ? new Date(scheduleModalLead.eventDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'Date TBD'}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Location</p>
                <p className="font-semibold text-slate-800">{scheduleModalLead.eventLocation || 'Location TBD'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Guest Count</p>
                <p className="font-semibold text-slate-800">
                  {scheduleModalLead.guestCount ? `${scheduleModalLead.guestCount} Guests` : 'TBD'}
                </p>
              </div>
            </div>

            {scheduleModalLead.message && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Inquiry Requirements</p>
                <p className="text-slate-600 italic leading-relaxed">"{scheduleModalLead.message}"</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const lId = scheduleModalLead._id;
                  setScheduleModalLead(null);
                  navigate('/vendor/quotes', { state: { prefillLeadId: lId } });
                }}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Icon name="fileText" size="xs" /> Send Official Quote
              </button>
              <button
                type="button"
                onClick={() => {
                  setScheduleModalLead(null);
                  navigate('/vendor/calendar');
                }}
                className="px-3.5 py-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-all flex items-center justify-center gap-1 active:scale-95"
              >
                <Icon name="calendar" size="xs" /> Open Calendar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Edit & Update Inquiry */}
      {editModalLead && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setEditModalLead(null)}
          />

          {/* Dialog Form Container */}
          <form 
            onSubmit={handleSaveEdit} 
            className="relative z-10 bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Icon name="edit" size="xs" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Update Inquiry Details</h3>
                  <p className="text-[11px] text-slate-500">{editModalLead.customerName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditModalLead(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                disabled={editModalLead.status === 'Booked'}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                {editModalLead.status === 'Booked' ? (
                  <option value="Booked">Booked (Confirmed via Quote)</option>
                ) : (
                  statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))
                )}
              </select>
              {editModalLead.status === 'Booked' && (
                <p className="text-[9px] text-emerald-600 font-medium">
                  This lead is confirmed as Booked. Status cannot be modified manually.
                </p>
              )}
            </div>

            {/* Starred / Important Checkbox */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer" onClick={() => setEditForm(prev => ({ ...prev, isImportant: !prev.isImportant }))}>
              <input 
                type="checkbox"
                checked={editForm.isImportant}
                onChange={(e) => setEditForm({ ...editForm, isImportant: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                ★ Mark as High Priority / Starred
              </span>
            </div>

            {/* Internal Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Vendor Follow-up Notes</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Add private notes about client requirements, conversation takeaways, or follow-up schedule..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalLead(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 active:scale-95"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Toast Notification Container */}
      <ToastComponent />
    </div>
  );
};

export default VendorLeads;
