import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { createOpsApi, money } from '../../operations/opsApi';
import { vendorApi } from '../vendorApi';
import { toast } from '../../../components/ui/Toast';

const getToken = () => localStorage.getItem('vendorToken');
const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

const Panel = ({ title, to, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col min-w-0">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-extrabold text-slate-800">{title}</h3>
      {to && <Link to={to} className="text-[10px] font-bold text-[#7C3AED]">Open</Link>}
    </div>
    <div className="space-y-1.5 text-[11px] text-slate-600 flex-1">{children}</div>
  </div>
);

const Empty = ({ children }) => <p className="text-slate-400">{children}</p>;

const EventRows = ({ events }) => events.length === 0 ? <Empty>No events.</Empty> : events.map(e => (
  <Link key={e._id} to={`/vendor/ops/events/${e._id}`} className="block rounded-lg bg-slate-50 px-2 py-1.5 hover:bg-purple-50">
    <div className="flex justify-between gap-2">
      <span className="font-bold text-slate-800 truncate">{e.title}</span>
      <span className={`font-bold shrink-0 ${e.readiness >= 80 ? 'text-emerald-600' : e.readiness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{e.readiness}%</span>
    </div>
    <div className="text-[10px] text-slate-500 truncate">
      {[e.reportingTime && `Report ${e.reportingTime}`, e.venue, e.openTasks ? `${e.openTasks} open task(s)` : 'All tasks done'].filter(Boolean).join(' · ')}
    </div>
  </Link>
));

/** The vendor's own checklist for today. Unfinished tasks from earlier days stay on it until done. */
const TodoList = ({ todos, onToggle, onRemove, empty }) => {
  if (todos.length === 0) return empty ? <Empty>{empty}</Empty> : null;
  return (
    <ul className="space-y-1">
      {todos.map(t => (
        <li key={t._id} className="flex items-start gap-2 rounded-lg bg-violet-50/60 px-2 py-1.5">
          <input
            type="checkbox"
            checked={t.done}
            onChange={() => onToggle(t)}
            aria-label={`Mark "${t.text}" ${t.done ? 'not done' : 'done'}`}
            className="mt-0.5 h-3.5 w-3.5 accent-[#7C3AED] cursor-pointer shrink-0"
          />
          <span className={`flex-1 min-w-0 break-words ${t.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
            {t.text}
            {t.carriedOver && !t.done && <span className="ml-1.5 text-[9px] font-bold text-amber-600 uppercase">earlier</span>}
          </span>
          {onRemove && (
            <button type="button" onClick={() => onRemove(t)} aria-label={`Delete "${t.text}"`} className="text-slate-300 hover:text-rose-500 text-xs leading-none cursor-pointer shrink-0">✕</button>
          )}
        </li>
      ))}
    </ul>
  );
};

const TaskDialog = ({ todos, onAdd, onToggle, onRemove, onClose }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    const ok = await onAdd(text.trim());
    setSaving(false);
    if (ok) setText('');
  };

  // On the page body, so it sits above the bottom navigation and floating buttons
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Today's tasks">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Today's tasks</h3>
            <p className="text-[11px] text-slate-500">Your to-do list. Tick things off as you finish them.</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 cursor-pointer" aria-label="Close">✕</button>
        </div>

        <form onSubmit={submit} className="flex gap-2 mb-3">
          <input
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={200}
            placeholder="Add a task, e.g. Call the florist"
            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:bg-white focus:border-violet-300 outline-none"
          />
          <button disabled={!text.trim() || saving} className="px-3.5 rounded-lg bg-[#7C3AED] text-white text-[12px] font-bold disabled:opacity-50 cursor-pointer">Add</button>
        </form>

        <div className="overflow-y-auto text-[12px]">
          <TodoList todos={todos} onToggle={onToggle} onRemove={onRemove} empty="No tasks yet. Add the first one above." />
        </div>
      </div>
    </div>,
    document.body
  );
};

