import { useState } from 'react';
import { useOps, fmtDate, fmtDateTime, money } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, Modal } from '../ui';
import { inputClass } from '../tokens';
import { useAction } from '../useAction';
import PurchaseForm from '../PurchaseForm';
import CodeScanner from '../CodeScanner';

const GP_TONE = { Draft: 'grey', Dispatched: 'violet', Received: 'blue', Returned: 'amber', Closed: 'green' };

const ReserveForm = ({ ev, stockItems, onClose, reload }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const [f, setF] = useState({ inventoryId: '', quantity: 1 });
  return (
    <Modal title="Reserve stock for this event" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Item">
          <select className={inputClass} value={f.inventoryId} onChange={e => setF({ ...f, inventoryId: e.target.value })}>
            <option value="">Choose item</option>
            {stockItems.filter(s => s.stockType === 'Reusable').map(s => <option key={s._id} value={s._id}>{s.itemName} · {s.owned} owned</option>)}
          </select>
        </Field>
        <Field label="Quantity" hint="Checked against every other event holding this item on overlapping dates.">
          <input type="number" min="1" className={inputClass} value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !f.inventoryId} onClick={async () => { if (await run('r', () => api.reserve(ev._id, { inventoryId: f.inventoryId, quantity: Number(f.quantity) }), 'Reserved')) onClose(); }}>Reserve</Btn>
        </div>
      </div>
    </Modal>
  );
};

const GatePassForm = ({ ev, stockItems, onClose, reload }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  // Start from what is reserved for this event
  const [lines, setLines] = useState(ev.reservations.map(r => ({ inventoryId: r.inventoryId?._id, qtyOut: r.quantity })));
  const [f, setF] = useState({ vehicleNumber: ev.transport?.[0]?.vehicle || '', driverName: '', driverMemberId: ev.transport?.[0]?.driverMemberId || '', destination: ev.venue || '', trip: 1 });
  const drivers = (ev.members || []).filter(m => m.role === 'Driver');
  const save = async () => {
    const body = { ...f, items: lines.filter(l => l.inventoryId && Number(l.qtyOut) > 0).map(l => ({ ...l, qtyOut: Number(l.qtyOut) })) };
    if (await run('gp', () => api.createGatePass(ev._id, body), 'Gate pass created')) onClose();
  };
  return (
    <Modal title="New gate pass" onClose={onClose} wide>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Vehicle number"><input className={inputClass} value={f.vehicleNumber} onChange={e => setF({ ...f, vehicleNumber: e.target.value.toUpperCase() })} placeholder="TS09AB1234" /></Field>
          <Field label="Trip"><input type="number" min="1" className={inputClass} value={f.trip} onChange={e => setF({ ...f, trip: e.target.value })} /></Field>
          <Field label="Driver">
            <select className={inputClass} value={f.driverMemberId} onChange={e => { const d = drivers.find(x => x._id === e.target.value); setF({ ...f, driverMemberId: e.target.value, driverName: d?.name || f.driverName }); }}>
              <option value="">Other / outside driver</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Driver name"><input className={inputClass} value={f.driverName} onChange={e => setF({ ...f, driverName: e.target.value })} /></Field>
        </div>
        <Field label="Destination"><input className={inputClass} value={f.destination} onChange={e => setF({ ...f, destination: e.target.value })} /></Field>
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Items going out</p>
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <select className={inputClass} value={l.inventoryId || ''} onChange={e => setLines(lines.map((x, j) => (j === i ? { ...x, inventoryId: e.target.value } : x)))}>
                <option value="">Choose item</option>
                {stockItems.map(s => <option key={s._id} value={s._id}>{s.itemName} ({s.stockType})</option>)}
              </select>
              <input type="number" min="0" className={`${inputClass} w-24`} value={l.qtyOut} onChange={e => setLines(lines.map((x, j) => (j === i ? { ...x, qtyOut: e.target.value } : x)))} />
              <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-rose-500 px-2 cursor-pointer">✕</button>
            </div>
          ))}
          <button onClick={() => setLines([...lines, { inventoryId: '', qtyOut: 1 }])} className="text-[11px] font-semibold text-violet-700 cursor-pointer">+ Add item</button>
          <p className="text-[10px] text-slate-400 mt-1">Reusable items can only leave up to the quantity reserved for this event.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy} onClick={save}>Create gate pass</Btn>
        </div>
      </div>
    </Modal>
  );
};

