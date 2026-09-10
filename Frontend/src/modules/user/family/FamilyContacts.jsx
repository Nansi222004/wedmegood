import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { familyContacts } from '../../../data/contacts';

const FamilyContacts = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect keyboard open/close on mobile
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75;
      
      setIsKeyboardOpen(viewportHeight < keyboardThreshold);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Filter contacts based on search query
  const filteredContacts = familyContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.relation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactToggle = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleCreateGroup = () => {
    if (selectedContacts.length < 2) {
      alert('Please select at least 2 contacts to create a group');
      return;
    }
    
    // Navigate to group creation page with selected contacts
    navigate('/user/family/create-group', { 
      state: { selectedContacts: selectedContacts }
    });
  };

  const getRelationColor = (relation) => {
    if (relation.includes('Bride')) return theme.colors.primary[500];
    if (relation.includes('Groom')) return theme.colors.secondary[500];
    if (relation.includes('Mother') || relation.includes('Father')) return theme.colors.accent[500];
    return theme.semantic.text.secondary;
  };

  return (
    <div 
      className={`min-h-screen ${isKeyboardOpen ? 'keyboard-open pb-4' : 'pb-32'}`} 
      style={{ backgroundColor: '#EAE1D8' }}
    >
      {/* Editorial Header */}
      <div 
        className="sticky top-0 z-20 px-6 py-8 rounded-b-[2.5rem] shadow-sm border-b border-[#3D2B2B]/5"
        style={{ 
          backgroundColor: 'white'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EAE1D8]/30 border border-[#EAE1D8]"
            >
              <Icon name="arrowLeft" size="sm" style={{ color: '#3D2B2B' }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Family & Friends
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30" style={{ fontFamily: '"Outfit", sans-serif' }}>
                 Your Inner Circle
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSelectAll}
            className="text-[10px] font-black uppercase tracking-widest text-[#BE185D] hover:opacity-80 transition-all px-3 py-2 rounded-full bg-[#FEF2F2] border border-[#FECACA]"
          >
            {selectedContacts.length === filteredContacts.length ? 'Reset All' : 'Select All'}
          </button>
        </div>
        
        {/* Editorial Search Bar */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2B2B]/30 transition-colors group-focus-within:text-[#BE185D]">
            <Icon name="search" size="sm" />
          </div>
          <input
            type="text"
            placeholder="Search name or relation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-[#EAE1D8]/20 border border-[#EAE1D8] focus:bg-white focus:ring-1 focus:ring-[#BE185D] focus:outline-none transition-all text-sm font-medium text-[#3D2B2B] placeholder:text-[#3D2B2B]/30"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          />
        </div>
      </div>

      {/* Selected Indicator - Floating Badge */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm inline-flex">
             <div className="w-2 h-2 rounded-full bg-[#BE185D] animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]">
               {selectedContacts.length} Selected
             </span>
          </div>
        </div>
      )}

      {/* High-Density Contacts List */}
      <div className="px-6 mt-4 space-y-4">
        {filteredContacts.map((contact) => {
          const isSelected = selectedContacts.includes(contact.id);
          
          return (
            <div 
              key={contact.id}
              onClick={() => handleContactToggle(contact.id)}
              className={`bg-white rounded-[2rem] p-4 flex items-center justify-between transition-all active:scale-[0.98] border shadow-sm ${
                isSelected ? 'border-[#3D2B2B] ring-1 ring-[#3D2B2B]' : 'border-white'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Profile Image with Selection Border */}
                <div className={`p-0.5 rounded-full border-2 transition-all duration-300 ${isSelected ? 'border-[#BE185D]' : 'border-transparent'}`}>
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-14 h-14 rounded-full object-cover shadow-inner"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold text-[#3D2B2B] truncate" style={{ fontFamily: '"Playfair Display", serif' }}>
                      {contact.name}
                    </h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/40 mb-1" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {contact.relation}
                  </p>
                  <p className="text-[10px] font-medium text-[#3D2B2B]/60 tabular-nums">
                    {contact.phone}
                  </p>
                </div>
              </div>

              {/* Selection Checkbox */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-[#3D2B2B] border-[#3D2B2B]' : 'border-[#EAE1D8]'
              }`}>
                {isSelected && <Icon name="check" size="xs" color="white" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-12 text-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-[#EAE1D8]/50">
               <Icon name="search" size="lg" style={{ color: '#3D2B2B/20' }} />
            </div>
            <h3 className="text-xl font-bold text-[#3D2B2B] mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>No connections found</h3>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3D2B2B]/30 mb-8 leading-loose">
              "We couldn't find anyone matching your current search criteria."
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-8 py-3 rounded-full bg-white border border-[#3D2B2B] text-[9px] font-black uppercase tracking-widest text-[#3D2B2B]"
            >
              Clear Search
            </button>
        </div>
      )}

      {/* Premium Create Group Modal Bar */}
      {selectedContacts.length > 0 && (
        <div 
          className="fixed bottom-8 left-6 right-6 z-50 animate-in slide-in-from-bottom duration-500"
        >
          <button
            onClick={handleCreateGroup}
            className="w-full bg-[#3D2B2B] rounded-full p-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] group active:scale-95 transition-all"
          >
            <div className="pl-6 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Icon name="users" size="xs" color="white" />
               </div>
               <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">New Connection</p>
                  <p className="text-sm font-bold text-white leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>Create Group ({selectedContacts.length})</p>
               </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-lg">
               <Icon name="arrowRight" size="sm" style={{ color: '#3D2B2B' }} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default FamilyContacts;