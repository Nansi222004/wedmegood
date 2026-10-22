import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { vendorApi } from '../vendorApi';
import { toast } from '../../../components/ui/Toast';

const LEVELS = ['Good', 'Acceptable', 'Poor', 'Very poor'];
const ASPECTS = [
  ['respect', 'Respect towards you and your staff'],
  ['support', 'Support during the work'],
  ['payment', 'Payment behaviour'],
  ['communication', 'Communication'],
  ['approach', 'Way of approach']
];
const ISSUES = [
  'Not supportive during the work',
  'Disrespectful to vendor or staff',
  'Stubborn or delaying payment',
  'Frequent last-minute changes',
  'Abusive language or threats',
  'Did not turn up / cancelled without notice',
  'Other'
];
const SHORT = { respect: 'Respect', support: 'Support', payment: 'Payment', communication: 'Communication', approach: 'Approach' };
const token = () => localStorage.getItem('vendorToken');

/**
 * What other vendors reported about this lead's customer (admin-confirmed reports only, reporters hidden).
 * Shows nothing when there are no confirmed reports.
 */
export const CustomerConductSummary = ({ leadId, compact = false }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!leadId) return;
    vendorApi.getLeadCustomerConduct(leadId, token())
      .then(res => setData(res?.success ? res.data : null))
      .catch(() => setData(null));
  }, [leadId]);

  if (!data || !data.reports) return null;
  const poorAspects = Object.entries(data.poorRatings || {}).filter(([, n]) => n > 0);

  if (compact) {
    return (
      <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
        Customer behaviour: {data.reports} confirmed report{data.reports === 1 ? '' : 's'} from {data.vendors} vendor{data.vendors === 1 ? '' : 's'}
        {data.issues?.[0] ? ` · ${data.issues[0].issue}` : ''}
      </p>
    );
  }
  return (
    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
      <p className="font-bold">Customer behaviour reported by {data.vendors} vendor{data.vendors === 1 ? '' : 's'} ({data.reports} confirmed)</p>
      {data.issues?.length > 0 && (
        <p>{data.issues.map(i => `${i.issue}${i.count > 1 ? ` (${i.count})` : ''}`).join(' · ')}</p>
      )}
      {poorAspects.length > 0 && (
        <p className="text-amber-800">Rated poor on: {poorAspects.map(([a, n]) => `${SHORT[a] || a} (${n})`).join(', ')}</p>
      )}
      {data.recent?.[0]?.description && <p className="italic text-amber-800">"{data.recent[0].description}"</p>}
      <p className="text-[10px] text-amber-700">Confirmed by the Utsavo team. Use it to plan advance and terms; do not refuse service on this alone.</p>
    </div>
  );
};

/** Vendor reports a customer's behaviour for a booking or lead. The admin reviews it before others see it. */
export const CustomerReportForm = ({ target, onClose, onSaved }) => {
  const [conduct, setConduct] = useState({ respect: '', support: '', payment: '', communication: '', approach: '' });
  const [issues, setIssues] = useState([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (ASPECTS.some(([key]) => !conduct[key])) return toast.warning('Rate each point.');
    if (description.trim().length < 10) return toast.warning('Describe what happened (at least 10 characters).');
    setSaving(true);
    try {
      const res = await vendorApi.createCustomerReport({
        ...(target.bookingId ? { bookingId: target.bookingId } : { leadId: target.leadId }),
        conduct, issues, description: description.trim()
      }, token());
      if (!res?.success) throw new Error(res?.message || 'Could not send the report');
      toast.success(res.message || 'Reported');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto space-y-3" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Report customer behaviour</h3>
            <p className="text-[11px] text-slate-500">{target.customerName ? `${target.customerName} · ` : ''}The customer can give their side. Once the Utsavo team confirms it, other vendors see a summary (not your name).</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 cursor-pointer shrink-0" aria-label="Close">✕</button>
        </div>

        {ASPECTS.map(([key, label]) => (
          <div key={key}>
            <p className="text-[11px] font-semibold text-slate-700 mb-1">{label}</p>
            <div className="grid grid-cols-4 gap-1">
              {LEVELS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConduct(c => ({ ...c, [key]: level }))}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${conduct[key] === level ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="text-[11px] font-semibold text-slate-700 mb-1">What happened (choose any)</p>
          <div className="flex flex-wrap gap-1.5">
            {ISSUES.map(issue => {
              const on = issues.includes(issue);
              return (
                <button
                  key={issue}
                  type="button"
                  onClick={() => setIssues(list => (on ? list.filter(i => i !== issue) : [...list, issue]))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${on ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {issue}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          rows={3}
          maxLength={1000}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Short description, for example: kept changing the setup on the day and delayed the balance payment by 3 weeks"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] focus:border-violet-300 outline-none resize-none"
        />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold cursor-pointer">Cancel</button>
          <button disabled={saving} className="px-3 py-2 rounded-lg bg-[#7c3aed] text-white text-[12px] font-semibold disabled:opacity-50 cursor-pointer">{saving ? 'Sending…' : 'Send report'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
};
