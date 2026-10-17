import { useState } from 'react';
import { useOps, can } from './opsApi';
import { Btn, Field, Modal } from './ui';
import { inputClass } from './tokens';
import { uploadPicked } from './useAction';
import { toast } from '../../components/ui/Toast';

const EVENT_CATEGORIES = ['Materials', 'Labour', 'Transport', 'Food', 'Equipment rental', 'Sub-vendor', 'Damage', 'Miscellaneous'];
const OVERHEAD_CATEGORIES = ['Godown rent', 'Warehouse wages', 'Security', 'Electricity & water', 'Office & internet', 'Equipment maintenance', 'Vehicle costs', 'Other overhead'];
const METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'];

/**
 * Add an expense. Owner/accountant: recorded directly (event or overhead). Crew: an expense claim
 * that waits for the owner's approval. Even small cash amounts belong here.
 */
const ExpenseForm = ({ eventId = '', events = [], scope: fixedScope, onClose, onSaved }) => {
  const { api, me } = useOps();
  const finance = can(me, 'finance.view') || can(me, 'expense.manage');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    scope: fixedScope || 'Event', eventId, category: fixedScope === 'Overhead' ? 'Godown rent' : 'Materials',
    description: '', amount: '', date: new Date().toISOString().slice(0, 10), paymentMethod: 'Cash', payee: '',
    receiptNumber: '', receiptPhoto: '', workers: '', hours: '', vehicle: '', trips: ''
  });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const categories = f.scope === 'Event' ? EVENT_CATEGORIES : OVERHEAD_CATEGORIES;

  const save = async (confirmDuplicate = false) => {
    setBusy(true);
    try {
      await api.createExpense({ ...f, amount: Number(f.amount), confirmDuplicate });
      toast.success(finance ? 'Expense added' : 'Claim submitted');
      onClose();
      onSaved?.();
    } catch (err) {
      // Same bill or same amount to the same payee recently: ask before adding it twice
      if (err.data?.code === 'POSSIBLE_DUPLICATE' && window.confirm(err.message)) return save(true);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
    return null;
  };

  return (
    <Modal title={finance ? 'Add expense' : 'Expense claim'} onClose={onClose}>
      <div className="space-y-3">
        {finance && !fixedScope && (
          <div className="flex gap-1.5">
            {['Event', 'Overhead'].map(s => (
              <button key={s} onClick={() => setF(x => ({ ...x, scope: s, category: s === 'Event' ? 'Materials' : 'Godown rent' }))} className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer ${f.scope === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {s === 'Event' ? 'Event cost' : 'Business overhead'}
              </button>
            ))}
          </div>
        )}
        {f.scope === 'Event' && !eventId && (
          <Field label="Event">
            <select className={inputClass} value={f.eventId} onChange={e => set('eventId', e.target.value)}>
              <option value="">Choose event</option>
              {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Category"><select className={inputClass} value={f.category} onChange={e => set('category', e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Amount (₹)"><input type="number" min="0" className={inputClass} value={f.amount} onChange={e => set('amount', e.target.value)} /></Field>
        </div>
        <Field label="What for"><input className={inputClass} value={f.description} onChange={e => set('description', e.target.value)} maxLength={500} /></Field>
        {f.category === 'Labour' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Workers"><input type="number" min="0" className={inputClass} value={f.workers} onChange={e => set('workers', e.target.value)} /></Field>
            <Field label="Hours"><input type="number" min="0" className={inputClass} value={f.hours} onChange={e => set('hours', e.target.value)} /></Field>
          </div>
        )}
        {(f.category === 'Transport' || f.category === 'Vehicle costs') && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Vehicle"><input className={inputClass} value={f.vehicle} onChange={e => set('vehicle', e.target.value)} /></Field>
            <Field label="Trips"><input type="number" min="0" className={inputClass} value={f.trips} onChange={e => set('trips', e.target.value)} /></Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date"><input type="date" className={inputClass} value={f.date} onChange={e => set('date', e.target.value)} /></Field>
          <Field label="Paid by"><select className={inputClass} value={f.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Paid to (shop / person)"><input className={inputClass} value={f.payee} onChange={e => set('payee', e.target.value)} /></Field>
          <Field label="Bill / receipt no."><input className={inputClass} value={f.receiptNumber} onChange={e => set('receiptNumber', e.target.value)} /></Field>
        </div>
        <label className="block px-3 py-2 rounded-lg text-[12px] font-semibold border border-dashed border-slate-300 text-slate-600 cursor-pointer text-center">
          {f.receiptPhoto ? 'Bill photo added ✓' : 'Add bill / receipt photo'}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async e => { const url = await uploadPicked(api, e.target.files); if (url) set('receiptPhoto', url); }} />
        </label>
        {!finance && <p className="text-[10px] text-slate-400">Your claim goes to the owner for approval.</p>}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !Number(f.amount) || (f.scope === 'Event' && !f.eventId)} onClick={() => save(false)}>{finance ? 'Save' : 'Submit claim'}</Btn>
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseForm;
