import { useCallback, useEffect, useState } from 'react';
import { vendorApi } from '../vendorApi';
import { toast } from '../../../components/ui/Toast';

const IST_OFFSET = 330 * 60 * 1000;
const todayIst = () => new Date(Date.now() + IST_OFFSET).toISOString().slice(0, 10);
const thisMonth = () => todayIst().slice(0, 7);
const money = (n) => `₹${Math.abs(Number(n || 0)).toLocaleString('en-IN')}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const getToken = () => localStorage.getItem('vendorToken');
const input = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:bg-white focus:border-violet-300 outline-none';

const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Other'];
const emptyForm = (direction = 'Paid') => ({ direction, title: '', party: '', amount: '', method: 'UPI', date: todayIst(), note: '' });

/** Major payments the vendor made, and money they received (from the + button) */
const VendorPayments = () => {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const paid = form.direction === 'Paid';

  const load = useCallback(() => vendorApi.getMoneyEntries('Payment', month, getToken())
    .then(r => { if (r?.success) setData(r.data); else throw new Error(r?.message); })
    .catch(err => { setData({ entries: [], totals: { paid: 0, received: 0, net: 0 } }); toast.error(err.message || 'Could not load payments'); }), [month]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.warning('What is the payment for?');
    if (!(Number(form.amount) >= 1)) return toast.warning('Enter the amount');
    setSaving(true);
    try {
      const r = await vendorApi.addMoneyEntry({
        type: 'Payment',
        direction: form.direction,
        title: form.title.trim(),
        party: form.party,
        amount: Number(form.amount),
        method: form.method,
        date: form.date || todayIst(),
        note: form.note
      }, getToken());
      if (!r?.success) throw new Error(r?.message || 'Could not save');
      toast.success(paid ? 'Payment noted' : 'Money received noted');
      setForm(f => emptyForm(f.direction));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"?`)) return;
    const r = await vendorApi.deleteMoneyEntry(entry._id, getToken()).catch(() => null);
    if (!r?.success) return toast.error(r?.message || 'Could not delete');
    load();
  };

  const shown = (data?.entries || []).filter(e => filter === 'All' || e.direction === filter);
  const net = data?.totals.net || 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments</h1>
          <p className="text-xs text-slate-500">Write down the major payments you make, and any money you receive.</p>
        </div>
        <input type="month" value={month} max={thisMonth()} onChange={(e) => setMonth(e.target.value || thisMonth())} className={`${input} w-40`} aria-label="Month" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid out</p>
          <p className="text-base sm:text-lg font-black text-rose-600 mt-0.5">{data ? money(data.totals.paid) : '…'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Received</p>
          <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{data ? money(data.totals.received) : '…'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Balance</p>
          <p className={`text-base sm:text-lg font-black mt-0.5 ${net < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{data ? `${net < 0 ? '−' : ''}${money(net)}` : '…'}</p>
        </div>
      </div>

      {/* Add */}
      <form onSubmit={add} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg" role="tablist">
          {[['Paid', 'I paid'], ['Received', 'I received']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={form.direction === key}
              onClick={() => setForm(f => ({ ...f, direction: key }))}
              className={`py-1.5 rounded-md text-[12px] font-bold cursor-pointer ${form.direction === key ? `bg-white shadow-sm ${key === 'Paid' ? 'text-rose-600' : 'text-emerald-700'}` : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className={`${input} col-span-2`} value={form.title} onChange={set('title')} maxLength={120} placeholder={paid ? 'e.g. Advance for LED wall' : 'e.g. Balance for the Verma wedding'} aria-label="What for" />
          <input className={input} type="number" min="1" inputMode="numeric" value={form.amount} onChange={set('amount')} placeholder="₹ Amount" aria-label="Amount" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className={input} value={form.party} onChange={set('party')} maxLength={120} placeholder={paid ? 'Paid to' : 'Received from'} aria-label={paid ? 'Paid to' : 'Received from'} />
          <select className={input} value={form.method} onChange={set('method')} aria-label="Method">
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className={input} type="date" value={form.date} max={todayIst()} onChange={set('date')} aria-label="Date" />
        </div>
        <input className={input} value={form.note} onChange={set('note')} maxLength={500} placeholder="Note, e.g. UTR or cheque number (optional)" aria-label="Note" />
        <button disabled={saving} className={`w-full py-2.5 rounded-lg text-white text-[13px] font-bold disabled:opacity-50 cursor-pointer ${paid ? 'bg-[#7C3AED] hover:bg-[#6D28D9]' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
          {saving ? 'Saving…' : paid ? 'Save payment' : 'Save money received'}
        </button>
      </form>

      {/* List */}
      <section className="bg-white rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-[13px] font-extrabold text-slate-800">This month</h2>
          <div className="flex gap-1">
            {['All', 'Paid', 'Received'].map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{f}</button>
            ))}
          </div>
        </div>
        {!data ? <p className="text-xs text-slate-400">Loading…</p> : shown.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing noted for this month.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map(e => {
              const out = e.direction === 'Paid';
              return (
                <li key={e._id} className="flex items-start gap-2.5 py-2">
                  <span className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${out ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`} aria-hidden="true">
                    {out ? '↑' : '↓'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 break-words">{e.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {[fmt(e.date), e.party ? `${out ? 'to' : 'from'} ${e.party}` : null, e.method].filter(Boolean).join(' · ')}
                    </p>
                    {e.note && <p className="text-[11px] text-slate-500 mt-0.5">{e.note}</p>}
                  </div>
                  <span className={`text-[13px] font-bold shrink-0 ${out ? 'text-rose-600' : 'text-emerald-600'}`}>{out ? '−' : '+'}{money(e.amount)}</span>
                  <button type="button" onClick={() => remove(e)} aria-label={`Delete "${e.title}"`} className="text-slate-300 hover:text-rose-500 text-xs cursor-pointer shrink-0">✕</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default VendorPayments;
