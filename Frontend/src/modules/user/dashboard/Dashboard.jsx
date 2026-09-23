import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';
import { userApi } from '../../../services/userApi';

const Dashboard = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    wedding: {
      brideName: '',
      groomName: '',
      weddingDate: null,
      daysRemaining: null,
      venue: '',
      location: '',
      budget: 0,
      guestCount: 0,
      category: 'Wedding'
    },
    bookings: {
      total: 0,
      confirmed: 0,
      upcomingCount: 0,
      upcomingList: []
    },
    quotes: {
      total: 0,
      pending: 0,
      expiringSoon: 0,
      recent: []
    },
    planning: {
      checklist: { total: 0, completed: 0, progressPercentage: 0 },
      budget: { totalBudget: 0, spent: 0, remaining: 0, percentSpent: 0 },
      timeline: { totalEvents: 0, upcomingEvents: 0 },
      guests: { totalInvited: 0, confirmed: 0, pending: 0 }
    },
    vendors: {
      favoritesCount: 0,
      recommended: []
    },
    upcomingActions: [],
    recentActivities: [],
    notifications: {
      unreadCount: 0
    }
  });

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await userApi.getDashboardSummary();
        if (isMounted && res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.warn('Dashboard summary load error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = user?.name?.split(' ')[0] || 'There';
  const wedding = summary.wedding || {};
  const planning = summary.planning || {};
  const bookings = summary.bookings || {};
  const quotes = summary.quotes || {};

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-4 pb-32 bg-transparent"
    >
      <div className="w-full max-w-lg mx-auto space-y-6">

        {/* Editorial Header */}
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-0.5">
            <h1
              className="text-[#3D2B2B] text-2xl sm:text-3xl font-bold leading-tight tracking-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {getGreeting()},<br />{userName}
            </h1>
            <p className="text-[#3D2B2B]/50 text-[10px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: '"Outfit", sans-serif' }}>
              {wedding.brideName && wedding.groomName
                ? `${wedding.brideName} & ${wedding.groomName}'s Celebration`
                : 'Wedding Planning Dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/user/calendar')}
              className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-white border border-white hover:shadow-md transition-all active:scale-95"
              title="Wedding Calendar"
            >
              <Icon name="calendar" size="sm" style={{ color: '#3D2B2B' }} />
            </button>
            <button
              onClick={() => navigate('/user/notifications')}
              className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-white border border-white relative hover:shadow-md transition-all active:scale-95"
              title="Notifications"
            >
              <Icon name="bell" size="sm" style={{ color: '#3D2B2B' }} />
              {summary.notifications?.unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
            <button
              onClick={() => navigate('/user/account')}
              className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-white border border-white hover:shadow-md transition-all active:scale-95"
              title="Account"
            >
              <Icon name="account" size="sm" style={{ color: '#3D2B2B' }} />
            </button>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="space-y-3">
          <div
            onClick={() => navigate('/user/bookings')}
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-sm border border-white hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F5EBE6] flex items-center justify-center text-[#5C4D4D]">
                <Icon name="calendar" size="sm" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#2A2B4A] leading-tight mb-0.5">Upcoming Booking</h4>
                <p className="text-[12px] text-[#6B6C80]">Your next event details and venue info</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" className="text-[#2A2B4A]" />
          </div>

          <div
            onClick={() => navigate('/user/tools/checklist')}
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-sm border border-white hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F5EBE6] flex items-center justify-center text-[#5C4D4D]">
                <Icon name="money" size="sm" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#2A2B4A] leading-tight mb-0.5">Checklist / Task Pending</h4>
                <p className="text-[12px] text-[#6B6C80]">Important tasks to complete</p>
              </div>
            </div>
            <Icon name="chevronRight" size="sm" className="text-[#2A2B4A]" />
          </div>
        </div>

        {/* Actionable Urgent Alerts Banner (Rule 20) */}
        {summary.upcomingActions && summary.upcomingActions.length > 0 && (
          <div className="space-y-2">
            {summary.upcomingActions.slice(0, 2).map((act, idx) => (
              <div
                key={idx}
                onClick={() => navigate(act.route || '/user/dashboard')}
                className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer shadow-sm transition-all hover:shadow-md active:scale-[0.99] border ${
                  act.priority === 'high'
                    ? 'bg-amber-50 border-amber-200/80 text-amber-900'
                    : 'bg-white border-white/80 text-[#3D2B2B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    act.priority === 'high' ? 'bg-amber-500 text-white' : 'bg-[#EAE1D8] text-[#3D2B2B]'
                  }`}>
                    <Icon name={act.type === 'quote' ? 'money' : (act.type === 'booking' ? 'calendar' : 'checkList')} size="xs" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">{act.title}</h4>
                    <p className="text-[11px] opacity-75 line-clamp-1">{act.description}</p>
                  </div>
                </div>
                <Icon name="chevronRight" size="xs" className="opacity-40" />
              </div>
            ))}
          </div>
        )}

        {/* High-Density Quick Stats */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-4 flex justify-between items-center shadow-sm border border-white/50">
          {[
            { val: bookings.total ?? 0, label: 'BOOKINGS', route: '/user/bookings' },
            { val: quotes.pending ?? 0, label: 'QUOTES', route: '/user/dashboard' },
            { val: planning.checklist?.total ?? 0, label: 'TASKS', route: '/user/tools/checklist' },
            { val: '...', label: 'MORE', route: '/user/dashboard' }
          ].map((stat, i) => (
            <div key={i} className="flex-1 relative flex flex-col items-center">
              <button
                onClick={() => navigate(stat.route)}
                className="text-center space-y-1 w-full hover:opacity-70 transition-opacity"
              >
                <div className="text-xl sm:text-2xl font-black text-[#2A2B4A] tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                  {stat.val}
                </div>
                <div className="text-[9px] font-medium tracking-widest text-[#6B6C80]">{stat.label}</div>
              </button>
              {i < 3 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-[#2A2B4A]/10"></div>
              )}
            </div>
          ))}
        </div>

        {/* Planning Progress Meter (Rule 19) */}
        <div className="p-5 rounded-3xl bg-white shadow-sm border border-white space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-bold text-[#2A2B4A]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Planning Completion
              </h3>
              <p className="text-[11px] font-medium text-[#6B6C80] mt-0.5">
                Track your progress to a perfect celebration
              </p>
            </div>
            <span className="text-xl font-bold text-[#9D3875]">
              {planning.checklist?.progressPercentage || 0}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F5EBE6] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${planning.checklist?.progressPercentage || 0}%`,
                background: '#9D3875'
              }}
            />
          </div>

          <div className="flex justify-between items-center pt-2 text-center">
            <div onClick={() => navigate('/user/tools/checklist')} className="flex-1 cursor-pointer hover:opacity-80">
              <div className="text-[13px] font-bold text-[#2A2B4A]">{planning.checklist?.completed || 0}/{planning.checklist?.total || 0}</div>
              <div className="text-[11px] text-[#6B6C80]">Tasks Done</div>
            </div>
            <div className="h-6 w-px bg-[#2A2B4A]/10"></div>
            <div onClick={() => navigate('/user/tools/budget')} className="flex-1 cursor-pointer hover:opacity-80">
              <div className="text-[13px] font-bold text-[#2A2B4A]">₹{(planning.budget?.spent || 0).toLocaleString()}</div>
              <div className="text-[11px] text-[#6B6C80]">Budget Used</div>
            </div>
            <div className="h-6 w-px bg-[#2A2B4A]/10"></div>
            <div onClick={() => navigate('/user/vendors')} className="flex-1 cursor-pointer hover:opacity-80">
              <div className="text-[13px] font-bold text-[#2A2B4A]">{bookings.confirmed || 0}/{bookings.total || 0}</div>
              <div className="text-[11px] text-[#6B6C80]">Vendors Finalized</div>
            </div>
          </div>
        </div>

        {/* Upcoming Bookings Spotlight */}
        {bookings.upcomingList && bookings.upcomingList.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3D2B2B]/60">
                Next Upcoming Booking
              </h3>
              <button
                onClick={() => navigate('/user/bookings')}
                className="text-xs font-bold text-[#BE185D] hover:underline"
              >
                View All ({bookings.total})
              </button>
            </div>

            {bookings.upcomingList.slice(0, 1).map((b) => (
              <div
                key={b._id}
                onClick={() => navigate('/user/bookings')}
                className="p-4 rounded-3xl bg-white shadow-sm border border-white flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={b.vendorId?.profileImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=120&h=120&fit=crop'}
                    alt={b.vendorId?.businessName}
                    className="w-12 h-12 rounded-2xl object-cover border border-[#EAE1D8]"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#3D2B2B] leading-tight">
                      {b.vendorId?.businessName || 'Wedding Vendor'}
                    </h4>
                    <p className="text-xs text-[#3D2B2B]/50 line-clamp-1">
                      {b.services?.join(', ') || 'Event Service'} • {b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Scheduled'}
                    </p>
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 mt-1">
                      {b.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#3D2B2B]">₹{(b.totalPrice || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-[#3D2B2B]/40 font-bold uppercase">{b.paymentStatus}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Vendors Carousel (Rule 5 & Phase 4 Engine) */}
        {summary.vendors?.recommended && summary.vendors.recommended.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3D2B2B]/60">
                Recommended For You
              </h3>
              <button
                onClick={() => navigate('/user/vendors')}
                className="text-xs font-bold text-[#BE185D] hover:underline"
              >
                Explore Marketplace
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {summary.vendors.recommended.slice(0, 2).map((v) => (
                <div
                  key={v._id}
                  onClick={() => navigate(`/user/vendor/${v._id}`)}
                  className="rounded-3xl bg-white p-3 shadow-sm border border-white cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-2 relative">
                    <img
                      src={v.profileImage || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&h=200&fit=crop'}
                      alt={v.businessName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
                      ⭐ {v.rating || '5.0'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3D2B2B] leading-tight line-clamp-1">
                      {v.businessName}
                    </h4>
                    <p className="text-[10px] text-[#3D2B2B]/50 line-clamp-1">
                      {v.city} • Starts ₹{(v.startingPrice || 15000).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planning Toolkit Navigation */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[#3D2B2B]/40 text-[10px] font-black uppercase tracking-[0.25em] text-center">
            Wedding Planning Suite
          </h4>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { icon: 'calendar', label: 'Calendar', route: '/user/calendar' },
              { icon: 'checkList', label: 'Checklist', route: '/user/tools/checklist' },
              { icon: 'money', label: 'Budget', route: '/user/tools/budget' },
              { icon: 'users', label: 'Guests', route: '/user/tools/guests' },
              { icon: 'users', label: 'Family', route: '/user/family/groups' },
              { icon: 'share', label: 'E-Invites', route: '/user/e-invites' },
              { icon: 'star', label: 'Inspiration', route: '/user/inspirations' },
              { icon: 'heart', label: 'Saved', route: '/user/favourites' }
            ].map((tool, idx) => (
              <button
                key={idx}
                onClick={() => navigate(tool.route)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-sm border border-white hover:shadow-md transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-[#EAE1D8] flex items-center justify-center text-[#3D2B2B]">
                  <Icon name={tool.icon} size="xs" />
                </div>
                <span className="text-[9px] font-black uppercase text-[#3D2B2B]/70 tracking-wider">
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent User Activity Feed (Rule 4) */}
        {summary.recentActivities && summary.recentActivities.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#3D2B2B]/60 px-1">
              Recent Activity
            </h3>
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-white space-y-3">
              {summary.recentActivities.slice(0, 4).map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="sparkles" size="xs" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#3D2B2B] leading-tight">{act.title}</p>
                    <p className="text-[#3D2B2B]/60 text-[11px] mt-0.5">{act.message}</p>
                    <span className="text-[9px] text-[#3D2B2B]/40 mt-1 block">
                      {new Date(act.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Editorial Quote */}
        <div className="text-center pt-6 border-t border-[#3D2B2B]/10">
          <p className="text-[#3D2B2B]/40 text-[11px] italic font-medium leading-relaxed" style={{ fontFamily: '"Outfit", sans-serif' }}>
            "Every great love story deserves a<br />perfectly curated celebration" ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
