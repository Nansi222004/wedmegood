import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import LoginRequired from '../../../components/common/LoginRequired';
import { toast } from '../../../components/ui/Toast';
import userApi, { getAuthToken } from '../../../services/userApi';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const HEADING = { fontFamily: '"Playfair Display", Georgia, serif' };
const STATUS = {
  Pending: ['Received', 'bg-amber-50 text-amber-800'],
  'In-Review': ['Being reviewed', 'bg-sky-50 text-sky-700'],
  Resolved: ['Resolved', 'bg-emerald-50 text-emerald-700'],
  Dismissed: ['Not upheld', 'bg-stone-100 text-stone-600'],
  Appealed: ['Under appeal', 'bg-violet-50 text-violet-700']
};
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** The customer's complaints: progress against the targets, the decision, and one appeal */
const MyComplaints = () => {
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const load = useCallback(() => userApi.getUserComplaints().then(r => setList(r.data?.complaints || [])).catch(() => setList([])), []);
  useEffect(() => { if (getAuthToken()) load(); }, [load]);
  // Vendors' concerns about this customer, so they can give their side before the team decides
  const [aboutMe, setAboutMe] = useState([]);
  const loadAboutMe = useCallback(() => userApi.getConductReports().then(r => setAboutMe(r.data || [])).catch(() => setAboutMe([])), []);
  useEffect(() => { if (getAuthToken()) loadAboutMe(); }, [loadAboutMe]);

  if (!getAuthToken()) return <LoginRequired message="Log in to see your complaints." />;

  const respond = async (r) => {
    const statement = window.prompt('Your side of what happened (at least 10 characters). The Utsavo team reads it before deciding.');
    if (!statement) return;
    try {
      const res = await userApi.respondConductReport(r._id, statement);
      toast.success(res.message);
      loadAboutMe();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Could not send your response.'));
    }
  };

  const appeal = async (c) => {
    const reason = window.prompt('Why should the decision be reviewed again? You can appeal once.');
    if (!reason) return;
    try {
      const r = await userApi.appealComplaint(c._id, reason);
      toast.success(r.message);
      load();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Could not submit the appeal.'));
    }
  };

  return (
    <div className="min-h-screen pb-32 px-4 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/home'))} className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] cursor-pointer" aria-label="Back"><Icon name="chevronLeft" size="sm" /></button>
        <div>
          <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={HEADING}>My complaints</h1>
          <p className="text-xs text-[#7A6876]">The vendor is asked for their side; the Utsavo team decides after hearing both.</p>
        </div>
      </div>
      {!list ? <p className="text-xs text-[#8A7987]">Loading...</p> : list.length === 0 ? (
        <p className="text-xs text-[#8A7987] text-center py-10 bg-white rounded-2xl border border-[#F2E5EC]">You have not filed any complaints.</p>
      ) : list.map(c => {
        const [label, tone] = STATUS[c.status] || [c.status, 'bg-stone-100 text-stone-600'];
        const vendorName = c.vendorId?.businessName || c.externalVendor?.businessName || c.externalVendor?.name || 'Vendor';
        return (
          <div key={c._id} className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-[#2E1026]">{c.category} · {vendorName}</p>
                <p className="text-xs text-[#7A6876]">Filed {fmt(c.createdAt)}{c.tat?.resolveBy && ['Pending', 'In-Review', 'Appealed'].includes(c.status) ? ` · decision expected by ${fmt(c.tat.resolveBy)}` : ''}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tone}`}>{label}</span>
            </div>
            <p className="text-xs text-[#5C4A57] line-clamp-3">{c.description}</p>
            {c.vendorId && ['Pending', 'In-Review'].includes(c.status) && (
              <p className="text-[11px] text-[#7A6876]">{c.vendorResponded ? 'The vendor has given their side.' : 'Waiting for the vendor to give their side.'}</p>
            )}
            {c.outcome && <p className="text-xs p-3 rounded-xl bg-[#FAF6F0] text-[#2E1026]"><span className="font-bold">Decision:</span> {c.outcome}</p>}
            {c.appeal?.by && <p className="text-[11px] text-[#5C4A57]">Appeal by {c.appeal.by === 'User' ? 'you' : 'the vendor'}{c.appeal.decision ? `: ${c.appeal.decision.toLowerCase()} · ${c.appeal.decisionNote}` : ' · being reviewed'}</p>}
            {c.canAppeal && <button onClick={() => appeal(c)} className="px-4 py-2 rounded-xl border border-[#E5D5DC] text-[#401332] text-xs font-bold cursor-pointer">Appeal the decision</button>}
          </div>
        );
      })}

      {aboutMe.length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="text-lg font-bold text-[#401332]" style={HEADING}>Concerns raised by vendors</h2>
          <p className="text-xs text-[#7A6876]">A vendor shared how a booking went with you. Nothing is shown to other vendors unless the Utsavo team confirms it after reading your side.</p>
          {aboutMe.map(r => (
            <div key={r._id} className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-[#2E1026]">{r.vendorName}</p>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.status === 'Confirmed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>{r.status === 'Confirmed' ? 'Confirmed' : 'Being reviewed'}</span>
              </div>
              {r.issues?.length > 0 && <p className="text-xs text-[#5C4A57]">{r.issues.join(' · ')}</p>}
              <p className="text-xs text-[#5C4A57]">{r.description}</p>
              {r.customerResponse?.statement
                ? <p className="text-[11px] text-[#7A6876]"><span className="font-bold">Your side:</span> {r.customerResponse.statement}</p>
                : r.status === 'Pending' && <button onClick={() => respond(r)} className="px-4 py-2 rounded-xl border border-[#E5D5DC] text-[#401332] text-xs font-bold cursor-pointer">Give your side</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
