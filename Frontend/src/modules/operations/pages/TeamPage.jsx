import { useCallback, useEffect, useState } from 'react';
import { useOps, fmtDate, money } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, Modal, PageHeader, Spinner } from '../ui';
import { inputClass } from '../tokens';
import { useAction } from '../useAction';

const ROLE_INFO = {
  Supervisor: 'Runs events: assigns and verifies tasks, attendance, gate passes',
  Crew: 'Sees and updates their own tasks, requests purchases, claims expenses',
  Warehouse: 'Stock, reservations, gate passes, records purchases',
  Driver: 'Their tasks, confirms material received at the venue',
  Accountant: 'Expenses, P&L and accounts (no team or stock changes)',
  SubVendor: 'An outside business: accepts and completes work packages'
};

const MemberForm = ({ member, onClose, onSaved }) => {
  const { api } = useOps();
  const { busy, run } = useAction(onSaved);
  const [f, setF] = useState(member ? {
    name: member.name, role: member.role, skills: (member.skills || []).join(', '), wage: member.wage || { basis: 'Per day', amount: 0 },
    subVendor: member.subVendor || { businessName: '', services: [], verified: false }, password: ''
  } : { name: '', phone: '', password: '', role: 'Crew', skills: '', wage: { basis: 'Per day', amount: 0 }, subVendor: { businessName: '', services: [], verified: false } });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async () => {
    const body = { ...f, skills: f.skills.split(',').map(s => s.trim()).filter(Boolean), wage: { ...f.wage, amount: Number(f.wage.amount) || 0 } };
    if (member && !body.password) delete body.password;
    const res = await run('m', () => (member ? api.updateMember(member._id, body) : api.addMember(body)));
    if (res) onClose();
  };
  return (
    <Modal title={member ? `Edit ${member.name}` : 'Add a team member'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name"><input className={inputClass} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
        {!member && <Field label="Mobile number (their login)"><input inputMode="numeric" maxLength={10} className={inputClass} value={f.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} /></Field>}
        <Field label={member ? 'New password (leave empty to keep)' : 'Password'} hint="Give it to them; they can change it after logging in at /team">
          <input className={inputClass} value={f.password} onChange={e => set('password', e.target.value)} />
        </Field>
        <Field label="Role" hint={ROLE_INFO[f.role]}>
          <select className={inputClass} value={f.role} onChange={e => set('role', e.target.value)}>{Object.keys(ROLE_INFO).map(r => <option key={r}>{r}</option>)}</select>
        </Field>
        {f.role === 'SubVendor' ? (
          <>
            <Field label="Business name"><input className={inputClass} value={f.subVendor.businessName} onChange={e => set('subVendor', { ...f.subVendor, businessName: e.target.value })} /></Field>
            <Field label="Services (comma separated)"><input className={inputClass} value={(f.subVendor.services || []).join(', ')} onChange={e => set('subVendor', { ...f.subVendor, services: e.target.value.split(',').map(s => s.trim()) })} /></Field>
            <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={f.subVendor.verified} onChange={e => set('subVendor', { ...f.subVendor, verified: e.target.checked })} /> I have verified this business (ID, past work). Only verified sub-vendors get packages.</label>
          </>
        ) : (
          <>
            <Field label="Skills (comma separated)"><input className={inputClass} value={f.skills} onChange={e => set('skills', e.target.value)} placeholder="Floral, lighting, driving" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Wage basis"><select className={inputClass} value={f.wage.basis} onChange={e => set('wage', { ...f.wage, basis: e.target.value })}>{['Per day', 'Per shift', 'Per hour', 'Per job'].map(b => <option key={b}>{b}</option>)}</select></Field>
              <Field label="Wage (₹)" hint="Only you can see this"><input type="number" min="0" className={inputClass} value={f.wage.amount} onChange={e => set('wage', { ...f.wage, amount: e.target.value })} /></Field>
            </div>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !f.name.trim() || (!member && (!f.phone || f.password.length < 6))} onClick={save}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
};

/** Crew work wallet: shifts, earnings, advances, payments */
export const WalletView = ({ data }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-4 gap-2 text-center">
      {[['Earned', data.earned], ['Advances', data.advances], ['Paid', data.paid], ['Balance', data.balance]].map(([l, v]) => (
        <div key={l} className="p-2 rounded-lg bg-slate-50"><p className="text-[9px] uppercase text-slate-400 font-semibold">{l}</p><p className={`text-[14px] font-bold ${l === 'Balance' && v > 0 ? 'text-emerald-700' : ''}`}>{money(v)}</p></div>
      ))}
    </div>
    <div className="space-y-1 max-h-72 overflow-y-auto">
      {data.entries.length === 0 ? <Empty>No entries yet.</Empty> : data.entries.map(e => (
        <div key={e._id} className="flex justify-between text-[12px] py-1 border-b border-slate-50">
          <span><Badge tone={e.type === 'Earning' ? 'green' : e.type === 'Advance' ? 'amber' : 'blue'}>{e.type}</Badge> {e.workspaceId?.title || e.note || ''}{e.method ? ` · ${e.method}` : ''}</span>
          <span className="font-semibold">{e.type === 'Earning' ? '+' : '−'}{money(e.amount)} <span className="text-[10px] text-slate-400 font-normal">{fmtDate(e.date, { day: 'numeric', month: 'short' })}</span></span>
        </div>
      ))}
    </div>
  </div>
);

const WalletModal = ({ member, onClose, onChanged }) => {
  const { api } = useOps();
  const [data, setData] = useState(null);
  const load = useCallback(() => api.wallet(member._id).then(r => setData(r.data)).catch(() => setData(null)), [api, member._id]);
  useEffect(() => { load(); }, [load]);
  const { busy, run } = useAction(async () => { await load(); onChanged(); });
  const entry = (type) => {
    const amount = Number(window.prompt(`${type} amount (₹)`));
    if (!amount) return;
    const method = window.prompt('Paid by (Cash / UPI / Bank transfer)', 'Cash') || 'Cash';
    run(type, () => api.addWalletEntry(member._id, { type, amount, method }), `${type} recorded`);
  };
  return (
    <Modal title={`${member.name}: work wallet`} onClose={onClose} wide>
      {!data ? <Spinner /> : (
        <>
          <WalletView data={data} />
          <div className="flex justify-end gap-2 mt-3">
            <Btn variant="ghost" disabled={Boolean(busy)} onClick={() => entry('Advance')}>Give advance</Btn>
            <Btn disabled={Boolean(busy)} onClick={() => entry('Payment')}>Record payment</Btn>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Payments settle the member's unpaid shift costs on the events, oldest first.</p>
        </>
      )}
    </Modal>
  );
};

const TeamPage = () => {
  const { api } = useOps();
  const [members, setMembers] = useState(null);
  const [modal, setModal] = useState(null);
  const load = useCallback(() => api.team().then(r => setMembers(r.data)).catch(() => setMembers([])), [api]);
  useEffect(() => { load(); }, [load]);
  const { run } = useAction(load);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      <PageHeader title="Team" subtitle="Employees, casual labour, supervisors, drivers and sub-vendors, each with their own login" action={<Btn onClick={() => setModal('new')}>+ Member</Btn>} />
      <Card>
        <p className="text-[12px] text-slate-600">Team members log in at <span className="font-mono font-semibold">{window.location.origin}/team</span> with their mobile number and the password you set. They only see what their role allows. Customer contacts, amounts and your accounts stay with you.</p>
      </Card>
      {!members ? <Spinner /> : members.length === 0 ? <Empty>No team members yet.</Empty> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {members.map(m => (
            <Card key={m._id} className={m.isActive ? '' : 'opacity-60'}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold text-slate-900">{m.role === 'SubVendor' ? m.subVendor?.businessName || m.name : m.name}</p>
                  <p className="text-[11px] text-slate-500">{m.phone} · {m.role}{m.role === 'SubVendor' ? ` · ${m.name}` : ''}{m.wage?.amount ? ` · ${money(m.wage.amount)} ${m.wage.basis.toLowerCase()}` : ''}</p>
                  {m.skills?.length > 0 && <p className="text-[11px] text-slate-500">{m.skills.join(', ')}</p>}
                  {m.role === 'SubVendor' && <p className="text-[11px]">{m.subVendor?.verified ? <span className="text-emerald-700">Verified</span> : <span className="text-amber-700">Not verified</span>}</p>}
                  <p className="text-[10px] text-slate-400">{m.lastLoginAt ? `Last login ${fmtDate(m.lastLoginAt)}` : 'Never logged in'}</p>
                </div>
                <div className="text-right">
                  {m.balance !== undefined && m.role !== 'SubVendor' && <p className={`text-[13px] font-bold ${m.balance > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{money(m.balance)}</p>}
                  {!m.isActive && <Badge tone="red">Inactive</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Btn variant="ghost" onClick={() => setModal({ edit: m })}>Edit</Btn>
                {m.role !== 'SubVendor' && <Btn variant="ghost" onClick={() => setModal({ wallet: m })}>Wallet</Btn>}
                <Btn variant={m.isActive ? 'danger' : 'ghost'} onClick={() => run('t', () => api.updateMember(m._id, { isActive: !m.isActive }), m.isActive ? 'Login disabled' : 'Login enabled')}>{m.isActive ? 'Deactivate' : 'Activate'}</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {modal === 'new' && <MemberForm onClose={() => setModal(null)} onSaved={load} />}
      {modal?.edit && <MemberForm member={modal.edit} onClose={() => setModal(null)} onSaved={load} />}
      {modal?.wallet && <WalletModal member={modal.wallet} onClose={() => setModal(null)} onChanged={load} />}
    </div>
  );
};

export default TeamPage;
