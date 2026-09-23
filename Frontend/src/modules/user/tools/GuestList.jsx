import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { userApi } from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const GuestList = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({
    totalGuests: 0,
    totalInvited: 0,
    confirmed: 0,
    pending: 0,
    declined: 0,
    responseRate: 0,
    categories: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeRsvpFilter, setActiveRsvpFilter] = useState('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'Family',
    side: 'Mutual',
    guestCount: 1,
    rsvpStatus: 'Pending',
    mealPreference: 'No Preference',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeCategory !== 'All') params.category = activeCategory;
      if (activeRsvpFilter !== 'All') params.rsvpStatus = activeRsvpFilter;

      const res = await userApi.getGuests(params);
      if (res.success && res.data) {
        setGuests(res.data.guests || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load guests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [activeCategory, activeRsvpFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGuests();
  };

  const handleOpenAddModal = (guest = null) => {
    if (guest) {
      setEditingGuest(guest);
      setGuestForm({
        name: guest.name || '',
        phone: guest.phone || '',
        email: guest.email || '',
        category: guest.category || 'Family',
        side: guest.side || 'Mutual',
        guestCount: guest.guestCount || 1,
        rsvpStatus: guest.rsvpStatus || 'Pending',
        mealPreference: guest.mealPreference || 'No Preference',
        notes: guest.notes || ''
      });
    } else {
      setEditingGuest(null);
      setGuestForm({
        name: '',
        phone: '',
        email: '',
        category: 'Family',
        side: 'Mutual',
        guestCount: 1,
        rsvpStatus: 'Pending',
        mealPreference: 'No Preference',
        notes: ''
      });
    }
    setShowAddModal(true);
  };

  const handleSaveGuest = async (e) => {
    e.preventDefault();
    if (!guestForm.name.trim()) {
      toast.warning('Guest name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingGuest) {
        await userApi.updateGuest(editingGuest._id || editingGuest.id, guestForm);
        toast.success('Guest updated successfully');
      } else {
        await userApi.createGuest(guestForm);
        toast.success('Guest added successfully');
      }
      setShowAddModal(false);
      setEditingGuest(null);
      await fetchGuests();
    } catch (err) {
      console.error('Failed to save guest:', err);
      toast.error(getFriendlyErrorMessage(err, 'Failed to save guest'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = (guestId) => {
    setGuestToDelete(guestId);
  };

  const confirmDeleteGuest = async () => {
    if (!guestToDelete) return;
    try {
      setIsDeleting(true);
      await userApi.deleteGuest(guestToDelete);
      toast.success('Guest removed successfully');
      await fetchGuests();
    } catch (err) {
      console.error('Failed to delete guest:', err);
      toast.error(getFriendlyErrorMessage(err, 'Failed to delete guest'));
    } finally {
      setIsDeleting(false);
      setGuestToDelete(null);
    }
  };

  const handleToggleRSVP = async (guestId, currentStatus) => {
    const nextStatus = currentStatus === 'Confirmed' ? 'Declined' : (currentStatus === 'Declined' ? 'Pending' : 'Confirmed');
    try {
      await userApi.updateGuestRSVP(guestId, nextStatus);
      await fetchGuests();
    } catch (err) {
      console.error('Failed to update RSVP:', err);
    }
  };

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  const getPercentage = (value, total) => (total > 0 ? ((value / total) * 100).toFixed(1) : 0);

  return (
    <div className="min-h-screen pb-24 bg-transparent relative">
      {/* Header */}
      <div className="px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FDF4F7] shadow-sm transition-all active:scale-95 border border-white"
            >
              <Icon name="chevronLeft" size="sm" style={{ color: '#4A2B42' }} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-[#4A2B42]" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Guest List
                </h1>
                <img src="/exproler%20section%20bg.png" alt="decor" className="w-8 h-8 object-contain" />
              </div>
              <p className="text-[12px] text-[#6B6C80] font-medium mt-0.5">
                Track invitations, headcounts and RSVPs
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenAddModal(null)}
            className="relative overflow-hidden flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-white text-[12px] font-bold shadow-md active:scale-95 transition-all bg-gradient-to-r from-[#4A2B42] to-[#69395D] border border-[#EAC397]/50"
          >
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-no-repeat bg-cover opacity-40" style={{ backgroundImage: "url('/invitation%20bg.png')" }} />
            <Icon name="plus" size="xs" className="relative z-10" />
            <span className="relative z-10">Add Guest</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="relative bg-white/70 backdrop-blur-md rounded-[20px] p-5 shadow-sm border border-white overflow-hidden">
            <div className="absolute inset-0 bg-no-repeat opacity-80" style={{ backgroundImage: "url('/cart1.png')", backgroundSize: '100% 100%' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F5EDF3] flex items-center justify-center">
                    <Icon name="users" size="xs" className="text-[#4A2B42]" />
                  </div>
                  <span className="text-[10px] text-[#6B6C80] font-bold">Total Invited</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#FDF4F7] flex items-center justify-center">
                  <Icon name="chevronRight" size="xs" className="text-[#9D7D9A]" />
                </div>
              </div>
              <p className="text-[28px] font-black text-[#4A2B42] leading-none mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>{stats.totalInvited}</p>
              <p className="text-[10px] text-[#9D7D9A] font-medium">{stats.totalGuests} parties registered</p>
            </div>
          </div>

          <div className="relative bg-white/70 backdrop-blur-md rounded-[20px] p-5 shadow-sm border border-white overflow-hidden">
            <div className="absolute inset-0 bg-no-repeat opacity-80" style={{ backgroundImage: "url('/cart2.png')", backgroundSize: '100% 100%' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#EAF5F0] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#2F855A]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-[10px] text-[#6B6C80] font-bold">Confirmed</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#EAF5F0] flex items-center justify-center">
                  <Icon name="chevronRight" size="xs" className="text-[#2F855A]" />
                </div>
              </div>
              <p className="text-[28px] font-black text-[#2F855A] leading-none mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>{stats.confirmed}</p>
              <p className="text-[10px] text-[#9D7D9A] font-medium">{getPercentage(stats.confirmed, stats.totalInvited)}% of total invited</p>
            </div>
          </div>

          <div className="relative bg-white/70 backdrop-blur-md rounded-[20px] p-5 shadow-sm border border-white overflow-hidden">
            <div className="absolute inset-0 bg-no-repeat opacity-80" style={{ backgroundImage: "url('/cart3.png')", backgroundSize: '100% 100%' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FEF3E2] flex items-center justify-center">
                    <Icon name="clock" size="xs" className="text-[#C27803]" />
                  </div>
                  <span className="text-[10px] text-[#6B6C80] font-bold">Pending Response</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#FEF3E2] flex items-center justify-center">
                  <Icon name="chevronRight" size="xs" className="text-[#C27803]" />
                </div>
              </div>
              <p className="text-[28px] font-black text-[#C27803] leading-none mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>{stats.pending}</p>
              <p className="text-[10px] text-[#9D7D9A] font-medium">{getPercentage(stats.pending, stats.totalInvited)}% awaiting reply</p>
            </div>
          </div>

          <div className="relative bg-white/70 backdrop-blur-md rounded-[20px] p-5 shadow-sm border border-white overflow-hidden">
            <div className="absolute inset-0 bg-no-repeat opacity-80" style={{ backgroundImage: "url('/cart4.png')", backgroundSize: '100% 100%' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FCE8E8] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#E53E3E]"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </div>
                  <span className="text-[10px] text-[#6B6C80] font-bold">Declined</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#FCE8E8] flex items-center justify-center">
                  <Icon name="chevronRight" size="xs" className="text-[#E53E3E]" />
                </div>
              </div>
              <p className="text-[28px] font-black text-[#E53E3E] leading-none mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>{stats.declined}</p>
              <p className="text-[10px] text-[#9D7D9A] font-medium">{getPercentage(stats.declined, stats.totalInvited)}% declined</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1 flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-white p-1">
            <Icon name="search" size="sm" className="absolute left-4 text-[#9D7D9A]" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-3 py-2 text-[13px] bg-transparent focus:outline-none text-[#4A2B42] placeholder-[#9D7D9A]"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#4A2B42] text-white text-[12px] font-bold rounded-full active:scale-95 transition-transform shadow-md ml-2"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden text-[12px]">
          {['All', 'Family', 'Friends', 'Colleagues', 'VIP', 'Others'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-all shadow-sm border ${
                activeCategory === cat ? 'bg-[#4A2B42] text-white border-[#4A2B42]' : 'bg-[#F8EBEE] text-[#4A2B42] border-white hover:bg-[#F1D8E7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Divider */}
        <div className="flex items-center justify-center my-8">
           <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#EAC397] to-transparent relative flex items-center justify-center">
              <div className="absolute bg-transparent px-2 text-[#EAC397]">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3c-1.2 0-2.4.6-3 1.5C8.4 3.6 7.2 3 6 3 3 3 2 5.5 2 8c0 3 4.5 7 10 12 5.5-5 10-9 10-12 0-2.5-1-5-4-5-1.2 0-2.4.6-3 1.5-.6-.9-1.8-1.5-3-1.5z" fill="#EAC397" fillOpacity="0.2"/></svg>
              </div>
           </div>
        </div>
      </div>

      {/* Guest Cards List */}
      <div className="px-6 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading guests...
          </div>
        ) : guests.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-8 text-center border border-white shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-no-repeat bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/invitation%20bg.png')" }} />
            <div className="relative z-10 flex flex-col items-center">
               <div className="w-24 h-24 bg-white rounded-[24px] rotate-3 flex items-center justify-center mb-6 shadow-sm border border-[#F5EDF3]">
                  <div className="-rotate-3">
                     <Icon name="users" size="lg" className="text-[#9D7D9A]" />
                  </div>
               </div>
               <p className="text-2xl font-bold text-[#4A2B42] mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>No guests found</p>
               <p className="text-[13px] text-[#6B6C80] font-medium mb-6">Add your family and friends to manage RSVPs</p>
               <button
                 onClick={() => handleOpenAddModal(null)}
                 className="px-6 py-3 bg-[#561D42] text-white rounded-full text-[12px] font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
               >
                 <Icon name="plus" size="xs" />
                 Add Your First Guest
               </button>
            </div>
          </div>
        ) : (
          guests.map((g) => {
            const statusBg =
              g.rsvpStatus === 'Confirmed'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : g.rsvpStatus === 'Declined'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

            return (
              <div
                key={g._id || g.id}
                className="bg-white rounded-xl p-4 border border-black/5 shadow-sm flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{g.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      +{g.guestCount || 1}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {g.category} • {g.side}’s side {g.phone ? `• ${g.phone}` : ''}
                  </p>
                  {g.notes && <p className="text-[11px] text-gray-500 italic mt-1 line-clamp-1">{g.notes}</p>}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleRSVP(g._id || g.id, g.rsvpStatus)}
                    className={`text-[11px] px-3 py-1 rounded-full font-bold border ${statusBg} transition-all active:scale-95`}
                  >
                    {g.rsvpStatus}
                  </button>
                  <button
                    onClick={() => handleOpenAddModal(g)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <Icon name="edit" size="xs" />
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(g._id || g.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg"
                  >
                    <Icon name="trash" size="xs" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Guest / Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh & Family"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Number of Guests</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={guestForm.guestCount}
                    onChange={(e) => setGuestForm({ ...guestForm, guestCount: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={guestForm.category}
                    onChange={(e) => setGuestForm({ ...guestForm, category: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Colleagues">Colleagues</option>
                    <option value="VIP">VIP</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Side</label>
                  <select
                    value={guestForm.side}
                    onChange={(e) => setGuestForm({ ...guestForm, side: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Mutual">Mutual</option>
                    <option value="Bride">Bride</option>
                    <option value="Groom">Groom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">RSVP Status</label>
                  <select
                    value={guestForm.rsvpStatus}
                    onChange={(e) => setGuestForm({ ...guestForm, rsvpStatus: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Meal Preference</label>
                  <select
                    value={guestForm.mealPreference}
                    onChange={(e) => setGuestForm({ ...guestForm, mealPreference: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="No Preference">No Preference</option>
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Jain">Jain</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes / Address</label>
                <textarea
                  rows="2"
                  placeholder="Special accommodations, table assignment, etc."
                  value={guestForm.notes}
                  onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                  className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl shadow hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingGuest ? 'Update Guest' : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Guest Confirmation Modal */}
      <ConfirmModal
        isOpen={!!guestToDelete}
        title="Remove Guest"
        message="Are you sure you want to remove this guest from your list? This action cannot be undone."
        confirmText={isDeleting ? 'Removing...' : 'Remove Guest'}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteGuest}
        onCancel={() => setGuestToDelete(null)}
      />
    </div>
  );
};

export default GuestList;