// Answers the owner's five daily questions: today, tomorrow, leads, money in and out, risks
const DailyBrief = () => {
  const api = useMemo(() => createOpsApi(getToken), []);
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');
  const [todos, setTodos] = useState([]);
  const [taskOpen, setTaskOpen] = useState(false);

  useEffect(() => {
    api.brief().then(r => setBrief(r.data)).catch(e => setError(e.message));
  }, [api]);

  useEffect(() => {
    vendorApi.getTodos(getToken()).then(r => { if (r?.success) setTodos(r.data.tasks); }).catch(() => {});
  }, []);

  const addTodo = async (text) => {
    try {
      const r = await vendorApi.addTodo(text, getToken());
      if (!r?.success) throw new Error(r?.message || 'Could not add the task');
      setTodos(list => [...list, r.data]);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const toggleTodo = async (t) => {
    setTodos(list => list.map(x => (x._id === t._id ? { ...x, done: !t.done } : x)));  // tick straight away
    try {
      const r = await vendorApi.updateTodo(t._id, { done: !t.done }, getToken());
      if (!r?.success) throw new Error(r?.message);
    } catch {
      setTodos(list => list.map(x => (x._id === t._id ? { ...x, done: t.done } : x)));
      toast.error('Could not update the task');
    }
  };

  const removeTodo = async (t) => {
    const before = todos;
    setTodos(list => list.filter(x => x._id !== t._id));
    try {
      const r = await vendorApi.deleteTodo(t._id, getToken());
      if (!r?.success) throw new Error(r?.message);
    } catch {
      setTodos(before);
      toast.error('Could not delete the task');
    }
  };

  if (error) return null;
  if (!brief) return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />;

  const { today, tomorrow, leads, money: m, risks } = brief;
  const leadCount = leads.pendingOffers + leads.needReply.length + leads.revisionRequests.length;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-heading font-extrabold text-slate-800">Tasks</h2>
        <button
          type="button"
          onClick={() => setTaskOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
        >
          <span className="text-sm leading-none">+</span> Add task
        </button>
      </div>
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <Panel title={`Today (${today.events.length + todos.filter(t => !t.done).length})`} to="/vendor/ops/events">
          <TodoList todos={todos} onToggle={toggleTodo} />
          <EventRows events={today.events} />
        </Panel>

        <Panel title={`Tomorrow (${tomorrow.events.length})`} to="/vendor/ops/events">
          <EventRows events={tomorrow.events} />
          {tomorrow.gatePassesDue > 0 && <p className="text-amber-700 font-semibold">{tomorrow.gatePassesDue} gate pass return(s) due</p>}
        </Panel>

        <Panel title={`Leads needing you (${leadCount})`} to="/vendor/leads">
          {leadCount === 0 && <Empty>Nothing waiting.</Empty>}
          {leads.pendingOffers > 0 && <p className="font-bold text-rose-600">{leads.pendingOffers} new offer(s) to accept or decline</p>}
          {leads.needReply.slice(0, 3).map(l => (
            <p key={l._id} className="truncate">
              <span className="font-semibold text-slate-800">{l.customerName || 'Customer'}</span> · {l.category}
              {l.status === 'Accepted' ? ' · call them' : ' · reply'}{l.eventDate ? ` · ${shortDate(l.eventDate)}` : ''}
            </p>
          ))}
          {leads.revisionRequests.length > 0 && (
            <Link to="/vendor/quotes" className="block font-semibold text-amber-700">{leads.revisionRequests.length} quote(s): customer asked for changes</Link>
          )}
          {leads.quotesExpiringToday > 0 && <p className="text-slate-500">{leads.quotesExpiringToday} quote(s) expire within a day</p>}
        </Panel>

        <Panel title="Money" to="/vendor/ops/accounts">
          <div className="flex justify-between"><span>Customers owe you</span><span className="font-bold text-emerald-700">{money(m.owedToMe.total)}</span></div>
          {m.owedToMe.items.slice(0, 2).map(o => (
            <p key={o._id} className="text-[10px] text-slate-500 truncate pl-2">{o.customerName} · {money(o.balance)}{o.eventDate ? ` · ${shortDate(o.eventDate)}` : ''}</p>
          ))}
          <div className="flex justify-between pt-1 border-t border-slate-100"><span>You need to pay</span><span className="font-bold text-rose-600">{money(m.iOwe.total)}</span></div>
          {m.iOwe.items.slice(0, 2).map(o => (
            <p key={o._id} className="text-[10px] text-slate-500 truncate pl-2">{o.payee} · {money(o.amount)}</p>
          ))}
          {(m.pendingClaims.count > 0 || m.purchaseRequests > 0 || m.packagesToApprove > 0) && (
            <p className="text-amber-700 font-semibold pt-1 border-t border-slate-100">
              {[m.pendingClaims.count && `${m.pendingClaims.count} claim(s)`, m.purchaseRequests && `${m.purchaseRequests} purchase request(s)`, m.packagesToApprove && `${m.packagesToApprove} sub-vendor job(s)`].filter(Boolean).join(', ')} to approve
            </p>
          )}
        </Panel>

        <Panel title={`Risks (${risks.length})`}>
          {risks.length === 0 ? <Empty>No risks right now.</Empty> : risks.slice(0, 5).map((r, i) => (
            <Link key={i} to={r.link} className={`block rounded-lg px-2 py-1 font-semibold ${r.level === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
              {r.text}
            </Link>
          ))}
        </Panel>
      </div>

      {taskOpen && <TaskDialog todos={todos} onAdd={addTodo} onToggle={toggleTodo} onRemove={removeTodo} onClose={() => setTaskOpen(false)} />}
    </section>
  );
};

export default DailyBrief;
