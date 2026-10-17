import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';

/**
 * A vendor the Utsavo team confirmed as fake. Shown in search results in red so genuine customers
 * are warned; every contact option is removed (the server blocks contact too).
 */
const ReportedFakeVendorCard = ({ vendor }) => {
  const navigate = useNavigate();
  const name = vendor?.businessName || vendor?.name || 'Vendor';
  // Only vendors who registered on the app have a profile page (it opens as a warning)
  const profileId = vendor?.vendorId || null;

  return (
    <div className="rounded-[22px] border-2 border-red-300 bg-red-50/70 p-4 shadow-xs" role="alert">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
          <Icon name="warning" size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-red-800 leading-tight line-through decoration-red-400/70">{name}</h3>
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">Fake vendor</span>
          </div>
          <p className="text-[11px] text-red-700/80 mt-0.5">
            {[vendor?.city, vendor?.category].filter(Boolean).join(' · ')}
          </p>
          <p className="text-xs text-red-900 mt-2 leading-relaxed">
            Confirmed as fake by the Utsavo team after an investigation. Contacting this vendor is blocked for your safety.
          </p>
          <div className="flex flex-wrap gap-3 mt-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/user/fake-vendors'); }}
              className="text-xs font-bold text-red-700 underline cursor-pointer"
            >
              See what happened
            </button>
            {profileId && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/user/vendor/${profileId}`); }}
                className="text-xs font-semibold text-red-700/80 cursor-pointer"
              >
                View warning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportedFakeVendorCard;
