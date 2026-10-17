import { useState } from 'react';
import { useOps, fmtDateTime } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, Modal } from '../ui';
import { TASK_TONE, inputClass } from '../tokens';
import { useAction, uploadPicked } from '../useAction';

const toLocalInput = (d) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

const EMPTY = { title: '', description: '', quantity: 1, unit: '', deadline: '', mandatory: true, assigneeMemberId: '', requiredStock: [] };

/** Add / edit a task: details, deadline, who does it, stock it needs */
const TaskForm = ({ ev, task, stockItems, onClose, onSaved }) => {
  const { api } = useOps();
  const [f, setF] = useState(task ? {
    title: task.title, description: task.description || '', quantity: task.quantity, unit: task.unit || '',
    deadline: toLocalInput(task.deadline), mandatory: task.mandatory, assigneeMemberId: task.assigneeMemberId || '',
    requiredStock: (task.requiredStock || []).map(r => ({ inventoryId: r.inventoryId?._id || r.inventoryId, quantity: r.quantity }))
  } : EMPTY);
  const { busy, run } = useAction(onSaved);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const save = async () => {
    const body = { ...f, deadline: f.deadline ? new Date(f.deadline).toISOString() : null, assigneeMemberId: f.assigneeMemberId || null, requiredStock: f.requiredStock.filter(r => r.inventoryId && r.quantity > 0) };
    const res = await run('save', () => (task ? api.updateTask(task._id, body) : api.createTask(ev._id, body)), task ? 'Task updated' : 'Task added');
    if (res) onClose();
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose} wide>
      <div className="space-y-3">
        <Field label="Task"><input className={inputClass} value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Groom's decorated coconut" maxLength={200} /></Field>
        <Field label="Details"><textarea rows={3} className={`${inputClass} resize-none`} value={f.description} onChange={e => set('description', e.target.value)} maxLength={2000} /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Quantity"><input type="number" min="0" className={inputClass} value={f.quantity} onChange={e => set('quantity', e.target.value)} /></Field>
          <Field label="Unit"><input className={inputClass} value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs" /></Field>
          <Field label="Deadline"><input type="datetime-local" className={inputClass} value={f.deadline} onChange={e => set('deadline', e.target.value)} /></Field>
        </div>
        <Field label="Assigned to">
          <select className={inputClass} value={f.assigneeMemberId} onChange={e => set('assigneeMemberId', e.target.value)}>
            <option value="">Not assigned</option>
            {(ev.members || []).filter(m => m.role !== 'SubVendor').map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-[12px] text-slate-700">
          <input type="checkbox" checked={f.mandatory} onChange={e => set('mandatory', e.target.checked)} /> Must be verified before the event is confirmed ready
        </label>
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Stock this task needs</p>
          {f.requiredStock.map((r, i) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <select className={inputClass} value={r.inventoryId} onChange={e => set('requiredStock', f.requiredStock.map((x, j) => (j === i ? { ...x, inventoryId: e.target.value } : x)))}>
                <option value="">Choose item</option>
                {stockItems.map(s => <option key={s._id} value={s._id}>{s.itemName} ({s.available} free today)</option>)}
              </select>
              <input type="number" min="0" className={`${inputClass} w-24`} value={r.quantity} onChange={e => set('requiredStock', f.requiredStock.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} />
              <button onClick={() => set('requiredStock', f.requiredStock.filter((_, j) => j !== i))} className="text-rose-500 text-[12px] px-2 cursor-pointer">✕</button>
            </div>
          ))}
          <button onClick={() => set('requiredStock', [...f.requiredStock, { inventoryId: '', quantity: 1 }])} className="text-[11px] font-semibold text-violet-700 cursor-pointer">+ Add item</button>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={busy || !f.title.trim()}>{busy ? 'Saving...' : 'Save task'}</Btn>
        </div>
      </div>
    </Modal>
  );
};

