import { useCallback, useEffect, useState } from 'react';
import { toast } from '../../../components/ui/Toast';
import PrivateImage from '../../../components/common/PrivateImage';
import { adminApi } from '../services/adminApi';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const TONE = { Pending: 'bg-amber-50 text-amber-800', Verified: 'bg-emerald-50 text-emerald-700', Rejected: 'bg-rose-50 text-rose-700', Unverified: 'bg-slate-100 text-slate-500' };

/** Workers' ID verification, accounts under review after no-shows, payment disputes */
const AdminWorkforce = () => {
  const token = localStorage.getItem('adminToken');
  const [tab, setTab] = useState('Pending');
  const [workers, setWorkers] = useState(null);
  const [counts, setCounts] = useState({});
  const [overview, setOverview] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [safety, setSafety] = useState(null);
  const [openSafety, setOpenSafety] = useState(0);

  const load = useCallback(() => {
    if (tab === 'safety') {
      return adminApi.getSafetyReports(token).then(r => { if (r.success) { setSafety(r.data); setOpenSafety(r.open); } else toast.error(r.message); });
    }
    if (tab === 'disputes' || tab === 'jobs') {
      return adminApi.getWorkforceOverview(token).then(r => (r.success ? setOverview(r.data) : toast.error(r.message)));
    }
    return adminApi.getWorkers(token, tab === 'review' ? { review: 1 } : { status: tab })
      .then(r => { if (r.success) { setWorkers(r.data); setCounts(r.counts || {}); } else toast.error(r.message); });
  }, [token, tab]);
  useEffect(() => { load(); }, [load]);
  // Keep the open-safety count fresh on every tab; emergencies must not wait for someone to click
  useEffect(() => {
    const poll = () => adminApi.getSafetyReports(token, 'Open').then(r => r.success && setOpenSafety(r.open)).catch(() => {});
    poll();
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, [token]);

  const updateSafety = async (rep, status) => {
    const actionTaken = status === 'Resolved' ? window.prompt('What was done? (shown to the person who reported)') : '';
    if (status === 'Resolved' && !actionTaken) return;
    const r = await adminApi.updateSafetyReport(rep._id, { status, actionTaken }, token);
    if (r.success) { toast.success(status === 'Resolved' ? 'Closed' : 'Acknowledged'); load(); } else toast.error(r.message);
  };

  const verify = async (w, approve) => {
    const body = { approve };
    if (approve) {
      const dob = window.prompt('Date of birth shown on the ID (YYYY-MM-DD)', w.verification?.verifiedDob?.slice(0, 10) || '');
      if (!dob) return;
      body.verifiedDob = dob;
      body.verifiedName = window.prompt('Name as on the ID', w.name) || w.name;
    } else {
      body.reason = window.prompt('Reason (shown to the worker)');
      if (!body.reason) return;
    }
    const r = await adminApi.verifyWorker(w._id, body, token);
    if (r.success) { toast.success(approve ? 'Verified' : 'Rejected'); setViewId(null); load(); } else toast.error(r.message);
  };

  const review = async (w, clear) => {
    const note = window.prompt(clear ? 'Note (why offers can resume)' : 'Note (why the account stays paused)');
    if (note === null) return;
    const r = await adminApi.reviewWorker(w._id, { clear, note, deactivate: !clear && window.confirm('Also deactivate the worker account?') }, token);
    if (r.success) { toast.success('Saved'); load(); } else toast.error(r.message);
  };

  const resolve = async (a) => {
    const resolution = window.prompt('Decision (shown to the worker)');
    if (!resolution) return;
    const r = await adminApi.resolveWorkDispute(a._id, { resolution, markPaid: window.confirm('Has the worker now been paid in full?') }, token);
    if (r.success) { toast.success('Resolved'); load(); } else toast.error(r.message);
  };

  const tabs = [['Pending', `ID checks (${counts.Pending || 0})`], ['review', `Under review (${counts.underReview || 0})`], ['Verified', 'Verified'], ['Rejected', 'Rejected'], ['safety', `Safety${openSafety ? ` (${openSafety} open)` : ''}`], ['disputes', 'Disputes'], ['jobs', 'Jobs']];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Temporary Workforce</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Worker verification, reliability reviews and payment disputes</p>
      </div>
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${tab === k ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>{l}</button>)}
      </div>

      {['Pending', 'review', 'Verified', 'Rejected'].includes(tab) && (!workers ? <p className="text-xs text-slate-400">Loading...</p> : workers.length === 0 ? <p className="text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 text-center">Nobody here.</p> : (
        <div className="grid lg:grid-cols-2 gap-3">
          {workers.map(w => (
            <div key={w._id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">{w.name} <span className="text-xs font-semibold text-slate-400">· {w.age} yrs</span></p>
                  <p className="text-[11px] text-slate-500">{w.phone} · {w.city} {w.pincode} · joined {fmt(w.createdAt)}</p>
                  <p className="text-[11px] text-slate-500">{w.skills.map(s => `${s.category} (${s.level})`).join(', ')}</p>
                  <p className="text-[11px] text-slate-500">Done {w.stats.completed} · no-shows {w.stats.noShows} · missed offers {w.stats.missed}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TONE[w.verification.status]}`}>{w.verification.status}</span>
              </div>
              {w.verification.documentType && <p className="text-[11px] text-slate-600">{w.verification.method || 'Manual'} · {w.verification.documentType}{w.verification.verifiedName ? ` · name on ID: ${w.verification.verifiedName}` : ''}</p>}
              {w.verification.rejectionReason && <p className="text-[11px] text-rose-600">{w.verification.rejectionReason}</p>}
              {w.hasIdPhoto && (viewId === w._id ? (
                <PrivateImage src={`/admin/workforce/workers/${w._id}/id-photo`} token={token} alt="ID" className="w-full max-h-80 object-contain rounded-xl bg-slate-50" />
              ) : <button onClick={() => setViewId(w._id)} className="text-xs font-bold text-indigo-600 cursor-pointer">View ID photo</button>)}
              <div className="flex flex-wrap gap-2 pt-1">
                {['Pending', 'Rejected', 'Unverified'].includes(w.verification.status) && <button onClick={() => verify(w, true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer">Approve ID</button>}
                {w.verification.status === 'Pending' && <button onClick={() => verify(w, false)} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold cursor-pointer">Reject</button>}
                {w.underReview && <button onClick={() => review(w, true)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer">Resume offers</button>}
                {w.underReview && <button onClick={() => review(w, false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold cursor-pointer">Keep paused</button>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'disputes' && (!overview ? <p className="text-xs text-slate-400">Loading...</p> : overview.disputes.length === 0 ? <p className="text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 text-center">No open disputes.</p> : (
        <div className="space-y-2">
          {overview.disputes.map(a => (
            <div key={a._id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{a.workerId?.name} vs {a.jobId?.posterName} ({a.jobId?.posterType})</p>
                <p className="text-[11px] text-slate-500">{a.jobId?.title} · {fmt(a.jobId?.date)} · payable ₹{(a.totalPayable || a.agreedPay).toLocaleString('en-IN')}{a.payment?.receiptNumber ? ` · poster recorded ${a.payment.method} ${a.payment.receiptNumber}` : ' · no payment recorded'}</p>
                <p className="text-xs text-rose-700 mt-1">"{a.dispute.reason}"</p>
              </div>
              <button onClick={() => resolve(a)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer">Resolve</button>
            </div>
          ))}
        </div>
      ))}

      {tab === 'safety' && (!safety ? <p className="text-xs text-slate-400">Loading...</p> : safety.length === 0 ? <p className="text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 text-center">No safety reports.</p> : (
        <div className="space-y-2">
          {safety.map(s => (
            <div key={s._id} className={`rounded-2xl border p-4 flex flex-wrap items-start justify-between gap-3 ${s.status === 'Open' ? (s.kind === 'Emergency' ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-200') : 'bg-white border-slate-200'}`}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{s.kind} · {s.status}</p>
                <p className="text-[11px] text-slate-600">
                  {s.reportedBy}: {s.reporterName}{s.reporterPhone ? <> · <a href={`tel:${s.reporterPhone}`} className="text-violet-700 font-semibold">{s.reporterPhone}</a></> : ''} · {new Date(s.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="text-[11px] text-slate-500">{s.jobId?.title} · {fmt(s.jobId?.date)} {s.jobId?.startTime}–{s.jobId?.endTime} · {s.jobId?.exactAddress || [s.jobId?.area, s.jobId?.city].filter(Boolean).join(', ')}</p>
                {s.details && <p className="text-xs text-slate-800 mt-1">"{s.details}"</p>}
                {s.location?.lat && <a className="text-[11px] text-violet-700 font-semibold" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${s.location.lat},${s.location.lng}`}>Open shared location</a>}
                {s.actionTaken && <p className="text-[11px] text-emerald-700 mt-1">Action: {s.actionTaken}</p>}
                {s.kind === 'Emergency' && s.status === 'Open' && <p className="text-[11px] font-bold text-rose-700 mt-1">Call the reporter now. If they cannot be reached, call 112 with the job address.</p>}
              </div>
              <div className="flex gap-2">
                {s.status === 'Open' && <button onClick={() => updateSafety(s, 'Acknowledged')} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer">Acknowledge</button>}
                {s.status !== 'Resolved' && <button onClick={() => updateSafety(s, 'Resolved')} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold cursor-pointer">Close</button>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'jobs' && overview && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {overview.last30Days.map(s => <div key={s._id} className="bg-white rounded-xl border border-slate-200 px-4 py-2"><p className="text-[10px] font-black uppercase text-slate-400">{s._id}</p><p className="text-sm font-black">{s.n} jobs · {s.filled}/{s.positions} filled</p></div>)}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 text-left"><tr>{['Job', 'Poster', 'Date', 'City', 'Filled', 'Pay', 'Status'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
              <tbody>
                {overview.recentJobs.map(j => (
                  <tr key={j._id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold">{j.title}<span className="block text-[10px] text-slate-400">{j.category}</span></td>
                    <td className="px-3">{j.posterName} <span className="text-slate-400">({j.posterType})</span></td>
                    <td className="px-3">{fmt(j.date)}</td><td className="px-3">{j.city}</td>
                    <td className="px-3">{j.filled}/{j.positions}</td><td className="px-3">₹{j.payPerPerson}</td><td className="px-3">{j.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkforce;
