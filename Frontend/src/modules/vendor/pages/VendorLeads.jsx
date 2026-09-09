import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorState } from '../useVendorState';
import { vendorApi } from '../vendorApi';
import Icon from '../../../components/ui/Icon';

const statusOptions = ['New', 'Contacted', 'Quote Sent', 'Booked', 'Rejected'];

const VendorLeads = () => {
  const { refreshData, vendorState } = useVendorState();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.getLeads(token);
      if (res.success) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateStatus = async (leadId, status) => {
    try {
      const token = localStorage.getItem('vendorToken');
      const res = await vendorApi.updateLeadStatus(leadId, status, token);
      if (res.success) {
        setLeads(prev => prev.map(l => (l._id === leadId ? { ...l, status: res.data.status } : l)));
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead(prev => ({ ...prev, status: res.data.status }));
        }
        refreshData(); 
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (l.customerName || '').toLowerCase().includes(searchLower) || 
        (l.phone || '').includes(searchQuery) ||
        (l.eventLocation || '').toLowerCase().includes(searchLower) ||
        (l.category || '').toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'All' || 
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
      lost: leads.filter(l => l.status === 'Rejected' || l.status === 'Not converted' || l.status === 'Lost').length,
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
        {/* Simple Clean Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-[20px] font-semibold text-[#1e293b] tracking-tight leading-tight">Leads Management</h1>
            <p className="text-[11px] font-medium text-slate-500">Track and manage all customer enquiries</p>
          </div>
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
              className="w-32 sm:w-44 h-8 pl-8 pr-3 bg-white border border-slate-100 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-200 transition-all shadow-sm focus:w-40 sm:focus:w-52"
            />
          </div>
          <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100 flex-shrink-0">
            {[
              { label: 'All', value: 'All' },
              { label: 'New', value: 'New' },
              { label: 'Contacted', value: 'Contacted' },
              { label: 'Quoted', value: 'Quoted' },
              { label: 'Confirmed', value: 'Confirmed' },
              { label: 'Lost', value: 'Not converted' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${statusFilter === opt.value ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-105' : 'text-slate-500 hover:text-slate-700 hover:scale-105'}`}
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
          { label: 'Profile Views', value: vendorState.analytics?.profileViews || 842, trend: '+18% vs week', color: 'indigo', icon: 'eye' },
          { label: 'New Leads', value: 28, trend: '+12 today', color: 'violet', icon: 'zap' },
          { label: 'Responded', value: 18, trend: 'Avg. 12 mins', color: 'blue', icon: 'messageSquare' },
          { label: 'Quotations Sent', value: 11, trend: '₹8.5L Potential', color: 'orange', icon: 'fileText' },
          { label: 'Confirmed', value: 6, trend: 'Bookings', color: 'emerald', icon: 'checkCircle' },
          { label: 'Lost Leads', value: 4, trend: 'Track Reasons', color: 'rose', icon: 'xCircle' }
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
            <div key={i} className={`p-2 rounded-xl border transition-all hover:shadow-md ${style.border} ${style.bg} flex flex-col justify-between min-h-[75px]`}>
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

      {/* Leads Pipeline Section */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-slate-900">Leads Pipeline</h2>
          <button className="h-9 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[11px] font-medium text-slate-700 shadow-sm active:scale-95 transition-all">
            Pipeline View <Icon name="chevron-down" size="xs" />
          </button>
        </div>
        
        <div className="flex items-center justify-between gap-1 pb-2">
          {[
            { label: 'New Enquiry', count: 28, status: 'New', color: 'bg-[#EDE9FE] text-[#5B21B6]' },
            { label: 'Contacted', count: 18, status: 'Contacted', color: 'bg-[#E0E7FF] text-[#4338CA]' },
            { label: 'Quotation', count: 11, status: 'Quoted', color: 'bg-[#FFF7ED] text-[#C2410C]' }
          ].map((stage, i, arr) => (
            <div key={i} className="flex-1 flex items-center">
              <button 
                onClick={() => setStatusFilter(statusFilter === stage.status ? 'All' : stage.status)}
                className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 ${stage.color} ${
                  statusFilter === stage.status ? 'ring-2 ring-offset-2 ring-slate-300' : ''
                }`}
              >
                <span className="text-[10px] font-medium mb-1.5 whitespace-nowrap">{stage.label}</span>
                <div className="bg-white rounded-md w-10 h-5.5 flex items-center justify-center shadow-sm text-slate-900 font-semibold text-[12px]">
                  {stage.count}
                </div>
              </button>
              
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 flex items-center px-0.5">
                  <div className="w-4 border-t-2 border-dashed border-[#E2E8F0] relative">
                    <div className="absolute -right-0.5 -top-[4px] h-1.5 w-1.5 rounded-full bg-[#CBD5E1]"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>



      {/* Leads List Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[14px] font-bold text-slate-900">All Leads ({filteredLeads.length})</h2>
        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-violet-600 shadow-sm">
          <Icon name="grid" size="xs" />
        </div>
      </div>

      {/* High-Density Lead List */}
      <div className="space-y-2.5 px-1">
        {filteredLeads.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="mail" size="md" color="#cbd5e1" />
            </div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No matching enquiries found</p>
          </div>
        ) : (
          filteredLeads.map((lead, idx) => {
            const realImages = [
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
            ];
            const profileImg = lead.img || realImages[idx % realImages.length];
            const isHot = lead.status === 'New';
            const leadScore = isHot ? 92 : (lead.status === 'Contacted' ? 78 : 45);

            return (
              <div key={lead._id} className="bg-slate-50 rounded-xl border border-slate-200/60 p-3 shadow-sm relative group transition-all hover:bg-white hover:shadow-md active:scale-[0.995]">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5">
                    <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      <img src={profileImg} alt={lead.customerName} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-bold text-slate-900 leading-tight">{lead.customerName}</h3>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded bg-white shadow-sm border border-slate-100 uppercase tracking-widest ${isHot ? 'text-rose-500' : 'text-orange-500'}`}>
                          {lead.status === 'New' ? 'HOT' : 'WARM'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-bold text-slate-400">
                        <span className="flex items-center gap-1">{lead.category || 'Event'} <span className="opacity-30">•</span> {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : 'TBD'}</span>
                        <span className="flex items-center gap-1"><Icon name="location" size="xs" /> {lead.eventLocation || 'Indore'}</span>
                        <span className="flex items-center gap-1"><Icon name="users" size="xs" /> {lead.guests || '250'} G</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="text-right">
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">Budget</p>
                      <p className="text-[12px] font-bold text-slate-900 leading-none">₹{lead.budget || lead.totalAmount || 'TBD'}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="relative h-8 w-8">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-white" strokeWidth="4"></circle>
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500" strokeWidth="4" strokeDasharray={`${leadScore}, 100`} strokeLinecap="round"></circle>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-emerald-600">{leadScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirement Specification (Compact) */}
                {lead.message && (
                  <div className="mt-2 px-2 py-1.5 bg-white/60 rounded-xl border border-white shadow-inner">
                    <p className="text-[9px] text-slate-500 line-clamp-1 leading-normal italic">"{lead.message}"</p>
                  </div>
                )}

                {/* Compact Action Bar */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40">
                  <div className="flex gap-1">
                    {[
                      { icon: 'phone', color: 'bg-blue-500 text-white', href: `tel:${lead.customerPhone || lead.phone}` },
                      { icon: 'chat', color: 'bg-emerald-500 text-white' },
                      { icon: 'fileText', color: 'bg-violet-500 text-white', onClick: () => navigate('/vendor/quotes', { state: { prefillLeadId: lead._id } }) },
                      { icon: 'calendar', color: 'bg-orange-500 text-white' },
                      { icon: 'edit', color: 'bg-slate-100 text-slate-500' }
                    ].map((btn, i) => (
                      btn.href ? (
                        <a key={i} href={btn.href} className={`h-7 w-8 rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition-all ${btn.color}`}>
                          <Icon name={btn.icon} size="xs" />
                        </a>
                      ) : (
                        <button key={i} onClick={btn.onClick} className={`h-7 w-8 rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition-all ${btn.color}`}>
                          <Icon name={btn.icon} size="xs" />
                        </button>
                      )
                    ))}
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
    </div>
  );
};

export default VendorLeads;