const TaskRow = ({ t, ev, me, onEdit, run, busy }) => {
  const { api } = useOps();
  const mine = me.kind === 'member' && String(t.assigneeMemberId) === String(me.id);
  const p = ev.permissions;
  const assignee = (ev.members || []).find(m => String(m._id) === String(t.assigneeMemberId));
  const overdue = t.deadline && new Date(t.deadline) < new Date() && !['Completed', 'Verified'].includes(t.status);
  const move = (status, extra = {}) => run(`${t._id}:${status}`, () => api.setTaskStatus(t._id, { status, ...extra }), `Marked ${status.toLowerCase()}`);
  const can = (s) => p.manage || (mine && ['Accepted', 'In progress', 'Blocked', 'Completed'].includes(s));

  const complete = async (files) => {
    const url = files?.length ? await uploadPicked(api, files) : null;
    move('Completed', url ? { photos: [url] } : {});
  };

  return (
    <div className={`p-3 rounded-xl border ${overdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">
            {t.title}{t.quantity > 1 ? ` × ${t.quantity}${t.unit ? ` ${t.unit}` : ''}` : ''}
            {!t.mandatory && <span className="text-[10px] font-normal text-slate-400"> (optional)</span>}
          </p>
          <p className="text-[11px] text-slate-500">
            {assignee ? assignee.name : 'Not assigned'}
            {t.deadline && <span className={overdue ? 'text-rose-600 font-semibold' : ''}> · by {fmtDateTime(t.deadline)}</span>}
            {t.verifiedBy && <span> · verified by {t.verifiedBy}</span>}
          </p>
          {t.description && <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-line">{t.description}</p>}
          {(t.requiredStock || []).length > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">Needs: {t.requiredStock.map(r => `${r.quantity} ${r.inventoryId?.unit || ''} ${r.inventoryId?.itemName || 'item'}`).join(', ')}</p>
          )}
          {t.status === 'Blocked' && <p className="text-[11px] text-rose-700 mt-1">Blocked: {t.blockedReason}</p>}
          {t.completionPhotos?.length > 0 && (
            <div className="flex gap-1 mt-1.5">{t.completionPhotos.map(u => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="w-10 h-10 rounded object-cover" /></a>)}</div>
          )}
        </div>
        <Badge tone={TASK_TONE[t.status]}>{t.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {['Assigned', 'Not started'].includes(t.status) && can('Accepted') && <Btn variant="ghost" disabled={busy} onClick={() => move('Accepted')}>Acknowledge</Btn>}
        {['Assigned', 'Accepted', 'Blocked', 'Not started'].includes(t.status) && can('In progress') && <Btn variant="ghost" disabled={busy} onClick={() => move('In progress')}>Start</Btn>}
        {['Accepted', 'In progress', 'Assigned'].includes(t.status) && can('Blocked') && (
          <Btn variant="danger" disabled={busy} onClick={() => { const r = window.prompt('What is blocking this task?'); if (r) move('Blocked', { note: r }); }}>Blocked</Btn>
        )}
        {!['Completed', 'Verified'].includes(t.status) && can('Completed') && (
          <label className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-emerald-600 text-white cursor-pointer">
            Complete (photo)
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => complete(e.target.files)} />
          </label>
        )}
        {!['Completed', 'Verified'].includes(t.status) && can('Completed') && <Btn variant="ghost" disabled={busy} onClick={() => move('Completed')}>Complete</Btn>}
        {t.status === 'Completed' && p.verify && !mine && <Btn variant="success" disabled={busy} onClick={() => move('Verified')}>Verify</Btn>}
        {p.manage && <Btn variant="ghost" onClick={onEdit}>Edit</Btn>}
        {p.manage && t.status !== 'Verified' && (
          <Btn variant="danger" onClick={() => window.confirm('Delete this task?') && run(`${t._id}:del`, () => api.deleteTask(t._id), 'Task deleted')}>Delete</Btn>
        )}
      </div>
    </div>
  );
};

const TasksSection = ({ ev, me, reload, stockItems }) => {
  const { busy, run } = useAction(reload);
  const [editing, setEditing] = useState(null); // null | 'new' | task
  const [filter, setFilter] = useState('open');
  const tasks = ev.tasks.filter(t => (filter === 'open' ? t.status !== 'Verified' : filter === 'done' ? t.status === 'Verified' : true));

  return (
    <Card
      title={`Checklist (${ev.tasksDone}/${ev.tasksTotal} done)`}
      action={ev.permissions.manage && <Btn onClick={() => setEditing('new')}>+ Task</Btn>}
    >
      <div className="flex gap-1.5 mb-3">
        {[['open', 'Open'], ['done', 'Verified'], ['all', 'All']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${filter === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
        ))}
      </div>
      {tasks.length === 0 ? <Empty>{ev.tasksTotal === 0 ? 'No tasks yet.' : 'Nothing here.'}</Empty> : (
        <div className="space-y-2">{tasks.map(t => <TaskRow key={t._id} t={t} ev={ev} me={me} run={run} busy={Boolean(busy)} onEdit={() => setEditing(t)} />)}</div>
      )}
      {editing && <TaskForm ev={ev} task={editing === 'new' ? null : editing} stockItems={stockItems} onClose={() => setEditing(null)} onSaved={reload} />}
    </Card>
  );
};

export default TasksSection;
