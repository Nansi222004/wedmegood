import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOps, can, fmtDate, fmtDateTime } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, PageHeader, Spinner } from '../ui';
import { TASK_TONE, inputClass } from '../tokens';
import { useAction } from '../useAction';
import { WalletView } from './TeamPage';
import { SubVendorActions } from '../event/CrewSection';
import PurchaseForm from '../PurchaseForm';
import ExpenseForm from '../ExpenseForm';

/** Home screen of a team member: their tasks (or packages), wallet and quick actions */
const MyWorkPage = () => {
  const { api, me, basePath } = useOps();
  const navigate = useNavigate();
  const isSub = me.role === 'SubVendor';
  const [tasks, setTasks] = useState(null);
  const [packages, setPackages] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const load = useCallback(() => (isSub
    ? api.myPackages().then(r => setPackages(r.data))
    : Promise.all([api.myTasks(), api.myWallet().catch(() => null), api.events('upcoming')]).then(([t, w, e]) => {
      setTasks(t.data);
      setWallet(w?.data || null);
      setEvents(e.data);
    })
  ).catch(() => { setTasks([]); setPackages([]); }), [api, isSub]);
  useEffect(() => { load(); }, [load]);
  const { busy, run } = useAction(load);

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10">
      <PageHeader
        title={`Hello, ${me.name.split(' ')[0]}`}
        subtitle={`${me.role === 'SubVendor' ? 'Sub-vendor' : me.role} at ${me.business.name}`}
        action={!isSub && (
          <div className="flex gap-2">
            {can(me, 'purchase.request') && <Btn variant="ghost" onClick={() => setModal('purchase')}>Request purchase</Btn>}
            {can(me, 'expense.claim') && <Btn variant="ghost" onClick={() => setModal('claim')}>Claim expense</Btn>}
          </div>
        )}
      />

      {isSub ? (
        <Card title="My work packages">
          {!packages ? <Spinner /> : packages.length === 0 ? <Empty>No work packages yet.</Empty> : (
            <div className="space-y-2">
              {packages.map(pk => (
                <div key={pk._id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{pk.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {pk.workspaceId?.title} · {fmtDate(pk.requiredAt || pk.workspaceId?.eventDate)} · {pk.location}
                        {pk.agreedAmount > 0 && ` · ₹${pk.agreedAmount.toLocaleString('en-IN')}`}
                        {pk.status === 'Offered' && ` · accept by ${fmtDateTime(pk.acceptBy)}`}
                      </p>
                      {pk.quantity && <p className="text-[11px] text-slate-600">Scope: {pk.quantity}</p>}
                      {pk.instructions && <p className="text-[11px] text-slate-600 whitespace-pre-line mt-1">{pk.instructions}</p>}
                    </div>
                    <Badge tone={pk.status === 'Offered' ? 'amber' : pk.status === 'Approved' ? 'green' : 'blue'}>{pk.status}</Badge>
                  </div>
                  <SubVendorActions pk={pk} run={run} />
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card title="My tasks">
            {!tasks ? <Spinner /> : tasks.length === 0 ? <Empty>No open tasks. Your supervisor will assign work here.</Empty> : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <button key={t._id} onClick={() => navigate(`${basePath}/events/${t.workspaceId._id}`)} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-violet-200 cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{t.title}</p>
                        <p className="text-[11px] text-slate-500">
                          {t.workspaceId.title} · {fmtDate(t.workspaceId.eventDate)}{t.workspaceId.reportingTime ? ` · report ${t.workspaceId.reportingTime}` : ''}
                          {t.deadline && <span className={new Date(t.deadline) < new Date() ? 'text-rose-600 font-semibold' : ''}> · by {fmtDateTime(t.deadline)}</span>}
                        </p>
                      </div>
                      <Badge tone={TASK_TONE[t.status]}>{t.status === 'Assigned' ? 'New: acknowledge' : t.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {(can(me, 'events.view') || events.length > 0) && (
            <Card title="Events" action={<Btn variant="ghost" onClick={() => navigate(`${basePath}/events`)}>All events</Btn>}>
              {events.length === 0 ? <Empty>No upcoming events.</Empty> : events.slice(0, 5).map(e => (
                <button key={e._id} onClick={() => navigate(`${basePath}/events/${e._id}`)} className="w-full text-left flex justify-between py-1.5 text-[12px] border-b border-slate-50 cursor-pointer">
                  <span className="font-semibold text-slate-800">{e.title}</span><span className="text-slate-500">{fmtDate(e.eventDate)} · {e.readiness}%</span>
                </button>
              ))}
            </Card>
          )}

          {wallet && <Card title="My work wallet"><WalletView data={wallet} /></Card>}
        </>
      )}

      <Card title="Account">
        <div className="grid sm:grid-cols-3 gap-2 items-end">
          <Field label="Current password"><input type="password" className={inputClass} value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input type="password" className={inputClass} value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Btn variant="ghost" disabled={Boolean(busy) || pw.newPassword.length < 6} onClick={async () => { if (await run('pw', () => api.changePassword(pw), 'Password changed')) setPw({ currentPassword: '', newPassword: '' }); }}>Change password</Btn>
        </div>
      </Card>

      {modal === 'purchase' && <PurchaseForm events={events} onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'claim' && <ExpenseForm events={events} scope="Event" onClose={() => setModal(null)} onSaved={load} />}
    </div>
  );
};

export default MyWorkPage;