const ReturnForm = ({ pass, onClose, reload }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const [lines, setLines] = useState(pass.items.map((l, index) => ({ index, qtyReturned: l.qtyOut, qtyDamaged: 0 })));
  const set = (i, k, v) => setLines(lines.map(x => (x.index === i ? { ...x, [k]: Number(v) } : x)));
  return (
    <Modal title={`Return check · ${pass.number}`} onClose={onClose} wide>
      <div className="space-y-2">
        <p className="text-[11px] text-slate-500">Count what came back. Missing or damaged reusable stock opens a shortage record for the owner. It is never taken off the books silently.</p>
        {pass.items.map((l, i) => {
          const row = lines.find(x => x.index === i);
          const missing = l.stockType === 'Reusable' ? l.qtyOut - row.qtyReturned - row.qtyDamaged : 0;
          return (
            <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50">
              <div className="col-span-5 text-[12px] font-semibold text-slate-800">{l.name}<span className="block text-[10px] font-normal text-slate-400">{l.stockType} · {l.qtyOut} went out</span></div>
              <label className="col-span-3 text-[10px] text-slate-500">Returned<input type="number" min="0" max={l.qtyOut} className={inputClass} value={row.qtyReturned} onChange={e => set(i, 'qtyReturned', e.target.value)} /></label>
              {l.stockType === 'Reusable' ? (
                <label className="col-span-2 text-[10px] text-slate-500">Damaged<input type="number" min="0" className={inputClass} value={row.qtyDamaged} onChange={e => set(i, 'qtyDamaged', e.target.value)} /></label>
              ) : <span className="col-span-2 text-[10px] text-slate-500">Used: {l.qtyOut - row.qtyReturned}</span>}
              <span className={`col-span-2 text-[11px] font-bold text-right ${missing > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{l.stockType === 'Reusable' ? (missing > 0 ? `${missing} missing` : 'OK') : ''}</span>
            </div>
          );
        })}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy} onClick={async () => { if (await run('ret', () => api.returnGatePass(pass._id, { items: lines }))) onClose(); }}>Save return</Btn>
        </div>
      </div>
    </Modal>
  );
};

const GatePassCard = ({ pass, ev, run, busy, onReturn, reload }) => {
  const { api } = useOps();
  const p = ev.permissions;
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  // Each scan marks one line packed; the scanner stays open for the next item
  const onScan = (code) => api.packGatePass(pass._id, { code })
    .then(r => setScanStatus({ ok: true, text: `✓ ${r.message}` }))
    .catch(err => setScanStatus({ ok: false, text: err.message }));
  const closeScanner = () => { setScanning(false); setScanStatus(null); reload(); };
  return (
    <div className="p-3 rounded-xl border border-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-slate-900">{pass.number} · trip {pass.trip}</p>
          <p className="text-[11px] text-slate-500">
            {pass.vehicleNumber || 'No vehicle yet'}{pass.driverName ? ` · ${pass.driverName}` : ''}
            {pass.issuedAt && ` · out ${fmtDateTime(pass.issuedAt)} by ${pass.issuedBy}`}
            {pass.receivedAt && ` · received by ${pass.receivedBy}`}
            {pass.returnDueDate && pass.status !== 'Closed' && ` · return due ${fmtDate(pass.returnDueDate)}`}
          </p>
        </div>
        <Badge tone={GP_TONE[pass.status]}>{pass.status}</Badge>
      </div>
      <div className="mt-2 space-y-1">
        {pass.items.map((l, i) => (
          <label key={i} className="flex items-center justify-between gap-2 text-[12px]">
            <span className="flex items-center gap-2">
              {pass.status === 'Draft' && p.gatepass && (
                <input type="checkbox" checked={l.packed} onChange={e => run(`pk${i}`, () => api.packGatePass(pass._id, { index: i, packed: e.target.checked }), '')} />
              )}
              {l.name}
            </span>
            <span className="text-slate-500">
              {l.qtyOut} out
              {pass.status !== 'Draft' && pass.status !== 'Dispatched' && pass.status !== 'Received' && ` · ${l.qtyReturned} back${l.qtyMissing ? ` · ${l.qtyMissing} missing` : ''}${l.qtyDamaged ? ` · ${l.qtyDamaged} damaged` : ''}${l.qtyConsumed ? ` · ${l.qtyConsumed} used` : ''}`}
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {pass.status === 'Draft' && p.gatepass && (
          <>
            <Btn variant="ghost" disabled={busy} onClick={() => setScanning(true)}>Scan items</Btn>
            <Btn disabled={busy} onClick={() => run('d', () => api.dispatchGatePass(pass._id))}>Dispatch</Btn>
          </>
        )}
        {pass.status === 'Dispatched' && <Btn variant="ghost" disabled={busy} onClick={() => run('rcv', () => api.receiveGatePass(pass._id, {}), 'Received at venue')}>Received at venue</Btn>}
        {['Dispatched', 'Received'].includes(pass.status) && p.gatepass && <Btn variant="dark" onClick={onReturn}>Record return</Btn>}
      </div>
      {scanning && (
        <CodeScanner
          title={`Pack ${pass.number}`}
          status={scanStatus}
          onCode={onScan}
          onClose={closeScanner}
        />
      )}
    </div>
  );
};

const StockSection = ({ ev, reload, stockItems }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const [modal, setModal] = useState(null); // 'reserve' | 'gatepass' | 'purchase' | {return: pass}
  const p = ev.permissions;

  return (
    <div className="space-y-3">
      <Card title="Stock needed vs reserved" action={(p.stock || p.manage) && <Btn variant="ghost" onClick={() => setModal('reserve')}>+ Reserve</Btn>}>
        {ev.stockNeeds.length === 0 ? <Empty>Add the stock each task needs, or reserve items for this event.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400 text-left">
                <tr><th className="py-1">Item</th><th>Needed</th><th>Reserved</th><th>Still free</th><th>Short</th></tr>
              </thead>
              <tbody>
                {ev.stockNeeds.map(n => (
                  <tr key={n.inventoryId} className="border-t border-slate-100">
                    <td className="py-1.5 font-semibold text-slate-800">{n.name}</td>
                    <td>{n.required}</td><td>{n.reserved}</td><td>{n.freeForThisEvent}</td>
                    <td className={n.shortBy ? 'text-rose-600 font-bold' : 'text-emerald-600'}>{n.shortBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ev.reservations.length > 0 && (
          <div className="mt-3 space-y-1">
            {ev.reservations.map(r => (
              <div key={r._id} className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Reserved {r.quantity} {r.inventoryId?.unit} {r.inventoryId?.itemName} ({fmtDate(r.fromDate)} – {fmtDate(r.toDate)})</span>
                {(p.stock || p.manage) && <button onClick={() => run('rel', () => api.releaseReservation(r._id), 'Released')} className="text-rose-600 font-semibold cursor-pointer">Release</button>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {(p.gatepass || ev.gatePasses.length > 0) && (
        <Card title="Gate passes" action={p.gatepass && <Btn variant="ghost" onClick={() => setModal('gatepass')}>+ Gate pass</Btn>}>
          {ev.gatePasses.length === 0 ? <Empty>No material has left for this event yet.</Empty> : (
            <div className="space-y-2">{ev.gatePasses.map(g => <GatePassCard key={g._id} pass={g} ev={ev} run={run} busy={Boolean(busy)} reload={reload} onReturn={() => setModal({ return: g })} />)}</div>
          )}
        </Card>
      )}

      <Card title="Purchases for this event" action={<Btn variant="ghost" onClick={() => setModal('purchase')}>+ Request purchase</Btn>}>
        {ev.purchases.length === 0 ? <Empty>No purchase requests.</Empty> : (
          <div className="space-y-1.5">
            {ev.purchases.map(pr => (
              <div key={pr._id} className="flex items-start justify-between gap-2 text-[12px] p-2 rounded-lg bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-800">{pr.number} · {pr.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}</p>
                  <p className="text-[10px] text-slate-500">by {pr.requestedBy}{pr.neededBy ? ` · needed by ${fmtDate(pr.neededBy)}` : ''}{pr.purchase?.amount ? ` · ${money(pr.purchase.amount)} at ${pr.purchase.supplier}` : ''}{pr.rejectionReason ? ` · ${pr.rejectionReason}` : ''}</p>
                </div>
                <Badge tone={{ Requested: 'amber', Approved: 'blue', Purchased: 'green', Rejected: 'red' }[pr.status] || 'grey'}>{pr.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {modal === 'reserve' && <ReserveForm ev={ev} stockItems={stockItems} onClose={() => setModal(null)} reload={reload} />}
      {modal === 'gatepass' && <GatePassForm ev={ev} stockItems={stockItems} onClose={() => setModal(null)} reload={reload} />}
      {modal === 'purchase' && <PurchaseForm eventId={ev._id} stockItems={stockItems} onClose={() => setModal(null)} onSaved={reload} />}
      {modal?.return && <ReturnForm pass={modal.return} onClose={() => setModal(null)} reload={reload} />}
    </div>
  );
};

export default StockSection;
