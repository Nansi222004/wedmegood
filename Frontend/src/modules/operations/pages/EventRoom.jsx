import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOps, can, fmtDate, fmtDateTime, money } from '../opsApi';
import CustomerUpdates from '../CustomerUpdates';
import { Badge, Btn, Card, Empty, Field, Progress, Spinner, Tabs } from '../ui';
import { inputClass } from '../tokens';
import { useAction } from '../useAction';
import TasksSection from '../event/TasksSection';
import StockSection from '../event/StockSection';
import CrewSection from '../event/CrewSection';
import MoneySection from '../event/MoneySection';
import ChangesSection from '../event/ChangesSection';
import ExpenseForm from '../ExpenseForm';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** Plan, risks, customer, quotation and the two customer milestones */
const Overview = ({ ev, reload, events }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const p = ev.permissions;
  const [plan, setPlan] = useState({
    crewRequired: ev.crewRequired || 0,
    reportingTime: ev.reportingTime || '',
    eventEndDate: toDateInput(ev.eventEndDate),
    notes: ev.notes || '',
    transport: ev.transport?.length ? ev.transport : []
  });
  const [copyFrom, setCopyFrom] = useState('');
  const drivers = (ev.members || []).filter(m => m.role === 'Driver');

  return (
    <div className="space-y-3">
      {ev.risks.length > 0 && (
        <Card title="Needs attention">
          <ul className="space-y-1">
            {ev.risks.map((r, i) => (
              <li key={i} className={`text-[12px] font-medium ${r.level === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>{r.level === 'high' ? '●' : '○'} {r.text}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Card title="Event">
          <div className="space-y-1 text-[12px] text-slate-700">
            <p><span className="text-slate-400">Customer:</span> {ev.customer?.name}{ev.customer?.phone ? ` · ${ev.customer.phone}` : ''}</p>
            <p><span className="text-slate-400">When:</span> {fmtDate(ev.eventDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{ev.eventEndDate ? ` to ${fmtDate(ev.eventEndDate)}` : ''}{ev.reportingTime ? ` · report ${ev.reportingTime}` : ''}</p>
            <p><span className="text-slate-400">Venue:</span> {ev.venue || '—'}</p>
            {ev.guestCount > 0 && <p><span className="text-slate-400">Guests:</span> {ev.guestCount}</p>}
            {ev.bookingNotes && <p className="whitespace-pre-line"><span className="text-slate-400">Notes:</span> {ev.bookingNotes}</p>}
          </div>
          {ev.quoteItems.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirmed quotation</p>
              {ev.quoteItems.map((q, i) => (
                <p key={i} className="text-[12px] text-slate-700">{q.quantity > 1 ? `${q.quantity} × ` : ''}{q.service}{q.amount !== undefined ? ` · ${money(q.amount)}` : ''}</p>
              ))}
            </div>
          )}
        </Card>

        <Card title="Customer updates">
          <ol className="space-y-2 text-[12px]">
            <li className={ev.readinessUpdateSentAt ? 'text-emerald-700' : 'text-slate-500'}>
              {ev.readinessUpdateSentAt ? '✓' : '○'} "About 80% ready" update {ev.readinessUpdateSentAt ? `sent ${fmtDateTime(ev.readinessUpdateSentAt)}` : 'goes out automatically at 80%'}
            </li>
            <li className={ev.finalConfirmedAt ? 'text-emerald-700' : 'text-slate-500'}>
              {ev.finalConfirmedAt ? '✓' : '○'} Final "ready" confirmation {ev.finalConfirmedAt ? `by ${ev.finalConfirmedBy}, ${fmtDateTime(ev.finalConfirmedAt)}` : 'only after every mandatory task is verified'}
            </li>
          </ol>
          {p.verify && !ev.finalConfirmedAt && (
            <Btn variant="success" className="mt-3" disabled={!ev.canConfirmReady || Boolean(busy)} onClick={() => run('ready', () => api.confirmReady(ev._id))}>
              {ev.canConfirmReady ? 'Confirm ready to customer' : 'Verify all mandatory tasks first'}
            </Btn>
          )}
          <CustomerUpdates ev={ev} reload={reload} />
        </Card>
      </div>

      {p.manage && (
        <Card title="Plan">
          {ev.tasksTotal === 0 && (
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 mb-3 space-y-2">
              <p className="text-[12px] text-violet-900">Start the checklist from the confirmed quotation (materials, preparation, transport and installation for each item), or copy the plan of a similar past event.</p>
              <div className="flex flex-wrap gap-2">
                <Btn disabled={Boolean(busy)} onClick={() => run('gen', () => api.generateChecklist(ev._id))}>Generate from quotation</Btn>
                <select className={`${inputClass} w-auto`} value={copyFrom} onChange={e => setCopyFrom(e.target.value)}>
                  <option value="">Copy plan from...</option>
                  {events.filter(e => e._id !== ev._id && e.tasksTotal > 0).map(e => <option key={e._id} value={e._id}>{e.title} ({fmtDate(e.eventDate)})</option>)}
                </select>
                {copyFrom && <Btn variant="ghost" onClick={() => run('copy', () => api.copyPlan(ev._id, copyFrom))}>Copy</Btn>}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Field label="Crew needed"><input type="number" min="0" className={inputClass} value={plan.crewRequired} onChange={e => setPlan({ ...plan, crewRequired: e.target.value })} /></Field>
            <Field label="Reporting time"><input type="time" className={inputClass} value={plan.reportingTime} onChange={e => setPlan({ ...plan, reportingTime: e.target.value })} /></Field>
            <Field label="Last day (multi-day)"><input type="date" className={inputClass} value={plan.eventEndDate} min={toDateInput(ev.eventDate)} onChange={e => setPlan({ ...plan, eventEndDate: e.target.value })} /></Field>
          </div>
          <div className="mt-3">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vehicles</p>
            {plan.transport.map((t, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-1.5">
                <input className={`${inputClass} col-span-4`} placeholder="Vehicle no." value={t.vehicle} onChange={e => setPlan({ ...plan, transport: plan.transport.map((x, j) => (j === i ? { ...x, vehicle: e.target.value.toUpperCase() } : x)) })} />
                <select className={`${inputClass} col-span-4`} value={t.driverMemberId || ''} onChange={e => setPlan({ ...plan, transport: plan.transport.map((x, j) => (j === i ? { ...x, driverMemberId: e.target.value || null } : x)) })}>
                  <option value="">Driver</option>{drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <input className={`${inputClass} col-span-3`} placeholder="Loading time" value={t.loadingTime} onChange={e => setPlan({ ...plan, transport: plan.transport.map((x, j) => (j === i ? { ...x, loadingTime: e.target.value } : x)) })} />
                <button className="col-span-1 text-rose-500 cursor-pointer" onClick={() => setPlan({ ...plan, transport: plan.transport.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button className="text-[11px] font-semibold text-violet-700 cursor-pointer" onClick={() => setPlan({ ...plan, transport: [...plan.transport, { vehicle: '', driverMemberId: null, loadingTime: '', notes: '' }] })}>+ Vehicle</button>
          </div>
          <Field label="Notes for the team"><textarea rows={2} className={`${inputClass} resize-none mt-3`} value={plan.notes} onChange={e => setPlan({ ...plan, notes: e.target.value })} /></Field>
          <div className="flex flex-wrap justify-end gap-2 mt-3">
            {ev.opsStatus === 'Planning' || ev.opsStatus === 'Ready' ? <Btn variant="ghost" onClick={() => run('ip', () => api.updateEvent(ev._id, { opsStatus: 'In Progress' }), 'Event in progress')}>Event started</Btn> : null}
            {ev.opsStatus === 'In Progress' && <Btn variant="ghost" onClick={() => window.confirm('Mark the event completed? Its accounts stay open until you close them.') && run('done', () => api.updateEvent(ev._id, { opsStatus: 'Completed' }), 'Event completed')}>Event completed</Btn>}
            <Btn disabled={Boolean(busy)} onClick={() => run('plan', () => api.updateEvent(ev._id, { ...plan, crewRequired: Number(plan.crewRequired) || 0, eventEndDate: plan.eventEndDate || null }), 'Plan saved')}>Save plan</Btn>
          </div>
        </Card>
      )}

      {ev.history?.length > 0 && (
        <Card title="History">
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {[...ev.history].reverse().map((h, i) => <li key={i} className="text-[11px] text-slate-600">{fmtDateTime(h.at)} · {h.action} <span className="text-slate-400">({h.by})</span></li>)}
          </ul>
        </Card>
      )}
    </div>
  );
};

const EventRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, basePath, me } = useOps();
  const [ev, setEv] = useState(null);
  const [error, setError] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('overview');
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(() => api.event(id)
    .then(r => { setEv(r.data); setError(null); })
    .catch(err => setError(err.message)), [api, id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (can(me, 'stock.view')) api.stock().then(r => setStockItems(r.data)).catch(() => {});
    if (can(me, 'tasks.manage')) Promise.all([api.events('upcoming'), api.events('past')]).then(([a, b]) => setEvents([...a.data, ...b.data])).catch(() => {});
  }, [api, me]);

  if (error) return <div className="max-w-xl mx-auto py-16 text-center"><p className="text-[13px] text-rose-600">{error}</p><Btn variant="ghost" className="mt-3" onClick={() => navigate(`${basePath}/events`)}>Back to events</Btn></div>;
  if (!ev) return <Spinner />;

  const p = ev.permissions;
  const tabs = [
    ['overview', 'Overview'],
    ['tasks', `Tasks${ev.overdue ? ` (${ev.overdue} late)` : ''}`],
    ...(can(me, 'stock.view') || ev.gatePasses.length ? [['stock', 'Stock & transport']] : []),
    ['crew', 'Crew'],
    ...(p.finance ? [['money', 'Money']] : []),
    ...(p.owner || ev.changeRequests.length ? [['changes', 'Changes']] : [])
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      <div className="space-y-2">
        <button onClick={() => navigate(`${basePath}/events`)} className="text-[11px] font-semibold text-slate-500 cursor-pointer">← Events</button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-slate-900 leading-tight">{ev.title}</h1>
            <p className="text-[12px] text-slate-500">{fmtDate(ev.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {ev.venue}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={{ Planning: 'grey', Ready: 'green', 'In Progress': 'violet', Completed: 'solid', Cancelled: 'red' }[ev.opsStatus]}>{ev.opsStatus}</Badge>
            {can(me, 'expense.claim') && !p.finance && ev.financeStatus !== 'Closed' && <Btn variant="ghost" onClick={() => setClaiming(true)}>Claim expense</Btn>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1"><Progress value={ev.readiness} /></div>
          <span className="text-[12px] font-semibold text-slate-700">{ev.readiness}% ready · {ev.tasksDone}/{ev.tasksTotal} tasks</span>
        </div>
      </div>

      {ev.opsStatus === 'Cancelled' && <Empty>This booking was cancelled. Its stock reservations were released.</Empty>}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'overview' && <Overview ev={ev} reload={load} events={events} />}
      {tab === 'tasks' && <TasksSection ev={ev} me={me} reload={load} stockItems={stockItems} />}
      {tab === 'stock' && <StockSection ev={ev} reload={load} stockItems={stockItems} />}
      {tab === 'crew' && <CrewSection ev={ev} me={me} reload={load} />}
      {tab === 'money' && p.finance && <MoneySection ev={ev} reload={load} />}
      {tab === 'changes' && <ChangesSection ev={ev} reload={load} />}
      {claiming && <ExpenseForm eventId={ev._id} scope="Event" onClose={() => setClaiming(false)} onSaved={load} />}
    </div>
  );
};

export default EventRoom;
