import { useCallback, useEffect, useState } from 'react';
import { vendorApi } from '../vendorApi';
import { toast } from '../../../components/ui/Toast';

const IST_OFFSET = 330 * 60 * 1000;
const todayIst = () => new Date(Date.now() + IST_OFFSET).toISOString().slice(0, 10);
const thisMonth = () => todayIst().slice(0, 7);
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const getToken = () => localStorage.getItem('vendorToken');
const input = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:bg-white focus:border-violet-300 outline-none';

const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Other'];
const CATEGORIES = ['Materials', 'Transport', 'Staff & labour', 'Food', 'Equipment', 'Rent', 'Bills & utilities', 'Marketing', 'Other'];
const emptyForm = () => ({ mode: 'Spent', title: '', amount: '', category: '', method: 'Cash', date: todayIst(), dueDate: '', note: '' });

/** What the vendor spends, and a to-do list of spending still to do (from the + button) */
const VendorExpenditures = () => {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = useCallback(() => vendorApi.getMoneyEntries('Expense', month, getToken())
    .then(r => { if (r?.success) setData(r.data); else throw new Error(r?.message); })
    .catch(err => { setData({ planned: [], spent: [], totals: { spent: 0, planned: 0, byCategory: [] } }); toast.error(err.message || 'Could not load expenditures'); }), [month]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.warning('What is the expense for?');
    if (!(Number(form.amount) >= 1)) return toast.warning('Enter the amount');
    setSaving(true);
    try {
      const planned = form.mode === 'Planned';
      const r = await vendorApi.addMoneyEntry({
        type: 'Expense',
        status: planned ? 'Planned' : 'Spent',
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        method: form.method,
        note: form.note,
        ...(planned ? { dueDate: form.dueDate || null } : { date: form.date || todayIst() })
      }, getToken());
      if (!r?.success) throw new Error(r?.message || 'Could not save');
      toast.success(planned ? 'Added to your to-do list' : 'Expense noted');
      setForm(f => ({ ...emptyForm(), mode: f.mode }));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markSpent = async (entry) => {
    const r = await vendorApi.updateMoneyEntry(entry._id, { status: 'Spent' }, getToken()).catch(() => null);
    if (!r?.success) return toast.error(r?.message || 'Could not update');
    toast.success(`Marked as spent: ${entry.title}`);
    load();
  };

  const remove = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"?`)) return;
    const r = await vendorApi.deleteMoneyEntry(entry._id, getToken()).catch(() => null);
    if (!r?.success) return toast.error(r?.message || 'Could not delete');
    load();
  };

  const today = todayIst();

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Expenditures</h1>
          <p className="text-xs text-slate-500">Note what you spend, and keep a to-do list of what you still have to pay for.</p>
        </div>
        <input type="month" value={month} max={thisMonth()} onChange={(e) => setMonth(e.target.value || thisMonth())} className={`${input} w-40`} aria-label="Month" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spent this month</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{data ? money(data.totals.spent) : '…'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To do</p>
          <p className="text-lg font-black text-amber-600 mt-0.5">{data ? money(data.totals.planned) : '…'}</p>
          <p className="text-[10px] text-slate-400">{data ? `${data.planned.length} item(s) still to pay` : ''}</p>
        </div>
      </div>

      {/* Add */}
      <form onSubmit={add} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg" role="tablist">
          {[['Spent', 'Already spent'], ['Planned', 'To do (plan it)']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={form.mode === key}
              onClick={() => setForm(f => ({ ...f, mode: key }))}
              className={`py-1.5 rounded-md text-[12px] font-bold cursor-pointer ${form.mode === key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input className={`${input} col-span-2`} value={form.title} onChange={set('title')} maxLength={120} placeholder={form.mode === 'Planned' ? 'e.g. Pay the tent supplier' : 'e.g. Flowers for the Sharma wedding'} aria-label="What for" />
          <input className={input} type="number" min="1" inputMode="numeric" value={form.amount} onChange={set('amount')} placeholder="₹ Amount" aria-label="Amount" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select className={input} value={form.category} onChange={set('category')} aria-label="Category">
            <option value="">Category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={input} value={form.method} onChange={set('method')} aria-label="Paid by">
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {form.mode === 'Planned' ? (
            <input className={input} type="date" value={form.dueDate} min={today} onChange={set('dueDate')} aria-label="Pay by" title="Pay by (optional)" />
          ) : (
            <input className={input} type="date" value={form.date} max={today} onChange={set('date')} aria-label="Date spent" />
          )}
        </div>
        <input className={input} value={form.note} onChange={set('note')} maxLength={500} placeholder="Note (optional)" aria-label="Note" />
        <button disabled={saving} className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-bold disabled:opacity-50 cursor-pointer">
          {saving ? 'Saving…' : form.mode === 'Planned' ? 'Add to to-do list' : 'Save expense'}
        </button>
      </form>

      {/* To do */}
      <section className="bg-white rounded-xl border border-slate-200 p-3">
        <h2 className="text-[13px] font-extrabold text-slate-800 mb-2">To do</h2>
        {!data ? <p className="text-xs text-slate-400">Loading…</p> : data.planned.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing planned. Use "To do (plan it)" above for spending you must not forget.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.planned.map(e => {
              const overdue = e.dueDate && new Date(e.dueDate).toISOString().slice(0, 10) < today;
              return (
                <li key={e._id} className="flex items-start gap-2.5 rounded-lg bg-amber-50/60 border border-amber-100 px-2.5 py-2">
                  <input type="checkbox" onChange={() => markSpent(e)} className="mt-1 h-4 w-4 accent-[#7C3AED] cursor-pointer shrink-0" aria-label={`Mark "${e.title}" as spent`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 break-words">{e.title}</p>
                    <p className={`text-[11px] ${overdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                      {[e.category, e.method, e.dueDate ? `${overdue ? 'Overdue · was due' : 'Pay by'} ${fmt(e.dueDate)}` : null].filter(Boolean).join(' · ')}
                    </p>
                    {e.note && <p className="text-[11px] text-slate-500 mt-0.5">{e.note}</p>}
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 shrink-0">{money(e.amount)}</span>
                  <button type="button" onClick={() => remove(e)} aria-label={`Delete "${e.title}"`} className="text-slate-300 hover:text-rose-500 text-xs cursor-pointer shrink-0">✕</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Spent */}
      <section className="bg-white rounded-xl border border-slate-200 p-3">
        <h2 className="text-[13px] font-extrabold text-slate-800 mb-2">Spent this month</h2>
        {data?.totals.byCategory.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {data.totals.byCategory.map(c => (
              <span key={c.category} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold">{c.category}: {money(c.amount)}</span>
            ))}
          </div>
        )}
        {!data ? <p className="text-xs text-slate-400">Loading…</p> : data.spent.length === 0 ? (
          <p className="text-xs text-slate-400">No expenses noted for this month.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.spent.map(e => (
              <li key={e._id} className="flex items-start gap-2.5 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 break-words">{e.title}</p>
                  <p className="text-[11px] text-slate-500">{[fmt(e.date), e.category, e.method].filter(Boolean).join(' · ')}</p>
                  {e.note && <p className="text-[11px] text-slate-500 mt-0.5">{e.note}</p>}
                </div>
                <span className="text-[13px] font-bold text-slate-900 shrink-0">{money(e.amount)}</span>
                <button type="button" onClick={() => remove(e)} aria-label={`Delete "${e.title}"`} className="text-slate-300 hover:text-rose-500 text-xs cursor-pointer shrink-0">✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default VendorExpenditures;
