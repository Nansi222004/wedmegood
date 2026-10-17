import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';
import { HEADING_FONT } from './enquiryStatus';
import LoginRequired from '../../../components/common/LoginRequired';
import PrivateImage from '../../../components/common/PrivateImage';
import { getAuthToken } from '../../../services/userApi';

const MAX_PHOTOS = 10;
const todayISO = () => new Date().toISOString().slice(0, 10);

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5DC] bg-white text-sm text-[#2E1026] placeholder:text-[#B5A6B1] focus:outline-none focus:border-[#551E43]';
const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-[#7A6876] mb-1.5';

const Section = ({ step, title, hint, children }) => (
  <section className="p-4 rounded-2xl bg-white border border-[#F2E5EC] shadow-sm space-y-3">
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-full bg-[#551E43] text-white text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
      <div>
        <h2 className="text-base font-bold text-[#401332] leading-tight" style={HEADING_FONT}>{title}</h2>
        {hint && <p className="text-xs text-[#7A6876] mt-0.5">{hint}</p>}
      </div>
    </div>
    {children}
  </section>
);

const PostRequirement = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [options, setOptions] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pinState, setPinState] = useState({ status: 'idle', place: null });
  const [uploadingFor, setUploadingFor] = useState(null);

  const [form, setForm] = useState(() => ({
    eventType: params.get('event') || 'Wedding',
    eventTypeOther: '',
    eventDate: user?.weddingDate && new Date(user.weddingDate) >= new Date(todayISO())
      ? new Date(user.weddingDate).toISOString().slice(0, 10)
      : '',
    eventTime: '',
    guestCount: '',
    venueName: '',
    venueAddress: '',
    pincode: '',
    city: user?.city || '',
    district: '',
    venueType: 'Not Specified',
    totalBudget: '',
    notes: '',
    allowExpandedSearch: false
  }));
  // { [serviceName]: { budget, requirements, referencePhotos } }
  const [services, setServices] = useState(() => {
    const pre = params.get('service');
    return pre ? { [pre]: { budget: '', requirements: '', referencePhotos: [] } } : {};
  });

  useEffect(() => {
    if (!getAuthToken()) return undefined;
    let alive = true;
    userApi.getEnquiryOptions()
      .then(res => { if (alive) setOptions(res.data); })
      .catch(err => toast.error(getFriendlyErrorMessage(err, 'Could not load the form. Please try again.')))
      .finally(() => alive && setLoadingOptions(false));
    return () => { alive = false; };
  }, []);

  // Look up the PIN code as soon as it has 6 digits
  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPinState({ status: 'idle', place: null });
      return undefined;
    }
    let alive = true;
    setPinState({ status: 'loading', place: null });
    userApi.lookupPincode(pin)
      .then(res => {
        if (!alive) return;
        const place = res.data;
        setPinState({ status: 'found', place });
        setForm(f => ({
          ...f,
          city: f.city && f.city !== user?.city ? f.city : (place.city || place.district || f.city),
          district: place.district || f.district
        }));
      })
      .catch(() => alive && setPinState({ status: 'notfound', place: null }));
    return () => { alive = false; };
  }, [form.pincode, user?.city]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const selected = Object.keys(services);

  const toggleService = (name) => {
    setServices(prev => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = { budget: '', requirements: '', referencePhotos: [] };
      return next;
    });
  };
  const setService = (name, key, value) => setServices(prev => ({ ...prev, [name]: { ...prev[name], [key]: value } }));

  const handlePhotos = async (name, fileList) => {
    const files = Array.from(fileList || []);
    const room = MAX_PHOTOS - (services[name]?.referencePhotos.length || 0);
    if (room <= 0) {
      toast.warning(`You can add up to ${MAX_PHOTOS} photos per service.`);
      return;
    }
    setUploadingFor(name);
    try {
      // Uploaded privately: the server keeps no public link, only this account and the assigned vendor can view them
      const res = await userApi.uploadReferencePhotos(files.slice(0, room));
      if (res.success && Array.isArray(res.data)) {
        setServices(prev => ({
          ...prev,
          [name]: { ...prev[name], referencePhotos: [...prev[name].referencePhotos, ...res.data] }
        }));
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, 'Photo upload failed.'));
    } finally {
      setUploadingFor(null);
    }
  };

  const serviceBudgetTotal = useMemo(
    () => selected.reduce((sum, s) => sum + (Number(services[s].budget) || 0), 0),
    [services, selected]
  );

  const validate = () => {
    if (!form.eventDate) return 'Please choose the event date.';
    if (form.eventDate < todayISO()) return 'The event date cannot be in the past.';
    if (form.eventType === 'Other' && !form.eventTypeOther.trim()) return 'Tell us what you are celebrating.';
    if (!/^\d{6}$/.test(form.pincode.trim())) return 'Enter the 6-digit PIN code of the venue.';
    if (!form.city.trim()) return 'Enter the city of the event.';
    if (selected.length === 0) return 'Choose at least one service you need.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast.warning(problem);
      return;
    }
    setSubmitting(true);
    try {
      const res = await userApi.createEnquiry({
        ...form,
        guestCount: Number(form.guestCount) || 0,
        totalBudget: Number(form.totalBudget) || 0,
        services: selected.map(name => ({
          category: name,
          budget: Number(services[name].budget) || 0,
          requirements: services[name].requirements,
          referencePhotoIds: services[name].referencePhotos.map(p => p._id)
        }))
      });
      toast.success(res.message || 'Requirement posted');
      navigate(`/user/enquiries/${res.data._id}`, { replace: true });
    } catch (err) {
      if (err.status === 409 && err.data?.data?.enquiryIds?.[0]) {
        toast.info(err.message);
        navigate(`/user/enquiries/${err.data.data.enquiryIds[0]}`);
        return;
      }
      toast.error(getFriendlyErrorMessage(err, 'Could not post your requirement.'));
    } finally {
      setSubmitting(false);
    }
  };

  const windowSeconds = options?.offerWindowSeconds || 30;

  if (!getAuthToken()) return <LoginRequired message="Log in with your verified mobile number to post a requirement and track your vendors." />;

  return (
    <form onSubmit={handleSubmit} className="min-h-screen pb-36 px-4 sm:px-6 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/home'))}
          className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] active:scale-95 transition-all shrink-0 cursor-pointer"
          aria-label="Back"
        >
          <Icon name="chevronLeft" size="sm" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={HEADING_FONT}>Post your requirement</h1>
          <p className="text-xs text-[#7A6876] mt-0.5">Tell us once. We connect each service to a verified vendor near your venue.</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EDE3D6] text-xs text-[#5C4A57] leading-relaxed">
        <p className="font-bold text-[#401332] mb-1.5">How it works</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Each service you choose is sent to one subscribed, verified vendor who serves your venue's area.</li>
          <li>The vendor has {windowSeconds} seconds to accept. If they don't, it moves to the next vendor automatically.</li>
          <li>You see who accepted, their work and price range. Not the right fit? Ask for another or pick one yourself.</li>
        </ol>
      </div>

      <Section step={1} title="Your event" hint="Weddings, engagements, birthdays, housewarmings, temple events and more.">
        <div className="flex flex-wrap gap-2">
          {(options?.eventTypes || ['Wedding']).map(type => (
            <button
              type="button"
              key={type}
              onClick={() => set('eventType', type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${form.eventType === type ? 'bg-[#551E43] text-white border-[#551E43]' : 'bg-white text-[#401332] border-[#E5D5DC] hover:border-[#551E43]'}`}
            >
              {type}
            </button>
          ))}
        </div>
        {form.eventType === 'Other' && (
          <input className={inputClass} placeholder="What are you celebrating?" value={form.eventTypeOther} onChange={e => set('eventTypeOther', e.target.value)} maxLength={80} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="eventDate">Date *</label>
            <input id="eventDate" type="date" min={todayISO()} className={inputClass} value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="eventTime">Time</label>
            <input id="eventTime" type="time" className={inputClass} value={form.eventTime} onChange={e => set('eventTime', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="guests">Approx. guests</label>
          <input id="guests" type="number" min="0" inputMode="numeric" className={inputClass} placeholder="e.g. 300" value={form.guestCount} onChange={e => set('guestCount', e.target.value)} />
        </div>
      </Section>

      <Section step={2} title="Venue location" hint="Vendors are matched on the venue's PIN code, not on your home address.">
        <input className={inputClass} placeholder="Venue name (optional)" value={form.venueName} onChange={e => set('venueName', e.target.value)} maxLength={160} />
        <input className={inputClass} placeholder="Venue address (optional)" value={form.venueAddress} onChange={e => set('venueAddress', e.target.value)} maxLength={400} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="pincode">PIN code *</label>
            <input
              id="pincode"
              inputMode="numeric"
              maxLength={6}
              className={inputClass}
              placeholder="500081"
              value={form.pincode}
              onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="city">City *</label>
            <input id="city" className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} maxLength={80} />
          </div>
        </div>
        {pinState.status === 'loading' && <p className="text-[11px] text-[#7A6876]">Looking up PIN code...</p>}
        {pinState.status === 'found' && (
          <p className="text-[11px] text-emerald-700 flex items-center gap-1">
            <Icon name="location" size="xs" />
            {[pinState.place.city, pinState.place.district, pinState.place.state].filter(Boolean).join(', ')}
          </p>
        )}
        {pinState.status === 'notfound' && (
          <p className="text-[11px] text-amber-700">We could not find this PIN code. Check it, or type the district below.</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="district">District</label>
            <input id="district" className={inputClass} value={form.district} onChange={e => set('district', e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className={labelClass} htmlFor="venueType">Venue type</label>
            <select id="venueType" className={inputClass} value={form.venueType} onChange={e => set('venueType', e.target.value)}>
              <option value="Not Specified">Not decided</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
      </Section>

      <Section step={3} title="Services you need" hint="Each service goes to its own vendor, so you can book them separately.">
        {loadingOptions ? (
          <p className="text-xs text-[#7A6876]">Loading services...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(options?.services || []).map(s => {
              const on = Boolean(services[s.name]);
              return (
                <button
                  type="button"
                  key={s.name}
                  onClick={() => toggleService(s.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${on ? 'bg-[#FFF5F6] text-[#551E43] border-[#551E43]' : 'bg-white text-[#5C4A57] border-[#E5D5DC] hover:border-[#551E43]'}`}
                  aria-pressed={on}
                >
                  {on && <Icon name="check" size="xs" />}
                  {s.name}
                </button>
              );
            })}
          </div>
        )}

        {selected.map(name => (
          <div key={name} className="p-3.5 rounded-xl border border-[#F2E5EC] bg-[#FFFBFC] space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#401332]">{name}</p>
              <button type="button" onClick={() => toggleService(name)} className="text-[11px] font-semibold text-[#BE185D] cursor-pointer">Remove</button>
            </div>
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder={`What do you need from the ${name.toLowerCase()} vendor? Theme, quantities, timing...`}
              value={services[name].requirements}
              onChange={e => setService(name, 'requirements', e.target.value)}
              maxLength={2000}
            />
            <div>
              <label className={labelClass}>Budget for {name} (₹, optional)</label>
              <input type="number" min="0" inputMode="numeric" className={inputClass} placeholder="e.g. 50000" value={services[name].budget} onChange={e => setService(name, 'budget', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Reference photos</label>
              <div className="flex flex-wrap gap-2">
                {services[name].referencePhotos.map((photo, i) => (
                  <div key={photo._id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#F2E5EC]">
                    <PrivateImage src={photo.url} token={getAuthToken()} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setService(name, 'referencePhotos', services[name].referencePhotos.filter(p => p._id !== photo._id));
                        userApi.deleteReferencePhoto(photo._id).catch(() => {});
                      }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center cursor-pointer"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {services[name].referencePhotos.length < MAX_PHOTOS && (
                  <label className="w-16 h-16 rounded-lg border border-dashed border-[#C9AFBF] text-[#7A6876] flex flex-col items-center justify-center text-[10px] cursor-pointer hover:border-[#551E43]">
                    {uploadingFor === name ? '...' : <><Icon name="camera" size="xs" /> Add</>}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingFor === name} onChange={e => { handlePhotos(name, e.target.files); e.target.value = ''; }} />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-[#8A7987] mt-1">Stored privately. Only you and the vendor working on this service can see them, watermarked, and access ends if the vendor changes.</p>
            </div>
          </div>
        ))}
      </Section>

      <Section step={4} title="Budget and notes">
        <div>
          <label className={labelClass} htmlFor="totalBudget">Total budget for the event (₹)</label>
          <input id="totalBudget" type="number" min="0" inputMode="numeric" className={inputClass} placeholder="e.g. 200000" value={form.totalBudget} onChange={e => set('totalBudget', e.target.value)} />
          {serviceBudgetTotal > 0 && Number(form.totalBudget) > 0 && serviceBudgetTotal > Number(form.totalBudget) && (
            <p className="text-[11px] text-amber-700 mt-1">Your service budgets add up to ₹{serviceBudgetTotal.toLocaleString('en-IN')}, more than the total.</p>
          )}
        </div>
        <textarea rows={3} className={`${inputClass} resize-none`} placeholder="Anything every vendor should know (optional)" value={form.notes} onChange={e => set('notes', e.target.value)} maxLength={2000} />
        <label className="flex items-start gap-2.5 text-xs text-[#5C4A57] cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-[#551E43]" checked={form.allowExpandedSearch} onChange={e => set('allowExpandedSearch', e.target.checked)} />
          <span>If no vendor near my venue accepts, I am fine with vendors from further away. <span className="text-[#8A7987]">Travel charges may apply.</span></span>
        </label>
        <p className="text-[11px] text-[#8A7987]">
          Vendors see your requirement first. Your phone number stays hidden until you book; we use the verified number on your account ({user?.phone ? `${String(user.phone).slice(0, 2)}******${String(user.phone).slice(-2)}` : 'on file'}).
        </p>
      </Section>

      <div className="fixed bottom-0 inset-x-0 z-30 p-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-4 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            type="submit"
            disabled={submitting || loadingOptions}
            className="w-full py-3.5 rounded-xl bg-[#551E43] hover:bg-[#401332] text-white text-sm font-bold shadow-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Posting...' : selected.length > 1 ? `Find vendors for ${selected.length} services` : 'Find my vendor'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PostRequirement;
