import { useState } from 'react';
import { useOps, money } from './opsApi';
import { Btn, Field, Modal } from './ui';
import { inputClass } from './tokens';
import { useAction } from './useAction';

const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'];

// One driver or vehicle used for several events: the cost is shared by the hours or km each event used
const SplitCostForm = ({ events, onClose, onSaved }) => {
  const { api } = useOps();
  const [form, setForm] = useState({
    amount: '', category: 'Transport', description: '', payee: '', vehicle: '',
    paymentMethod: 'Cash', date: new Date().toISOString().slice(0, 10), basis: 'km'
  });
  const [parts, setParts] = useState([{ eventId: '', value: '' }, { eventId: '', value: '' }]);
  const { busy, run } = useAction();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const total = Number(form.amount) || 0;
  const totalValue = parts.reduce((s, p) => s + (Number(p.value) || 0), 0);
  const share = (p) => (totalValue > 0 ? Math.round((total * (Number(p.value) || 0)) / totalValue) : 0);
  const unit = form.basis === 'km' ? 'km' : 'hours';

  const save = async () => {
    const res = await run('split', () => api.splitExpense({
      ...form,
      amount: total,
      parts: parts.filter(p => p.eventId && Number(p.value) > 0).map(p => ({ eventId: p.eventId, value: Number(p.value) }))
    }), 'Cost shared across the events');
    if (res) {
      onSaved?.();
      onClose();
    }
  };

  return (
    <Modal title="Split a shared cost" onClose={onClose} wide>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Total amount"><input type="number" min="0" className={inputClass} value={form.amount} onChange={set('amount')} placeholder="₹" /></Field>
          <Field label="Date"><input type="date" className={inputClass} value={form.date} onChange={set('date')} /></Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={set('category')}>
              {['Transport', 'Labour', 'Equipment rental', 'Miscellaneous'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Paid by">
            <select className={inputClass} value={form.paymentMethod} onChange={set('paymentMethod')}>
              {METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Driver / payee"><input className={inputClass} value={form.payee} onChange={set('payee')} /></Field>
          <Field label="Vehicle number"><input className={inputClass} value={form.vehicle} onChange={set('vehicle')} /></Field>
        </div>
        <Field label="Description"><input className={inputClass} value={form.description} onChange={set('description')} placeholder="e.g. Tempo + driver, 14 Dec" /></Field>

        <div className="flex items-center gap-3 text-[12px]">
          <span className="text-slate-500 font-semibold">Share by</span>
          {[['km', 'Kilometres'], ['hours', 'Trip hours']].map(([k, label]) => (
            <label key={k} className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={form.basis === k} onChange={() => setForm(f => ({ ...f, basis: k }))} /> {label}
            </label>
          ))}
        </div>

        <div className="space-y-1.5">
          {parts.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select className={`${inputClass} flex-1`} value={p.eventId} onChange={e => setParts(list => list.map((x, j) => j === i ? { ...x, eventId: e.target.value } : x))}>
                <option value="">Choose event</option>
                {events.filter(ev => ev.financeStatus !== 'Closed').map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
              <input type="number" min="0" className={`${inputClass} w-24`} value={p.value} placeholder={unit} onChange={e => setParts(list => list.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
              <span className="w-20 text-right text-[12px] font-semibold text-slate-700">{money(share(p))}</span>
              {parts.length > 2 && (
                <button className="text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Remove" onClick={() => setParts(list => list.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          <button className="text-[12px] font-semibold text-violet-700 cursor-pointer" onClick={() => setParts(list => [...list, { eventId: '', value: '' }])}>+ Add event</button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={Boolean(busy) || !total || totalValue <= 0} onClick={save}>Save {parts.filter(p => p.eventId).length} expenses</Btn>
        </div>
      </div>
    </Modal>
  );
};

export default SplitCostForm;
