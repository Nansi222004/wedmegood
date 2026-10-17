import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';
import { HEADING_FONT, TERMINAL, TONE_CLASSES, formatDate, formatMoney, statusOf } from './enquiryStatus';
import PrivateImage from '../../../components/common/PrivateImage';
import { getAuthToken } from '../../../services/userApi';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5DC] bg-white text-sm text-[#2E1026] placeholder:text-[#B5A6B1] focus:outline-none focus:border-[#551E43]';
const primaryBtn = 'px-4 py-2.5 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer';
const ghostBtn = 'px-4 py-2.5 rounded-xl border border-[#E5D5DC] bg-white text-[#401332] text-xs font-bold hover:bg-[#FFF5F6] disabled:opacity-50 cursor-pointer';
const TRAVEL = { Included: 'Travel included', Separate: 'Travel charged separately', Depends: 'Travel depends on distance' };

const Modal = ({ title, subtitle, onClose, children }) => createPortal(
  <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
    <div
      className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-[#F2E5EC] max-h-[88vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#2E1026]" style={HEADING_FONT}>{title}</h3>
          {subtitle && <p className="text-xs text-[#7A6876] mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer" aria-label="Close">✕</button>
      </div>
      {children}
    </div>
  </div>,
  document.body
);

const Stars = ({ rating, count }) => (count > 0 ? (
  <span className="inline-flex items-center gap-0.5 text-[11px] text-[#7A6876]">
    <span className="text-amber-500">★</span> {Number(rating).toFixed(1)} ({count})
  </span>
) : <span className="text-[11px] text-[#8A7987]">New on Utsavo</span>);

const VendorCard = ({ vendor, onProfile }) => (
  <div className="flex gap-3">
    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FAF6F0] border border-[#F2E5EC] shrink-0">
      {vendor.profileImage
        ? <img src={vendor.profileImage} alt={vendor.businessName} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#551E43]">{(vendor.businessName || 'V').slice(0, 2).toUpperCase()}</div>}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-bold text-[#2E1026] truncate">{vendor.businessName}</p>
        {vendor.isVerified && <span className="text-[#2563EB] shrink-0" title="Verified"><Icon name="verified" size="xs" /></span>}
      </div>
      <p className="text-[11px] text-[#7A6876]">
        {vendor.city}
        {vendor.distanceKm != null ? ` · about ${Math.round(vendor.distanceKm)} km away` : ''}
        {vendor.experienceYears ? ` · ${vendor.experienceYears} yrs` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
        <Stars rating={vendor.rating} count={vendor.reviewCount} />
        {vendor.priceRange && <span className="text-[11px] text-[#5C4A57]">{vendor.priceRange}</span>}
      </div>
      {vendor.travelPolicy && <p className="text-[10px] text-[#8A7987] mt-0.5">{TRAVEL[vendor.travelPolicy]}</p>}
      {onProfile && (
        <button onClick={onProfile} className="text-[11px] font-bold text-[#551E43] underline mt-1 cursor-pointer">View profile & work</button>
      )}
    </div>
  </div>
);

const RequirementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // `${leadId}:${action}`

  const [declineFor, setDeclineFor] = useState(null);
  const [declineForm, setDeclineForm] = useState({ reason: '', note: '', next: 'auto' });
  const [exploreFor, setExploreFor] = useState(null);
  const [alternatives, setAlternatives] = useState({ loading: false, list: [] });
  const [detailsFor, setDetailsFor] = useState(null);
  const [detailsForm, setDetailsForm] = useState({ requirements: '', budget: '', guestCount: '' });

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await userApi.getEnquiry(id);
      setEnquiry(res.data);
      setError(null);
    } catch (err) {
      if (!quiet) setError(getFriendlyErrorMessage(err, 'Could not load this requirement.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    userApi.getEnquiryOptions().then(res => setOptions(res.data)).catch(() => {});
  }, []);

  // Live updates: poll quickly while a vendor is being found, slowly otherwise
  const searching = enquiry?.services?.some(s => s.status === 'Awaiting Response');
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const timer = setInterval(() => loadRef.current(true), searching ? 5000 : 30000);
    const onFocus = () => loadRef.current(true);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [searching]);

  const run = async (leadId, action, fn, successMessage) => {
    setBusy(`${leadId}:${action}`);
    try {
      const res = await fn();
      toast.success(res?.message || successMessage);
      await load(true);
      return res;
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Something went wrong. Please try again.'));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const openExplore = async (service) => {
    setExploreFor(service);
    setAlternatives({ loading: true, list: [] });
    try {
      const res = await userApi.getEnquiryAlternatives(id, service._id);
      setAlternatives({ loading: false, list: res.data || [] });
    } catch (err) {
      setAlternatives({ loading: false, list: [] });
      toast.error(getFriendlyErrorMessage(err, 'Could not load vendors.'));
    }
  };

  const openDecline = (service) => {
    setDeclineFor(service);
    setDeclineForm({ reason: '', note: '', next: service.canAutoReassign ? 'auto' : 'explore' });
  };

  const submitDecline = async () => {
    const service = declineFor;
    const res = await run(service._id, 'decline', () => userApi.declineEnquiryVendor(id, service._id, {
      reason: declineForm.reason || 'skipped',
      note: declineForm.note,
      next: declineForm.next
    }));
    setDeclineFor(null);
    if (res?.data?.status === 'Exploring') openExplore(service);
  };

  const openDetails = (service) => {
    setDetailsFor(service);
    setDetailsForm({
      requirements: service.requirements || '',
      budget: service.budget ? String(service.budget) : '',
      guestCount: service.guestCount ? String(service.guestCount) : '',
      photos: service.referencePhotos.filter(p => p.private)
    });
  };

  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const addDetailPhotos = async (fileList) => {
    const room = 10 - (detailsForm.photos?.length || 0);
    const files = Array.from(fileList || []).slice(0, Math.max(0, room));
    if (files.length === 0) {
      toast.warning('You can add up to 10 photos per service.');
      return;
    }
    setUploadingPhotos(true);
    try {
      const res = await userApi.uploadReferencePhotos(files);
      if (Array.isArray(res.data)) setDetailsForm(f => ({ ...f, photos: [...(f.photos || []), ...res.data] }));
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Photo upload failed.'));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submitDetails = async () => {
    const service = detailsFor;
    if (service.detailsRequest && !detailsForm.requirements.trim()) {
      toast.warning('Please add the details the vendor asked for.');
      return;
    }
    await run(service._id, 'details', () => userApi.updateEnquiryService(id, service._id, {
      requirements: detailsForm.requirements,
      budget: Number(detailsForm.budget) || 0,
      guestCount: Number(detailsForm.guestCount) || 0,
      referencePhotoIds: (detailsForm.photos || []).map(p => p._id)
    }), 'Details updated');
    setDetailsFor(null);
  };

  const selectVendor = async (vendor) => {
    const service = exploreFor;
    if (!window.confirm(`Choose ${vendor.businessName} for ${service.category}?`)) return;
    await run(service._id, 'select', () => userApi.selectEnquiryVendor(id, service._id, vendor._id), 'Vendor selected');
    setExploreFor(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-[#551E43] border-t-transparent animate-spin rounded-full mb-3" />
        <p className="text-xs font-semibold text-[#7A6876]">Loading your requirement...</p>
      </div>
    );
  }
  if (error || !enquiry) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-10 text-center">
        <p className="text-sm text-red-700">{error || 'Requirement not found'}</p>
        <button onClick={() => navigate('/user/enquiries')} className={`${ghostBtn} mt-4`}>Back to my requirements</button>
      </div>
    );
  }

  const eventLabel = enquiry.eventType === 'Other' && enquiry.eventTypeOther ? enquiry.eventTypeOther : enquiry.eventType;
  const isActive = enquiry.status === 'Active';
  const declineReasons = options?.customerDeclineReasons || [];

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-6 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/user/enquiries')}
          className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] active:scale-95 transition-all shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <Icon name="chevronLeft" size="sm" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#401332] leading-tight truncate" style={HEADING_FONT}>{eventLabel}</h1>
          <p className="text-xs text-[#7A6876] mt-0.5">
            {formatDate(enquiry.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {enquiry.eventTime ? ` · ${enquiry.eventTime}` : ''} · {enquiry.city} {enquiry.pincode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Services', value: enquiry.summary.total },
          { label: 'With vendor', value: enquiry.summary.withVendor },
          { label: 'Booked', value: enquiry.summary.booked }
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl bg-white border border-[#F2E5EC] text-center">
            <p className="text-lg font-bold text-[#401332]">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A7987]">{s.label}</p>
          </div>
        ))}
      </div>

      {(enquiry.guestCount > 0 || enquiry.totalBudget > 0 || enquiry.venueName) && (
        <p className="text-xs text-[#5C4A57] px-1">
          {[enquiry.venueName, enquiry.guestCount > 0 && `${enquiry.guestCount} guests`, enquiry.totalBudget > 0 && `Total budget ${formatMoney(enquiry.totalBudget)}`].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="space-y-3">
        {enquiry.services.map(s => {
          const st = statusOf(s.status);
          const open = !TERMINAL.includes(s.status);
          const isBusy = (a) => busy === `${s._id}:${a}`;
          const sentQuote = s.quotes.find(q => q.status === 'Sent');
          return (
            <div key={s._id} className={`p-4 rounded-2xl bg-white border shadow-sm space-y-3 ${open ? 'border-[#F2E5EC]' : 'border-stone-200 opacity-80'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#2E1026] leading-tight" style={HEADING_FONT}>{s.category}</h2>
                  <p className="text-[11px] text-[#7A6876] mt-0.5">
                    {s.budget > 0 ? `Budget ${formatMoney(s.budget)}` : 'No budget set'}
                    {s.referencePhotos.length > 0 ? ` · ${s.referencePhotos.length} photo${s.referencePhotos.length === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${TONE_CLASSES[st.tone]}`}>{st.label}</span>
              </div>

              {s.referencePhotos.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto">
                  {s.referencePhotos.map((p, i) => (
                    <PrivateImage key={p._id} src={p.url} token={getAuthToken()} alt={`Reference ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-[#F2E5EC] shrink-0" />
                  ))}
                </div>
              )}

              {/* Finding a vendor */}
              {s.status === 'Awaiting Response' && (
                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center gap-3">
                  <span className="relative flex w-3 h-3 shrink-0">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-sky-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-sky-500" />
                  </span>
                  <p className="text-xs text-sky-900">
                    {s.attempts > 1
                      ? `Reassigned. Asking vendor #${s.attempts} near your venue...`
                      : 'Asking a verified vendor near your venue. This usually takes under a minute.'}
                  </p>
                </div>
              )}

              {/* The vendor needs more details */}
              {s.status === 'Details Requested' && s.detailsRequest && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <p className="text-xs font-bold text-amber-900">A vendor needs more details to quote</p>
                  <p className="text-xs text-amber-900 italic">“{s.detailsRequest.note}”</p>
                  <button onClick={() => openDetails(s)} className={primaryBtn}>Add details</button>
                </div>
              )}

              {/* Nobody accepted */}
              {s.status === 'Unassigned' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <p className="text-xs text-rose-900">
                    No vendor near your venue has accepted yet. Our team has been told and may contact you.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!s.searchWidened && (
                      <button
                        disabled={isBusy('widen')}
                        onClick={() => run(s._id, 'widen', () => userApi.widenEnquirySearch(id, s._id))}
                        className={primaryBtn}
                      >
                        {isBusy('widen') ? 'Searching...' : 'Search a wider area'}
                      </button>
                    )}
                    <button onClick={() => openExplore(s)} className={ghostBtn}>Choose a vendor myself</button>
                  </div>
                  {!s.searchWidened && <p className="text-[10px] text-rose-800/80">Vendors further away may charge for travel.</p>}
                </div>
              )}

              {/* Customer picks */}
              {s.status === 'Exploring' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                  <p className="text-xs text-amber-900">Choose a vendor for this service from the eligible list.</p>
                  <button onClick={() => openExplore(s)} className={primaryBtn}>Explore vendors</button>
                </div>
              )}

              {/* A vendor is on it */}
              {s.vendor && (
                <div className="p-3 rounded-xl bg-[#FFFBFC] border border-[#F2E5EC] space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7987]">
                    {s.assignedType === 'CustomerSelected' ? 'Your chosen vendor' : s.assignedType === 'Manual' ? 'Assigned by the Utsavo team' : 'Accepted your requirement'}
                  </p>
                  <VendorCard vendor={s.vendor} onProfile={() => navigate(`/user/vendor/${s.vendor._id}`)} />
                  {s.vendor.portfolio.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto">
                      {s.vendor.portfolio.map(url => (
                        <img key={url} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#F2E5EC] shrink-0" loading="lazy" />
                      ))}
                    </div>
                  )}
                  {!s.contacted && s.contactDeadline && (
                    <p className="text-[11px] text-[#5C4A57] flex items-center gap-1">
                      <Icon name="clock" size="xs" />
                      Will contact you by {new Date(s.contactDeadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}, or we find you another vendor.
                    </p>
                  )}
                  {s.quotes.length > 0 && (
                    <div className="space-y-1.5">
                      {s.quotes.slice(0, 3).map(q => (
                        <div key={q._id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white border border-[#F2E5EC]">
                          <span className="text-[#401332] font-semibold">{formatMoney(q.totalAmount)}{q.version > 1 ? ` · v${q.version}` : ''}</span>
                          <span className="text-[#7A6876]">
                            {q.status === 'Sent' && q.validUntil ? `Valid till ${formatDate(q.validUntil, { day: 'numeric', month: 'short' })}` : q.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate(`/user/chats/${s.vendor._id}`)} className={ghostBtn}>Chat</button>
                    {sentQuote && <button onClick={() => navigate('/user/quotes')} className={primaryBtn}>Review quote</button>}
                    {open && (
                      <button onClick={() => openDecline(s)} className="px-3 py-2.5 text-xs font-bold text-[#BE185D] cursor-pointer">Not the right fit?</button>
                    )}
                  </div>
                </div>
              )}

              {s.status === 'Booked' && (
                <button onClick={() => navigate('/user/bookings')} className="text-xs font-bold text-emerald-700 underline cursor-pointer">View booking</button>
              )}

              {open && isActive && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-[#F7EEF2]">
                  <button onClick={() => openDetails(s)} className="text-[11px] font-semibold text-[#551E43] cursor-pointer pt-2">Edit details</button>
                  {s.vendor && !['Exploring'].includes(s.status) && (
                    <button onClick={() => openExplore(s)} className="text-[11px] font-semibold text-[#551E43] cursor-pointer pt-2">Explore other vendors</button>
                  )}
                  {s.status === 'Awaiting Response' && (
                    <button onClick={() => openExplore(s)} className="text-[11px] font-semibold text-[#551E43] cursor-pointer pt-2">Choose myself instead</button>
                  )}
                  <button
                    disabled={isBusy('cancel')}
                    onClick={() => window.confirm(`Remove ${s.category} from this requirement?`) && run(s._id, 'cancel', () => userApi.cancelEnquiryService(id, s._id))}
                    className="text-[11px] font-semibold text-stone-500 cursor-pointer pt-2 ml-auto"
                  >
                    Remove service
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isActive && enquiry.services.some(s => !TERMINAL.includes(s.status)) && (
        <div className="text-center pt-2">
          <button
            onClick={async () => {
              if (!window.confirm('Cancel this whole requirement? Booked services are not affected.')) return;
              try {
                const res = await userApi.cancelEnquiry(id);
                toast.success(res.message);
                load(true);
              } catch (err) {
                toast.error(getFriendlyErrorMessage(err, 'Could not cancel.'));
              }
            }}
            className="text-xs font-semibold text-stone-500 underline cursor-pointer"
          >
            Cancel this requirement
          </button>
        </div>
      )}

      {/* Decline the assigned vendor */}
      {declineFor && (
        <Modal
          title={`Not the right fit for ${declineFor.category}?`}
          subtitle="Your reason stays private. The vendor is only told you went another way."
          onClose={() => setDeclineFor(null)}
        >
          <div className="space-y-2">
            {declineReasons.filter(r => r.value !== 'skipped').map(r => (
              <label key={r.value} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer ${declineForm.reason === r.value ? 'border-[#551E43] bg-[#FFF5F6]' : 'border-[#F2E5EC]'}`}>
                <input type="radio" name="reason" className="accent-[#551E43]" checked={declineForm.reason === r.value} onChange={() => setDeclineForm(f => ({ ...f, reason: r.value }))} />
                <span className="text-[#2E1026]">{r.label}</span>
              </label>
            ))}
            {declineForm.reason === 'other' && (
              <textarea rows={2} className={`${inputClass} resize-none`} placeholder="Tell us more (optional)" value={declineForm.note} onChange={e => setDeclineForm(f => ({ ...f, note: e.target.value }))} maxLength={500} />
            )}
            <button onClick={() => setDeclineForm(f => ({ ...f, reason: '' }))} className="text-[11px] text-[#7A6876] underline cursor-pointer">I'd rather not say</button>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A6876] mt-4 mb-2">What next?</p>
          <div className="space-y-2">
            <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs ${declineFor.canAutoReassign ? 'cursor-pointer' : 'opacity-50'} ${declineForm.next === 'auto' ? 'border-[#551E43] bg-[#FFF5F6]' : 'border-[#F2E5EC]'}`}>
              <input type="radio" name="next" className="accent-[#551E43] mt-0.5" disabled={!declineFor.canAutoReassign} checked={declineForm.next === 'auto'} onChange={() => setDeclineForm(f => ({ ...f, next: 'auto' }))} />
              <span>
                <span className="font-semibold text-[#2E1026]">Find me another vendor</span>
                <span className="block text-[#7A6876]">
                  {declineFor.canAutoReassign
                    ? `Utsavo assigns the next eligible vendor${declineForm.reason === 'price_high' ? ' that fits your budget' : ''}.`
                    : `You have used the ${enquiry.reassignLimit} automatic reassignments. Choose a vendor yourself.`}
                </span>
              </span>
            </label>
            <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer ${declineForm.next === 'explore' ? 'border-[#551E43] bg-[#FFF5F6]' : 'border-[#F2E5EC]'}`}>
              <input type="radio" name="next" className="accent-[#551E43] mt-0.5" checked={declineForm.next === 'explore'} onChange={() => setDeclineForm(f => ({ ...f, next: 'explore' }))} />
              <span>
                <span className="font-semibold text-[#2E1026]">I'll choose from the list</span>
                <span className="block text-[#7A6876]">See eligible vendors for your date and area.</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 mt-5">
            <button onClick={() => setDeclineFor(null)} className={ghostBtn}>Keep this vendor</button>
            <button onClick={submitDecline} disabled={busy === `${declineFor._id}:decline`} className={primaryBtn}>
              {busy === `${declineFor._id}:decline` ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}

      {/* Explore other vendors */}
      {exploreFor && (
        <Modal
          title={`Vendors for ${exploreFor.category}`}
          subtitle={`Eligible on ${formatDate(enquiry.eventDate)} near ${enquiry.city}. ${exploreFor.vendor ? 'Your current vendor is not listed.' : ''}`}
          onClose={() => setExploreFor(null)}
        >
          {alternatives.loading ? (
            <p className="text-xs text-[#7A6876] py-6 text-center">Loading vendors...</p>
          ) : alternatives.list.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-[#5C4A57]">No other eligible vendor is available for this service yet.</p>
              {!exploreFor.searchWidened && !exploreFor.vendor && (
                <button
                  onClick={async () => { setExploreFor(null); await run(exploreFor._id, 'widen', () => userApi.widenEnquirySearch(id, exploreFor._id)); }}
                  className={primaryBtn}
                >
                  Search a wider area
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {alternatives.list.map(v => (
                <div key={v._id} className={`p-3 rounded-xl border ${v.selectable ? 'border-[#F2E5EC]' : 'border-stone-200 bg-stone-50'}`}>
                  <VendorCard vendor={v} onProfile={() => navigate(`/user/vendor/${v._id}`)} />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {v.nearby && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Serves your area</span>}
                    {!v.nearby && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">Travels to you</span>}
                    {!v.isVerified && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">Not yet verified</span>}
                    {!v.availableOnDate && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">Unavailable on your date</span>}
                    {v.availableOnDate && !v.takingLeads && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">Not taking requests now</span>}
                    {!v.withinBudget && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">Usually above your budget</span>}
                  </div>
                  {v.selectable && (
                    <button
                      onClick={() => selectVendor(v)}
                      disabled={busy === `${exploreFor._id}:select`}
                      className={`${primaryBtn} w-full mt-2.5`}
                    >
                      Choose {v.businessName}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Add / edit details */}
      {detailsFor && (
        <Modal
          title={`${detailsFor.category} details`}
          subtitle={detailsFor.detailsRequest ? `The vendor asked: “${detailsFor.detailsRequest.note}”` : 'Vendors see these details before they accept.'}
          onClose={() => setDetailsFor(null)}
        >
          <div className="space-y-3">
            <textarea rows={5} className={`${inputClass} resize-none`} placeholder="Describe what you need" value={detailsForm.requirements} onChange={e => setDetailsForm(f => ({ ...f, requirements: e.target.value }))} maxLength={2000} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" inputMode="numeric" className={inputClass} placeholder="Budget (₹)" value={detailsForm.budget} onChange={e => setDetailsForm(f => ({ ...f, budget: e.target.value }))} />
              <input type="number" min="0" inputMode="numeric" className={inputClass} placeholder="Guests" value={detailsForm.guestCount} onChange={e => setDetailsForm(f => ({ ...f, guestCount: e.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(detailsForm.photos || []).map((p, i) => (
                <div key={p._id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#F2E5EC]">
                  <PrivateImage src={p.url} token={getAuthToken()} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setDetailsForm(f => ({ ...f, photos: f.photos.filter(x => x._id !== p._id) }))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center cursor-pointer"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(detailsForm.photos || []).length < 10 && (
                <label className="w-16 h-16 rounded-lg border border-dashed border-[#C9AFBF] text-[#7A6876] flex flex-col items-center justify-center text-[10px] cursor-pointer">
                  {uploadingPhotos ? '...' : <><Icon name="camera" size="xs" /> Add</>}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingPhotos} onChange={e => { addDetailPhotos(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-[#8A7987]">Photos are stored privately and shown only to the vendor working on this service.</p>
            {detailsFor.detailsRequest && (
              <p className="text-[11px] text-[#7A6876]">When you save, the requirement goes straight back to the same vendor.</p>
            )}
          </div>
          <div className="flex justify-end gap-2.5 mt-5">
            <button onClick={() => setDetailsFor(null)} className={ghostBtn}>Cancel</button>
            <button onClick={submitDetails} disabled={busy === `${detailsFor._id}:details`} className={primaryBtn}>
              {busy === `${detailsFor._id}:details` ? 'Saving...' : detailsFor.detailsRequest ? 'Send to vendor' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RequirementDetail;
