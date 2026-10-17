import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { toast } from '../../components/ui/Toast';
import LoginRequired from '../../components/common/LoginRequired';
import { useAuth } from '../../contexts/AuthContext';
import userApi, { getAuthToken } from '../../services/userApi';
import socketService from '../../services/socket';
import { workerApi } from './workApi';
import { JobMessages, SafetyReportForm } from './JobSupport';

const HEADING = { fontFamily: '"Playfair Display", Georgia, serif' };
const input = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5DC] bg-white text-sm text-[#2E1026] focus:outline-none focus:border-[#551E43]';
const label = 'block text-[11px] font-bold uppercase tracking-wider text-[#7A6876] mb-1.5';
const primary = 'px-4 py-2.5 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white text-xs font-bold disabled:opacity-50 cursor-pointer';
const ghost = 'px-4 py-2.5 rounded-xl border border-[#E5D5DC] bg-white text-[#401332] text-xs font-bold disabled:opacity-50 cursor-pointer';
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '');

const Section = ({ title, children, action }) => (
  <section className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-bold text-[#401332]" style={HEADING}>{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

/** Register / edit the worker profile */
const ProfileForm = ({ options, profile, user, onSaved, onCancel }) => {
  const [f, setF] = useState(() => ({
    name: profile?.name || user?.name || '',
    dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : '',
    gender: profile?.gender || 'Prefer not to say',
    pincode: profile?.pincode || '',
    city: profile?.city || user?.city || '',
    travelRadiusKm: profile?.travelRadiusKm || 15,
    skills: profile?.skills?.length ? profile.skills.map(s => ({ category: s.category, level: s.level, years: s.years })) : [],
    languages: (profile?.languages || []).join(', '),
    about: profile?.about || '',
    hasVehicle: profile?.hasVehicle || false,
    vehicleType: profile?.vehicleType || '',
    drivingLicence: profile?.drivingLicence || false
  }));
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const toggleSkill = (category) => set('skills', f.skills.some(s => s.category === category) ? f.skills.filter(s => s.category !== category) : [...f.skills, { category, level: 'Fresher', years: 0 }]);
  const save = async () => {
    setBusy(true);
    try {
      const res = await workerApi.saveMe({ ...f, languages: f.languages.split(',').map(s => s.trim()).filter(Boolean) });
      toast.success(res.message || 'Profile saved');
      onSaved(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title={profile ? 'Edit your work profile' : 'Find event work near you'}>
      {!profile && <p className="text-xs text-[#5C4A57]">Catering helpers, decorators, technicians, drivers, ushers and more get short, paid jobs from event vendors and families. You must be 18 or older and verify your ID.</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><span className={label}>Full name (as on your ID)</span><input className={input} value={f.name} onChange={e => set('name', e.target.value)} /></div>
        <div><span className={label}>Date of birth</span><input type="date" className={input} value={f.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
        <div><span className={label}>Gender</span><select className={input} value={f.gender} onChange={e => set('gender', e.target.value)}>{['Female', 'Male', 'Other', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}</select></div>
        <div><span className={label}>Home PIN code</span><input inputMode="numeric" maxLength={6} className={input} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} /></div>
        <div><span className={label}>Travel up to (km)</span><input type="number" min="1" max="200" className={input} value={f.travelRadiusKm} onChange={e => set('travelRadiusKm', e.target.value)} /></div>
      </div>
      <div>
        <span className={label}>Work you can do</span>
        <div className="flex flex-wrap gap-1.5">
          {options.skills.map(s => {
            const on = f.skills.some(x => x.category === s);
            return <button type="button" key={s} onClick={() => toggleSkill(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${on ? 'bg-[#FFF5F6] text-[#551E43] border-[#551E43]' : 'bg-white text-[#5C4A57] border-[#E5D5DC]'}`}>{on ? '✓ ' : ''}{s}</button>;
          })}
        </div>
        {f.skills.map(s => (
          <div key={s.category} className="grid grid-cols-3 gap-2 mt-2 items-center">
            <span className="text-xs font-semibold text-[#401332]">{s.category}</span>
            <select className={input} value={s.level} onChange={e => set('skills', f.skills.map(x => (x.category === s.category ? { ...x, level: e.target.value } : x)))}>{options.levels.map(l => <option key={l}>{l}</option>)}</select>
            <input type="number" min="0" className={input} placeholder="Years" value={s.years} onChange={e => set('skills', f.skills.map(x => (x.category === s.category ? { ...x, years: e.target.value } : x)))} />
          </div>
        ))}
      </div>
      <div><span className={label}>Languages</span><input className={input} value={f.languages} onChange={e => set('languages', e.target.value)} placeholder="Telugu, Hindi, English" /></div>
      <div><span className={label}>About you</span><textarea rows={2} className={`${input} resize-none`} value={f.about} onChange={e => set('about', e.target.value)} maxLength={500} /></div>
      <div className="flex flex-wrap gap-4 text-xs text-[#5C4A57]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.hasVehicle} onChange={e => set('hasVehicle', e.target.checked)} /> I have a vehicle</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.drivingLicence} onChange={e => set('drivingLicence', e.target.checked)} /> I have a driving licence</label>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <button className={ghost} onClick={onCancel}>Cancel</button>}
        <button className={primary} disabled={busy || !f.name || !f.dateOfBirth || f.pincode.length !== 6 || f.skills.length === 0} onClick={save}>{busy ? 'Saving...' : profile ? 'Save' : 'Create my work profile'}</button>
      </div>
    </Section>
  );
};

const Verification = ({ profile, options, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState('Aadhaar');
  const v = profile.verification;
  const digilocker = async () => {
    setBusy(true);
    try {
      const res = await workerApi.startDigilocker();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };
  const uploadId = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      // Stored privately: only the Utsavo verification team can open it
      const up = await userApi.uploadReferencePhotos([files[0]]);
      const res = await workerApi.submitVerification({ idPhotoId: up.data[0]._id, documentType: docType });
      toast.success(res.message);
      onChanged(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  if (v.status === 'Verified') {
    return <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5"><Icon name="verified" size="xs" /> ID verified{v.method === 'DigiLocker' ? ' with DigiLocker' : ''}{v.documentType ? ` (${v.documentType})` : ''}</p>;
  }
  return (
    <div className="space-y-2">
      {v.status === 'Pending' && <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2.5">Your ID is being checked by the Utsavo team. You will get job offers once it is verified.</p>}
      {v.status === 'Rejected' && <p className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2.5">Verification failed: {v.rejectionReason}</p>}
      {v.status !== 'Pending' && (
        <>
          <p className="text-xs text-[#5C4A57]">Verify your identity before you can receive jobs.</p>
          {options.digilocker && <button className={`${primary} w-full`} disabled={busy} onClick={digilocker}>Verify instantly with DigiLocker</button>}
          <div className="flex gap-2">
            <select className={input} value={docType} onChange={e => setDocType(e.target.value)}>{['Aadhaar', 'PAN', 'Voter ID', 'Driving licence', 'Passport'].map(d => <option key={d}>{d}</option>)}</select>
            <label className={`${ghost} whitespace-nowrap flex items-center`}>
              {busy ? 'Uploading...' : 'Upload ID photo'}
              <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={e => uploadId(e.target.files)} />
            </label>
          </div>
          <p className="text-[10px] text-[#8A7987]">Your ID photo is stored privately and seen only by the verification team.</p>
        </>
      )}
    </div>
  );
};

const Availability = ({ profile, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [newDate, setNewDate] = useState('');
  const save = async (body) => {
    setBusy(true);
    try { onChanged((await workerApi.setAvailability(body)).data); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-[#2E1026]">{profile.available ? 'Taking job offers' : 'Not taking offers'}</span>
        <input type="checkbox" className="w-5 h-5 accent-[#551E43]" checked={profile.available} disabled={busy} onChange={e => save({ available: e.target.checked })} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div><span className={label}>Quiet hours from</span><input type="time" className={input} defaultValue={profile.quietHours?.start} onBlur={e => save({ quietHours: { start: e.target.value, end: profile.quietHours?.end || '' } })} /></div>
        <div><span className={label}>to</span><input type="time" className={input} defaultValue={profile.quietHours?.end} onBlur={e => save({ quietHours: { start: profile.quietHours?.start || '', end: e.target.value } })} /></div>
      </div>
      <p className="text-[10px] text-[#8A7987]">No normal offers in quiet hours; urgent ones still come. Your phone's own settings decide whether a sound plays.</p>
      <label className="flex items-center gap-2 text-xs text-[#5C4A57]"><input type="checkbox" checked={profile.soundOn} onChange={e => save({ soundOn: e.target.checked })} /> Buzzer sound for offers in the app</label>
      <div>
        <span className={label}>Days I can't work</span>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(profile.unavailableDates || []).map(d => (
            <button key={d} onClick={() => save({ unavailableDates: profile.unavailableDates.filter(x => x !== d) })} className="px-2.5 py-1 rounded-full bg-[#FAF6F0] border border-[#EDE3D6] text-[11px] text-[#401332] cursor-pointer">{day(d)} ✕</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="date" className={input} value={newDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setNewDate(e.target.value)} />
          <button className={ghost} disabled={!newDate || busy} onClick={() => { save({ unavailableDates: [...(profile.unavailableDates || []), newDate] }); setNewDate(''); }}>Add</button>
        </div>
      </div>
    </div>
  );
};

/** Live job offers: socket push plus polling, with a countdown and an optional beep */
const Offers = ({ profile, onAccepted }) => {
  const [offers, setOffers] = useState([]);
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0);
  const [busy, setBusy] = useState(null);

  const poll = useCallback(async () => {
    try {
      const r = await workerApi.offers();
      if (r.serverTime) offset.current = new Date(r.serverTime).getTime() - Date.now();
      setOffers(r.data || []);
    } catch { /* retried */ }
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 8000);
    const socket = socketService.connect(getAuthToken());
    const onOffer = (o) => setOffers(prev => (prev.some(x => x.offerId === o.offerId) ? prev : [...prev, o]));
    socket?.on('work:offer', onOffer);
    return () => { clearInterval(t); socket?.off('work:offer', onOffer); };
  }, [poll]);

  useEffect(() => {
    if (!offers.length) return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [offers.length]);

  // A short beep while an offer waits (browsers only allow sound after the page was used)
  useEffect(() => {
    if (!offers.length || !profile.soundOn) return undefined;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return undefined;
    const ctx = new AudioCtx();
    const beep = () => {
      try {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 880; g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.26);
      } catch { /* ignore */ }
    };
    beep();
    const t = setInterval(beep, 2000);
    return () => { clearInterval(t); ctx.close().catch(() => {}); };
  }, [offers.length, profile.soundOn]);

  const act = async (o, accept) => {
    let reason = '';
    if (!accept) { reason = window.prompt('Reason (optional). Declining never counts against you.') ?? null; if (reason === null) return; }
    setBusy(o.offerId);
    try {
      const r = accept ? await workerApi.accept(o.offerId) : await workerApi.decline(o.offerId, reason);
      toast[accept ? 'success' : 'info'](r.message);
      setOffers(prev => prev.filter(x => x.offerId !== o.offerId));
      if (accept) onAccepted();
    } catch (err) {
      toast.error(err.message);
      setOffers(prev => prev.filter(x => x.offerId !== o.offerId));
    } finally {
      setBusy(null);
    }
  };

  const live = offers.filter(o => new Date(o.expiresAt).getTime() - (now + offset.current) > 0);
  if (!live.length) return null;
  return (
    <div className="space-y-3">
      {live.map(o => {
        const secs = Math.ceil((new Date(o.expiresAt).getTime() - (now + offset.current)) / 1000);
        return (
          <div key={o.offerId} className="rounded-2xl overflow-hidden border-2 border-[#551E43] shadow-lg bg-white">
            <div className={`px-4 py-3 text-white flex items-center justify-between ${o.urgency === 'Urgent' ? 'bg-rose-600' : 'bg-[#551E43]'}`}>
              <span className="text-xs font-black uppercase tracking-widest">{o.urgency === 'Urgent' ? 'Urgent job' : 'New job offer'}</span>
              <span className="text-xl font-black tabular-nums">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-lg font-bold text-[#2E1026]" style={HEADING}>{o.title}</p>
              <p className="text-xs text-[#5C4A57]">{o.category} · {o.posterName} · {day(o.date)} {o.startTime}–{o.endTime} ({o.hours} h)</p>
              <p className="text-xs text-[#5C4A57]">{o.area}{o.distanceKm != null ? ` · about ${Math.round(o.distanceKm)} km from you` : ''}</p>
              <p className="text-2xl font-bold text-[#551E43]">{money(o.pay)} <span className="text-xs font-normal text-[#7A6876]">{o.paymentTerms.toLowerCase()}{o.travelAllowance ? ` + ${money(o.travelAllowance)} travel` : ''}{o.overtimeRatePerHour ? ` · overtime ${money(o.overtimeRatePerHour)}/h if agreed` : ''}</span></p>
              <p className="text-xs text-[#2E1026] whitespace-pre-line">{o.duties}</p>
              <p className="text-[11px] text-[#7A6876]">{[o.dressCode && `Dress: ${o.dressCode}`, o.equipment && `Bring: ${o.equipment}`, o.foodProvided ? 'Food provided' : 'Food not provided', o.cancellationRules && `Cancellation: ${o.cancellationRules}`].filter(Boolean).join(' · ')}</p>
              <p className="text-[10px] text-[#8A7987]">The exact address is shared once you accept.</p>
              <div className="flex gap-2 pt-1">
                <button className={`${ghost} flex-1`} disabled={busy === o.offerId} onClick={() => act(o, false)}>Decline</button>
                <button className="flex-[2] py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 cursor-pointer" disabled={busy === o.offerId} onClick={() => act(o, true)}>Accept job</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const STATUS_LABEL = { Confirmed: 'Confirmed', CheckedIn: 'At work', CheckedOut: 'Waiting for confirmation', Approved: 'Payment due', Paid: 'Paid', Disputed: 'Problem reported', NoShow: 'Marked no-show', Cancelled: 'Cancelled' };

const JobCards = ({ cards, summary, reload }) => {
  const [busy, setBusy] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [reporting, setReporting] = useState(null);
  const act = async (id, fn, msg) => {
    setBusy(id);
    try { await fn(); toast.success(msg); reload(); } catch (err) { toast.error(err.message); } finally { setBusy(null); }
  };
  if (!cards.length) return <p className="text-xs text-[#8A7987]">No jobs yet. Offers appear above as soon as a matching job comes in.</p>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded-xl bg-[#FAF6F0]"><p className="text-[10px] uppercase font-bold text-[#8A7987]">Earned</p><p className="text-base font-bold text-[#401332]">{money(summary.earned)}</p></div>
        <div className="p-2 rounded-xl bg-[#FAF6F0]"><p className="text-[10px] uppercase font-bold text-[#8A7987]">Due to you</p><p className="text-base font-bold text-[#401332]">{money(summary.pending)}</p></div>
      </div>
      {cards.map(c => (
        <div key={c._id} className="p-3 rounded-xl border border-[#F2E5EC]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[#2E1026]">{c.job?.title}</p>
              <p className="text-xs text-[#7A6876]">{c.job?.posterName} · {day(c.job?.date)} {c.job?.startTime}–{c.job?.endTime}</p>
              {c.job?.exactAddress && <p className="text-xs text-[#2E1026] mt-1 flex gap-1"><Icon name="location" size="xs" /> {c.job.exactAddress}</p>}
              <p className="text-xs text-[#401332] font-semibold mt-1">{c.totalPayable ? money(c.totalPayable) : money(c.agreedPay)}{c.overtimeHours ? ` (incl. ${c.overtimeHours} h overtime)` : ''}</p>
              {c.payment?.receiptNumber && <p className="text-[11px] text-emerald-700">Paid by {c.payment.method} · receipt {c.payment.receiptNumber}</p>}
              {c.dispute?.reason && <p className="text-[11px] text-rose-700">You reported: {c.dispute.reason}{c.dispute.resolution ? ` · ${c.dispute.resolution}` : ''}</p>}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF6F0] text-[#551E43] whitespace-nowrap">{STATUS_LABEL[c.status]}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {c.status === 'Confirmed' && (
              <>
                <button className={primary} disabled={busy === c._id} onClick={() => { const code = window.prompt('Enter the check-in code from the supervisor'); if (code) act(c._id, () => workerApi.checkIn(c._id, code), 'Checked in'); }}>Check in</button>
                <button className={ghost} disabled={busy === c._id} onClick={() => { const r = window.prompt('Why can you not come? The poster is told.'); if (r !== null) act(c._id, () => workerApi.cancel(c._id, r), 'Cancelled'); }}>Can't make it</button>
              </>
            )}
            {c.status === 'CheckedIn' && <button className={primary} disabled={busy === c._id} onClick={() => act(c._id, () => workerApi.checkOut(c._id), 'Checked out')}>Check out</button>}
            {c.status === 'Paid' && !c.workerConfirmedPaymentAt && <button className={primary} disabled={busy === c._id} onClick={() => act(c._id, () => workerApi.confirmPayment(c._id), 'Thanks')}>I received it</button>}
            {['CheckedOut', 'Approved', 'Paid'].includes(c.status) && !c.workerConfirmedPaymentAt && (
              <button className={ghost} disabled={busy === c._id} onClick={() => { const r = window.prompt('What is wrong? (unpaid, wrong hours...)'); if (r) act(c._id, () => workerApi.dispute(c._id, r), 'Reported'); }}>Report a problem</button>
            )}
            {!['Cancelled', 'NoShow'].includes(c.status) && (
              <button className={ghost} onClick={() => setChatWith(chatWith === c._id ? null : c._id)}>{chatWith === c._id ? 'Hide messages' : 'Message poster'}</button>
            )}
            <button className={`${ghost} text-rose-600`} onClick={() => setReporting(reporting === c._id ? null : c._id)}>Safety / SOS</button>
          </div>
          {chatWith === c._id && (
            <div className="mt-2">
              <JobMessages me="Worker" load={() => workerApi.messages(c._id)} send={(text) => workerApi.sendMessage(c._id, text)} />
            </div>
          )}
          {reporting === c._id && (
            <div className="mt-2 p-3 rounded-xl border border-rose-200">
              <SafetyReportForm submit={(body) => workerApi.reportSafety(c._id, body)} onClose={() => setReporting(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const WorkerHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [cards, setCards] = useState({ data: [], summary: { earned: 0, pending: 0 } });
  const [demand, setDemand] = useState(null);

  const loadCards = useCallback(() => workerApi.assignments().then(r => setCards({ data: r.data, summary: r.summary })).catch(() => {}), []);
  useEffect(() => {
    if (!getAuthToken()) return;
    workerApi.options().then(r => setOptions(r.data)).catch(() => {});
    workerApi.me().then(r => setProfile(r.data)).catch(() => setProfile(null));
    loadCards();
  }, [loadCards]);
  useEffect(() => { if (profile) workerApi.demand().then(r => setDemand(r.data)).catch(() => {}); }, [profile]);

  // Back from DigiLocker
  useEffect(() => {
    const v = params.get('verification');
    if (!v) return;
    if (v === 'verified') toast.success('ID verified. You will now receive job offers.');
    else if (v === 'pending') toast.info('DigiLocker name differs from your profile; the Utsavo team will check it.');
    else toast.error(params.get('message') || 'Verification was not completed');
    setParams({}, { replace: true });
  }, [params, setParams]);

  if (!getAuthToken()) return <LoginRequired message="Log in with your verified mobile number to find event work." />;
  if (!options || profile === undefined) return <div className="flex justify-center pt-24"><div className="w-10 h-10 border-4 border-[#551E43] border-t-transparent animate-spin rounded-full" /></div>;

  return (
    <div className="min-h-screen pb-32 px-4 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/home'))} className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] cursor-pointer" aria-label="Back"><Icon name="chevronLeft" size="sm" /></button>
        <div>
          <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={HEADING}>Work on Utsavo</h1>
          <p className="text-xs text-[#7A6876]">Short, paid event jobs near you</p>
        </div>
      </div>

      {!profile || editing ? (
        <ProfileForm options={options} profile={profile} user={user} onSaved={(p) => { setProfile(p); setEditing(false); }} onCancel={profile ? () => setEditing(false) : null} />
      ) : (
        <>
          {profile.underReview && <p className="text-xs text-rose-700 bg-rose-50 rounded-xl p-3">Your offers are paused after missed jobs. The Utsavo team is reviewing your account.</p>}
          {profile.verification.status === 'Verified' && profile.available && !profile.underReview && <Offers profile={profile} onAccepted={loadCards} />}

          <Section title={profile.name} action={<button className="text-xs font-bold text-[#551E43] cursor-pointer" onClick={() => setEditing(true)}>Edit</button>}>
            <p className="text-xs text-[#5C4A57]">{profile.skills.map(s => `${s.category} (${s.level})`).join(' · ')}</p>
            <p className="text-xs text-[#7A6876]">{profile.city} {profile.pincode} · travels up to {profile.travelRadiusKm} km{profile.rating ? ` · ★ ${profile.rating}` : ''} · {profile.stats.completed} jobs done</p>
            <Verification profile={profile} options={options} onChanged={setProfile} />
          </Section>

          <Section title="My jobs"><JobCards cards={cards.data} summary={cards.summary} reload={loadCards} /></Section>
          <Section title="Availability"><Availability profile={profile} onChanged={setProfile} /></Section>

          {demand && (
            <Section title="Demand near you">
              {demand.categories.length === 0 ? <p className="text-xs text-[#8A7987]">No jobs for your skills in {demand.city} in the last 30 days yet.</p> : demand.categories.map(c => (
                <div key={c.category} className="flex justify-between text-xs py-1 border-b border-[#F7EEF2]">
                  <span className="text-[#2E1026]">{c.category}</span>
                  <span className="text-[#5C4A57]">{c.positions} people needed in {c.jobs} jobs · avg {money(c.avgPay)}</span>
                </div>
              ))}
              <p className="text-[10px] text-[#8A7987]">{demand.note}</p>
            </Section>
          )}
        </>
      )}
    </div>
  );
};

export default WorkerHub;
