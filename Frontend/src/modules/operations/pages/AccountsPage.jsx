import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOps, fmtDate, money } from '../opsApi';
import { Badge, Btn, Card, Empty, PageHeader, Spinner, Tabs } from '../ui';
import { inputClass } from '../tokens';
import { useAction } from '../useAction';
import ExpenseForm from '../ExpenseForm';
import CashDayPanel from '../CashDayPanel';
import SplitCostForm from '../SplitCostForm';

const thisMonth = () => new Date().toISOString().slice(0, 7);

const Stat = ({ label, value, tone }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-3">
    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className={`text-[17px] font-bold mt-0.5 ${tone === 'neg' ? 'text-rose-600' : tone === 'pos' ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const AccountsPage = () => {
  const { api, basePath } = useOps();
  const navigate = useNavigate();
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [claims, setClaims] = useState([]);
  const [overheads, setOverheads] = useState([]);
  const [events, setEvents] = useState([]);
  const [adding, setAdding] = useState(null); // 'Event' | 'Overhead'
  const [splitting, setSplitting] = useState(false);
  const [tab, setTab] = useState('month');

  const load = useCallback(() => {
    const [y, m] = month.split('-').map(Number);
    const from = `${month}-01`;
    const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    return Promise.all([
      api.accounts(month),
      api.expenses('?status=Pending'),
      api.expenses(`?scope=Overhead&from=${from}&to=${to}`)
    ])
      .then(([summary, pending, oh]) => {
        setData(summary.data);
        setClaims(pending.data);
        setOverheads(oh.data);
      })
      .catch(err => setData({ error: err.message }));
  }, [api, month]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { Promise.all([api.events('upcoming'), api.events('past')]).then(([a, b]) => setEvents([...a.data, ...b.data])).catch(() => {}); }, [api]);
  const { busy, run } = useAction(load);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-10">
      <PageHeader
        title="Accounts"
        subtitle="Event profit, business overheads and every rupee spent"
        action={<div className="flex flex-wrap gap-2"><Btn variant="ghost" onClick={() => setSplitting(true)}>Split shared cost</Btn><Btn variant="ghost" onClick={() => setAdding('Overhead')}>+ Overhead</Btn><Btn onClick={() => setAdding('Event')}>+ Event expense</Btn></div>}
      />
      <Tabs tabs={[['month', 'Month'], ['cash', 'Daily cash & bank']]} value={tab} onChange={setTab} />
      {tab === 'cash' ? <CashDayPanel /> : <>
      <input type="month" className={`${inputClass} w-44`} value={month} onChange={e => setMonth(e.target.value)} />
      {!data ? <Spinner /> : data.error ? <Empty>{data.error}</Empty> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Stat label="Contract value" value={money(data.totals.contract)} />
            <Stat label="Received" value={money(data.totals.received)} />
            <Stat label="Direct costs" value={money(data.totals.directCost)} />
            <Stat label="Contribution" value={money(data.totals.contribution)} tone={data.totals.contribution < 0 ? 'neg' : 'pos'} />
            <Stat label="Overheads" value={money(data.totals.overhead)} />
            <Stat label="Profit" value={money(data.totals.profit)} tone={data.totals.profit < 0 ? 'neg' : 'pos'} />
          </div>

          {claims.length > 0 && (
            <Card title={`Claims waiting for approval (${claims.length})`}>
              <div className="space-y-1.5">
                {claims.map(c => (
                  <div key={c._id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/60 text-[12px]">
                    <div>
                      <p className="font-semibold text-slate-800">{money(c.amount)} · {c.category} · {c.paidBy}</p>
                      <p className="text-[10px] text-slate-500">{c.workspaceId?.title} · {fmtDate(c.date)} · {c.description || '—'}{c.receiptPhoto && <> · <a href={c.receiptPhoto} target="_blank" rel="noreferrer" className="text-violet-700 underline">bill</a></>}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Btn variant="success" disabled={Boolean(busy)} onClick={() => run(`a${c._id}`, () => api.approveExpense(c._id, { approve: true }), 'Approved')}>Approve</Btn>
                      <Btn variant="danger" disabled={Boolean(busy)} onClick={() => { const r = window.prompt('Reason'); if (r) run(`r${c._id}`, () => api.approveExpense(c._id, { approve: false, reason: r }), 'Rejected'); }}>Reject</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Events this month">
            {data.events.length === 0 ? <Empty>No events in this month.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[640px]">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400 text-left">
                    <tr><th className="py-1">Event</th><th>Contract</th><th>Received</th><th>Direct cost</th><th>Overhead share</th><th>Profit</th><th>Accounts</th></tr>
                  </thead>
                  <tbody>
                    {data.events.map(e => (
                      <tr key={e._id} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => navigate(`${basePath}/events/${e._id}`)}>
                        <td className="py-2"><p className="font-semibold text-slate-800">{e.title}</p><p className="text-[10px] text-slate-400">{fmtDate(e.eventDate)} · {e.opsStatus}</p></td>
                        <td>{money(e.contract)}</td><td>{money(e.received)}</td><td>{money(e.directCost)}</td><td>{money(e.allocatedOverhead)}</td>
                        <td className={e.profitAfterOverhead < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{money(e.profitAfterOverhead)}</td>
                        <td><Badge tone={e.financeStatus === 'Closed' ? 'grey' : 'amber'}>{e.financeStatus}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-2">Overheads are shared out by event-days in the month, so a two-day wedding carries twice the share of a one-day event.</p>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card title="Overheads">
              {overheads.length === 0 ? <Empty>No overheads recorded this month.</Empty> : overheads.map(o => (
                <div key={o._id} className="flex justify-between text-[12px] py-1 border-b border-slate-50">
                  <span className="text-slate-600">{o.category}{o.description ? ` · ${o.description}` : ''} <span className="text-slate-400">{fmtDate(o.date, { day: 'numeric', month: 'short' })}</span></span>
                  <span className="font-semibold">{money(o.amount)}</span>
                </div>
              ))}
            </Card>
            <Card title="Spent by payment method">
              {data.spendByMethod.length === 0 ? <Empty>Nothing spent.</Empty> : data.spendByMethod.map(s => (
                <div key={s.method} className="flex justify-between text-[12px] py-1"><span className="text-slate-600">{s.method}</span><span className="font-semibold">{money(s.amount)}</span></div>
              ))}
              <p className="text-[10px] text-slate-400 mt-2">Check the cash total against the cash in hand each day.</p>
            </Card>
          </div>
        </>
      )}
      </>}
      {splitting && <SplitCostForm events={events} onClose={() => setSplitting(false)} onSaved={load} />}
      {adding && <ExpenseForm scope={adding} events={events} onClose={() => setAdding(null)} onSaved={load} />}
    </div>
  );
};

export default AccountsPage;
