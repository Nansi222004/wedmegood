import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';
import { DOT_CLASSES, HEADING_FONT, formatDate, statusOf } from './enquiryStatus';
import LoginRequired from '../../../components/common/LoginRequired';
import { getAuthToken } from '../../../services/userApi';

const MyRequirements = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getEnquiries();
      setEnquiries(res.data || []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Could not load your requirements.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (getAuthToken()) load(); }, []);

  if (!getAuthToken()) return <LoginRequired message="Log in to see your requirements and the vendors working on them." />;

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/home'))}
            className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Back"
          >
            <Icon name="chevronLeft" size="sm" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={HEADING_FONT}>My requirements</h1>
            <p className="text-xs text-[#7A6876] mt-0.5">Every event and the vendor for each service.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/user/requirements/new')}
          className="px-3.5 py-2 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white text-xs font-bold shadow-sm shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <Icon name="plus" size="xs" /> New
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#551E43] border-t-transparent animate-spin rounded-full mb-3" />
          <p className="text-xs font-semibold text-[#7A6876]">Loading...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline cursor-pointer">Retry</button>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-2xl border border-[#F2E5EC] px-6 shadow-sm">
          <div className="w-12 h-12 bg-[#FFF5F6] text-[#551E43] rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="checkList" size="md" />
          </div>
          <h3 className="text-sm font-bold text-[#401332]">No requirements yet</h3>
          <p className="text-xs text-[#7A6876] mt-1">Tell us about your event and we will connect you with verified vendors.</p>
          <button
            onClick={() => navigate('/user/requirements/new')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#551E43] text-white text-xs font-bold cursor-pointer"
          >
            Post a requirement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(e => (
            <button
              key={e._id}
              onClick={() => navigate(`/user/enquiries/${e._id}`)}
              className="w-full text-left p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm hover:border-[#D9C2CF] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#2E1026] leading-tight" style={HEADING_FONT}>{e.eventType}</h3>
                  <p className="text-xs text-[#7A6876] mt-0.5">{formatDate(e.eventDate)} · {e.city} {e.pincode}</p>
                </div>
                {e.status !== 'Active' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 shrink-0">{e.status}</span>
                ) : e.summary.needsAction > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    {e.summary.needsAction} need{e.summary.needsAction === 1 ? 's' : ''} you
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFF5F6] text-[#551E43] shrink-0">
                    {e.summary.withVendor}/{e.summary.total} with vendor
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.services.map(s => {
                  const st = statusOf(s.status);
                  return (
                    <span key={s._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF6F0] text-[11px] text-[#401332] border border-[#EDE3D6]">
                      <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASSES[st.tone]}`} />
                      {s.category}
                      <span className="text-[#8A7987]">· {st.label}</span>
                    </span>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequirements;
