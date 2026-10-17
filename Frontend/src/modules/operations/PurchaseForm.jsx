import { useState } from 'react';
import { useOps } from './opsApi';
import { Btn, Field, Modal } from './ui';
import { inputClass } from './tokens';
import { useAction, uploadPicked } from './useAction';

/** Request a purchase (crew, warehouse, supervisor) or, for the owner, an approved purchase. */
const PurchaseForm = ({ eventId = '', events = [], stockItems = [], onClose, onSaved }) => {
  const { api } = useOps();
  const { busy, run } = useAction(onSaved);
  const [f, setF] = useState({ eventId, reason: '', neededBy: '', referencePhoto: '' });
  const [lines, setLines] = useState([{ inventoryId: '', name: '', quantity: 1, unit: 'pcs', stockType: 'Consumable' }]);
  const setLine = (i, k, v) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const save = async () => {
    const res = await run('pr', () => api.createPurchase({
      ...f,
      eventId: f.eventId || undefined,
      neededBy: f.neededBy || undefined,
      items: lines.map(l => ({ ...l, quantity: Number(l.quantity) }))
    }), 'Purchase request sent');
    if (res) onClose();
  };

  return (
    <Modal title="Purchase request" onClose={onClose} wide>
      <div className="space-y-3">
        {!eventId && (
          <Field label="For event">
            <select className={inputClass} value={f.eventId} onChange={e => setF({ ...f, eventId: e.target.value })}>
              <option value="">General (not for one event)</option>
              {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </Field>
        )}
        {lines.map((l, i) => (
          <div key={i} className="p-2 rounded-lg bg-slate-50 space-y-1.5">
            <div className="flex gap-2">
              <select className={inputClass} value={l.inventoryId} onChange={e => { const s = stockItems.find(x => x._id === e.target.value); setLines(lines.map((x, j) => (j === i ? { ...x, inventoryId: e.target.value, name: s?.itemName || x.name, unit: s?.unit || x.unit, stockType: s?.stockType || x.stockType } : x))); }}>
                <option value="">New item (type below)</option>
                {stockItems.map(s => <option key={s._id} value={s._id}>{s.itemName}</option>)}
              </select>
              {lines.length > 1 && <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-rose-500 px-2 cursor-pointer">✕</button>}
            </div>
            {!l.inventoryId && <input className={inputClass} placeholder="Item name" value={l.name} onChange={e => setLine(i, 'name', e.target.value)} />}
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="1" className={inputClass} value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} />
              <input className={inputClass} placeholder="Unit" value={l.unit} onChange={e => setLine(i, 'unit', e.target.value)} disabled={Boolean(l.inventoryId)} />
              <select className={inputClass} value={l.stockType} onChange={e => setLine(i, 'stockType', e.target.value)} disabled={Boolean(l.inventoryId)}>
                <option>Consumable</option><option>Reusable</option>
              </select>
            </div>
          </div>
        ))}
        <button onClick={() => setLines([...lines, { inventoryId: '', name: '', quantity: 1, unit: 'pcs', stockType: 'Consumable' }])} className="text-[11px] font-semibold text-violet-700 cursor-pointer">+ Add item</button>
        <Field label="Why is it needed"><textarea rows={2} className={`${inputClass} resize-none`} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2 items-end">
          <Field label="Needed by"><input type="date" className={inputClass} value={f.neededBy} onChange={e => setF({ ...f, neededBy: e.target.value })} /></Field>
          <label className="px-3 py-2 rounded-lg text-[12px] font-semibold border border-slate-200 text-slate-700 cursor-pointer text-center">
            {f.referencePhoto ? 'Photo added ✓' : 'Reference photo'}
            <input type="file" accept="image/*" className="hidden" onChange={async e => { const url = await uploadPicked(api, e.target.files); if (url) setF(x => ({ ...x, referencePhoto: url })); }} />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || lines.some(l => !l.inventoryId && !l.name.trim())} onClick={save}>Send request</Btn>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseForm;
