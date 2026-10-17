import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createOpsApi, money } from '../../operations/opsApi';

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

// Answers the owner's five daily questions: today, tomorrow, leads, money in and out, risks
const DailyBrief = () => {
  const api = useMemo(() => createOpsApi(getToken), []);
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.brief().then(r => setBrief(r.data)).catch(e => setError(e.message));
  }, [api]);

  if (error) return null;
  if (!brief) return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />;

  const { today, tomorrow, leads, money: m, risks } = brief;
  const leadCount = leads.pendingOffers + leads.needReply.length + leads.revisionRequests.length;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-heading font-extrabold text-slate-800">Your day at a glance</h2>
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <Panel title={`Today (${today.events.length})`} to="/vendor/ops/events">
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
    </section>
  );
};

export default DailyBrief;
