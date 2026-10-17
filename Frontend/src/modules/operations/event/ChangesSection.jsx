import { useState } from 'react';
import { useOps, fmtDate, money } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, Modal } from '../ui';
import { inputClass } from '../tokens';
import { useAction } from '../useAction';

const TONE = { Pending: 'amber', Approved: 'green', Rejected: 'red', Withdrawn: 'grey' };

/** Extra work after confirmation: the customer approves it before it is done or charged */
const ChangesSection = ({ ev, reload }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', description: '', amount: '' });

  return (
    <Card title="Change requests" action={ev.permissions.owner && <Btn onClick={() => setOpen(true)}>+ Change request</Btn>}>
      <p className="text-[11px] text-slate-500 mb-2">Extra work needs the customer's approval. Approved work becomes a task and its price is added to the contract.</p>
      {ev.changeRequests.length === 0 ? <Empty>No change requests.</Empty> : (
        <div className="space-y-1.5">
          {ev.changeRequests.map(c => (
            <div key={c._id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50 text-[12px]">
              <div>
                <p className="font-semibold text-slate-800">{c.title}{c.amount !== undefined && c.amount > 0 ? ` · ${money(c.amount)}` : ''}</p>
                <p className="text-[10px] text-slate-500">{fmtDate(c.createdAt)}{c.description ? ` · ${c.description}` : ''}{c.customerNote ? ` · customer: "${c.customerNote}"` : ''}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={TONE[c.status]}>{c.status}</Badge>
                {c.status === 'Pending' && ev.permissions.owner && (
                  <button className="text-[10px] text-slate-500 cursor-pointer" onClick={() => run(`w${c._id}`, () => api.withdrawChangeRequest(c._id), 'Withdrawn')}>Withdraw</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Propose extra work" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="What"><input className={inputClass} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="e.g. Extra flower wall at the entrance" /></Field>
            <Field label="Details"><textarea rows={3} className={`${inputClass} resize-none`} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
            <Field label="Extra price (₹)" hint="0 if it is free"><input type="number" min="0" className={inputClass} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              <Btn disabled={Boolean(busy) || !f.title.trim()} onClick={async () => {
                if (await run('cr', () => api.createChangeRequest(ev._id, { ...f, amount: Number(f.amount) || 0 }))) { setOpen(false); setF({ title: '', description: '', amount: '' }); }
              }}>Send to customer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default ChangesSection;
