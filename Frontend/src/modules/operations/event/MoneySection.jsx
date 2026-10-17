import { useCallback, useEffect, useState } from 'react';
import { useOps, fmtDate, money } from '../opsApi';
import { Badge, Btn, Card, Empty } from '../ui';
import { useAction } from '../useAction';
import ExpenseForm from '../ExpenseForm';

const Row = ({ label, value, strong, tone }) => (
  <div className={`flex justify-between py-1 text-[12px] ${strong ? 'font-bold border-t border-slate-100 pt-2' : ''}`}>
    <span className="text-slate-600">{label}</span>
    <span className={tone === 'neg' ? 'text-rose-600' : tone === 'pos' ? 'text-emerald-700' : 'text-slate-900'}>{value}</span>
  </div>
);

const MoneySection = ({ ev, reload }) => {
  const { api } = useOps();
  const [expenses, setExpenses] = useState(null);
  const [adding, setAdding] = useState(false);
  const [unsettled, setUnsettled] = useState(null);

  const loadExpenses = useCallback(() => api.expenses(`?eventId=${ev._id}`)
    .then(r => setExpenses(r.data))
    .catch(() => setExpenses([])), [api, ev._id]);
  useEffect(() => { loadExpenses(); }, [loadExpenses]);
  const refresh = async () => { await Promise.all([loadExpenses(), reload()]); };
  const { busy, run } = useAction(refresh);
  const pnl = ev.pnl;
  const closed = ev.financeStatus === 'Closed';

  const close = async () => {
    try {
      const res = await api.unsettled(ev._id);
      setUnsettled(res.data);
      if (res.data.length === 0 && window.confirm('Close the accounts of this event? No more expenses can be added afterwards.')) {
        await run('close', () => api.closeAccounts(ev._id, {}));
      }
    } catch (err) {
      setUnsettled([err.message]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Card title="Profit and loss">
          <Row label="Booking value" value={money(pnl.bookingValue)} />
          {pnl.changeRequestValue > 0 && <Row label="Approved extra work" value={money(pnl.changeRequestValue)} />}
          <Row label="Contract value" value={money(pnl.contract)} strong />
          <Row label="Received from customer" value={money(pnl.received)} />
          <Row label="Customer still owes" value={money(pnl.outstandingFromCustomer)} tone={pnl.outstandingFromCustomer ? 'neg' : ''} />
          <Row label="Direct costs" value={`− ${money(pnl.directCost)}`} />
          <Row label={`Contribution${pnl.contributionMargin != null ? ` (${pnl.contributionMargin}%)` : ''}`} value={money(pnl.contribution)} strong tone={pnl.contribution < 0 ? 'neg' : 'pos'} />
          <Row label="Share of overheads" value={`− ${money(pnl.allocatedOverhead)}`} />
          <p className="text-[10px] text-slate-400 -mt-0.5 mb-1">{pnl.overheadRule}</p>
          <Row label="Profit after overheads" value={money(pnl.profitAfterOverhead)} strong tone={pnl.profitAfterOverhead < 0 ? 'neg' : 'pos'} />
          {(pnl.pendingClaims > 0 || pnl.unpaidCosts > 0) && (
            <p className="text-[11px] text-amber-700 mt-2">
              {pnl.pendingClaims > 0 && `${money(pnl.pendingClaims)} in claims waiting for approval (not counted). `}
              {pnl.unpaidCosts > 0 && `${money(pnl.unpaidCosts)} of costs still unpaid.`}
            </p>
          )}
        </Card>
        <Card title="Costs by category">
          {pnl.costByCategory.length === 0 ? <Empty>No costs recorded yet.</Empty> : pnl.costByCategory.map(c => (
            <div key={c.category} className="py-1">
              <div className="flex justify-between text-[12px]"><span className="text-slate-600">{c.category}</span><span className="font-semibold">{money(c.amount)}</span></div>
              <div className="h-1 bg-slate-100 rounded-full mt-1"><div className="h-full bg-violet-400 rounded-full" style={{ width: `${Math.round((c.amount / (pnl.directCost || 1)) * 100)}%` }} /></div>
            </div>
          ))}
          <div className="pt-3 flex flex-wrap gap-2">
            {!closed && <Btn onClick={() => setAdding(true)}>+ Expense</Btn>}
            {!closed && ev.opsStatus === 'Completed' && <Btn variant="dark" disabled={Boolean(busy)} onClick={close}>Close accounts</Btn>}
            {closed && <Badge tone="grey">Accounts closed {fmtDate(ev.financeClosedAt)}</Badge>}
          </div>
          {ev.opsStatus !== 'Completed' && !closed && <p className="text-[10px] text-slate-400 mt-2">Finishing the event and closing its accounts are separate steps.</p>}
          {unsettled?.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[11px] font-bold text-amber-900 mb-1">Still unsettled</p>
              <ul className="text-[11px] text-amber-900 list-disc pl-4 space-y-0.5">{unsettled.map(u => <li key={u}>{u}</li>)}</ul>
              <Btn variant="ghost" className="mt-2" onClick={() => {
                const reason = window.prompt('Close anyway? Write the reason (kept in the event history)');
                if (reason) run('force', () => api.closeAccounts(ev._id, { force: true, reason }));
              }}>Close anyway with a reason</Btn>
            </div>
          )}
        </Card>
      </div>

      <Card title="Event ledger">
        {!expenses ? <Empty>Loading...</Empty> : expenses.length === 0 ? <Empty>No expenses yet. Even small cash spends belong here.</Empty> : (
          <div className="space-y-1.5">
            {expenses.map(e => (
              <div key={e._id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-slate-50 text-[12px]">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{e.category} · {money(e.amount)}{e.possibleDuplicateOf && <span className="text-amber-700 text-[10px]"> · possible duplicate</span>}</p>
                  <p className="text-[10px] text-slate-500">
                    {fmtDate(e.date)} · {e.description || '—'}{e.payee ? ` · ${e.payee}` : ''} · {e.paymentMethod}{e.paidBy ? ` by ${e.paidBy}` : ''}
                    {e.receiptPhoto && <> · <a href={e.receiptPhoto} target="_blank" rel="noreferrer" className="text-violet-700 underline">bill</a></>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge tone={e.approvalStatus === 'Pending' ? 'amber' : e.approvalStatus === 'Rejected' ? 'red' : e.paymentStatus === 'Unpaid' ? 'blue' : 'green'}>
                    {e.approvalStatus !== 'Approved' ? e.approvalStatus : e.paymentStatus}
                  </Badge>
                  {!closed && e.approvalStatus === 'Pending' && (
                    <div className="flex gap-1">
                      <button className="text-[10px] font-bold text-emerald-700 cursor-pointer" onClick={() => run(`a${e._id}`, () => api.approveExpense(e._id, { approve: true }), 'Approved')}>Approve</button>
                      <button className="text-[10px] font-bold text-rose-600 cursor-pointer" onClick={() => { const r = window.prompt('Reason for rejecting'); if (r) run(`r${e._id}`, () => api.approveExpense(e._id, { approve: false, reason: r }), 'Rejected'); }}>Reject</button>
                    </div>
                  )}
                  {!closed && e.approvalStatus === 'Approved' && e.paymentStatus === 'Unpaid' && (
                    <button className="text-[10px] font-bold text-violet-700 cursor-pointer" onClick={() => run(`p${e._id}`, () => api.updateExpense(e._id, { paymentStatus: 'Paid' }), 'Marked paid')}>Mark paid</button>
                  )}
                  {!closed && ['manual', 'claim'].includes(e.source) && (
                    <button className="text-[10px] text-slate-400 cursor-pointer" onClick={() => { const r = window.prompt('Why delete this expense? (kept in the audit history)'); if (r) run(`d${e._id}`, () => api.deleteExpense(e._id, r), 'Deleted'); }}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {adding && <ExpenseForm eventId={ev._id} scope="Event" onClose={() => setAdding(false)} onSaved={refresh} />}
    </div>
  );
};

export default MoneySection;
