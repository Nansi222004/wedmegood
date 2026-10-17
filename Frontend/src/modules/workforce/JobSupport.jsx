import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '../../components/ui/Toast';

const SAFETY_KINDS = ['Emergency', 'Harassment or abuse', 'Unsafe site', 'Injury', 'Threat or intimidation', 'Other'];
const inputClass = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-medium focus:border-violet-300 outline-none';
const time = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * In-app messages between the poster and one worker.
 * `load()` resolves to { data, open }; `send(text)` posts one message. `me` is 'Poster' or 'Worker'.
 */
export const JobMessages = ({ load, send, me }) => {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  // Callers pass inline functions; keep the latest without restarting the poll each render
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  const refresh = useCallback(() => loadRef.current()
    .then(r => { setList(r.data); setOpen(r.open); })
    .catch(err => { setList([]); toast.error(err.message); }), []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [refresh]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [list]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await send(text.trim());
      setText('');
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 space-y-2">
      <div className="max-h-56 overflow-y-auto space-y-1.5 px-1">
        {list === null ? <p className="text-[11px] text-slate-400">Loading…</p>
          : list.length === 0 ? <p className="text-[11px] text-slate-400">No messages yet. Share directions, timing changes or questions here.</p>
            : list.map(m => (
              <div key={m._id} className={`flex ${m.from === me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-2.5 py-1.5 text-[12px] ${m.from === me ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                  <p className="whitespace-pre-line break-words">{m.text}</p>
                  <p className={`text-[9px] mt-0.5 ${m.from === me ? 'text-violet-200' : 'text-slate-400'}`}>{m.senderName} · {time(m.createdAt)}</p>
                </div>
              </div>
            ))}
        <div ref={endRef} />
      </div>
      {open ? (
        <form onSubmit={submit} className="flex gap-1.5">
          <input className={inputClass} value={text} maxLength={1000} onChange={e => setText(e.target.value)} placeholder="Type a message" />
          <button disabled={sending || !text.trim()} className="px-3 rounded-lg bg-violet-600 text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">Send</button>
        </form>
      ) : <p className="text-[10px] text-slate-400 text-center">Messages for this job are closed.</p>}
    </div>
  );
};

/** Ask the Utsavo team for help during a job. Always points to 112 for immediate danger. */
export const SafetyReportForm = ({ submit, onClose }) => {
  const [kind, setKind] = useState('');
  const [details, setDetails] = useState('');
  const [shareLocation, setShareLocation] = useState(true);
  const [sending, setSending] = useState(false);

  const position = () => new Promise(resolve => {
    if (!shareLocation || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 }
    );
  });

  const send = async () => {
    setSending(true);
    try {
      const location = await position();
      const r = await submit({ kind, details, location });
      toast.success(r.message || 'Reported');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <a href="tel:112" className="block p-3 rounded-xl bg-rose-600 text-white text-center">
        <span className="block text-[15px] font-bold">In danger right now? Call 112</span>
        <span className="block text-[11px] text-rose-100">India's emergency number for police, fire and ambulance</span>
      </a>
      <p className="text-[12px] text-slate-600">Then tell the Utsavo team. We see this straight away and will contact you.</p>
      <div className="flex flex-wrap gap-1.5">
        {SAFETY_KINDS.map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${kind === k ? (k === 'Emergency' ? 'bg-rose-600 text-white border-rose-600' : 'bg-violet-600 text-white border-violet-600') : 'bg-white text-slate-700 border-slate-200'}`}
          >
            {k}
          </button>
        ))}
      </div>
      <textarea rows={3} className={inputClass} value={details} maxLength={2000} onChange={e => setDetails(e.target.value)} placeholder="What happened? Who is involved?" />
      <label className="flex items-center gap-2 text-[12px] text-slate-600">
        <input type="checkbox" checked={shareLocation} onChange={e => setShareLocation(e.target.checked)} /> Share my current location with the Utsavo team
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold cursor-pointer">Cancel</button>
        <button
          type="button"
          disabled={sending || !kind || (kind !== 'Emergency' && details.trim().length < 5)}
          onClick={send}
          className="px-3 py-2 rounded-lg bg-rose-600 text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer"
        >
          {sending ? 'Sending…' : 'Alert Utsavo team'}
        </button>
      </div>
    </div>
  );
};
