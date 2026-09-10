import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import CartIcon from './CartIcon';
import HamburgerMenu from './HamburgerMenu';
import Icon from '../ui/Icon';

const Header = () => {
  const { theme, changeTheme, availableThemes, themeName } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);

  // Mock notification count - replace with actual data from context/API
  const [notificationCount] = useState(3);

  const handleNotificationsClick = () => {
    navigate('/user/notifications');
  };

  const isDashboard = location.pathname === '/user/dashboard';

  const headerStyles = {
    backgroundColor: '#EAE1D8',
    borderBottomColor: 'rgba(61, 43, 43, 0.08)',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    boxShadow: '0 1px 1px 0 rgba(0, 0, 0, 0.04)',
  };

  const logoStyles = {
    background: theme.semantic.background.gradient.hero,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const mobileMenuStyles = {
    backgroundColor: theme.semantic.background.accent,
    borderTopColor: theme.semantic.border.accent,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
  };

  return (
    <header className="sticky top-0 z-50" style={headerStyles}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/user/home"
              className="text-2xl sm:text-3xl font-black uppercase tracking-tighter"
              style={{ color: '#3D2B2B', fontFamily: '"Playfair Display", serif' }}
            >
              Utsavo
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Saved Items Icon */}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/user/favourites')}
                className="relative p-2 rounded-lg transition-colors"
                style={{
                  color: theme.semantic.text.secondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.semantic.text.primary;
                  e.currentTarget.style.backgroundColor = theme.semantic.background.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.semantic.text.secondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon name="heart" size="md" />
                {/* Saved Badge */}
                {notificationCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.accent[500] }}
                  >
                    <span className="text-xs font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* Cart Icon */}
            {!isDashboard && <CartIcon />}

            {/* Theme Switcher */}
            <select
              value={themeName}
              onChange={(e) => changeTheme(e.target.value)}
              className="px-3 py-1 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: theme.semantic.border.accent,
                borderWidth: '1px',
                borderStyle: 'solid',
                color: theme.semantic.text.secondary,
                backgroundColor: theme.semantic.navigation.background,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.semantic.border.focus;
                e.target.style.boxShadow = `0 0 0 2px ${theme.semantic.border.focus}25`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.semantic.border.accent;
                e.target.style.boxShadow = 'none';
              }}
            >
              {availableThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>

            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/user/account"
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors"
                  style={{ color: theme.semantic.text.primary }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme.semantic.background.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&face=center&q=80';
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm px-3 py-1 rounded-lg transition-colors"
                  style={{
                    color: theme.semantic.text.secondary,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = theme.semantic.text.primary;
                    e.target.style.backgroundColor = theme.semantic.background.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = theme.semantic.text.secondary;
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/user/account">
                <Button variant="primary" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Saved Items for Mobile */}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/user/favourites')}
                className="relative p-2 rounded-lg transition-colors"
                style={{
                  color: theme.semantic.navigation.text,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.semantic.text.accent;
                  e.currentTarget.style.backgroundColor = theme.semantic.navigation.backgroundHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.semantic.navigation.text;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon name="heart" size="sm" />
                {/* Saved Badge */}
                {notificationCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.accent[500] }}
                  >
                    <span className="text-xs font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* Cart Icon for Mobile */}
            {!isDashboard && <CartIcon />}

            <button
              onClick={() => setIsHamburgerMenuOpen(!isHamburgerMenuOpen)}
              className="p-2 rounded-lg transition-colors focus:outline-none"
              style={{
                color: theme.semantic.navigation.text,
              }}
              onMouseEnter={(e) => {
                e.target.style.color = theme.semantic.text.accent;
                e.target.style.backgroundColor = theme.semantic.navigation.backgroundHover;
              }}
              onMouseLeave={(e) => {
                e.target.style.color = theme.semantic.navigation.text;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isHamburgerMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden" style={mobileMenuStyles}>
            <div className="px-2 pt-2 pb-3 space-y-3">
              {/* Theme Switcher Mobile */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: theme.semantic.text.primary }}
                >
                  Theme
                </label>
                <select
                  value={themeName}
                  onChange={(e) => changeTheme(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: theme.semantic.border.accent,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: theme.semantic.text.primary,
                    backgroundColor: theme.semantic.navigation.background,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme.semantic.border.focus;
                    e.target.style.boxShadow = `0 0 0 2px ${theme.semantic.border.focus}25`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.semantic.border.accent;
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {availableThemes.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Authentication Section Mobile */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 px-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&face=center&q=80';
                        }}
                      />
                    </div>
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {user.name}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: theme.semantic.text.secondary }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to="/user/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        Account
                      </Button>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        Logout
                      </Button>
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/user/account" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={isHamburgerMenuOpen}
        onClose={() => setIsHamburgerMenuOpen(false)}
      />
    </header>
  );
};

export default Header;