import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useCart } from '../../../contexts/CartContext';
import { useLenisContext } from '../../../providers/LenisProvider';
import Icon from '../../../components/ui/Icon';
import EmptyState from '../../../components/ui/EmptyState';

const ChatsList = () => {
  const { theme } = useTheme();
  const { cartState } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);

  // Memoize cart items to prevent unnecessary re-renders
  const cartItems = useMemo(() => cartState?.items || [], [cartState?.items]);

  useEffect(() => {
    // Create chat entries for vendors in cart, shortlist, bookings, or enquiries
    if (cartItems.length > 0) {
      const chatData = cartItems.map(item => ({
        id: `chat-${item.id}`,
        vendorId: item.id,
        vendorName: item.name,
        vendorCategory: item.category,
        vendorImage: item.image,
        lastMessage: generateLastMessage(item.category),
        timestamp: generateTimestamp(),
        unread: Math.random() > 0.6, // 40% chance of unread
        unreadCount: Math.floor(Math.random() * 3) + 1,
        isOnline: Math.random() > 0.5, // 50% chance of being online
        source: 'cart' // Track where the chat originated from
      }));
      
      // Only update if the chat data has actually changed
      setChats(prevChats => {
        if (prevChats.length !== chatData.length) {
          return chatData;
        }
        
        // Check if any vendor IDs have changed
        const prevVendorIds = prevChats.map(chat => chat.vendorId).sort();
        const newVendorIds = chatData.map(chat => chat.vendorId).sort();
        
        if (JSON.stringify(prevVendorIds) !== JSON.stringify(newVendorIds)) {
          return chatData;
        }
        
        return prevChats; // No change needed
      });
    } else {
      setChats(prevChats => prevChats.length > 0 ? [] : prevChats);
    }
  }, [cartItems.length, cartItems.map(item => item.id).join(',')]); // Only depend on length and IDs

  const generateLastMessage = (category) => {
    const messages = {
      'Wedding Venues': 'Thank you for your interest! Our venue is available for your date.',
      'Wedding Photographers': 'I would love to capture your special moments. Let\'s discuss the package.',
      'Bridal Makeup Artists': 'Hi! I can create the perfect bridal look for you. When is your wedding?',
      'Wedding Decorators': 'We can transform your venue into a dream wedding setup.',
      'Catering Services': 'Our menu options will make your wedding feast memorable.',
      'DJ & Music': 'Let\'s make your wedding celebration unforgettable with great music!',
      'Wedding Planners': 'I can help you plan every detail of your perfect wedding.',
      'Mehndi Artists': 'Beautiful bridal mehndi designs await you. Let\'s schedule a trial.',
      'Wedding Invitations': 'Your wedding invitations will be elegant and memorable.',
      'Bridal Wear': 'Find your dream wedding outfit in our exclusive collection.',
      'Groom Wear': 'Handsome groom outfits that will make you look your best.',
      'Wedding Jewelry': 'Exquisite jewelry pieces to complement your bridal look.',
      'Wedding Cakes': 'Delicious wedding cakes that taste as good as they look.'
    };
    
    return messages[category] || 'Hi! Thank you for your interest in our services.';
  };

  const generateTimestamp = () => {
    const now = new Date();
    const timestamps = [
      'Just now',
      '5 min ago',
      '1 hour ago',
      '2 hours ago',
      'Yesterday',
      '2 days ago',
      now.toLocaleDateString('en-US', { weekday: 'short' })
    ];
    return timestamps[Math.floor(Math.random() * timestamps.length)];
  };

  const filteredChats = chats.filter(chat =>
    chat.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.vendorCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chat) => {
    navigate(`/user/chats/${chat.vendorId}`, { 
      state: { 
        vendorName: chat.vendorName,
        vendorCategory: chat.vendorCategory,
        vendorImage: chat.vendorImage
      }
    });
  };

  const formatTime = (timestamp) => {
    if (timestamp === 'Just now' || timestamp.includes('ago')) {
      return timestamp;
    }
    return timestamp;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="px-4 py-4 border-b"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 
                className="text-xl font-bold"
                style={{ color: theme.semantic.text.primary }}
              >
                My Chats
              </h1>
              <p 
                className="text-sm"
                style={{ color: theme.semantic.text.secondary }}
              >
                {chats.length} vendor conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {chats.length > 0 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" size="sm" style={{ color: theme.semantic.text.tertiary }} />
            </div>
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: theme.semantic.background.accent,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary,
                fontSize: '14px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.primary[500];
                e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary[500]}25`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.semantic.border.light;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="px-4 py-4">
        {filteredChats.length === 0 ? (
          <EmptyState
            icon="chat"
            title="No Chats Yet"
            description="Start chatting with vendors by adding them to your cart or shortlist."
            actionText="Browse Vendors"
            onAction={() => navigate('/user/vendors')}
          />
        ) : (
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border"
                style={{ 
                  backgroundColor: theme.semantic.background.primary,
                  borderColor: theme.semantic.border.light
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary[50];
                  e.currentTarget.style.borderColor = theme.colors.primary[200];
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.semantic.background.primary;
                  e.currentTarget.style.borderColor = theme.semantic.border.light;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Vendor Image with Online Status */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2" style={{ ringColor: theme.colors.primary[100] }}>
                    <img
                      src={chat.vendorImage}
                      alt={chat.vendorName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=112&h=112&fit=crop&face=center&q=80';
                      }}
                    />
                  </div>
                  {chat.isOnline && (
                    <div 
                      className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                      style={{ 
                        backgroundColor: '#10b981',
                        borderColor: theme.semantic.background.primary
                      }}
                    />
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 
                      className={`font-semibold text-base truncate ${chat.unread ? 'font-bold' : ''}`}
                      style={{ color: theme.semantic.text.primary }}
                    >
                      {chat.vendorName}
                    </h3>
                    <span 
                      className="text-xs flex-shrink-0 ml-2"
                      style={{ color: theme.semantic.text.tertiary }}
                    >
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>
                  
                  <p 
                    className="text-xs mb-1.5 font-medium"
                    style={{ color: theme.colors.primary[600] }}
                  >
                    {chat.vendorCategory}
                  </p>
                  
                  <div className="flex items-center justify-between gap-2">
                    <p 
                      className={`text-sm truncate flex-1 ${chat.unread ? 'font-medium' : ''}`}
                      style={{ color: chat.unread ? theme.semantic.text.primary : theme.semantic.text.secondary }}
                    >
                      {chat.lastMessage}
                    </p>
                    
                    {/* Unread Badge */}
                    {chat.unread && (
                      <div 
                        className="min-w-[1.5rem] h-6 px-2 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.colors.primary[500] }}
                      >
                        <span className="text-xs font-bold text-white">
                          {chat.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:h-8"></div>
    </div>
  );
};

export default ChatsList;