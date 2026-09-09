import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../ui/Icon';

const BottomNav = () => {
  const { theme } = useTheme();

  const getHasRequirements = () => {
    try {
      const saved = localStorage.getItem('eventDetails');
      if (!saved || saved === 'null' || saved === 'undefined') return false;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
    } catch (e) {
      return false;
    }
  };

  const hasRequirements = getHasRequirements();

  const navItems = [
    { path: '/user/dashboard', label: 'Dashboard', iconName: 'sparkles' },
    { path: '/user/home', label: 'Home', iconName: 'home' },
    {
      path: hasRequirements ? '/user/planning-dashboard' : '/user/requirements',
      label: 'Plan',
      iconName: 'plan'
    },
    { path: '/user/vendors', label: 'Vendors', iconName: 'vendors' },
    {
      path: '/user/account',
      label: 'Account',
      iconName: 'account'
    },
  ];

  const navStyles = {
    backgroundColor: '#EAE1D8',
    borderTopColor: 'rgba(61, 43, 43, 0.1)',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40" style={navStyles}>
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs transition-all duration-200 rounded-lg"
            style={({ isActive }) => ({
              color: isActive ? theme.semantic.navigation.textActive : theme.semantic.navigation.text,
              backgroundColor: isActive ? theme.semantic.navigation.backgroundActive : 'transparent',
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.color = theme.semantic.text.accent;
                e.currentTarget.style.backgroundColor = theme.semantic.navigation.backgroundHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.color = theme.semantic.navigation.text;
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon
              name={item.iconName}
              size="lg"
              className="mb-1"
            />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] mt-1" style={{ fontFamily: '"Playfair Display", serif' }}>{item.label}</span>
          </NavLink>
        ))}
      </div>
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" style={{ backgroundColor: theme.semantic.navigation.background }}></div>
    </nav>
  );
};

export default BottomNav;
