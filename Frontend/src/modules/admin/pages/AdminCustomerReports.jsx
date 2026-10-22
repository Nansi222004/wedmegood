import { useCallback, useEffect, useState } from 'react';
import { toast } from '../../../components/ui/Toast';
import { adminApi } from '../services/adminApi';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const ASPECTS = [['respect', 'Respect'], ['support', 'Support during work'], ['payment', 'Payment'], ['communication', 'Communication'], ['approach', 'Approach']];
const TONE = { Pending: 'bg-amber-50 text-amber-800', Confirmed: 'bg-emerald-50 text-emerald-700', Rejected: 'bg-slate-100 text-slate-500' };

/**
 * Vendors' reports about customer behaviour. Confirmed reports are shown to other vendors as a
 * summary (never the reporting vendor), so decide only after reading the customer's side.
 */
const AdminCustomerReports = () => {
  const token = localStorage.getItem('adminToken');
  const [status, setStatus] = useState('Pending');
  const [list, setList] = useState(null);
  const [pending, setPending] = useState(0);

  const load = useCallback(() => adminApi.getCustomerReports(token, status)
    .then(r => { if (r.success) { setList(r.data); setPending(r.pending); } else toast.error(r.message); })
    .catch(err => toast.error(err.message)), [token, status]);
  useEffect(() => { load(); }, [load]);

  const decide = async (report, decision) => {
    const note = window.prompt(decision === 'Confirmed'
      ? 'Why is this confirmed? (shown to the vendor and the customer)'
      : 'Why is this rejected? (shown to the vendor and the customer)');
    if (!note) return;
    const r = await adminApi.decideCustomerReport(report._id, { decision, note }, token);
    if (r.success) { toast.success(decision === 'Confirmed' ? 'Confirmed: other vendors will see a summary' : 'Rejected'); load(); } else toast.error(r.message);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer behaviour reports</h1>
        <p className="text-xs text-slate-500">Vendors report how customers behaved (support during work, respect, payment). Confirmed reports are shown to other vendors without the reporter's name. Read the customer's side before deciding.</p>
      </div>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['Pending', 'Confirmed', 'Rejected', ''].map(s => (
          <button key={s || 'all'} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${status === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
            {s === 'Pending' ? `To review (${pending})` : s || 'All'}
          </button>
        ))}
      </div>
      {!list ? <p className="text-xs text-slate-400">Loading...</p> : list.length === 0 ? (
        <p className="text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 text-center">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {list.map(r => (
            <div key={r._id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.userId?.name || 'Customer'} <span className="font-normal text-slate-500">reported by {r.vendorId?.businessName || 'Vendor'}</span></p>
                  <p className="text-[11px] text-slate-500">{fmt(r.createdAt)} · {r.userId?.phone || r.userId?.email || ''}{r.bookingId ? ' · about a booking' : ' · about a lead'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${TONE[r.status]}`}>{r.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ASPECTS.map(([key, label]) => (
                  <span key={key} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${['Poor', 'Very poor'].includes(r.conduct?.[key]) ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {label}: {r.conduct?.[key]}
                  </span>
                ))}
              </div>
              {r.issues?.length > 0 && <p className="text-xs text-slate-700">{r.issues.join(' · ')}</p>}
              <p className="text-xs text-slate-800">"{r.description}"</p>
              <p className="text-xs text-slate-600">
                <b>Customer's side:</b> {r.customerResponse?.statement || <span className="text-slate-400">not given yet</span>}
              </p>
              {r.adminNote && <p className="text-xs text-slate-600"><b>Decision note:</b> {r.adminNote}</p>}
              {r.status === 'Pending' && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => decide(r, 'Confirmed')} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer">Confirm</button>
                  <button onClick={() => decide(r, 'Rejected')} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCustomerReports;
