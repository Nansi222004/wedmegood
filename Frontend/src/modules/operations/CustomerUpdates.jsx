import { useState } from 'react';
import { useOps, fmtDateTime } from './opsApi';
import { Badge, Btn, Field } from './ui';
import { inputClass } from './tokens';
import { useAction } from './useAction';

const TONE = { Pending: 'amber', Sent: 'green', Discarded: 'grey' };

/** Updates to the customer: held ones for the owner to edit and send or discard, and the owner's own note */
const CustomerUpdates = ({ ev, reload }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const [editing, setEditing] = useState(null);   // { id, title, message }
  const [writing, setWriting] = useState(null);   // { title, message }
  const updates = ev.customerUpdates || [];
  const owner = ev.permissions?.owner;
  const pending = updates.filter(u => u.status === 'Pending');

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      {pending.length > 0 && (
        <p className="text-[11px] font-semibold text-amber-700">
          {pending.length} update(s) waiting for {owner ? 'your' : 'the owner\'s'} review before the customer sees them.
        </p>
      )}
      {updates.map(u => (
        <div key={u._id} className={`p-2 rounded-lg text-[12px] ${u.status === 'Pending' ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
          {editing?.id === u._id ? (
            <div className="space-y-1.5">
              <input className={inputClass} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              <textarea rows={3} className={inputClass} value={editing.message} onChange={e => setEditing({ ...editing, message: e.target.value })} />
              <div className="flex gap-1.5 justify-end">
                <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
                <Btn disabled={Boolean(busy)} onClick={() => run(`s${u._id}`, () => api.decideCustomerUpdate(ev._id, u._id, { action: 'send', title: editing.title, message: editing.message })).then(r => r && setEditing(null))}>Send edited</Btn>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{u.title}</p>
                <Badge tone={TONE[u.status]}>{u.status}</Badge>
              </div>
              <p className="text-slate-600 mt-0.5">{u.message}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {u.createdBy === 'system' ? 'Automatic' : u.createdBy} · {fmtDateTime(u.createdAt)}
                {u.decidedAt && u.status !== 'Pending' ? ` · ${u.status.toLowerCase()} by ${u.decidedBy}` : ''}
              </p>
              {owner && u.status === 'Pending' && (
                <div className="flex gap-1.5 mt-1.5">
                  <Btn variant="success" disabled={Boolean(busy)} onClick={() => run(`s${u._id}`, () => api.decideCustomerUpdate(ev._id, u._id, { action: 'send' }))}>Send</Btn>
                  <Btn variant="ghost" onClick={() => setEditing({ id: u._id, title: u.title, message: u.message })}>Edit</Btn>
                  <Btn variant="danger" disabled={Boolean(busy)} onClick={() => run(`d${u._id}`, () => api.decideCustomerUpdate(ev._id, u._id, { action: 'discard' }))}>Discard</Btn>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {owner && (writing ? (
        <div className="space-y-1.5">
          <Field label="Title"><input className={inputClass} value={writing.title} onChange={e => setWriting({ ...writing, title: e.target.value })} /></Field>
          <Field label="Message"><textarea rows={3} className={inputClass} value={writing.message} onChange={e => setWriting({ ...writing, message: e.target.value })} /></Field>
          <div className="flex gap-1.5 justify-end">
            <Btn variant="ghost" onClick={() => setWriting(null)}>Cancel</Btn>
            <Btn disabled={Boolean(busy) || !writing.title.trim() || writing.message.trim().length < 5} onClick={() => run('custom', () => api.sendCustomerUpdate(ev._id, writing)).then(r => r && setWriting(null))}>Send to customer</Btn>
          </div>
        </div>
      ) : (
        <button className="text-[12px] font-semibold text-violet-700 cursor-pointer" onClick={() => setWriting({ title: '', message: '' })}>+ Write an update to the customer</button>
      ))}
    </div>
  );
};

export default CustomerUpdates;
