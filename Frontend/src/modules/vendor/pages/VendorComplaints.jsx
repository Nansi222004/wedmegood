import { useCallback, useEffect, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';
import { toast } from '../../../components/ui/Toast';

const TONE = {
  Pending: 'bg-amber-50 text-amber-800', 'In-Review': 'bg-sky-50 text-sky-700', Resolved: 'bg-slate-100 text-slate-700',
  Dismissed: 'bg-emerald-50 text-emerald-700', Appealed: 'bg-violet-50 text-violet-700'
};
const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');
const input = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] focus:bg-white focus:border-violet-300 outline-none';

/** Complaints customers filed about this vendor: give your side, see the decision, appeal it */
const VendorComplaints = () => {
  const token = localStorage.getItem('vendorToken');
  const [list, setList] = useState(null);
  const [replying, setReplying] = useState(null);
  const [statement, setStatement] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => vendorApi.getComplaints(token).then(r => setList(r.success ? r.data : [])).catch(() => setList([])), [token]);
  useEffect(() => { load(); }, [load]);
  // Reports this vendor made about customers' behaviour
  const [myReports, setMyReports] = useState([]);
  useEffect(() => { vendorApi.getCustomerReports(token).then(r => setMyReports(r.success ? r.data : [])).catch(() => {}); }, [token]);

  const upload = async (files) => {
    const file = files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/upload/single`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data?.data?.url) setEvidence(e => [...e, { type: 'image', url: data.data.url }]);
    } catch {
      toast.error('Upload failed');
    }
  };

  const send = async () => {
    setBusy(true);
    const r = await vendorApi.respondComplaint(replying._id, { statement, evidence }, token);
    setBusy(false);
    if (r.success) { toast.success(r.message); setReplying(null); setStatement(''); setEvidence([]); load(); } else toast.error(r.message);
  };

  const appeal = async (c) => {
    const reason = window.prompt('Why should the decision be reviewed again? (you can appeal once)');
    if (!reason) return;
    const r = await vendorApi.appealComplaint(c._id, reason, token);
    if (r.success) { toast.success(r.message); load(); } else toast.error(r.message);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="h-9 w-9 rounded-xl bg-[#7c3aed] flex items-center justify-center text-white shadow-md"><Icon name="shield" size="sm" color="white" /></div>
        <div>
          <h1 className="text-[18px] font-medium text-slate-900 tracking-tight leading-tight">Complaints</h1>
          <p className="text-[11px] font-medium text-slate-400">A complaint is not a finding against you. Give your side; the Utsavo team decides after hearing both.</p>
        </div>
      </div>

      {!list ? <p className="text-[12px] text-slate-400">Loading...</p> : list.length === 0 ? (
        <p className="text-[12px] text-slate-400 text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">No complaints. Keep it that way.</p>
      ) : list.map(c => (
        <div key={c._id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">{c.category} · from {c.customerName}</p>
              <p className="text-[11px] text-slate-500">{fmt(c.createdAt)}{c.booking ? ` · booking on ${new Date(c.booking.eventDate).toLocaleDateString('en-IN')}` : ''}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TONE[c.status]}`}>{c.status === 'Resolved' ? 'Upheld' : c.status === 'Dismissed' ? 'Dismissed' : c.status}</span>
          </div>
          <p className="text-[12px] text-slate-700 whitespace-pre-line">{c.description}</p>
          {c.evidence?.length > 0 && <div className="flex gap-2">{c.evidence.map((e, i) => <a key={i} href={e.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-700 underline">Customer evidence {i + 1}</a>)}</div>}

          {c.vendorResponse?.respondedAt ? (
            <div className="p-2.5 rounded-lg bg-violet-50/60 text-[12px]">
              <p className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Your response · {fmt(c.vendorResponse.respondedAt)}</p>
              <p className="text-slate-700 whitespace-pre-line">{c.vendorResponse.statement}</p>
            </div>
          ) : ['Pending', 'In-Review', 'Appealed'].includes(c.status) && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setReplying(c); setStatement(''); setEvidence([]); }} className="px-3 py-2 rounded-lg bg-[#7c3aed] text-white text-[12px] font-semibold cursor-pointer">Give your side</button>
              {c.respondBy && <span className={`text-[11px] ${new Date(c.respondBy) < new Date() ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>Reply by {fmt(c.respondBy)}</span>}
            </div>
          )}

          {c.outcome && <p className="text-[12px] p-2.5 rounded-lg bg-slate-50 text-slate-800"><span className="font-semibold">Decision:</span> {c.outcome}</p>}
          {c.appeal && <p className="text-[11px] text-slate-600">Appeal by {c.appeal.by === 'Vendor' ? 'you' : 'the customer'}{c.appeal.decision ? `: ${c.appeal.decision.toLowerCase()} · ${c.appeal.decisionNote}` : ' · under review'}</p>}
          {c.canAppeal && <button onClick={() => appeal(c)} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-[12px] font-semibold cursor-pointer">Appeal the decision</button>}
        </div>
      ))}

      <div className="pt-2 space-y-2">
        <h2 className="text-[13px] font-semibold text-slate-800">Your reports about customers</h2>
        <p className="text-[11px] text-slate-500">Report a customer from the lead or booking (Customer behaviour). Confirmed reports are shown to other vendors without your name.</p>
        {myReports.length === 0 ? <p className="text-[11px] text-slate-400">No reports yet.</p> : myReports.map(r => (
          <div key={r._id} className="p-3 rounded-xl border border-slate-100 bg-white text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">{r.customerName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : r.status === 'Rejected' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span>
            </div>
            {r.issues?.length > 0 && <p className="text-[11px] text-slate-600 mt-0.5">{r.issues.join(' · ')}</p>}
            <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
            {r.adminNote && <p className="text-[11px] text-slate-700 mt-1"><b>Utsavo team:</b> {r.adminNote}</p>}
          </div>
        ))}
      </div>

      {replying && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setReplying(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-slate-900">Your side of the {replying.category.toLowerCase()} complaint</h3>
            <textarea rows={5} className={`${input} resize-none`} value={statement} onChange={e => setStatement(e.target.value)} placeholder="What happened, from your side. Facts, dates, what was agreed." maxLength={3000} />
            <div className="flex flex-wrap items-center gap-2">
              {evidence.map((e, i) => <a key={i} href={e.url} target="_blank" rel="noreferrer" className="text-[11px] text-violet-700 underline">Evidence {i + 1}</a>)}
              <label className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-[11px] font-semibold text-slate-600 cursor-pointer">
                + Photo / screenshot<input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files)} />
              </label>
            </div>
            <p className="text-[10px] text-slate-400">Only the Utsavo team sees your response.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setReplying(null)} className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold cursor-pointer">Cancel</button>
              <button onClick={send} disabled={busy || statement.trim().length < 10} className="px-3 py-2 rounded-lg bg-[#7c3aed] text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorComplaints;
