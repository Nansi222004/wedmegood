import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '../../components/ui/Toast';
import { JobMessages, SafetyReportForm } from './JobSupport';

/*
 * Post and manage temporary-worker jobs. Shared by vendors (event jobs) and customers (home jobs);
 * `api` provides jobs/job/createJob/updateJob/cancelJob/jobAction for the poster's side.
 */

const inputClass = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-medium focus:border-violet-300 outline-none';
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '');
const STATUS_TONE = { Open: 'bg-sky-50 text-sky-700', Filled: 'bg-emerald-50 text-emerald-700', Unfilled: 'bg-amber-50 text-amber-800', Cancelled: 'bg-slate-100 text-slate-500', Completed: 'bg-emerald-600 text-white' };
const A_TONE = { Confirmed: 'bg-sky-50 text-sky-700', CheckedIn: 'bg-violet-50 text-violet-700', CheckedOut: 'bg-amber-50 text-amber-800', Approved: 'bg-emerald-50 text-emerald-700', Paid: 'bg-emerald-600 text-white', Disputed: 'bg-rose-50 text-rose-700', NoShow: 'bg-rose-50 text-rose-700', Cancelled: 'bg-slate-100 text-slate-500' };

const Pill = ({ className, children }) => <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>{children}</span>;
const Btn = ({ variant = 'primary', className = '', ...p }) => (
  <button {...p} className={`px-3 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-50 cursor-pointer ${variant === 'primary' ? 'bg-[#7c3aed] text-white' : variant === 'success' ? 'bg-emerald-600 text-white' : variant === 'danger' ? 'border border-rose-200 text-rose-600 bg-white' : 'border border-slate-200 text-slate-700 bg-white'} ${className}`} />
);
const Label = ({ label, children, hint }) => (
  <label className="block space-y-1">
    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
  </label>
);
const Modal = ({ title, onClose, children }) => createPortal(
  <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-4" onClick={onClose}>
    <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 cursor-pointer" aria-label="Close">✕</button>
      </div>
      {children}
    </div>
  </div>,
  document.body
);

