import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOps, fmtDateTime, money } from '../opsApi';
import { Badge, Btn, Card, Empty, Field, Modal } from '../ui';
import { inputClass } from '../tokens';
import { useAction, uploadPicked } from '../useAction';

const PKG_TONE = { Offered: 'amber', Accepted: 'blue', 'In progress': 'violet', Completed: 'amber', Approved: 'green', Declined: 'red', Expired: 'red', Cancelled: 'grey' };

const PackageForm = ({ ev, onClose, reload }) => {
  const { api } = useOps();
  const { busy, run } = useAction(reload);
  const subs = (ev.members || []).filter(m => m.role === 'SubVendor');
  const [f, setF] = useState({ subVendorId: '', fallbackSubVendorId: '', title: '', instructions: '', quantity: '', agreedAmount: '', advancePaid: '', acceptWithinHours: 12, location: ev.venue || '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  return (
    <Modal title="Outsource a work package" onClose={onClose} wide>
      <div className="space-y-3">
        {subs.length === 0 && <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg p-2">Add sub-vendors in Team first.</p>}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Sub-vendor">
            <select className={inputClass} value={f.subVendorId} onChange={e => set('subVendorId', e.target.value)}>
              <option value="">Choose</option>
              {subs.map(s => <option key={s._id} value={s._id} disabled={!s.subVendor?.verified}>{s.subVendor?.businessName || s.name}{s.subVendor?.verified ? '' : ' (not verified)'}</option>)}
            </select>
          </Field>
          <Field label="Fallback if they do not accept">
            <select className={inputClass} value={f.fallbackSubVendorId} onChange={e => set('fallbackSubVendorId', e.target.value)}>
              <option value="">None</option>
              {subs.filter(s => s._id !== f.subVendorId).map(s => <option key={s._id} value={s._id}>{s.subVendor?.businessName || s.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Work"><input className={inputClass} value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Sound system for sangeet" /></Field>
        <Field label="Instructions"><textarea rows={3} className={`${inputClass} resize-none`} value={f.instructions} onChange={e => set('instructions', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Quantity / scope"><input className={inputClass} value={f.quantity} onChange={e => set('quantity', e.target.value)} /></Field>
          <Field label="Location"><input className={inputClass} value={f.location} onChange={e => set('location', e.target.value)} /></Field>
          <Field label="Agreed amount (₹)" hint="Visible only to you and this sub-vendor"><input type="number" min="0" className={inputClass} value={f.agreedAmount} onChange={e => set('agreedAmount', e.target.value)} /></Field>
          <Field label="Advance paid (₹)"><input type="number" min="0" className={inputClass} value={f.advancePaid} onChange={e => set('advancePaid', e.target.value)} /></Field>
          <Field label="Accept within (hours)"><input type="number" min="1" max="168" className={inputClass} value={f.acceptWithinHours} onChange={e => set('acceptWithinHours', e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn disabled={busy || !f.subVendorId || !f.title.trim()} onClick={async () => { if (await run('pkg', () => api.createPackage(ev._id, f))) onClose(); }}>Offer package</Btn>
        </div>
      </div>
    </Modal>
  );
};

const CrewSection = ({ ev, me, reload }) => {
  const { api, basePath } = useOps();
  const navigate = useNavigate();
  const { busy, run } = useAction(reload);
  const [modal, setModal] = useState(null);
  const p = ev.permissions;
  const isMember = me.kind === 'member';
  const myShift = ev.shifts.find(s => String(s.memberId?._id || s.memberId) === String(me.id));
  const crew = (ev.members || []).filter(m => m.role !== 'SubVendor');

  const confirm = (s) => {
    const ot = window.prompt(`Overtime hours for ${s.memberId?.name || 'this member'} (0 if none)`, String(s.overtimeHours || 0));
    if (ot === null) return;
    run(`c${s._id}`, () => api.confirmShift(s._id, { overtimeHours: Number(ot) || 0 }), 'Shift confirmed: wage added to their wallet and to event labour');
  };

  return (
    <div className="space-y-3">
      {isMember && me.role !== 'SubVendor' && (
        <Card title="My attendance today">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-slate-600">
              {myShift?.checkInAt ? `Checked in ${fmtDateTime(myShift.checkInAt)}` : 'Not checked in'}
              {myShift?.checkOutAt ? ` · out ${fmtDateTime(myShift.checkOutAt)}` : ''}
              {myShift?.status === 'Confirmed' ? ' · confirmed' : ''}
            </span>
            {!myShift?.checkInAt && <Btn variant="success" disabled={Boolean(busy)} onClick={() => run('in', () => api.attendance(ev._id, { action: 'checkin' }), 'Checked in')}>Check in</Btn>}
            {myShift?.checkInAt && !myShift?.checkOutAt && <Btn variant="dark" disabled={Boolean(busy)} onClick={() => run('out', () => api.attendance(ev._id, { action: 'checkout' }), 'Checked out')}>Check out</Btn>}
          </div>
        </Card>
      )}

      {p.attendance && (
        <Card title="Crew attendance" action={(p.manage || p.owner) && <Btn variant="ghost" onClick={() => navigate(`${basePath}/workforce?eventId=${ev._id}`)}>Hire temporary workers</Btn>}>
          <p className="text-[11px] text-slate-500 mb-2">Crew needed: {ev.crewRequired || 'not set'} · confirmed on tasks or shifts: {new Set([...ev.tasks.map(t => t.assigneeMemberId).filter(Boolean), ...ev.shifts.map(s => s.memberId?._id)].map(String)).size}</p>
          {crew.length === 0 ? <Empty>No team members yet.</Empty> : (
            <div className="space-y-1.5">
              {crew.map(m => {
                const s = ev.shifts.find(x => String(x.memberId?._id) === String(m._id));
                return (
                  <div key={m._id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 text-[12px]">
                    <div>
                      <span className="font-semibold text-slate-800">{m.name}</span> <span className="text-slate-400">{m.role}</span>
                      <span className="block text-[10px] text-slate-500">
                        {s ? `${s.status === 'Absent' ? 'Absent' : `In ${fmtDateTime(s.checkInAt)}${s.checkOutAt ? ` · out ${fmtDateTime(s.checkOutAt)}` : ''}`}${s.status === 'Confirmed' ? ` · confirmed${s.amount !== undefined ? ` ${money(s.amount)}` : ''}` : ''}` : 'Not recorded today'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {!s && <Btn variant="ghost" onClick={() => run(`i${m._id}`, () => api.attendance(ev._id, { memberId: m._id, action: 'checkin' }), 'Checked in')}>In</Btn>}
                      {!s && <Btn variant="danger" onClick={() => run(`a${m._id}`, () => api.attendance(ev._id, { memberId: m._id, action: 'absent' }), 'Marked absent')}>Absent</Btn>}
                      {s && s.checkInAt && !s.checkOutAt && s.status === 'Open' && <Btn variant="ghost" onClick={() => run(`o${m._id}`, () => api.attendance(ev._id, { memberId: m._id, action: 'checkout' }), 'Checked out')}>Out</Btn>}
                      {s && s.status === 'Open' && s.checkInAt && <Btn variant="success" onClick={() => confirm(s)}>Confirm shift</Btn>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {(p.owner || ev.packages.length > 0) && (
        <Card title="Sub-vendor packages" action={p.owner && <Btn variant="ghost" onClick={() => setModal('pkg')}>+ Package</Btn>}>
          {ev.packages.length === 0 ? <Empty>Outsource a piece of work to a verified sub-vendor.</Empty> : (
            <div className="space-y-2">
              {ev.packages.map(pk => (
                <div key={pk._id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{pk.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {pk.subVendorId?.subVendor?.businessName || pk.subVendorId?.name}
                        {pk.status === 'Offered' && ` · accept by ${fmtDateTime(pk.acceptBy)}`}
                        {pk.agreedAmount !== undefined && pk.agreedAmount > 0 && ` · ${money(pk.agreedAmount)} (advance ${money(pk.advancePaid)})`}
                        {pk.status === 'Approved' && ` · ${pk.settlementStatus}`}
                      </p>
                      {pk.declineReason && <p className="text-[11px] text-rose-600">Declined: {pk.declineReason}</p>}
                      {pk.progress?.length > 0 && <p className="text-[11px] text-slate-600 mt-1">Latest: {pk.progress[pk.progress.length - 1].note || 'update'} ({fmtDateTime(pk.progress[pk.progress.length - 1].at)})</p>}
                      {pk.completionPhotos?.length > 0 && <div className="flex gap-1 mt-1">{pk.completionPhotos.map(u => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="w-10 h-10 rounded object-cover" /></a>)}</div>}
                    </div>
                    <Badge tone={PKG_TONE[pk.status]}>{pk.status}</Badge>
                  </div>
                  {p.owner && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pk.status === 'Completed' && <Btn variant="success" onClick={() => run('ap', () => api.approvePackage(pk._id, {}), 'Approved')}>Approve quality</Btn>}
                      {pk.status === 'Approved' && pk.settlementStatus === 'Unsettled' && <Btn variant="ghost" onClick={() => run('st', () => api.settlePackage(pk._id), 'Settled')}>Mark settled</Btn>}
                      {['Expired', 'Declined'].includes(pk.status) && (
                        <Btn variant="dark" onClick={() => {
                          const target = pk.fallbackSubVendorId?._id || (ev.members || []).find(m => m.role === 'SubVendor' && m._id !== (pk.subVendorId?._id))?._id;
                          if (!target) return;
                          const name = pk.fallbackSubVendorId?.subVendor?.businessName || pk.fallbackSubVendorId?.name || 'another sub-vendor';
                          if (window.confirm(`Offer "${pk.title}" to ${name}?`)) run('ra', () => api.reassignPackage(pk._id, { subVendorId: target }), 'Offered again');
                        }}>Offer to {pk.fallbackSubVendorId ? 'fallback' : 'another'}</Btn>
                      )}
                    </div>
                  )}
                  {me.role === 'SubVendor' && <SubVendorActions pk={pk} run={run} />}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {modal === 'pkg' && <PackageForm ev={ev} onClose={() => setModal(null)} reload={reload} />}
    </div>
  );
};

/** What a sub-vendor can do on their own package */
export const SubVendorActions = ({ pk, run }) => {
  const { api } = useOps();
  const progress = async (status, files) => {
    const photo = files?.length ? await uploadPicked(api, files) : '';
    const note = status === 'Completed' ? 'Work completed' : window.prompt('Progress update') || '';
    run('pg', () => api.packageProgress(pk._id, { status, note, photo }), status === 'Completed' ? 'Marked complete' : 'Update sent');
  };
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pk.status === 'Offered' && (
        <>
          <Btn variant="success" onClick={() => run('acc', () => api.respondPackage(pk._id, { accept: true }), 'Accepted')}>Accept</Btn>
          <Btn variant="danger" onClick={() => { const r = window.prompt('Why are you declining?'); if (r !== null) run('dec', () => api.respondPackage(pk._id, { accept: false, reason: r }), 'Declined'); }}>Decline</Btn>
        </>
      )}
      {['Accepted', 'In progress'].includes(pk.status) && (
        <>
          <Btn variant="ghost" onClick={() => progress('In progress')}>Send update</Btn>
          <label className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-emerald-600 text-white cursor-pointer">
            Complete with photo
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => progress('Completed', e.target.files)} />
          </label>
        </>
      )}
    </div>
  );
};

export default CrewSection;
