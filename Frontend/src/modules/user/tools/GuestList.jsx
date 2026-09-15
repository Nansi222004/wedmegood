import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { userApi } from '../../../services/userApi';

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
      alert('Guest name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingGuest) {
        await userApi.updateGuest(editingGuest._id || editingGuest.id, guestForm);
      } else {
        await userApi.createGuest(guestForm);
      }
      setShowAddModal(false);
      setEditingGuest(null);
      await fetchGuests();
    } catch (err) {
      console.error('Failed to save guest:', err);
      alert(err.message || 'Failed to save guest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = async (guestId) => {
    if (window.confirm('Are you sure you want to remove this guest?')) {
      try {
        await userApi.deleteGuest(guestId);
        await fetchGuests();
      } catch (err) {
        console.error('Failed to delete guest:', err);
      }
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-3 p-2 rounded-full transition-transform active:scale-95"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
                Guest List
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
                Track invitations, headcounts and RSVPs
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenAddModal(null)}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-md active:scale-95 transition-all"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            <Icon name="plus" size="xs" />
            <span>Add Guest</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Total Invited</span>
              <Icon name="users" size="sm" style={{ color: theme.colors.primary[500] }} />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalInvited}</p>
            <p className="text-[11px] text-gray-400 mt-1">{stats.totalGuests} parties registered</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Confirmed</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{stats.confirmed}</p>
            <p className="text-[11px] text-gray-400 mt-1">{getPercentage(stats.confirmed, stats.totalInvited)}% of total invited</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Pending Response</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-500">{stats.pending}</p>
            <p className="text-[11px] text-gray-400 mt-1">{getPercentage(stats.pending, stats.totalInvited)}% awaiting reply</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Declined</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
            <p className="text-2xl font-black text-rose-500">{stats.declined}</p>
            <p className="text-[11px] text-gray-400 mt-1">{getPercentage(stats.declined, stats.totalInvited)}% declined</p>
          </div>
        </div>

        {/* Search & Filters */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Icon name="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide text-xs">
          {['All', 'Family', 'Friends', 'Colleagues', 'VIP', 'Others'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Cards List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading guests...
          </div>
        ) : guests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <Icon name="users" size="lg" className="text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700">No guests found</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Add your family and friends to manage RSVPs</p>
            <button
              onClick={() => handleOpenAddModal(null)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold"
            >
              Add First Guest
            </button>
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
    </div>
  );
};

export default GuestList;