const PostJob = ({ api, mode, skills, levels, events, initialEventId, onClose, onPosted }) => {
  const isCustomer = mode === 'Customer';
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    title: '', category: skills[0] || '', skillLevel: 'Fresher', positions: 1, date: '', startTime: '10:00', endTime: '18:00',
    breakMinutes: 30, duties: '', dressCode: '', equipment: '', payPerPerson: '', overtimeRatePerHour: '', foodProvided: '',
    travelAllowance: 0, paymentTerms: 'Same day', cancellationRules: '', pincode: '', area: '', exactAddress: '',
    searchRadiusKm: 15, urgency: 'Normal', eventId: initialEventId || '',
    driver: { vehicleRequired: false, vehicleType: '', licenceRequired: true, tripDetails: '' }
  });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const budget = (Number(f.positions) || 0) * ((Number(f.payPerPerson) || 0) + (Number(f.travelAllowance) || 0));

  const submit = async () => {
    if (f.foodProvided === '') { toast.warning('Say whether food is provided'); return; }
    if (!window.confirm(`Total budget ${money(budget)} (${f.positions} × ${money(Number(f.payPerPerson) + Number(f.travelAllowance || 0))}). Workers see the pay before accepting and it cannot be lowered later. Post the job?`)) return;
    setBusy(true);
    try {
      const res = await api.createJob({ ...f, foodProvided: f.foodProvided === 'yes', budgetConfirmed: true, positions: Number(f.positions), payPerPerson: Number(f.payPerPerson), overtimeRatePerHour: Number(f.overtimeRatePerHour) || 0, travelAllowance: Number(f.travelAllowance) || 0, eventId: f.eventId || undefined });
      toast.success(res.message);
      onPosted(res.data);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isCustomer ? 'Get help at home' : 'Hire temporary workers'} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Label label="Kind of work"><select className={inputClass} value={f.category} onChange={e => set('category', e.target.value)}>{skills.map(s => <option key={s}>{s}</option>)}</select></Label>
          <Label label="Skill level"><select className={inputClass} value={f.skillLevel} onChange={e => set('skillLevel', e.target.value)}>{levels.map(l => <option key={l}>{l}</option>)}</select></Label>
        </div>
        <Label label="Job title"><input className={inputClass} value={f.title} onChange={e => set('title', e.target.value)} placeholder={isCustomer ? 'e.g. Wedding home cleaning' : 'e.g. Buffet service for 400 guests'} /></Label>
        {!isCustomer && events?.length > 0 && (
          <Label label="For event" hint="Confirmed shifts are recorded as labour cost on the event">
            <select className={inputClass} value={f.eventId} onChange={e => set('eventId', e.target.value)}>
              <option value="">Not linked to an event</option>
              {events.map(e => <option key={e._id} value={e._id}>{e.title} ({fmtDate(e.eventDate)})</option>)}
            </select>
          </Label>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Label label="Date"><input type="date" className={inputClass} value={f.date} min={new Date().toISOString().slice(0, 10)} onChange={e => set('date', e.target.value)} /></Label>
          <Label label="Start"><input type="time" className={inputClass} value={f.startTime} onChange={e => set('startTime', e.target.value)} /></Label>
          <Label label="End"><input type="time" className={inputClass} value={f.endTime} onChange={e => set('endTime', e.target.value)} /></Label>
          <Label label="People needed"><input type="number" min="1" max="100" className={inputClass} value={f.positions} onChange={e => set('positions', e.target.value)} /></Label>
          <Label label="Breaks (min)"><input type="number" min="0" className={inputClass} value={f.breakMinutes} onChange={e => set('breakMinutes', e.target.value)} /></Label>
          <Label label="Urgency"><select className={inputClass} value={f.urgency} onChange={e => set('urgency', e.target.value)}><option>Normal</option><option>Urgent</option></select></Label>
        </div>
        <Label label="Exact duties"><textarea rows={3} className={`${inputClass} resize-none`} value={f.duties} onChange={e => set('duties', e.target.value)} placeholder="What exactly will they do?" /></Label>
        <div className="grid grid-cols-2 gap-2">
          <Label label="Dress code"><input className={inputClass} value={f.dressCode} onChange={e => set('dressCode', e.target.value)} placeholder="Black shirt, black trousers" /></Label>
          <Label label="Equipment to bring"><input className={inputClass} value={f.equipment} onChange={e => set('equipment', e.target.value)} /></Label>
        </div>
        {f.category === 'Driver' && (
          <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50">
            <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={f.driver.vehicleRequired} onChange={e => set('driver', { ...f.driver, vehicleRequired: e.target.checked })} /> Driver brings a vehicle</label>
            <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={f.driver.licenceRequired} onChange={e => set('driver', { ...f.driver, licenceRequired: e.target.checked })} /> Licence required</label>
            <Label label="Vehicle type"><input className={inputClass} value={f.driver.vehicleType} onChange={e => set('driver', { ...f.driver, vehicleType: e.target.value })} /></Label>
            <Label label="Trips"><input className={inputClass} value={f.driver.tripDetails} onChange={e => set('driver', { ...f.driver, tripDetails: e.target.value })} /></Label>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Label label="Pay per person (₹)"><input type="number" min="100" className={inputClass} value={f.payPerPerson} onChange={e => set('payPerPerson', e.target.value)} /></Label>
          <Label label="Overtime ₹/hour" hint="Only paid when you approve it"><input type="number" min="0" className={inputClass} value={f.overtimeRatePerHour} onChange={e => set('overtimeRatePerHour', e.target.value)} /></Label>
          <Label label="Travel allowance (₹)"><input type="number" min="0" className={inputClass} value={f.travelAllowance} onChange={e => set('travelAllowance', e.target.value)} /></Label>
          <Label label="Food"><select className={inputClass} value={f.foodProvided} onChange={e => set('foodProvided', e.target.value)}><option value="">Choose</option><option value="yes">Food provided</option><option value="no">Not provided</option></select></Label>
          <Label label="Paid"><select className={inputClass} value={f.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>{['Same day', 'Within 3 days', 'Within 7 days'].map(p => <option key={p}>{p}</option>)}</select></Label>
          <Label label="Search within (km)"><input type="number" min="1" max="200" className={inputClass} value={f.searchRadiusKm} onChange={e => set('searchRadiusKm', e.target.value)} /></Label>
        </div>
        <Label label="Cancellation rules"><input className={inputClass} value={f.cancellationRules} onChange={e => set('cancellationRules', e.target.value)} placeholder="e.g. Cancelled less than 24 h before: half pay" /></Label>
        <div className="grid grid-cols-3 gap-2">
          <Label label="PIN code"><input inputMode="numeric" maxLength={6} className={inputClass} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} /></Label>
          <Label label="Area (shown in the offer)"><input className={`${inputClass}`} value={f.area} onChange={e => set('area', e.target.value)} /></Label>
          <Label label={isCustomer ? 'Full address *' : 'Exact address'} hint="Only workers who accept see it"><input className={inputClass} value={f.exactAddress} onChange={e => set('exactAddress', e.target.value)} /></Label>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <p className="text-[12px] text-slate-700">Total budget <span className="font-bold">{money(budget)}</span></p>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn disabled={busy || !f.title || !f.date || !f.payPerPerson || f.pincode.length !== 6} onClick={submit}>{busy ? 'Posting...' : 'Post job'}</Btn>
          </div>
        </div>
        <p className="text-[10px] text-slate-400">Verified workers with this skill near the location are offered the job one at a time, the one offered least recently first. Workers must be 18 or older and ID-verified.</p>
      </div>
    </Modal>
  );
};

const JobDetail = ({ api, jobId, onClose, onChanged }) => {
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [chatWith, setChatWith] = useState(null);
  const [reporting, setReporting] = useState(false);
  // Vendor ops api and customer api name these differently
  const loadMessages = useCallback((aid) => (api.jobMessages || api.messages)(jobId, aid), [api, jobId]);
  const sendMessage = useCallback((aid, text) => (api.sendJobMessage || api.sendMessage)(jobId, aid, text), [api, jobId]);
  const load = useCallback(() => api.job(jobId).then(r => setJob(r.data)).catch(err => toast.error(err.message)), [api, jobId]);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const act = async (fn, msg) => {
    setBusy(true);
    try { const r = await fn(); toast.success(msg || r.message || 'Done'); await load(); onChanged(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  if (!job) return <Modal title="Job" onClose={onClose}><p className="text-[12px] text-slate-400">Loading...</p></Modal>;
  const open = ['Open', 'Unfilled', 'Filled'].includes(job.status);

  return (
    <Modal title={job.title} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
          <Pill className={STATUS_TONE[job.status]}>{job.status}</Pill>
          <span>{job.category} · {fmtDate(job.date)} {job.startTime}–{job.endTime} · {job.filled}/{job.positions} filled · {money(job.payPerPerson)} each</span>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-[12px] text-violet-900">
          Check-in code for the venue: <span className="font-mono text-[18px] font-bold tracking-widest">{job.checkInCode}</span>
          <span className="block text-[10px] text-violet-700">Show it to workers when they arrive, or mark them present below.</span>
        </div>
        {job.status === 'Unfilled' && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-900 space-y-2">
            <p>No more eligible workers nearby. Widen the area or raise the pay; workers who said no before will be asked again.</p>
            <div className="flex gap-2">
              <Btn variant="ghost" disabled={busy} onClick={() => { const r = window.prompt('Search within (km)', String(job.searchRadiusKm * 2)); if (r) act(() => api.updateJob(job._id, { searchRadiusKm: Number(r) }), 'Searching wider'); }}>Widen area</Btn>
              <Btn variant="ghost" disabled={busy} onClick={() => { const r = window.prompt('New pay per person (₹)', String(Math.round(job.payPerPerson * 1.2))); if (r) act(() => api.updateJob(job._id, { payPerPerson: Number(r) }), 'Pay raised'); }}>Raise pay</Btn>
            </div>
          </div>
        )}
        {job.currentOffer && <p className="text-[11px] text-sky-700">Offer out to a worker until {new Date(job.currentOffer.expiresAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}…</p>}
        <div className="space-y-2">
          {job.assignments.length === 0 ? <p className="text-[12px] text-slate-400">No worker confirmed yet.</p> : job.assignments.map(a => (
            <div key={a._id} className="p-3 rounded-xl border border-slate-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{a.worker?.name} {a.worker?.verified && <span className="text-[10px] text-emerald-700">✓ ID verified</span>}</p>
                  <p className="text-[11px] text-slate-500">
                    {a.worker?.phone ? `${a.worker.phone} · ` : ''}{a.worker?.completed || 0} jobs done{a.worker?.rating ? ` · ★ ${a.worker.rating}` : ''}
                    {a.checkInAt ? ` · in ${new Date(a.checkInAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}
                    {a.checkOutAt ? ` · out ${new Date(a.checkOutAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}
                  </p>
                  {a.totalPayable > 0 && <p className="text-[11px] text-slate-700">Payable {money(a.totalPayable)}{a.overtimeHours ? ` (incl. ${a.overtimeHours}h overtime)` : ''}{a.payment?.receiptNumber ? ` · receipt ${a.payment.receiptNumber}` : ''}</p>}
                  {a.dispute?.reason && <p className="text-[11px] text-rose-700">Worker reported: {a.dispute.reason}{a.dispute.resolution ? ` · ${a.dispute.resolution}` : ''}</p>}
                </div>
                <Pill className={A_TONE[a.status]}>{a.status === 'NoShow' ? 'No-show' : a.status}</Pill>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {a.status === 'Confirmed' && <Btn variant="ghost" disabled={busy} onClick={() => act(() => api.jobAction(job._id, a._id, 'checkin'), 'Marked present')}>Mark present</Btn>}
                {a.status === 'Confirmed' && <Btn variant="danger" disabled={busy} onClick={() => window.confirm('Mark as no-show? A replacement will be searched.') && act(() => api.jobAction(job._id, a._id, 'noshow'))}>No-show</Btn>}
                {['CheckedIn', 'CheckedOut'].includes(a.status) && (
                  <Btn variant="success" disabled={busy} onClick={() => {
                    const ot = job.overtimeRatePerHour ? window.prompt(`Approved overtime hours (₹${job.overtimeRatePerHour}/h). 0 if none.`, '0') : '0';
                    if (ot !== null) act(() => api.jobAction(job._id, a._id, 'approve', { overtimeHours: Number(ot) || 0 }), 'Shift confirmed');
                  }}>Confirm shift</Btn>
                )}
                {['Approved', 'Disputed'].includes(a.status) && (
                  <Btn disabled={busy} onClick={() => {
                    const method = window.prompt('Paid by (Cash / UPI / Bank transfer)', 'UPI');
                    if (!method) return;
                    const reference = window.prompt('Transaction reference (optional)') || '';
                    act(() => api.jobAction(job._id, a._id, 'pay', { method, reference }), 'Payment recorded');
                  }}>Record payment</Btn>
                )}
                {!['Cancelled', 'NoShow'].includes(a.status) && (
                  <Btn variant="ghost" onClick={() => setChatWith(chatWith === a._id ? null : a._id)}>{chatWith === a._id ? 'Hide messages' : 'Message'}</Btn>
                )}
                {['Approved', 'Paid'].includes(a.status) && !a.rating && (
                  <Btn variant="ghost" disabled={busy} onClick={() => { const r = window.prompt('Rate the worker 1-5'); if (r) act(() => api.jobAction(job._id, a._id, 'rate', { rating: Number(r) }), 'Thanks for rating'); }}>Rate</Btn>
                )}
              </div>
              {chatWith === a._id && (
                <div className="mt-2">
                  <JobMessages me="Poster" load={() => loadMessages(a._id)} send={(text) => sendMessage(a._id, text)} />
                </div>
              )}
            </div>
          ))}
        </div>
        {reporting ? (
          <div className="p-3 rounded-xl border border-rose-200">
            <SafetyReportForm submit={(body) => (api.reportJobSafety || api.reportSafety)(job._id, body)} onClose={() => setReporting(false)} />
          </div>
        ) : (
          <button onClick={() => setReporting(true)} className="text-[12px] font-semibold text-rose-600 cursor-pointer">Safety problem or emergency? Get help</button>
        )}
        {open && (
          <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" disabled={busy} onClick={() => { const n = window.prompt('Total people needed', String(job.positions + 1)); if (n) act(() => api.updateJob(job._id, { positions: Number(n) }), 'Updated'); }}>Change number of people</Btn>
            <Btn variant="danger" disabled={busy} onClick={() => { const r = window.prompt('Why cancel? Confirmed workers are told.'); if (r !== null) act(() => api.cancelJob(job._id, { reason: r }), 'Job cancelled'); }}>Cancel job</Btn>
          </div>
        )}
      </div>
    </Modal>
  );
};

const JobsBoard = ({ api, mode = 'Vendor', events = [], initialEventId = '' }) => {
  const [jobs, setJobs] = useState(null);
  const [meta, setMeta] = useState({ skills: [], levels: [] });
  const [posting, setPosting] = useState(Boolean(initialEventId));
  const [openJob, setOpenJob] = useState(null);
  const load = useCallback(() => api.jobs().then(r => { setJobs(r.data); setMeta({ skills: r.skills, levels: r.levels }); }).catch(err => { toast.error(err.message); setJobs([]); }), [api]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Btn onClick={() => setPosting(true)} disabled={!meta.skills.length}>+ Post a job</Btn></div>
      {!jobs ? <p className="text-[12px] text-slate-400">Loading...</p> : jobs.length === 0 ? (
        <p className="text-[12px] text-slate-400 text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">No jobs posted yet.</p>
      ) : (
        <div className="space-y-2">
          {jobs.map(j => (
            <button key={j._id} onClick={() => setOpenJob(j._id)} className="w-full text-left p-3 rounded-xl bg-white border border-slate-100 hover:border-violet-200 cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{j.title}</p>
                  <p className="text-[11px] text-slate-500">{j.category} · {fmtDate(j.date)} {j.startTime}–{j.endTime} · {j.city} · {money(j.payPerPerson)}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {j.filled}/{j.positions} confirmed{j.checkedIn ? ` · ${j.checkedIn} at work` : ''}
                    {j.toApprove ? <span className="text-amber-700 font-semibold"> · {j.toApprove} shift(s) to confirm</span> : ''}
                    {j.disputes ? <span className="text-rose-700 font-semibold"> · {j.disputes} problem(s) reported</span> : ''}
                  </p>
                </div>
                <Pill className={STATUS_TONE[j.status]}>{j.status}</Pill>
              </div>
            </button>
          ))}
        </div>
      )}
      {posting && meta.skills.length > 0 && <PostJob api={api} mode={mode} skills={meta.skills} levels={meta.levels} events={events} initialEventId={initialEventId} onClose={() => setPosting(false)} onPosted={(job) => { load(); setOpenJob(job._id); }} />}
      {openJob && <JobDetail api={api} jobId={openJob} onClose={() => setOpenJob(null)} onChanged={load} />}
    </div>
  );
};

export default JobsBoard;
