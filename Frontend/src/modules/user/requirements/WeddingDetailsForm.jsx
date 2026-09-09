import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const WeddingDetailsForm = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Event categories configuration
  const eventCategories = {
    wedding: {
      label: 'Wedding',
      icon: 'rings',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop&q=80',
      subcategories: [
        { id: 'engagement', label: 'Engagement' },
        { id: 'mehendi', label: 'Mehendi' },
        { id: 'haldi', label: 'Haldi' },
        { id: 'sangeet', label: 'Sangeet' },
        { id: 'wedding', label: 'Wedding Ceremony' },
        { id: 'reception', label: 'Reception' },
        { id: 'other', label: 'Other' }
      ],
      fields: {
        brideName: { label: "Bride's Name", type: 'text', required: true },
        groomName: { label: "Groom's Name", type: 'text', required: true },
        weddingDate: { label: 'Wedding Date', type: 'date', required: true },
        venue: { label: 'Venue Location', type: 'text', required: true },
        budget: { label: 'Total Budget', type: 'number', required: true, prefix: '₹' },
        guestCount: { label: 'Estimated Guests', type: 'number', required: true }
      }
    },
    birthday: {
      label: 'Birthday',
      icon: 'cake',
      image: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=800&h=400&fit=crop&q=80',
      subcategories: [
        { id: 'kids_party', label: 'Kids Party' },
        { id: 'milestone', label: 'Milestone' },
        { id: 'surprise', label: 'Surprise' },
        { id: 'other', label: 'Other' }
      ],
      fields: {
        personName: { label: "Birthday Person", type: 'text', required: true },
        eventDate: { label: 'Event Date', type: 'date', required: true },
        venue: { label: 'Venue Location', type: 'text', required: true },
        budget: { label: 'Total Budget', type: 'number', required: true, prefix: '₹' },
        guestCount: { label: 'Estimated Guests', type: 'number', required: true }
      }
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('wedding');
  const [selectedSubcategories, setSelectedSubcategories] = useState(['wedding']);
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    budget: '',
    guestCount: ''
  });

  const [errors, setErrors] = useState({});

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setSelectedSubcategories([]);
    setErrors({});
    const initialData = {};
    Object.keys(eventCategories[val].fields).forEach(k => initialData[k] = '');
    setFormData(initialData);
  };

  const handleSubcategoryToggle = (subId) => {
    setSelectedSubcategories(prev =>
      prev.includes(subId)
        ? prev.filter(id => id !== subId)
        : [...prev, subId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = eventCategories[selectedCategory].fields;
    Object.keys(fields).forEach(key => {
      if (fields[key].required && !formData[key]?.trim()) {
        newErrors[key] = true;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Save data logic
      const eventData = {
        category: selectedCategory,
        subcategories: selectedSubcategories,
        subcategoryLabels: selectedSubcategories.map(id => 
          eventCategories[selectedCategory].subcategories.find(s => s.id === id)?.label || id
        ),
        details: formData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('eventDetails', JSON.stringify(eventData));
      navigate('/user/planning-dashboard');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden font-['Outfit'] pb-20" style={{ backgroundColor: '#BE9B9B' }}>
      
      {/* EDGE-TO-EDGE LEAF DECORATIONS (Matches Signup/Login) */}
      <div className="absolute top-0 left-0 w-full h-40 opacity-90 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
         <img src="/assets/vendor/straight_leaves.png" alt="straight leaves top" className="w-full h-full object-cover scale-x-125 origin-top" />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-40 opacity-90 pointer-events-none rotate-180 -mb-16" style={{ mixBlendMode: 'multiply' }}>
         <img src="/assets/vendor/straight_leaves.png" alt="straight leaves bottom" className="w-full h-full object-cover scale-x-125 origin-top" />
      </div>

      {/* SEARCH/BACK BUTTON - Minimalist */}
      <div className="relative z-20 w-full px-6 pt-10 flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 text-white hover:bg-white/30 transition-all shadow-lg active:scale-90"
        >
          <Icon name="chevronLeft" size="sm" />
        </button>
        <div className="w-9 h-9 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
           <svg viewBox="0 0 100 100" className="w-5 h-5 fill-white">
              <path d="M50 85c-2-2-35-25-35-45 0-12 10-20 20-20 6 0 11 3 15 8 4-5 9-8 15-8 10 0 20 8 20 20 0 20-33 43-35 45z"/>
           </svg>
        </div>
      </div>

      {/* HEADER SECTION - Editorial Style */}
      <div className="relative z-20 w-full max-w-md pt-4 px-8 text-center space-y-1 mb-4">
        <h1 className="text-[#5D3E3E] text-5xl font-bold leading-tight" style={{ fontFamily: '"Great Vibes", cursive' }}>
          Event Details
        </h1>
        <p className="text-[#5D3E3E]/60 text-[9px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: '"Outfit", sans-serif' }}>
          Personalize your planning experience
        </p>
        
        {/* SMALL HEART DIVIDER */}
        <div className="flex justify-center pt-1 opacity-30">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#5D3E3E">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      {/* MAIN FORM CONTAINER */}
      <div className="relative z-20 w-full max-w-sm px-6 space-y-4">
          
        {/* Category Selector Cards */}
        <div className="flex gap-3">
          {Object.keys(eventCategories).map(key => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`flex-1 p-3.5 rounded-3xl transition-all duration-500 border-2 ${
                selectedCategory === key 
                ? 'bg-[#5D3E3E] border-[#5D3E3E] text-white shadow-xl scale-[1.02]' 
                : 'bg-white/40 border-white/20 text-[#5D3E3E] backdrop-blur-md'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  selectedCategory === key ? 'bg-white/20 border-white/30' : 'bg-[#5D3E3E]/5 border-[#5D3E3E]/10'
                }`}>
                  <Icon name={eventCategories[key].icon} size="sm" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: '"Outfit", sans-serif' }}>
                  {eventCategories[key].label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Events to Include Section */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl p-5 border border-white/40">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[#5D3E3E] text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: '"Outfit", sans-serif' }}>Events to Include</h3>
            <span className="px-2.5 py-1 rounded-full bg-[#5D3E3E]/5 text-[7px] font-black text-[#5D3E3E]/50 uppercase tracking-widest">Select Multiple</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {eventCategories[selectedCategory].subcategories.map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubcategoryToggle(sub.id)}
                className={`px-4 py-3 rounded-2xl text-[10px] font-black transition-all border flex items-center gap-2.5 ${
                  selectedSubcategories.includes(sub.id)
                  ? 'bg-[#5D3E3E] border-[#5D3E3E] text-white shadow-lg translate-y-[-2px]'
                  : 'bg-white border-[#5D3E3E]/10 text-[#5D3E3E]/60'
                }`}
                style={{ fontFamily: '"Outfit", sans-serif' }}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                  selectedSubcategories.includes(sub.id) ? 'bg-white/20 border-white/30' : 'bg-[#5D3E3E]/5 border-[#5D3E3E]/10'
                }`}>
                  {selectedSubcategories.includes(sub.id) && <Icon name="check" size="xs" color="white" />}
                </div>
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Info Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl p-5 border border-white/40">
            <div className="mb-4 px-1">
              <h3 className="text-[#5D3E3E] text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontFamily: '"Outfit", sans-serif' }}>Details & Logistics</h3>
            </div>
            
            <div className="space-y-2.5">
              {Object.keys(eventCategories[selectedCategory].fields).map(key => {
                const field = eventCategories[selectedCategory].fields[key];
                return (
                  <div key={key} className="space-y-1.5 group">
                    <label className="text-[10px] font-black text-[#5D3E3E]/50 uppercase tracking-widest pl-1 group-focus-within:text-[#5D3E3E] transition-colors" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    <div className="relative">
                      {field.prefix && (
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-[#5D3E3E]/40">
                          {field.prefix}
                        </span>
                      )}
                      <input
                        type={field.type}
                        name={key}
                        value={formData[key] || ''}
                        onChange={handleChange}
                        className={`w-full ${field.prefix ? 'pl-10' : 'px-5'} py-2.5 rounded-2xl bg-white border border-[#5D3E3E]/5 transition-all focus:outline-none focus:ring-2 focus:ring-[#5D3E3E]/10 text-[#5D3E3E] text-sm font-semibold shadow-sm ${
                          errors[key] ? 'border-rose-200' : 'border-[#5D3E3E]/10'
                        }`}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className="w-full bg-[#5D3E3E] py-4.5 rounded-[2rem] font-black text-sm text-white tracking-[0.2em] uppercase shadow-2xl active:scale-[0.98] hover:bg-[#4A3232] transition-all transform hover:translate-y-[-2px]"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              Confirm My Plan →
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/user/dashboard')}
              className="w-full py-2 text-[#5D3E3E]/40 font-black text-[9px] uppercase tracking-widest hover:text-[#5D3E3E] transition-colors"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              Skip planning for now
            </button>
          </div>
        </form>

        </div>
      </div>
    );
};

export default WeddingDetailsForm;
