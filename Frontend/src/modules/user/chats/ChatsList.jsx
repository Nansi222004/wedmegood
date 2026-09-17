import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import EmptyState from '../../../components/ui/EmptyState';
import { chatApi } from '../../../services/chatApi';
import { socketService } from '../../../services/socket';

const ChatsList = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineVendors, setOnlineVendors] = useState(new Set());

  const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token || null; } catch { return null; } })();

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      try {
        setLoading(true);
        const res = await chatApi.getUserConversations();
        if (res.success && isMounted) {
          setConversations(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConversations();

    // Socket setup for real-time conversation list updates
    if (token) {
      socketService.connect(token);

      const unsubMsg = socketService.onMessage(({ message, conversation }) => {
        setConversations(prev => {
          const exists = prev.find(c => c._id === conversation._id);
          if (exists) {
            return prev.map(c => c._id === conversation._id 
              ? { ...c, lastMessage: conversation.lastMessage, userUnreadCount: conversation.userUnreadCount, updatedAt: conversation.updatedAt } 
              : c
            ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          } else {
            return [conversation, ...prev];
          }
        });
      });

      const unsubOnline = socketService.onUserOnline(({ id, role }) => {
        if (role === 'Vendor') {
          setOnlineVendors(prev => new Set(prev).add(id));
        }
      });

      const unsubOffline = socketService.onUserOffline(({ id, role }) => {
        if (role === 'Vendor') {
          setOnlineVendors(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      });

      return () => {
        isMounted = false;
        unsubMsg();
        unsubOnline();
        unsubOffline();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const filteredChats = useMemo(() => {
    return conversations.filter(chat => {
      const vendor = chat.vendorId || {};
      const name = vendor.businessName || vendor.name || '';
      const category = vendor.category || '';
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query) || category.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery]);

  const handleChatClick = (chat) => {
    const vendor = chat.vendorId || {};
    const vendorId = vendor._id || chat.vendorId;
    navigate(`/user/chats/${vendorId}`, {
      state: {
        conversationId: chat._id,
        vendorName: vendor.businessName || vendor.name || 'Vendor',
        vendorCategory: vendor.category || 'Service Provider',
        vendorImage: vendor.profileImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=150'
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div 
        className="px-4 py-4 border-b sticky top-0 z-10 backdrop-blur-md"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}ee`,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: theme.semantic.background.accent }}
              aria-label="Back"
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 
                className="text-xl font-bold tracking-tight"
                style={{ color: theme.semantic.text.primary }}
              >
                My Chats
              </h1>
              <p 
                className="text-xs"
                style={{ color: theme.semantic.text.secondary }}
              >
                {conversations.length} active conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {conversations.length > 0 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" size="sm" style={{ color: theme.semantic.text.tertiary }} />
            </div>
            <input
              type="text"
              placeholder="Search vendor conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all"
              style={{
                backgroundColor: theme.semantic.background.accent,
                borderColor: theme.semantic.border.light,
                color: theme.semantic.text.primary,
                fontSize: '14px'
              }}
            />
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="px-4 py-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <EmptyState
            icon="chat"
            title={searchQuery ? "No Matching Chats" : "No Conversations Yet"}
            description={searchQuery ? "Try searching for a different vendor name or category." : "Inquire with vendors or send a requirement to start chatting directly."}
            actionText="Explore Vendors"
            onAction={() => navigate('/user/vendors')}
          />
        ) : (
          <div className="space-y-2">
            {filteredChats.map((chat) => {
              const vendor = chat.vendorId || {};
              const vendorIdStr = vendor._id ? vendor._id.toString() : '';
              const isOnline = onlineVendors.has(vendorIdStr);
              const unread = (chat.userUnreadCount || 0) > 0;

              return (
                <div
                  key={chat._id}
                  onClick={() => handleChatClick(chat)}
                  className={`flex items-center space-x-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                    unread ? 'shadow-sm' : ''
                  }`}
                  style={{ 
                    backgroundColor: unread ? `${theme.colors.primary[500]}08` : theme.semantic.background.primary,
                    borderColor: unread ? `${theme.colors.primary[500]}30` : theme.semantic.border.light
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = unread ? '0 1px 3px rgba(0,0,0,0.05)' : 'none';
                  }}
                >
                  {/* Vendor Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-slate-100 bg-slate-100">
                      <img
                        src={vendor.profileImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=150'}
                        alt={vendor.businessName || vendor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=150';
                        }}
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h2 
                        className={`text-sm truncate pr-2 ${unread ? 'font-bold' : 'font-semibold'}`}
                        style={{ color: theme.semantic.text.primary }}
                      >
                        {vendor.businessName || vendor.name || 'Vendor'}
                      </h2>
                      <span 
                        className="text-[11px] whitespace-nowrap"
                        style={{ color: unread ? theme.colors.primary[600] : theme.semantic.text.tertiary }}
                      >
                        {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                      </span>
                    </div>

                    <p 
                      className="text-xs font-medium mb-1 truncate"
                      style={{ color: theme.semantic.text.secondary }}
                    >
                      {vendor.category || 'Vendor Partner'} {vendor.city ? `• ${vendor.city}` : ''}
                    </p>

                    <p 
                      className={`text-xs truncate ${unread ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                    >
                      {chat.lastMessage?.text || 'Tap to view conversation'}
                    </p>
                  </div>

                  {/* Unread Counter Badge */}
                  {unread && (
                    <div className="flex-shrink-0">
                      <span 
                        className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: theme.colors.primary[500] }}
                      >
                        {chat.userUnreadCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsList;