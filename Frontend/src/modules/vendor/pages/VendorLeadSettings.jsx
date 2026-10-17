import { useEffect, useState } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';
import { toast } from '../../../components/ui/Toast';

const inputClass = 'w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium focus:bg-white focus:border-violet-200 outline-none transition-all';
const labelClass = 'text-[9px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5';

const COVERAGE = [
  { value: 'pincodes', label: 'Selected PIN codes', desc: 'Only the PIN codes you list' },
  { value: 'radius', label: 'Radius from my business', desc: 'A distance around your business PIN code' },
  { value: 'districts', label: 'Whole city or districts', desc: 'Every venue in the districts you list' },
  { value: 'combined', label: 'Combination', desc: 'Any of PIN codes, radius and districts' }
];

const TRAVEL = [
  { value: 'Included', label: 'Included in my price' },
  { value: 'Separate', label: 'Charged separately' },
  { value: 'Depends', label: 'Depends on distance and event' }
];

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm space-y-3.5">
    <h3 className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
      {title}
    </h3>
    {children}
  </div>
);

const Stat = ({ label, value, hint }) => (
  <div className="p-3 rounded-xl bg-slate-50">
    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-lg font-semibold text-slate-900 mt-0.5">{value ?? '—'}</p>
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const VendorLeadSettings = () => {
  const token = localStorage.getItem('vendorToken');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [pinText, setPinText] = useState('');
  const [districtText, setDistrictText] = useState('');
  const [insights, setInsights] = useState(null);
  const [cities, setCities] = useState([]);

  const apply = (data) => {
    setArea(data.serviceArea);
    setPrefs({
      ...data.leadPreferences,
      pausedUntil: data.leadPreferences.pausedUntil ? new Date(data.leadPreferences.pausedUntil).toISOString().slice(0, 10) : ''
    });
    setPinText((data.serviceArea.pincodes || []).join(', '));
    setDistrictText((data.serviceArea.districts || []).join(', '));
    setCities([data.city, ...(data.serviceCities || [])].filter(Boolean));
  };

  useEffect(() => {
    Promise.all([vendorApi.getLeadSettings(token), vendorApi.getLeadInsights(token, 90)])
      .then(([settingsRes, insightsRes]) => {
        if (settingsRes?.success) apply(settingsRes.data);
        else toast.error(settingsRes?.message || 'Could not load your lead settings');
        if (insightsRes?.success) setInsights(insightsRes.data);
      })
      .catch(() => toast.error('Could not load your lead settings'))
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (payload, message = 'Saved') => {
    setSaving(true);
    try {
      const res = await vendorApi.updateLeadSettings(payload, token);
      if (res?.success) {
        apply(res.data);
        toast.success(message);
      } else {
        toast.error(res?.message || 'Could not save');
      }
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  const saveArea = () => save({
    serviceArea: {
      coverage: area.coverage,
      basePincode: area.basePincode,
      pincodes: pinText,
      districts: districtText,
      radiusKm: Number(area.radiusKm) || 0,
      maxTravelKm: Number(area.maxTravelKm) || 0,
      travelPolicy: area.travelPolicy
    },
    leadPreferences: {
      minBudget: Number(prefs.minBudget) || 0,
      maxBudget: Number(prefs.maxBudget) || 0
    }
  }, 'Service area saved');

  const togglePause = () => {
    const paused = !prefs.paused;
    save({ leadPreferences: { paused, pausedUntil: paused && prefs.pausedUntil ? prefs.pausedUntil : null } },
      paused ? 'New lead offers paused' : 'You will receive lead offers again');
  };

  if (loading || !area || !prefs) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7c3aed]" />
      </div>
    );
  }

  const showPins = area.coverage === 'pincodes' || area.coverage === 'combined';
  const showRadius = area.coverage === 'radius' || area.coverage === 'combined';
  const showDistricts = area.coverage === 'districts' || area.coverage === 'combined';
  const pausedNow = prefs.paused && (!prefs.pausedUntil || new Date(prefs.pausedUntil) > new Date());
  const notConfigured = !area.basePincode && !(area.pincodes || []).length && !(area.districts || []).length;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-6">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="h-9 w-9 rounded-xl bg-[#7c3aed] flex items-center justify-center text-white shadow-md">
          <Icon name="location" size="sm" color="white" />
        </div>
        <div>
          <h1 className="text-[18px] font-medium text-slate-900 tracking-tight leading-tight">Service area & lead settings</h1>
          <p className="text-[11px] font-medium text-slate-400">Where you work decides which leads you are offered</p>
        </div>
      </div>

      {/* Pause */}
      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${pausedNow ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-slate-900">{pausedNow ? 'New lead offers are paused' : 'Receiving lead offers'}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {pausedNow
              ? `Leads go to other vendors${prefs.pausedUntil ? ` until ${new Date(prefs.pausedUntil).toLocaleDateString('en-IN')}` : ' until you resume'}. Missed offers are not counted while paused.`
              : 'Busy at an event or travelling? Pause so you do not miss offers. Missed offers lower your response rate.'}
          </p>
        </div>
        {!pausedNow && (
          <input type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} className={`${inputClass} sm:w-40`} value={prefs.pausedUntil} onChange={e => setPrefs(p => ({ ...p, pausedUntil: e.target.value }))} title="Pause until (optional)" />
        )}
        <button onClick={togglePause} disabled={saving} className={`px-4 py-2.5 rounded-lg text-[12px] font-semibold shrink-0 cursor-pointer disabled:opacity-50 ${pausedNow ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
          {pausedNow ? 'Resume offers' : prefs.pausedUntil ? 'Pause until date' : 'Pause offers'}
        </button>
      </div>

      {notConfigured && (
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3.5 text-[11px] text-violet-900">
          You have not set a service area yet, so you are matched on your cities ({cities.join(', ') || 'none listed'}).
          Add your business PIN code and the areas you cover so you only get leads you can reach.
        </div>
      )}

      <Card title="Service coverage">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COVERAGE.map(c => (
            <label key={c.value} className={`p-3 rounded-lg border cursor-pointer ${area.coverage === c.value ? 'border-[#7c3aed] bg-violet-50/60' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <input type="radio" name="coverage" className="accent-[#7c3aed]" checked={area.coverage === c.value} onChange={() => setArea(a => ({ ...a, coverage: c.value }))} />
                <span className="text-[12px] font-semibold text-slate-800">{c.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 ml-5">{c.desc}</p>
            </label>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Business PIN code</label>
          <input inputMode="numeric" maxLength={6} className={inputClass} placeholder="500081" value={area.basePincode || ''} onChange={e => setArea(a => ({ ...a, basePincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
          {area.baseDistrict && <p className="text-[10px] text-slate-400 ml-0.5">District: {area.baseDistrict}{area.hasLocation ? '' : ' · location not found, radius matching is off'}</p>}
        </div>

        {showPins && (
          <div className="space-y-1.5">
            <label className={labelClass}>PIN codes you serve</label>
            <textarea rows={2} className={`${inputClass} resize-none`} placeholder="500081, 500032, 500034" value={pinText} onChange={e => setPinText(e.target.value)} />
          </div>
        )}
        {showDistricts && (
          <div className="space-y-1.5">
            <label className={labelClass}>Districts / cities you serve</label>
            <input className={inputClass} placeholder="Hyderabad, Rangareddy" value={districtText} onChange={e => setDistrictText(e.target.value)} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {showRadius && (
            <div className="space-y-1.5">
              <label className={labelClass}>Preferred radius (km)</label>
              <input type="number" min="0" className={inputClass} value={area.radiusKm} onChange={e => setArea(a => ({ ...a, radiusKm: e.target.value }))} />
            </div>
          )}
          <div className="space-y-1.5">
            <label className={labelClass}>Maximum travel (km)</label>
            <input type="number" min="0" className={inputClass} value={area.maxTravelKm} onChange={e => setArea(a => ({ ...a, maxTravelKm: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Travel charges</label>
          <div className="flex flex-wrap gap-2">
            {TRAVEL.map(t => (
              <button type="button" key={t.value} onClick={() => setArea(a => ({ ...a, travelPolicy: t.value }))} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer ${area.travelPolicy === t.value ? 'border-[#7c3aed] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Budget range">
        <p className="text-[11px] text-slate-500">Leads with a service budget below your minimum are not offered to you, so you are not penalised for declining them.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Minimum budget (₹)</label>
            <input type="number" min="0" className={inputClass} value={prefs.minBudget || ''} placeholder="0" onChange={e => setPrefs(p => ({ ...p, minBudget: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Typical maximum (₹)</label>
            <input type="number" min="0" className={inputClass} value={prefs.maxBudget || ''} placeholder="0" onChange={e => setPrefs(p => ({ ...p, maxBudget: e.target.value }))} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <button onClick={saveArea} disabled={saving} className="px-5 py-2.5 rounded-lg bg-[#7c3aed] hover:bg-violet-700 text-white text-[12px] font-semibold shadow-md disabled:opacity-50 cursor-pointer">
          {saving ? 'Saving...' : 'Save service area'}
        </button>
      </div>

      {insights && (
        <Card title={`Your lead record · last ${insights.periodDays} days`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Stat label="Offered" value={insights.offered} />
            <Stat label="Accepted" value={insights.accepted} hint={insights.acceptanceRate != null ? `${insights.acceptanceRate}% acceptance` : null} />
            <Stat label="Missed" value={insights.missed} hint="No response in time" />
            <Stat label="Booked" value={insights.booked} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Response rate" value={insights.responseRate != null ? `${insights.responseRate}%` : null} />
            <Stat label="Avg. response" value={insights.avgResponseSeconds != null ? `${insights.avgResponseSeconds}s` : null} />
          </div>
          {insights.declineReasons.length > 0 && (
            <div className="text-[11px] text-slate-500">
              Your decline reasons: {insights.declineReasons.map(r => `${r.label} (${r.count})`).join(' · ')}
            </div>
          )}
          <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700 mb-1">How Utsavo matches leads</p>
            Leads go only to approved, subscribed vendors of the right service who are free on the event date, fit the budget and cover the venue.
            Among them, offers rotate in subscription order, nearest area first, so every vendor gets a turn, including new ones.
            Declining for a genuine reason is never held against you; repeatedly missing offers or not contacting customers after accepting is tracked.
          </div>
        </Card>
      )}
    </div>
  );
};

export default VendorLeadSettings;
