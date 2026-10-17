import { useCallback, useEffect, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { toast } from '../../../components/ui/Toast';
import { adminApi } from '../services/adminApi';

const STATUS_TONE = {
  'Awaiting Response': 'bg-sky-50 text-sky-700',
  Accepted: 'bg-emerald-50 text-emerald-700',
  New: 'bg-emerald-50 text-emerald-700',
  Contacted: 'bg-emerald-50 text-emerald-700',
  'Quote Sent': 'bg-violet-50 text-violet-700',
  Booked: 'bg-emerald-600 text-white',
  'Details Requested': 'bg-amber-50 text-amber-800',
  Exploring: 'bg-amber-50 text-amber-800',
  Unassigned: 'bg-rose-100 text-rose-700',
  Closed: 'bg-slate-100 text-slate-500',
  Cancelled: 'bg-slate-100 text-slate-500'
};
const OFFER_TONE = {
  Pending: 'text-sky-600', Accepted: 'text-emerald-600', Declined: 'text-amber-700', Expired: 'text-rose-600',
  Lapsed: 'text-rose-700', Withdrawn: 'text-slate-500', CustomerDeclined: 'text-amber-700', Revoked: 'text-slate-400'
};

const fmt = (d, withTime = false) => (d ? new Date(d).toLocaleString('en-IN', withTime
  ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }
  : { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const Panel = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer" aria-label="Close">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const AdminEnquiries = () => {
  const token = localStorage.getItem('adminToken');
  const [tab, setTab] = useState('requirements');

  // Requirements
  const [enquiries, setEnquiries] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [attention, setAttention] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Lead panel
  const [panelLead, setPanelLead] = useState(null);
  const [history, setHistory] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [assignReason, setAssignReason] = useState('');
  const [working, setWorking] = useState(false);

  // Distribution & reports
  const [distribution, setDistribution] = useState(null);
  const [days, setDays] = useState(30);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('Pending');

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEnquiries(token, { page, limit: 20, ...(attention ? { attention: 1 } : {}), ...(search.trim() ? { search: search.trim() } : {}) });
      if (res.success) {
        setEnquiries(res.data);
        setUnassignedCount(res.unassignedCount || 0);
        setPages(res.pagination?.totalPages || 1);
      } else toast.error(res.message || 'Could not load requirements');
    } catch {
      toast.error('Could not load requirements');
    } finally {
      setLoading(false);
    }
  }, [token, page, attention, search]);

  useEffect(() => {
    if (tab !== 'requirements') return undefined;
    const t = setTimeout(loadEnquiries, 250);
    return () => clearTimeout(t);
  }, [tab, loadEnquiries]);

  useEffect(() => {
    if (tab !== 'distribution') return;
    adminApi.getLeadDistribution(token, days).then(res => res.success && setDistribution(res.data)).catch(() => {});
  }, [tab, days, token]);

  const loadReports = useCallback(() => {
    adminApi.getLeadReports(token, reportFilter).then(res => res.success && setReports(res.data)).catch(() => {});
  }, [token, reportFilter]);
  useEffect(() => { if (tab === 'reports') loadReports(); }, [tab, loadReports]);

  const openLead = async (service) => {
    setPanelLead(service);
    setHistory(null);
    setCandidates(null);
    setAssignReason('');
    const res = await adminApi.getLeadHistory(service._id, token).catch(() => null);
    if (res?.success) setHistory(res.data);
  };

  const loadCandidates = async () => {
    const res = await adminApi.getLeadCandidates(panelLead._id, token).catch(() => null);
    setCandidates(res?.success ? res.data : []);
  };

  const act = async (fn) => {
    setWorking(true);
    try {
      const res = await fn();
      if (res?.success) {
        toast.success(res.message || 'Done');
        setPanelLead(null);
        loadEnquiries();
      } else toast.error(res?.message || 'Action failed');
    } catch {
      toast.error('Action failed');
    } finally {
      setWorking(false);
    }
  };

  const reviewReport = async (report, status) => {
    const notes = window.prompt(`Notes for marking this report as ${status} (optional)`, report.adminNotes || '');
    if (notes === null) return;
    const res = await adminApi.updateLeadReport(report._id, status, notes, token).catch(() => null);
    if (res?.success) { toast.success('Report updated'); loadReports(); } else toast.error(res?.message || 'Failed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Requirements & Lead Dispatch</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Customer requirements, vendor offers and fair distribution</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[['requirements', 'Requirements'], ['distribution', 'Distribution'], ['reports', 'Lead reports']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {label}{key === 'requirements' && unassignedCount > 0 ? ` (${unassignedCount} unassigned)` : ''}
            </button>
          ))}
        </div>
      </div>

      {tab === 'requirements' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, phone, city, PIN code"
              className="flex-1 h-10 px-4 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4F35C3]"
            />
            <button
              onClick={() => { setAttention(a => !a); setPage(1); }}
              className={`h-10 px-4 rounded-xl text-xs font-bold border cursor-pointer ${attention ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-600 border-rose-200'}`}
            >
              Needs attention only
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-10 text-center">Loading...</p>
          ) : enquiries.length === 0 ? (
            <p className="text-xs text-slate-400 py-10 text-center bg-white rounded-2xl border border-slate-200">No requirements found</p>
          ) : (
            <div className="space-y-3">
              {enquiries.map(e => (
                <div key={e._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-900">{e.eventType} · {fmt(e.eventDate)}</p>
                      <p className="text-[11px] text-slate-500">
                        {e.contactName} · {e.contactPhone} · {[e.city, e.district, e.pincode].filter(Boolean).join(', ')}
                        {e.totalBudget > 0 ? ` · Budget ₹${e.totalBudget.toLocaleString('en-IN')}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Posted {fmt(e.createdAt, true)}</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {e.services.map(s => (
                      <button key={s._id} onClick={() => openLead(s)} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left cursor-pointer">
                        <span className="text-xs font-bold text-slate-800">{s.category}</span>
                        <span className="flex items-center gap-2 text-[11px] text-slate-500">
                          {s.vendor ? s.vendor.businessName : `${s.attempts} offer${s.attempts === 1 ? '' : 's'}`}
                          {s.customerDeclines > 0 && <span className="text-amber-700">· {s.customerDeclines} declined</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_TONE[s.status] || 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-40">Previous</button>
                <span className="text-xs text-slate-500">Page {page} of {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'distribution' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${days === d ? 'bg-[#4F35C3] text-white border-[#4F35C3]' : 'bg-white text-slate-600 border-slate-200'}`}>Last {d} days</button>
            ))}
          </div>
          {!distribution ? <p className="text-xs text-slate-400">Loading...</p> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Subscribed vendors', distribution.fairness.subscribedVendors],
                  ['Got no offers', distribution.fairness.vendorsWithNoOffers],
                  ['Avg. offers / vendor', distribution.fairness.avgOffers],
                  ['Most offers to one vendor', distribution.fairness.maxOffers]
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-3">
                {[
                  ['Why vendors decline', distribution.vendorDeclineReasons],
                  ['Why customers decline vendors', distribution.customerDeclineReasons],
                  ['Where requirements are', distribution.leadStatuses.map(s => ({ label: s.status, count: s.count }))]
                ].map(([title, rows]) => (
                  <div key={title} className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs font-black text-slate-900 mb-2">{title}</p>
                    {rows.length === 0 ? <p className="text-[11px] text-slate-400">No data yet</p> : rows.map(r => (
                      <div key={r.label} className="flex justify-between text-[11px] py-1 border-b border-slate-50 last:border-0">
                        <span className="text-slate-600">{r.label}</span><span className="font-bold text-slate-900">{r.count}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>{['Vendor', 'Offered', 'Accepted', 'Declined', 'Missed', 'Lapsed', 'Booked', 'Acceptance', 'Last offer'].map(h => <th key={h} className="px-4 py-3 font-black">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {distribution.vendors.map(v => (
                      <tr key={v._id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-slate-900">{v.businessName}</p>
                          <p className="text-[10px] text-slate-400">
                            {v.city}{v.categories.length ? ` · ${v.categories.slice(0, 2).join(', ')}` : ''}
                            {v.isNew && <span className="ml-1 text-emerald-600 font-bold">NEW</span>}
                            {v.paused && <span className="ml-1 text-amber-600 font-bold">PAUSED</span>}
                          </p>
                        </td>
                        <td className={`px-4 py-2.5 font-bold ${v.offered === 0 ? 'text-rose-600' : 'text-slate-900'}`}>{v.offered}</td>
                        <td className="px-4 py-2.5">{v.accepted}</td>
                        <td className="px-4 py-2.5">{v.declined}</td>
                        <td className="px-4 py-2.5">{v.missed}</td>
                        <td className="px-4 py-2.5">{v.lapsed}</td>
                        <td className="px-4 py-2.5">{v.booked}</td>
                        <td className="px-4 py-2.5">{v.acceptanceRate != null ? `${v.acceptanceRate}%` : '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500">{fmt(v.lastOfferedAt, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {['Pending', 'Reviewed', 'Dismissed'].map(s => (
              <button key={s} onClick={() => setReportFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${reportFilter === s ? 'bg-[#4F35C3] text-white border-[#4F35C3]' : 'bg-white text-slate-600 border-slate-200'}`}>{s}</button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Vendors flag suspicious enquiries here. Investigate before acting: a report alone does not make a customer guilty.</p>
          {reports.length === 0 ? <p className="text-xs text-slate-400 py-8 text-center bg-white rounded-2xl border border-slate-200">No reports</p> : reports.map(r => (
            <div key={r._id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="text-sm font-black text-slate-900">{r.reasonLabel}</p>
                <span className="text-[10px] text-slate-400">{fmt(r.createdAt, true)}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                By <b>{r.vendorId?.businessName || 'vendor'}</b> about <b>{r.userId?.name || 'customer'}</b> ({r.userId?.phone || 'no phone'})
                {r.leadId ? ` · ${r.leadId.category} on ${fmt(r.leadId.eventDate)} in ${r.leadId.city || ''}` : ''}
              </p>
              {r.note && <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-2.5">{r.note}</p>}
              {r.adminNotes && <p className="text-[11px] text-indigo-700">Admin: {r.adminNotes}</p>}
              <div className="flex gap-2">
                {r.status !== 'Reviewed' && <button onClick={() => reviewReport(r, 'Reviewed')} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer">Mark reviewed</button>}
                {r.status !== 'Dismissed' && <button onClick={() => reviewReport(r, 'Dismissed')} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold cursor-pointer">Dismiss</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {panelLead && (
        <Panel title={`${panelLead.category} · ${panelLead.status}`} onClose={() => setPanelLead(null)}>
          {!history ? <p className="text-xs text-slate-400">Loading history...</p> : (
            <>
              <div className="text-xs text-slate-600 space-y-1">
                <p>{history.lead.eventType} on {fmt(history.lead.eventDate)} · {[history.lead.city, history.lead.district, history.lead.pincode].filter(Boolean).join(', ')}</p>
                <p>Budget: {history.lead.budget > 0 ? `₹${history.lead.budget.toLocaleString('en-IN')}` : 'not given'} · Search: {history.lead.dispatch?.allowExpandedSearch ? 'widened' : 'local'}</p>
                {history.lead.requirements && <p className="bg-slate-50 rounded-xl p-2.5 text-slate-700 whitespace-pre-line">{history.lead.requirements}</p>}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Offers ({history.offers.length})</p>
                <div className="space-y-1.5">
                  {history.offers.length === 0 && <p className="text-[11px] text-slate-400">No vendor has been offered this lead.</p>}
                  {history.offers.map(o => (
                    <div key={o._id} className="flex items-start justify-between gap-2 text-[11px] px-3 py-2 rounded-lg bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">#{o.attempt} {o.vendorId?.businessName || 'Vendor'}</p>
                        <p className="text-slate-500">
                          {o.match?.coverage} match{o.match?.distanceKm != null ? ` · ${Math.round(o.match.distanceKm)} km` : ''} · offered {fmt(o.offeredAt, true)}
                          {o.responseSeconds != null ? ` · answered in ${o.responseSeconds}s` : ''}
                        </p>
                        {o.declineReasonLabel && <p className="text-amber-700">{o.declineReasonLabel}{o.declineNote ? `: ${o.declineNote}` : ''}</p>}
                      </div>
                      <span className={`font-black ${OFFER_TONE[o.status] || ''}`}>{o.status === 'Expired' ? 'Missed' : o.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {history.customerDeclines.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Customer declined</p>
                  {history.customerDeclines.map((d, i) => (
                    <p key={i} className="text-[11px] text-slate-600">{d.vendorId?.businessName || 'Vendor'}: {d.reasonLabel}{d.note ? ` (${d.note})` : ''} · {fmt(d.at, true)}</p>
                  ))}
                </div>
              )}

              {!panelLead.vendor && !['Booked', 'Closed', 'Cancelled'].includes(panelLead.status) && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Manual assistance</p>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={working} onClick={() => act(() => adminApi.redispatchLead(panelLead._id, false, token))} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold cursor-pointer disabled:opacity-50">Offer to next vendor</button>
                    <button disabled={working} onClick={() => act(() => adminApi.redispatchLead(panelLead._id, true, token))} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold cursor-pointer disabled:opacity-50">Widen search & offer</button>
                    <button onClick={loadCandidates} className="px-3 py-2 rounded-lg bg-[#4F35C3] text-white text-[11px] font-bold cursor-pointer">Assign a vendor...</button>
                  </div>
                  {candidates && (
                    <div className="space-y-2">
                      <input value={assignReason} onChange={(e) => setAssignReason(e.target.value)} placeholder="Reason (e.g. called customer, vendor agreed)" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                      {candidates.length === 0 && <p className="text-[11px] text-slate-400">No vendor offers this service.</p>}
                      {candidates.map(v => (
                        <div key={v._id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-100">
                          <div className="text-[11px]">
                            <p className="font-bold text-slate-800">{v.businessName} {v.isVerified ? '✓' : ''}</p>
                            <p className="text-slate-500">
                              {v.city}{v.distanceKm != null ? ` · ${Math.round(v.distanceKm)} km` : ''} · {v.nearby ? 'serves area' : 'outside area'}
                              {!v.availableOnDate ? ' · date blocked' : ''}{!v.takingLeads ? ' · paused' : ''}{!v.withinBudget ? ' · above budget' : ''}
                            </p>
                          </div>
                          <button disabled={working} onClick={() => act(() => adminApi.assignLead(panelLead._id, v._id, assignReason, token))} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50">Assign</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Panel>
      )}
    </div>
  );
};

export default AdminEnquiries;
