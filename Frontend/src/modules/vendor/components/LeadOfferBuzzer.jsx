import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';
import socketService from '../../../services/socket';
import { toast } from '../../../components/ui/Toast';

const POLL_MS = 10000;
const MUTE_KEY = 'utsavo_vendor_buzzer_muted';

const FALLBACK_REASONS = [
  { value: 'date_unavailable', label: 'Event date unavailable' },
  { value: 'budget_low', label: 'Customer budget too low' },
  { value: 'outside_area', label: 'Location outside service area' },
  { value: 'service_not_offered', label: 'Required service not offered' },
  { value: 'workload', label: 'Already booked / workload too high' },
  { value: 'insufficient_details', label: 'Insufficient event details' },
  { value: 'other', label: 'Other reason' }
];

const readMuted = () => {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const money = (n) => (Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Not given');

/** A short repeating two-tone buzz. Browsers only allow sound after the vendor has used the page. */
function useBuzzer(active, muted) {
  const ctxRef = useRef(null);
  useEffect(() => {
    if (!active || muted) return undefined;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return undefined;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const beep = () => {
      try {
        [0, 0.18].forEach((offset, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = i === 0 ? 880 : 660;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.15);
          osc.connect(gain).connect(ctx.destination);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.16);
        });
        // Browsers only allow vibration after the vendor has interacted with the page
        if (navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate([200, 100, 200]);
      } catch { /* audio is best effort */ }
    };
    beep();
    const timer = setInterval(beep, 1500);
    return () => clearInterval(timer);
  }, [active, muted]);
}

const LeadOfferBuzzer = ({ enabled }) => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [reasons, setReasons] = useState(FALLBACK_REASONS);
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(readMuted);
  const [mode, setMode] = useState('offer'); // offer | decline
  const [decline, setDecline] = useState({ reason: '', note: '' });
  const [working, setWorking] = useState(false);

  const clockOffset = useRef(0); // serverTime - clientTime
  const acked = useRef(new Set());
  const attachedSocket = useRef(null);
  const disabledRef = useRef(false); // stops polling when the vendor cannot receive offers

  const token = typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
  const current = offers[0] || null;

  const mergeOffer = useCallback((offer) => {
    setOffers(prev => (prev.some(o => o.offerId === offer.offerId)
      ? prev.map(o => (o.offerId === offer.offerId ? { ...o, ...offer } : o))
      : [...prev, offer]));
  }, []);

  const removeOffer = useCallback((offerId) => {
    setOffers(prev => prev.filter(o => o.offerId !== offerId));
    setMode('offer');
    setDecline({ reason: '', note: '' });
  }, []);

  const poll = useCallback(async () => {
    if (!enabled || !token || disabledRef.current) return;
    try {
      const res = await vendorApi.getActiveLeadOffers(token);
      if (res?.success === false && /subscription|approv/i.test(res.message || '')) {
        disabledRef.current = true;
        return;
      }
      if (res?.serverTime) clockOffset.current = new Date(res.serverTime).getTime() - Date.now();
      if (Array.isArray(res?.data)) {
        setOffers(prev => {
          const live = new Set(res.data.map(o => o.offerId));
          // Keep an offer the vendor is answering right now even if a poll raced it
          return [...res.data, ...prev.filter(o => !live.has(o.offerId) && o.answering)];
        });
      }
    } catch { /* network blips are retried on the next tick */ }

    // Re-attach to the socket if the shared connection was replaced
    const socket = socketService.connect(token);
    if (socket && attachedSocket.current !== socket) {
      attachedSocket.current?.off?.('lead:offer');
      attachedSocket.current?.off?.('lead:offer:closed');
      socket.on('lead:offer', (offer) => mergeOffer(offer));
      socket.on('lead:offer:closed', ({ offerId }) => removeOffer(offerId));
      attachedSocket.current = socket;
    }
  }, [enabled, token, mergeOffer, removeOffer]);

  useEffect(() => {
    if (!enabled || !token) return undefined;
    poll();
    vendorApi.getLeadOfferReasons(token).then(res => {
      if (res?.data?.declineReasons?.length) setReasons(res.data.declineReasons);
    }).catch(() => {});
    const timer = setInterval(poll, POLL_MS);
    const onFocus = () => poll();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      attachedSocket.current?.off?.('lead:offer');
      attachedSocket.current?.off?.('lead:offer:closed');
      attachedSocket.current = null;
    };
  }, [enabled, token, poll]);

  // The offer is on screen: tell the server so the 30 s window starts now
  useEffect(() => {
    if (!current || acked.current.has(current.offerId) || !token) return;
    acked.current.add(current.offerId);
    vendorApi.acknowledgeLeadOffer(current.offerId, token).then(res => {
      if (res?.serverTime) clockOffset.current = new Date(res.serverTime).getTime() - Date.now();
      if (res?.data?.expiresAt) mergeOffer({ offerId: current.offerId, expiresAt: res.data.expiresAt, deliveredAt: res.data.deliveredAt });
      if (res?.data && res.data.status !== 'Pending') removeOffer(current.offerId);
    }).catch(() => {});
  }, [current, token, mergeOffer, removeOffer]);

  // Countdown tick
  useEffect(() => {
    if (!current) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [current]);

  const remainingMs = current ? new Date(current.expiresAt).getTime() - (now + clockOffset.current) : 0;
  const expired = Boolean(current) && remainingMs <= 0;
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const windowSeconds = current?.windowSeconds || 30;
  // Before delivery is confirmed the server allows extra time; show the window the vendor really has
  const shownSeconds = Math.min(seconds, current?.deliveredAt ? seconds : windowSeconds);

  useBuzzer(Boolean(current) && !expired, muted);

  // Time's up: drop it after a moment (the server reassigns it)
  useEffect(() => {
    if (!expired || !current || current.answering) return undefined;
    const timer = setTimeout(() => removeOffer(current.offerId), 2500);
    return () => clearTimeout(timer);
  }, [expired, current, removeOffer]);

  // Flash the tab title while an offer waits
  useEffect(() => {
    if (!current || expired) return undefined;
    const original = document.title;
    let flip = false;
    const timer = setInterval(() => {
      flip = !flip;
      document.title = flip ? `🔔 New lead · ${shownSeconds}s` : original;
    }, 1000);
    return () => { clearInterval(timer); document.title = original; };
  }, [current, expired, shownSeconds]);

  const toggleMute = () => {
    setMuted(m => {
      try { localStorage.setItem(MUTE_KEY, m ? '0' : '1'); } catch { /* ignore */ }
      return !m;
    });
  };

  const accept = async () => {
    if (!current) return;
    setWorking(true);
    mergeOffer({ offerId: current.offerId, answering: true });
    try {
      const res = await vendorApi.acceptLeadOffer(current.offerId, token);
      if (res?.success) {
        toast.success(res.message || 'Lead accepted');
        removeOffer(current.offerId);
        navigate(`/vendor/leads?lead=${res.data.leadId}`);
      } else {
        toast.error(res?.message || 'This lead is no longer available.');
        removeOffer(current.offerId);
      }
    } catch {
      toast.error('Could not reach the server. Try again.');
      mergeOffer({ offerId: current.offerId, answering: false });
    } finally {
      setWorking(false);
    }
  };

  const submitDecline = async () => {
    if (!current) return;
    if (!decline.reason) {
      toast.warning('Choose a reason');
      return;
    }
    if (decline.reason === 'insufficient_details' && !decline.note.trim()) {
      toast.warning('Tell the customer which details you need');
      return;
    }
    setWorking(true);
    mergeOffer({ offerId: current.offerId, answering: true });
    try {
      const res = await vendorApi.declineLeadOffer(current.offerId, decline.reason, decline.note, token);
      if (res?.success) toast.info(res.message);
      else toast.error(res?.message || 'This offer has already ended.');
      removeOffer(current.offerId);
    } catch {
      toast.error('Could not reach the server. Try again.');
      mergeOffer({ offerId: current.offerId, answering: false });
    } finally {
      setWorking(false);
    }
  };

  if (!enabled || !current) return null;

  const pct = Math.max(0, Math.min(100, (shownSeconds / windowSeconds) * 100));
  const urgent = shownSeconds <= 10;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-0 sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="lead-offer-title">
      <div className="w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Countdown */}
        <div className={`px-6 pt-5 pb-4 text-white ${expired ? 'bg-slate-500' : urgent ? 'bg-rose-600' : 'bg-[#7c3aed]'}`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-90">
              {expired ? "Time's up" : current.attempt > 1 ? 'Lead offer · reassigned to you' : 'New lead offer'}
            </p>
            <button onClick={toggleMute} className="relative w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer" aria-label={muted ? 'Unmute buzzer' : 'Mute buzzer'}>
              <Icon name="bell" size="xs" color="white" />
              {muted && <span className="absolute w-5 h-0.5 bg-white rotate-45" />}
            </button>
          </div>
          <div className="flex items-end gap-2 mt-1">
            <span className={`text-5xl font-black tabular-nums leading-none ${urgent && !expired ? 'animate-pulse' : ''}`}>{shownSeconds}</span>
            <span className="text-sm font-bold opacity-90 mb-1">seconds to respond</span>
          </div>
          <div className="h-1.5 bg-white/25 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h2 id="lead-offer-title" className="text-xl font-black text-slate-900 leading-tight">{current.service}</h2>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">{current.eventType} · {formatDate(current.eventDate)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</p>
              <p className="font-bold text-slate-800 mt-0.5">{current.city}{current.pincode ? ` ${current.pincode}` : ''}</p>
              {current.distanceKm != null && <p className="text-slate-500">~{Math.round(current.distanceKm)} km from you</p>}
            </div>
            <div className="p-3 rounded-2xl bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Budget</p>
              <p className="font-bold text-slate-800 mt-0.5">{money(current.budget)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Guests</p>
              <p className="font-bold text-slate-800 mt-0.5">{current.guestCount || 'Not given'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Venue</p>
              <p className="font-bold text-slate-800 mt-0.5">{current.venueType && current.venueType !== 'Not Specified' ? current.venueType : 'Not decided'}</p>
            </div>
          </div>

          {current.requirements && (
            <p className="text-xs text-slate-600 leading-relaxed bg-violet-50/60 border border-violet-100 rounded-2xl p-3">{current.requirements}</p>
          )}
          {current.referencePhotoCount > 0 && (
            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Icon name="image" size="xs" /> {current.referencePhotoCount} reference photo{current.referencePhotoCount === 1 ? '' : 's'} (visible after you accept)
            </p>
          )}
          <p className="text-[11px] text-slate-400">Customer contact details are shared after you accept. You must contact them before the deadline shown on the lead.</p>

          {mode === 'decline' && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Why are you declining?</p>
              {reasons.map(r => (
                <label key={r.value} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${decline.reason === r.value ? 'border-[#7c3aed] bg-violet-50 text-violet-900' : 'border-slate-200 text-slate-700'}`}>
                  <input type="radio" name="decline-reason" className="accent-[#7c3aed]" checked={decline.reason === r.value} onChange={() => setDecline(d => ({ ...d, reason: r.value }))} />
                  {r.label}
                </label>
              ))}
              {(decline.reason === 'insufficient_details' || decline.reason === 'other') && (
                <textarea
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#7c3aed]"
                  placeholder={decline.reason === 'insufficient_details' ? 'Which details do you need? The customer will be asked and the lead comes back to you.' : 'Add a note (optional)'}
                  value={decline.note}
                  onChange={e => setDecline(d => ({ ...d, note: e.target.value }))}
                />
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-1 flex gap-3">
          {mode === 'offer' ? (
            <>
              <button onClick={() => setMode('decline')} disabled={working || expired} className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 text-sm font-black disabled:opacity-40 cursor-pointer">
                Decline
              </button>
              <button onClick={accept} disabled={working || expired} className="flex-[2] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg shadow-emerald-600/30 disabled:opacity-40 cursor-pointer">
                {working ? 'Accepting...' : 'Accept lead'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setMode('offer')} disabled={working} className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 text-sm font-black cursor-pointer">
                Back
              </button>
              <button onClick={submitDecline} disabled={working || expired} className="flex-[2] py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-black disabled:opacity-40 cursor-pointer">
                {working ? 'Sending...' : 'Confirm decline'}
              </button>
            </>
          )}
        </div>
        {offers.length > 1 && (
          <p className="text-center text-[11px] font-bold text-slate-400 pb-4 -mt-2">{offers.length - 1} more offer{offers.length > 2 ? 's' : ''} waiting</p>
        )}
      </div>
    </div>
  );
};

export default LeadOfferBuzzer;
