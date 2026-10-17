import { useCallback, useEffect, useState } from 'react';
import { useOps, can, fmtDate, fmtDateTime, money } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, Modal, PageHeader, Spinner, Tabs } from '../ui';
import StockLabels from '../StockLabels';
import { inputClass } from '../tokens';
import { useAction, uploadPicked } from '../useAction';
import PurchaseForm from '../PurchaseForm';
import { toast } from '../../../components/ui/Toast';

const today = () => new Date().toISOString().slice(0, 10);

const ItemForm = ({ item, onClose, onSaved }) => {
  const { api, me } = useOps();
  const { busy, run } = useAction(onSaved);
  const [f, setF] = useState(item ? { ...item } : { itemName: '', itemCode: '', unit: 'pcs', stockType: 'Reusable', totalQuantity: 0, storageLocation: '', condition: 'Good', reorderLevel: 0, unitCost: 0 });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async () => {
    const res = await run('i', () => (item ? api.updateStock(item._id, f) : api.createStock({ ...f, totalQuantity: Number(f.totalQuantity) })), item ? 'Item updated' : 'Item added');
    if (res) onClose();
  };
  return (
    <Modal title={item ? 'Edit item' : 'New stock item'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name"><input className={inputClass} value={f.itemName} onChange={e => set('itemName', e.target.value)} placeholder="e.g. Iron frame 6ft" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Item code / barcode"><input className={inputClass} value={f.itemCode} onChange={e => set('itemCode', e.target.value)} /></Field>
          <Field label="Unit"><input className={inputClass} value={f.unit} onChange={e => set('unit', e.target.value)} /></Field>
          <Field label="Type" hint="Reusable comes back after events; consumable is used up">
            <select className={inputClass} value={f.stockType} onChange={e => set('stockType', e.target.value)}><option>Reusable</option><option>Consumable</option></select>
          </Field>
          {!item && <Field label="Quantity owned now"><input type="number" min="0" className={inputClass} value={f.totalQuantity} onChange={e => set('totalQuantity', e.target.value)} /></Field>}
          <Field label="Godown location"><input className={inputClass} value={f.storageLocation} onChange={e => set('storageLocation', e.target.value)} placeholder="Rack B2" /></Field>
          <Field label="Condition"><select className={inputClass} value={f.condition} onChange={e => set('condition', e.target.value)}><option>Good</option><option>Needs repair</option><option>Damaged</option></select></Field>
          <Field label="Reorder when below"><input type="number" min="0" className={inputClass} value={f.reorderLevel} onChange={e => set('reorderLevel', e.target.value)} /></Field>
          {can(me, 'finance.view') && <Field label="Cost per unit (₹)"><input type="number" min="0" className={inputClass} value={f.unitCost} onChange={e => set('unitCost', e.target.value)} /></Field>}
        </div>
        {item && <p className="text-[10px] text-slate-400">Change the quantity with "Adjust" so the reason is recorded.</p>}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !f.itemName.trim()} onClick={save}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
};

const Movements = ({ item, onClose }) => {
  const { api } = useOps();
  const [data, setData] = useState(null);
  useEffect(() => { api.stockMovements(item._id).then(r => setData(r.data)).catch(() => setData({ movements: [], reservations: [] })); }, [api, item._id]);
  return (
    <Modal title={`${item.itemName}: history`} onClose={onClose} wide>
      {!data ? <Spinner /> : (
        <div className="space-y-3">
          {data.reservations.length > 0 && (
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Reserved for</p>
              {data.reservations.map(r => <p key={r._id} className="text-[12px] text-slate-700">{r.quantity} · {r.workspaceId?.title} ({fmtDate(r.fromDate)} – {fmtDate(r.toDate)})</p>)}
            </div>
          )}
          <div className="space-y-1">
            {data.movements.length === 0 ? <Empty>No movements.</Empty> : data.movements.map(m => (
              <div key={m._id} className="flex justify-between gap-2 text-[12px] py-1 border-b border-slate-50">
                <span><Badge tone={m.ownedChange > 0 ? 'green' : m.ownedChange < 0 ? 'red' : 'grey'}>{m.type}</Badge> {m.quantity} {m.ref && <span className="text-slate-400">· {m.ref}</span>} {m.workspaceId && <span className="text-slate-400">· {m.workspaceId.title}</span>} {m.note && <span className="text-slate-500">· {m.note}</span>}</span>
                <span className="text-slate-400 shrink-0">{fmtDateTime(m.at)} · {m.by}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

const RecordPurchase = ({ pr, onClose, onSaved }) => {
  const { api } = useOps();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ supplier: '', invoiceNumber: '', amount: '', paymentMethod: 'Cash', invoicePhoto: '' });
  const [qty, setQty] = useState(pr.items.map(i => i.quantity));
  const save = async (confirmDuplicate = false) => {
    setBusy(true);
    try {
      const res = await api.recordPurchase(pr._id, { ...f, amount: Number(f.amount), confirmDuplicate, items: qty.map((q, index) => ({ index, quantityReceived: Number(q) })) });
      toast.success(res.message || 'Purchase recorded');
      onClose();
      onSaved();
    } catch (err) {
      // Same invoice (or amount to the same supplier) recently: ask before recording it twice
      if (err.data?.code === 'POSSIBLE_DUPLICATE' && window.confirm(err.message)) return save(true);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
    return null;
  };
  return (
    <Modal title={`Record purchase ${pr.number}`} onClose={onClose}>
      <div className="space-y-3">
        {pr.items.map((i, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 text-[12px]">
            <span>{i.name} <span className="text-slate-400">({i.stockType}, asked {i.quantity} {i.unit})</span></span>
            <input type="number" min="0" className={`${inputClass} w-24`} value={qty[idx]} onChange={e => setQty(qty.map((q, j) => (j === idx ? e.target.value : q)))} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Supplier"><input className={inputClass} value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} /></Field>
          <Field label="Invoice no."><input className={inputClass} value={f.invoiceNumber} onChange={e => setF({ ...f, invoiceNumber: e.target.value })} /></Field>
          <Field label="Amount paid (₹)"><input type="number" min="0" className={inputClass} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Paid by"><select className={inputClass} value={f.paymentMethod} onChange={e => setF({ ...f, paymentMethod: e.target.value })}>{['Cash', 'UPI', 'Bank transfer', 'Card', 'Cheque', 'Credit (unpaid)'].map(m => <option key={m}>{m}</option>)}</select></Field>
        </div>
        <label className="block px-3 py-2 rounded-lg text-[12px] font-semibold border border-dashed border-slate-300 text-slate-600 cursor-pointer text-center">
          {f.invoicePhoto ? 'Invoice photo added ✓' : 'Invoice photo'}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async e => { const url = await uploadPicked(api, e.target.files); if (url) setF(x => ({ ...x, invoicePhoto: url })); }} />
        </label>
        <p className="text-[10px] text-slate-400">Received items enter the stock; the amount is charged to {pr.workspaceId ? 'the event' : 'overheads'}.</p>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !f.supplier || !Number(f.amount)} onClick={() => save(false)}>Record purchase</Btn>
        </div>
      </div>
    </Modal>
  );
};

const StockPage = () => {
  const { api, me } = useOps();
  const [tab, setTab] = useState('items');
  const [range, setRange] = useState({ from: today(), to: today() });
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({});
  const [shortages, setShortages] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const manage = can(me, 'stock.manage');
  const owner = me.kind === 'owner';

  const load = useCallback(() => {
    const fail = () => { setItems([]); setShortages([]); setPurchases([]); };
    if (tab === 'items') return api.stock(range.from, range.to).then(r => { setItems(r.data); setMeta(r.meta); }).catch(fail);
    if (tab === 'shortages') return api.shortages('Open').then(r => setShortages(r.data)).catch(fail);
    return api.purchases().then(r => setPurchases(r.data)).catch(fail);
  }, [api, tab, range]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.events('upcoming').then(r => setEvents(r.data)).catch(() => {}); }, [api]);
  const { busy, run } = useAction(load);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">
      <PageHeader
        title="Stock & purchases"
        subtitle="What you own, what is promised to events, what is out, and what is missing"
        action={<div className="flex gap-2">{can(me, 'purchase.request') && <Btn variant="ghost" onClick={() => setModal('purchase')}>Request purchase</Btn>}{manage && items?.length > 0 && <Btn variant="ghost" onClick={() => setModal('labels')}>Print QR labels</Btn>}{manage && <Btn onClick={() => setModal('item')}>+ Item</Btn>}</div>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[['items', 'Items'], ['shortages', `Missing / damaged${meta.openShortages ? ` (${meta.openShortages})` : ''}`], ['purchases', 'Purchase requests']]} />

      {tab === 'items' && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Availability from"><input type="date" className={inputClass} value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></Field>
            <Field label="to"><input type="date" className={inputClass} value={range.to} min={range.from} onChange={e => setRange({ ...range, to: e.target.value })} /></Field>
          </div>
          {!items ? <Spinner /> : items.length === 0 ? <Empty>No stock items yet.</Empty> : (
            <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
              <table className="w-full text-[12px] min-w-[680px]">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 text-left">
                  <tr><th className="px-3 py-2">Item</th><th>Type</th><th>Owned</th><th>Reserved</th><th>Missing / damaged</th><th>Free</th><th>Location</th><th /></tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i._id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{i.itemName}</p>
                        <p className="text-[10px] text-slate-400">{i.itemCode || 'no code'}{i.condition !== 'Good' ? ` · ${i.condition}` : ''}{i.unitCost ? ` · ${money(i.unitCost)}/${i.unit}` : ''}</p>
                      </td>
                      <td><Badge tone={i.stockType === 'Reusable' ? 'blue' : 'violet'}>{i.stockType}</Badge></td>
                      <td>{i.owned} {i.unit}</td>
                      <td>{i.reserved}</td>
                      <td className={i.unavailable ? 'text-rose-600 font-semibold' : ''}>{i.unavailable || '—'}</td>
                      <td className={`font-bold ${i.lowStock ? 'text-amber-600' : 'text-emerald-700'}`}>{i.available}{i.lowStock ? ' (low)' : ''}</td>
                      <td className="text-slate-500">{i.storageLocation || '—'}</td>
                      <td className="pr-3 text-right whitespace-nowrap">
                        <button onClick={() => setModal({ history: i })} className="text-[11px] font-semibold text-violet-700 mr-2 cursor-pointer">History</button>
                        {manage && <button onClick={() => setModal({ edit: i })} className="text-[11px] font-semibold text-slate-600 mr-2 cursor-pointer">Edit</button>}
                        {manage && <button onClick={() => {
                          const change = window.prompt(`Add (e.g. 5) or remove (e.g. -3) ${i.itemName}`);
                          if (!change) return;
                          const note = window.prompt('Reason (stock count, found, broken...)');
                          if (note) run('adj', () => api.adjustStock(i._id, { change: Number(change), note }), 'Stock adjusted');
                        }} className="text-[11px] font-semibold text-slate-600 cursor-pointer">Adjust</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'shortages' && (!shortages ? <Spinner /> : shortages.length === 0 ? <Empty>Nothing missing. Every gate pass came back complete.</Empty> : (
        <div className="space-y-2">
          {shortages.map(s => (
            <Card key={s._id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{s.quantity} {s.itemName} {s.kind.toLowerCase()}</p>
                  <p className="text-[11px] text-slate-500">{s.workspaceId?.title} · gate pass {s.gatePassId?.number}{s.gatePassId?.vehicleNumber ? ` (${s.gatePassId.vehicleNumber})` : ''} · {fmtDate(s.createdAt)}</p>
                </div>
                {owner && (
                  <div className="flex gap-1.5">
                    <Btn variant="ghost" disabled={Boolean(busy)} onClick={() => run('rec', () => api.resolveShortage(s._id, { action: 'recovered', note: window.prompt('Where was it found?') || '' }), 'Recovered')}>Recovered</Btn>
                    <Btn variant="danger" disabled={Boolean(busy)} onClick={() => {
                      const note = window.prompt('Why is it written off?');
                      if (note === null) return;
                      const charge = window.prompt('Charge a loss to the event? Amount in ₹ (0 for none)', '0');
                      run('wo', () => api.resolveShortage(s._id, { action: 'writeoff', note, chargeAmount: Number(charge) || 0 }), 'Written off');
                    }}>Write off</Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ))}

      {tab === 'purchases' && (!purchases ? <Spinner /> : purchases.length === 0 ? <Empty>No purchase requests.</Empty> : (
        <div className="space-y-2">
          {purchases.map(pr => (
            <Card key={pr._id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{pr.number} · {pr.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}</p>
                  <p className="text-[11px] text-slate-500">
                    {pr.workspaceId?.title || 'General'} · by {pr.requestedBy} · {fmtDate(pr.createdAt)}{pr.neededBy ? ` · needed by ${fmtDate(pr.neededBy)}` : ''}
                    {pr.purchase?.amount !== undefined && pr.status === 'Purchased' ? ` · ${money(pr.purchase.amount)} at ${pr.purchase.supplier}` : ''}
                  </p>
                  {pr.reason && <p className="text-[11px] text-slate-600 mt-0.5">{pr.reason}</p>}
                  {pr.rejectionReason && <p className="text-[11px] text-rose-600">Rejected: {pr.rejectionReason}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone={{ Requested: 'amber', Approved: 'blue', Purchased: 'green', Rejected: 'red' }[pr.status] || 'grey'}>{pr.status}</Badge>
                  <div className="flex gap-1.5">
                    {owner && pr.status === 'Requested' && (
                      <>
                        <Btn variant="success" onClick={() => run('ap', () => api.decidePurchase(pr._id, { approve: true }), 'Approved')}>Approve</Btn>
                        <Btn variant="danger" onClick={() => { const r = window.prompt('Reason for rejecting'); if (r) run('rj', () => api.decidePurchase(pr._id, { approve: false, reason: r }), 'Rejected'); }}>Reject</Btn>
                      </>
                    )}
                    {can(me, 'purchase.record') && pr.status === 'Approved' && <Btn onClick={() => setModal({ record: pr })}>Record purchase</Btn>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}

      {modal === 'item' && <ItemForm onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'labels' && <StockLabels items={items || []} onClose={() => setModal(null)} onCodesAssigned={load} />}
      {modal?.edit && <ItemForm item={modal.edit} onClose={() => setModal(null)} onSaved={load} />}
      {modal?.history && <Movements item={modal.history} onClose={() => setModal(null)} />}
      {modal?.record && <RecordPurchase pr={modal.record} onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'purchase' && <PurchaseForm events={events} stockItems={items || []} onClose={() => setModal(null)} onSaved={load} />}
    </div>
  );
};

export default StockPage;
