import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOps, can, fmtDate, money } from '../opsApi';
import { Badge, Card, Empty, PageHeader, Progress, Spinner, Tabs } from '../ui';
import { toast } from '../../../components/ui/Toast';
import ReviewToggle from '../ReviewToggle';

const STATUS_TONE = { Planning: 'grey', Ready: 'green', 'In Progress': 'violet', Completed: 'solid', Cancelled: 'red' };

const EventCard = ({ e, onOpen }) => (
  <button onClick={onOpen} className="w-full text-left bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-violet-200 transition-colors cursor-pointer">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 truncate">{e.title}</p>
        <p className="text-[11px] text-slate-500">{fmtDate(e.eventDate, { weekday: 'short', day: 'numeric', month: 'short' })} · {e.venue || 'Venue TBD'}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge tone={STATUS_TONE[e.opsStatus]}>{e.opsStatus}</Badge>
        {e.financeStatus === 'Closed' && <Badge tone="grey">Accounts closed</Badge>}
      </div>
    </div>
    <div className="mt-3 flex items-center gap-3">
      <div className="flex-1"><Progress value={e.readiness} /></div>
      <span className="text-[11px] font-semibold text-slate-600 w-20 text-right">{e.readiness}% ready</span>
    </div>
    <p className="text-[10px] text-slate-400 mt-1.5">
      {e.tasksDone}/{e.tasksTotal} tasks done
      {e.overdue > 0 && <span className="text-rose-600 font-semibold"> · {e.overdue} overdue</span>}
      {e.finalConfirmed && <span className="text-emerald-600 font-semibold"> · confirmed to customer</span>}
    </p>
  </button>
);

const BoardRow = ({ e, onOpen, finance }) => (
  <Card className="space-y-3">
    <div className="flex items-start justify-between gap-2">
      <button onClick={onOpen} className="text-left cursor-pointer">
        <p className="text-[14px] font-semibold text-slate-900">{e.title}</p>
        <p className="text-[11px] text-slate-500">
          {fmtDate(e.eventDate, { weekday: 'long', day: 'numeric', month: 'short' })}{e.reportingTime ? ` · report ${e.reportingTime}` : ''} · {e.venue}
        </p>
      </button>
      <span className={`text-[20px] font-bold ${e.readiness >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{e.readiness}%</span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
      <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400">Crew</p><p className="font-semibold">{e.crewConfirmed} / {e.crewRequired || '—'}</p></div>
      <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400">Stock short</p><p className={`font-semibold ${e.stockShort.length ? 'text-rose-600' : ''}`}>{e.stockShort.length ? e.stockShort.map(s => `${s.name} ${s.shortBy}`).join(', ') : 'None'}</p></div>
      <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400">Sub-vendors</p><p className="font-semibold">{e.subVendorsConfirmed} / {e.subVendorsTotal}</p></div>
      <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400">Transport</p><p className="font-semibold">{e.transport.length ? e.transport.map(t => t.vehicle || 'Vehicle').join(', ') : 'Not planned'}</p></div>
      {e.pendingPurchases.length > 0 && <div className="p-2 rounded-lg bg-amber-50 col-span-2"><p className="text-amber-700">To buy</p><p className="font-semibold">{e.pendingPurchases.map(p => p.number).join(', ')}</p></div>}
      {finance && e.money && <div className="p-2 rounded-lg bg-slate-50 col-span-2"><p className="text-slate-400">Money</p><p className="font-semibold">Customer owes {money(e.money.outstandingFromCustomer)} · unpaid costs {money(e.money.unpaidCosts)}</p></div>}
    </div>
    {e.risks.length > 0 ? (
      <ul className="space-y-1">
        {e.risks.map((r, i) => (
          <li key={i} className={`text-[11px] font-medium flex gap-1.5 ${r.level === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>
            <span>{r.level === 'high' ? '●' : '○'}</span>{r.text}
          </li>
        ))}
      </ul>
    ) : <p className="text-[11px] text-emerald-700 font-medium">No risks flagged.</p>}
  </Card>
);

const EventsPage = () => {
  const { api, basePath, me } = useOps();
  const navigate = useNavigate();
  const seeAll = can(me, 'events.view');
  const [tab, setTab] = useState(seeAll ? 'board' : 'upcoming');
  const [events, setEvents] = useState(null);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    let alive = true;
    (tab === 'board' ? api.board(2) : api.events(tab))
      .then(r => {
        if (!alive) return;
        if (tab === 'board') setBoard(r.data);
        else setEvents(r.data);
      })
      .catch(err => alive && toast.error(err.message));
    return () => { alive = false; };
  }, [api, tab]);

  const open = (id) => navigate(`${basePath}/events/${id}`);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8">
      <PageHeader title="Events" subtitle="Every confirmed booking gets its own control room" action={<ReviewToggle />} />
      <Tabs
        value={tab}
        onChange={(t) => { setTab(t); setEvents(null); setBoard(null); }}
        tabs={[...(seeAll ? [['board', 'Today & tomorrow']] : []), ['upcoming', 'Upcoming'], ['past', 'Past']]}
      />
      {tab === 'board' ? (
        !board ? <Spinner /> : board.length === 0 ? <Empty>No events in the next 2 days.</Empty> : (
          <div className="space-y-3">{board.map(e => <BoardRow key={e._id} e={e} onOpen={() => open(e._id)} finance={can(me, 'finance.view')} />)}</div>
        )
      ) : !events ? <Spinner /> : events.length === 0 ? (
        <Empty>{seeAll ? 'No events here yet. Events appear automatically when a booking is created.' : 'You have not been given work on any event yet.'}</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">{events.map(e => <EventCard key={e._id} e={e} onOpen={() => open(e._id)} />)}</div>
      )}
    </div>
  );
};

export default EventsPage;
