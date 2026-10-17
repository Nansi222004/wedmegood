import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { toast } from '../../../components/ui/Toast';
import { getAuthToken } from '../../../services/userApi';
import { HEADING_FONT, formatDate, formatMoney } from '../enquiries/enquiryStatus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const call = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${getAuthToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

/** The customer's view of the vendor's preparation, and change requests to approve */
const EventProgress = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => call(`/user/events/${bookingId}`).then(r => setData(r.data)).catch(err => setError(err.message)), [bookingId]);
  useEffect(() => { load(); }, [load]);

  const respond = async (cr, approve) => {
    if (approve && !window.confirm(`Approve "${cr.title}"${cr.amount ? ` for ${formatMoney(cr.amount)}` : ''}? It will be added to your booking.`)) return;
    const note = approve ? '' : (window.prompt('Tell the vendor why (optional)') ?? null);
    if (note === null) return;
    setBusy(cr._id);
    try {
      const r = await call(`/user/events/${bookingId}/change-requests/${cr._id}`, { approve, note });
      toast.success(r.message);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (error) return <div className="max-w-md mx-auto px-4 pt-16 text-center text-sm text-red-700">{error}</div>;
  if (!data) return <div className="flex justify-center pt-24"><div className="w-10 h-10 border-4 border-[#551E43] border-t-transparent animate-spin rounded-full" /></div>;
  const prep = data.preparation;

  return (
    <div className="min-h-screen pb-32 px-4 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/bookings'))} className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] cursor-pointer" aria-label="Back">
          <Icon name="chevronLeft" size="sm" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={HEADING_FONT}>{data.eventType} preparation</h1>
          <p className="text-xs text-[#7A6876]">{data.vendor.businessName} · {formatDate(data.eventDate)} · {data.location}</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm space-y-3">
        {prep && prep.readiness === null ? (
          <p className="text-sm font-bold text-[#401332]">Preparation</p>
        ) : !prep || prep.tasksTotal === 0 ? (
          <p className="text-sm text-[#5C4A57]">Your vendor has not started the preparation checklist yet.</p>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <p className="text-sm font-bold text-[#401332]">Preparation</p>
              <p className="text-2xl font-bold text-[#551E43]">{prep.readiness}%</p>
            </div>
            <div className="h-2 bg-[#F7EEF2] rounded-full overflow-hidden"><div className="h-full bg-[#551E43] rounded-full" style={{ width: `${prep.readiness}%` }} /></div>
            <p className="text-xs text-[#7A6876]">{prep.tasksVerified} of {prep.tasksTotal} tasks checked by the vendor's supervisor.</p>
          </>
        )}
        <ol className="space-y-2 pt-1">
          <li className={`text-xs flex gap-2 ${prep?.readinessUpdateAt ? 'text-emerald-700' : 'text-[#8A7987]'}`}>
            <span>{prep?.readinessUpdateAt ? '✓' : '○'}</span>
            <span>About 80% ready{prep?.readinessUpdateAt ? ` · ${formatDate(prep.readinessUpdateAt)}` : ''}</span>
          </li>
          <li className={`text-xs flex gap-2 ${prep?.finalConfirmedAt ? 'text-emerald-700 font-semibold' : 'text-[#8A7987]'}`}>
            <span>{prep?.finalConfirmedAt ? '✓' : '○'}</span>
            <span>{prep?.finalConfirmedAt ? `Everything checked and ready · ${formatDate(prep.finalConfirmedAt)}` : 'Final confirmation once every essential task is checked'}</span>
          </li>
        </ol>
        {(data.updates || []).length > 0 && (
          <div className="pt-2 border-t border-[#F2E5EC] space-y-2">
            <p className="text-xs font-bold text-[#401332]">Updates from your vendor</p>
            {data.updates.map(u => (
              <div key={u._id} className="text-xs">
                <p className="font-semibold text-[#2E1026]">{u.title} <span className="font-normal text-[#8A7987]">· {formatDate(u.at)}</span></p>
                <p className="text-[#5C4A57]">{u.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm space-y-3">
        <p className="text-sm font-bold text-[#401332]" style={HEADING_FONT}>Changes to your booking</p>
        <p className="text-xs text-[#7A6876]">Extra work after confirmation is only done and charged once you approve it here.</p>
        {data.changeRequests.length === 0 ? <p className="text-xs text-[#8A7987]">No change requests.</p> : data.changeRequests.map(cr => (
          <div key={cr._id} className={`p-3 rounded-xl border ${cr.status === 'Pending' ? 'border-amber-200 bg-amber-50' : 'border-[#F2E5EC]'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#2E1026]">{cr.title}</p>
                {cr.description && <p className="text-xs text-[#5C4A57] mt-0.5">{cr.description}</p>}
                <p className="text-xs font-bold text-[#401332] mt-1">{cr.amount ? `+ ${formatMoney(cr.amount)}` : 'No extra charge'}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#F2E5EC] text-[#551E43]">{cr.status}</span>
            </div>
            {cr.status === 'Pending' && (
              <div className="flex gap-2 mt-3">
                <button disabled={busy === cr._id} onClick={() => respond(cr, true)} className="flex-1 py-2 rounded-xl bg-[#551E43] text-white text-xs font-bold cursor-pointer disabled:opacity-50">Approve</button>
                <button disabled={busy === cr._id} onClick={() => respond(cr, false)} className="flex-1 py-2 rounded-xl border border-[#E5D5DC] bg-white text-[#401332] text-xs font-bold cursor-pointer disabled:opacity-50">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => navigate(`/user/chats/${data.vendor._id}`)} className="w-full py-3 rounded-xl border border-[#E5D5DC] bg-white text-[#401332] text-sm font-bold cursor-pointer">Chat with {data.vendor.businessName}</button>
    </div>
  );
};

export default EventProgress;
