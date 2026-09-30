import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../../services/userApi';

const CEREMONIES = {
  wedding: [
    { id: 'engagement', label: 'Engagement & Roka' },
    { id: 'mehendi', label: 'Mehendi' },
    { id: 'haldi', label: 'Haldi' },
    { id: 'sangeet', label: 'Sangeet' },
    { id: 'wedding', label: 'Vivah (Wedding)' },
    { id: 'reception', label: 'Reception' }
  ],
  other: [
    { id: 'anniversary', label: 'Anniversary' },
    { id: 'birthday', label: 'Birthday' },
    { id: 'housewarming', label: 'Griha Pravesh' }
  ]
};

const POPULAR_CITIES = ['Udaipur', 'Jaipur', 'Hyderabad', 'Goa', 'Delhi NCR', 'Mumbai'];

const WeddingDetailsForm = () => {
  const navigate = useNavigate();

  const [category, setCategory] = useState('wedding');
  const [selectedSubcategories, setSelectedSubcategories] = useState([
    'engagement',
    'mehendi',
    'haldi',
    'sangeet',
    'wedding',
    'reception'
  ]);

  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    budget: '',
    guestCount: ''
  });

  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadDetails = async () => {
      try {
        const res = await userApi.getWeddingDetails();
        if (isMounted && res?.success && res.data?.weddingDetails) {
          const wd = res.data.weddingDetails;
          setHasExistingPlan(true);
          if (wd.category) setCategory(wd.category);
          if (wd.subcategories?.length) setSelectedSubcategories(wd.subcategories);

          const formattedDate = wd.weddingDate
            ? new Date(wd.weddingDate).toISOString().split('T')[0]
            : '';
          setFormData({
            brideName: wd.brideName || '',
            groomName: wd.groomName || '',
            weddingDate: formattedDate,
            venue: wd.venue || '',
            budget: wd.budget ? String(wd.budget) : '',
            guestCount: wd.guestCount ? String(wd.guestCount) : ''
          });
        }
      } catch {
        const saved = localStorage.getItem('eventDetails');
        if (saved && isMounted) {
          try {
            const parsed = JSON.parse(saved);
            setHasExistingPlan(true);
            if (parsed.category) setCategory(parsed.category);
            if (parsed.subcategories) setSelectedSubcategories(parsed.subcategories);
            if (parsed.details) setFormData(parsed.details);
          } catch {}
        }
      }
    };

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (newCat === 'wedding') {
      setSelectedSubcategories(['engagement', 'mehendi', 'haldi', 'sangeet', 'wedding', 'reception']);
    } else {
      setSelectedSubcategories(['anniversary']);
    }
  };

  const toggleCeremony = (id) => {
    setSelectedSubcategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.brideName?.trim()) newErrors.brideName = true;
    if (category === 'wedding' && !formData.groomName?.trim()) newErrors.groomName = true;
    if (!formData.weddingDate) newErrors.weddingDate = true;
    if (!formData.venue?.trim()) newErrors.venue = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const ceremoniesList = CEREMONIES[category] || CEREMONIES.wedding;
    const payload = {
      category,
      subcategories: selectedSubcategories,
      subcategoryLabels: selectedSubcategories.map(
        (id) => ceremoniesList.find((s) => s.id === id)?.label || id
      ),
      brideName: formData.brideName || '',
      groomName: formData.groomName || '',
      weddingDate: formData.weddingDate || null,
      venue: formData.venue || '',
      budget: Number(formData.budget) || 0,
      guestCount: Number(formData.guestCount) || 0,
      planningPreferences: {
        rawDetails: formData
      }
    };

    try {
      await userApi.updateWeddingDetails(payload);
    } catch (err) {
      console.warn('Backend sync failed, saving locally:', err);
    } finally {
      const eventData = {
        ...payload,
        details: formData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('eventDetails', JSON.stringify(eventData));
      setIsLoading(false);
      navigate('/user/planning-dashboard');
    }
  };

  const activeCeremonies = CEREMONIES[category] || CEREMONIES.wedding;

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-stone-800 antialiased selection:bg-[#F2BDCD] selection:text-[#4A1224] py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        
        {/* Existing Plan Discreet Link */}
        {hasExistingPlan && (
          <div className="text-center mb-4">
            <button
              type="button"
              onClick={() => navigate('/user/planning-dashboard')}
              className="text-xs text-[#8B6743] hover:text-[#4A1224] font-medium tracking-wide underline underline-offset-4 cursor-pointer"
            >
              Go to your active planning dashboard →
            </button>
          </div>
        )}

        {/* Minimalist Editorial Header */}
        <div className="text-center space-y-1 mb-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#8B6743] font-cinzel">
            Celebration Concierge
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#4A1224] tracking-tight">
            Curate Your Event
          </h1>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            A few quick details to personalize your vendor recommendations and timeline.
          </p>
        </div>

        {/* Minimalist Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#ECE5D8] shadow-[0_4px_24px_rgba(74,18,36,0.03)] space-y-6">
          
          {/* Segmented Category Pill Switcher */}
          <div className="flex p-1 bg-stone-100 rounded-full">
            <button
              type="button"
              onClick={() => handleCategoryChange('wedding')}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                category === 'wedding'
                  ? 'bg-[#4A1224] text-[#ECC880] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Wedding (Vivah)
            </button>
            <button
              type="button"
              onClick={() => handleCategoryChange('other')}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                category === 'other'
                  ? 'bg-[#4A1224] text-[#ECC880] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Other Occasion
            </button>
          </div>

          {/* Minimalist Ceremony Tags */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block font-cinzel">
              Ceremonies to Include
            </label>
            <div className="flex flex-wrap gap-2">
              {activeCeremonies.map((ceremony) => {
                const isSelected = selectedSubcategories.includes(ceremony.id);
                return (
                  <button
                    key={ceremony.id}
                    type="button"
                    onClick={() => toggleCeremony(ceremony.id)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#4A1224] text-[#ECC880] font-medium shadow-2xs'
                        : 'bg-stone-50 border border-stone-200/80 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {isSelected && <span className="text-[10px]">✓</span>}
                    <span>{ceremony.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-stone-100" />

          {/* Minimalist Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Couple / Celebrant Names */}
            {category === 'wedding' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-600">
                    Bride's Name <span className="text-[#651731]">*</span>
                  </label>
                  <input
                    type="text"
                    name="brideName"
                    value={formData.brideName}
                    onChange={handleChange}
                    placeholder="e.g. Radhika"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50/70 border text-xs text-stone-800 outline-none transition-all placeholder-stone-400 ${
                      errors.brideName
                        ? 'border-rose-400 ring-1 ring-rose-200'
                        : 'border-stone-200 focus:border-[#4A1224] focus:bg-white'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-600">
                    Groom's Name <span className="text-[#651731]">*</span>
                  </label>
                  <input
                    type="text"
                    name="groomName"
                    value={formData.groomName}
                    onChange={handleChange}
                    placeholder="e.g. Ananya"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50/70 border text-xs text-stone-800 outline-none transition-all placeholder-stone-400 ${
                      errors.groomName
                        ? 'border-rose-400 ring-1 ring-rose-200'
                        : 'border-stone-200 focus:border-[#4A1224] focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  Celebrant / Host Name <span className="text-[#651731]">*</span>
                </label>
                <input
                  type="text"
                  name="brideName"
                  value={formData.brideName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Verma"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50/70 border text-xs text-stone-800 outline-none transition-all placeholder-stone-400 ${
                    errors.brideName
                      ? 'border-rose-400 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-[#4A1224] focus:bg-white'
                  }`}
                />
              </div>
            )}

            {/* Date & Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  Event Date <span className="text-[#651731]">*</span>
                </label>
                <input
                  type="date"
                  name="weddingDate"
                  value={formData.weddingDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 rounded-xl bg-stone-50/70 border text-xs text-stone-800 outline-none transition-all ${
                    errors.weddingDate
                      ? 'border-rose-400 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-[#4A1224] focus:bg-white'
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  City / Destination <span className="text-[#651731]">*</span>
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g. Udaipur"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50/70 border text-xs text-stone-800 outline-none transition-all placeholder-stone-400 ${
                    errors.venue
                      ? 'border-rose-400 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-[#4A1224] focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Quick Destination Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, venue: city }));
                    if (errors.venue) setErrors((prev) => ({ ...prev, venue: false }));
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer border ${
                    formData.venue === city
                      ? 'bg-[#4A1224] text-[#ECC880] border-[#4A1224] font-medium'
                      : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Budget & Guests */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  Approx. Budget (₹)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. 2500000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50/70 border border-stone-200 text-xs text-stone-800 outline-none focus:border-[#4A1224] focus:bg-white transition-all placeholder-stone-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600">
                  Estimated Guests
                </label>
                <input
                  type="number"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  placeholder="e.g. 300"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50/70 border border-stone-200 text-xs text-stone-800 outline-none focus:border-[#4A1224] focus:bg-white transition-all placeholder-stone-400"
                />
              </div>
            </div>

            {/* Error Message */}
            {Object.keys(errors).length > 0 && (
              <p className="text-rose-600 text-xs text-center font-medium pt-1">
                Please complete the required fields highlighted above.
              </p>
            )}

            {/* CTA Buttons */}
            <div className="pt-3 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-[#4A1224] hover:bg-[#380D1B] text-[#ECC880] text-xs font-semibold uppercase tracking-[0.14em] shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#D4AF37]/30 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Saving Celebration Plan...</span>
                ) : (
                  <>
                    <span>Confirm & Continue</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/user/vendors')}
                className="w-full py-2 text-stone-400 hover:text-stone-700 text-xs text-center transition-colors cursor-pointer"
              >
                Skip for now, explore vendors
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};

export default WeddingDetailsForm;
