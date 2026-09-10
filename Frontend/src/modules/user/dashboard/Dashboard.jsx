import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/ui/Icon';

const Dashboard = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardOptions = [
    {
      id: 'news',
      title: 'News & Updates',
      subtitle: 'Latest wedding trends',
      icon: 'news',
      route: '/user/news',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop&q=80',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.75) 0%, rgba(244, 114, 182, 0.75) 100%)',
      shadowColor: 'rgba(236, 72, 153, 0.4)',
      stats: '50+ Articles'
    },
    {
      id: 'plan',
      title: 'Plan',
      subtitle: 'Plan your event',
      icon: 'plan',
      route: '/user/requirements',
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop&q=80',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.75) 0%, rgba(251, 191, 36, 0.75) 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.4)',
      stats: 'Event Planning'
    },
    {
      id: 'horoscope',
      title: 'Horoscope',
      subtitle: 'Check your horoscope',
      icon: 'star',
      route: '/user/horoscope',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop&q=80',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.75) 0%, rgba(52, 211, 153, 0.75) 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.4)',
      stats: 'Daily Predictions'
    },
    {
      id: 'home',
      title: 'Explore Home',
      subtitle: 'Browse all services',
      icon: 'sparkles',
      route: '/user/home',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop&q=80',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.75) 0%, rgba(167, 139, 250, 0.75) 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.4)',
      stats: 'All Categories'
    }
  ];

  const handleCardClick = (option) => {
    if (option.id === 'plan') {
      const saved = localStorage.getItem('eventDetails');
      let hasRequirements = false;
      try {
        if (saved && saved !== 'null' && saved !== 'undefined') {
          const parsed = JSON.parse(saved);
          hasRequirements = parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
        }
      } catch (e) {
        hasRequirements = false;
      }

      if (hasRequirements) {
        navigate('/user/planning-dashboard');
      } else {
        navigate('/user/requirements');
      }
      return;
    }
    navigate(option.route);
  };

  // Get user's first name or default greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userName = user?.name?.split(' ')[0] || 'There';

  return (
    <div
      className="min-h-screen px-6 py-2 pb-32"
      style={{ backgroundColor: '#EAE1D8' }}
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Editorial Header - Compact */}
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-0.5">
             <h1 className="text-[#3D2B2B] text-2xl font-bold leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                {getGreeting()},<br />{userName}
             </h1>
             <p className="text-[#3D2B2B]/40 text-[8px] font-black uppercase tracking-[0.2em]" style={{ fontFamily: '"Outfit", sans-serif' }}>
                Curation in progress
             </p>
          </div>
          <button
            onClick={() => navigate('/user/account')}
            className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group active:scale-95 transition-transform"
            style={{ 
               backgroundColor: 'white',
               border: '1px solid white' 
            }}
          >
             <div className="w-full h-full flex items-center justify-center bg-[#EAE1D8]/20 backdrop-blur-sm">
                <Icon name="account" size="md" style={{ color: '#3D2B2B' }} />
             </div>
          </button>
        </div>

        {/* High-Density Quick Stats - Compact */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#3D2B2B]/10">
            {[
              { val: '12', label: 'Tasks Left', color: '#B45309' },
              { val: '08', label: 'Shortlisted', color: '#BE185D' },
              { val: '45', label: 'To Your Day', color: '#15803D' }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-0">
                 <div className="text-xl font-black text-[#3D2B2B] tracking-tight">{stat.val}</div>
                 <div className="text-[8px] font-black uppercase text-[#3D2B2B]/40 tracking-wider whitespace-nowrap">{stat.label}</div>
              </div>
            ))}
        </div>

        {/* Premium Action Grid - High Density */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          {dashboardOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleCardClick(option)}
              className="flex flex-col text-left group active:scale-[0.98] transition-transform"
            >
              <div 
                className="w-full aspect-[4/5] rounded-t-[4rem] rounded-b-[1.5rem] overflow-hidden shadow-md border border-white mb-2 relative"
              >
                 <img
                   src={option.image}
                   alt={option.title}
                   className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                   loading="lazy"
                 />
                 <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white">
                        <Icon name={option.icon} size="xs" />
                    </div>
                 </div>
              </div>
              <div className="px-1">
                 <h3 className="text-[#3D2B2B] text-sm font-bold leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {option.title}
                 </h3>
                 <p className="text-[#3D2B2B]/30 text-[8px] font-black uppercase tracking-widest leading-none mt-0.5">
                    {option.stats}
                 </p>
              </div>
            </button>
          ))}
        </div>

        {/* Editorial Sub-Sections */}
        <div className="space-y-6 pt-6">
           <h4 className="text-[#3D2B2B]/30 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-center justify-center">
              <span className="w-8 h-[1px] bg-[#3D2B2B]/10" />
              Planning Toolkit
              <span className="w-8 h-[1px] bg-[#3D2B2B]/10" />
           </h4>
           <div className="grid grid-cols-3 gap-4">
              {[
                { icon: 'search', label: 'Explore', route: '/user/search' },
                { icon: 'heart', label: 'Saved', route: '/user/favourites' },
                { icon: 'settings', label: 'Account', route: '/user/account' }
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-white shadow-sm border border-white transition-all hover:shadow-md active:scale-95"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#EAE1D8] flex items-center justify-center text-[#3D2B2B]">
                    <Icon name={action.icon} size="sm" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#3D2B2B]/60 tracking-wider">
                    {action.label}
                  </span>
                </button>
              ))}
           </div>
        </div>

        {/* Divine Footer Quote */}
        <div className="text-center pt-8 border-t border-[#3D2B2B]/5">
           <p className="text-[#3D2B2B]/40 text-[11px] italic font-medium leading-relaxed" style={{ fontFamily: '"Outfit", sans-serif' }}>
              "Every great love story deserves a<br />perfectly curated celebration" ✨
           </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
