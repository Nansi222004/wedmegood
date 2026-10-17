import { useCallback, useEffect, useState } from 'react';
import { useOps, fmtDate, money } from './opsApi';
import { Btn, Card, Empty, Field, Spinner } from './ui';
import { inputClass } from './tokens';
import { useAction } from './useAction';

const todayIst = () => new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);

const Row = ({ m }) => (
  <div className="flex justify-between gap-2 text-[12px] py-1 border-b border-slate-50">
    <span className="text-slate-600 min-w-0 truncate">
      <span className="font-semibold text-slate-800">{m.name}</span> · {m.source}{m.detail ? ` · ${m.detail}` : ''}
      <span className="text-slate-400"> · {m.method}</span>
    </span>
    <span className="font-semibold shrink-0">{money(m.amount)}</span>
  </div>
);

// End-of-day cash count: opening + cash received - cash paid out = what the drawer should hold
const CashDayPanel = () => {
  const { api } = useOps();
  const [day, setDay] = useState(todayIst());
  const [data, setData] = useState(null);
  const [counted, setCounted] = useState('');
  const [opening, setOpening] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(() => api.cashDay(day)
    .then(r => {
      setData(r.data);
      setCounted(r.data.count ? String(r.data.count.countedCash) : '');
      setOpening('');
      setNote(r.data.count?.note || '');
    })
    .catch(err => setData({ error: err.message })), [api, day]);
  useEffect(() => { load(); }, [load]);
  const { busy, run } = useAction(load);

  if (!data) return <Spinner />;
  if (data.error) return <Empty>{data.error}</Empty>;

  const openingCash = opening !== '' ? Number(opening) || 0 : data.openingCash;
  const expected = openingCash + data.cashIn - data.cashOut;
  const diff = counted === '' ? null : Math.round(Number(counted) || 0) - expected;

  return (
    <div className="space-y-3">
      <input type="date" className={`${inputClass} w-44`} value={day} max={todayIst()} onChange={e => setDay(e.target.value || todayIst())} />

      <div className="grid sm:grid-cols-2 gap-3">
        <Card title="Cash count">
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between"><span className="text-slate-500">Opening cash{data.previousDay ? ` (counted ${fmtDate(data.previousDay, { day: 'numeric', month: 'short' })})` : ''}</span><span className="font-semibold">{money(openingCash)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">+ Cash received</span><span className="font-semibold text-emerald-700">{money(data.cashIn)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">− Cash paid out</span><span className="font-semibold text-rose-600">{money(data.cashOut)}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-slate-100 text-[13px]"><span className="font-bold">Should be in hand</span><span className="font-bold">{money(expected)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Field label="Cash counted">
              <input type="number" min="0" className={inputClass} value={counted} onChange={e => setCounted(e.target.value)} placeholder="₹" />
            </Field>
            <Field label="Change opening" hint="Only if the drawer started different">
              <input type="number" min="0" className={inputClass} value={opening} onChange={e => setOpening(e.target.value)} placeholder={String(data.openingCash)} />
            </Field>
          </div>
          {diff !== null && diff !== 0 && (
            <p className={`text-[11px] font-semibold mt-2 ${diff > 0 ? 'text-amber-700' : 'text-rose-600'}`}>
              {diff > 0 ? 'Extra' : 'Short'} by {money(Math.abs(diff))}. Add a note to explain it.
            </p>
          )}
          <Field label="Note">
            <textarea rows={2} className={inputClass} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. ₹500 given to driver for diesel, bill tomorrow" />
          </Field>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-400">
              {data.count ? `Counted by ${data.count.closedBy}, ${fmtDate(data.count.closedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not counted yet'}
            </span>
            <Btn
              disabled={Boolean(busy) || counted === ''}
              onClick={() => run('close', () => api.closeCashDay({ day, countedCash: Number(counted), openingCash: opening === '' ? undefined : Number(opening), note }), 'Cash count saved')}
            >
              {data.count ? 'Recount' : 'Save count'}
            </Btn>
          </div>
        </Card>

        <Card title="UPI, bank and cash today">
          {data.byMethod.length === 0 ? <Empty>No money moved this day.</Empty> : (
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400 text-left">
                <tr><th className="py-1">Method</th><th className="text-right">In</th><th className="text-right">Out</th></tr>
              </thead>
              <tbody>
                {data.byMethod.map(m => (
                  <tr key={m.method} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{m.method}</td>
                    <td className="text-right text-emerald-700 font-semibold">{money(m.in)}</td>
                    <td className="text-right text-rose-600 font-semibold">{money(m.out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-[10px] text-slate-400 mt-2">Match the UPI and bank lines against your bank app or statement for the day.</p>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card title={`Money in (${data.moneyIn.length})`}>
          {data.moneyIn.length === 0 ? <Empty>No customer payments recorded.</Empty> : data.moneyIn.map((m, i) => <Row key={i} m={m} />)}
        </Card>
        <Card title={`Money out (${data.moneyOut.length})`}>
          {data.moneyOut.length === 0 ? <Empty>No paid expenses recorded.</Empty> : data.moneyOut.map((m, i) => <Row key={i} m={m} />)}
        </Card>
      </div>

      {data.recent.length > 0 && (
        <Card title="Recent counts">
          {data.recent.map(r => (
            <button key={r.day} onClick={() => setDay(r.day)} className="w-full flex justify-between text-[12px] py-1 border-b border-slate-50 text-left cursor-pointer hover:bg-slate-50">
              <span className="text-slate-600">{fmtDate(r.day)} · {r.closedBy}</span>
              <span className={r.difference === 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                {r.difference === 0 ? 'Matched' : `${r.difference > 0 ? '+' : '−'}${money(Math.abs(r.difference))}`}
              </span>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
};

export default CashDayPanel;
