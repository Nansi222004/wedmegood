import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import userApi, { getAuthToken } from '../../../services/userApi';
import { socketService } from '../../../services/socket';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from '../../../components/ui/Toast';

const GroupChat = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams();
  const messagesEndRef = useRef(null);
  
  const { user } = useAuth();
  const token = getAuthToken();
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [copiedMemberId, setCopiedMemberId] = useState(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [quickInviteName, setQuickInviteName] = useState('');
  const [quickInvitePhone, setQuickInvitePhone] = useState('');
  const [isInvitingQuick, setIsInvitingQuick] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsAvatar, setSettingsAvatar] = useState('');
  const [settingsShared, setSettingsShared] = useState({
    checklist: true,
    timeline: true,
    budget: false,
    guestList: false,
    inspiration: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Check if current user is admin
  const isCurrentUserAdmin = () => {
    const currentUserId = user?.id || user?._id;
    return group?.userId === currentUserId || group?.userId?._id === currentUserId;
  };

  // Detect keyboard open/close on mobile
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75; // If viewport is less than 75% of screen height, keyboard is likely open
      
      setIsKeyboardOpen(viewportHeight < keyboardThreshold);
    };

    // Use visualViewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Quick message suggestions
  const quickMessages = [
    "Let's finalize the venue! 🏛️",
    "What about the catering menu? 🍽️",
    "Need to book the photographer 📸",
    "Decoration ideas anyone? 🌸",
    "Budget discussion needed 💰",
    "Timeline looks good! ✅"
  ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect Socket and Fetch Messages
  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }

    if (location.state?.group) {
      setGroup(location.state.group);
    } else {
      userApi.getFamilyGroups().then(res => {
        if (res.success) {
          const groupsData = Array.isArray(res.data) ? res.data : (res.data?.groups || []);
          const foundGroup = groupsData.find(g => g._id === groupId || g.id === groupId);
          if (foundGroup) {
            setGroup({ ...foundGroup, id: foundGroup._id });
          } else {
            navigate('/user/family/groups');
          }
        }
      });
    }

    // Load existing messages
    if (groupId) {
      userApi.getFamilyGroupMessages(groupId).then(res => {
        if (res.success && res.data) {
          setMessages(res.data);
        }
      }).catch(err => console.error('Error fetching messages', err));
      
      socketService.joinFamilyGroup(groupId);

      const unsubMsg = socketService.onFamilyGroupMessage(({ message }) => {
        if (message.groupId === groupId) {
          setMessages(prev => {
            // Prevent duplicate messages if optimistic update was fast
            if (prev.some(m => m._id === message._id || (message.clientMessageId && m.clientMessageId === message.clientMessageId))) {
              return prev.map(m => (m._id === message._id || (message.clientMessageId && m.clientMessageId === message.clientMessageId)) ? message : m);
            }
            return [...prev, message];
          });
        }
      });
      
      return () => {
        socketService.leaveFamilyGroup(groupId);
        if (unsubMsg) unsubMsg();
      };
    }
  }, [groupId, location.state, navigate, token]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !groupId) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    setShowSuggestions(false);

    const clientMsgId = 'client_' + Date.now();
    const optimisticMessage = {
      _id: clientMsgId,
      clientMessageId: clientMsgId,
      senderId: user?._id || user?.id,
      senderName: user?.name || 'You',
      senderAvatar: user?.profileImage || '',
      message: messageText,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      type: 'text'
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await userApi.sendFamilyGroupMessage(groupId, {
        message: messageText,
        type: 'text',
        clientMessageId: clientMsgId
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Open Settings Modal
  const handleOpenSettings = () => {
    if (!group) return;
    setSettingsName(group.name || '');
    setSettingsDesc(group.description || '');
    setSettingsAvatar(group.avatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop');
    setSettingsShared(group.sharedResources || {
      checklist: true,
      timeline: true,
      budget: false,
      guestList: false,
      inspiration: true
    });
    setShowGroupInfo(false);
    setShowGroupSettings(true);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!settingsName.trim()) {
      toast.warning('Group name cannot be empty');
      return;
    }
    try {
      setIsSavingSettings(true);
      const gId = group._id || group.id;
      const res = await userApi.updateFamilyGroup(gId, {
        name: settingsName.trim(),
        description: settingsDesc.trim(),
        avatar: settingsAvatar.trim(),
        sharedResources: settingsShared
      });
      if (res.success && res.data) {
        toast.success('Group settings updated successfully!');
        const updated = res.data.group || res.data;
        setGroup(prev => ({
          ...prev,
          name: updated.name || settingsName.trim(),
          description: updated.description !== undefined ? updated.description : settingsDesc.trim(),
          avatar: updated.avatar || settingsAvatar.trim(),
          sharedResources: updated.sharedResources || settingsShared
        }));
        setShowGroupSettings(false);
      } else {
        toast.error(res.message || 'Failed to update group settings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Delete group function
  const handleDeleteGroup = async () => {
    try {
      setIsDeletingGroup(true);
      const gId = group._id || group.id;
      const res = await userApi.deleteFamilyGroup(gId);
      if (res.success) {
        toast.success('Family group deleted successfully');
        setShowDeleteConfirm(false);
        navigate('/user/family/groups');
      } else {
        toast.error(res.message || 'Failed to delete group');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleWhatsAppMember = async (member) => {
    try {
      setIsGeneratingLink(true);
      const mId = member._id || member.id;
      const gId = group._id || group.id;
      const res = await userApi.getFamilyMemberShareLink(gId, mId);
      if (res.success && res.data?.inviteLink) {
        const inviteUrl = res.data.inviteLink;
        const cleanPhone = (member.phone || '').replace(/\D/g, '');
        const text = encodeURIComponent(
          `Hi ${member.name}! You've been invited to join our wedding planning group "${group.name}" on Utsavo.\n\nClick this link to join and start planning with us:\n${inviteUrl}`
        );
        const waUrl = cleanPhone
          ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}&text=${text}`
          : `https://api.whatsapp.com/send?text=${text}`;
        window.open(waUrl, '_blank');
      } else {
        toast.error(res.message || 'Failed to generate invitation link');
      }
    } catch (err) {
      toast.error('Failed to get invite link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyMemberLink = async (member) => {
    try {
      const mId = member._id || member.id;
      const gId = group._id || group.id;
      setIsGeneratingLink(true);
      const res = await userApi.getFamilyMemberShareLink(gId, mId);
      if (res.success && res.data?.inviteLink) {
        await navigator.clipboard.writeText(res.data.inviteLink);
        setCopiedMemberId(mId);
        toast.success(`Copied invite link for ${member.name}!`);
        setTimeout(() => setCopiedMemberId(null), 2500);
      } else {
        toast.error(res.message || 'Failed to copy invite link');
      }
    } catch (err) {
      toast.error('Failed to copy link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleQuickInviteMember = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quickInviteName.trim()) {
      toast.warning('Please enter contact name');
      return;
    }
    const cleanPhone = quickInvitePhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.warning('Please enter a valid 10-digit phone number');
      return;
    }
    try {
      setIsInvitingQuick(true);
      const gId = group._id || group.id;
      const res = await userApi.inviteFamilyGroupMember(gId, {
        name: quickInviteName.trim(),
        phone: cleanPhone,
        relation: 'Family'
      });
      if (res.success && res.data) {
        toast.success(`${quickInviteName.trim()} invited!`);
        const updatedMembers = res.data.members || [...(group.members || []), res.data.member];
        setGroup(prev => ({ ...prev, members: updatedMembers }));

        const inviteUrl = res.data.inviteLink || res.data.member?.inviteLink;
        if (inviteUrl) {
          const text = encodeURIComponent(
            `Hi ${quickInviteName.trim()}! You've been invited to join our wedding planning group "${group.name}" on Utsavo.\n\nClick this link to join and start planning with us:\n${inviteUrl}`
          );
          window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone.slice(-10)}&text=${text}`, '_blank');
        }
        setQuickInviteName('');
        setQuickInvitePhone('');
        setShowAddMembers(false);
      } else {
        toast.error(res.message || 'Failed to invite member');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsInvitingQuick(false);
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const timeToUse = message.createdAt || message.timestamp;
    if (!timeToUse) return groups;
    const date = formatDate(timeToUse);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary[500] }}></div>
      </div>
    );
  }

  return (
    <div 
      className={`h-[100dvh] flex flex-col bg-white overflow-hidden ${isKeyboardOpen ? 'keyboard-open' : ''}`} 
      style={{ 
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div 
        className="h-16 px-4 border-b flex items-center justify-between bg-white z-20 flex-shrink-0 shadow-sm"
        style={{ 
          borderColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate('/user/family/groups')}
            className="mr-3 p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={group.avatar}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div 
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: theme.colors.accent[500] }}
              />
            </div>
            
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="text-left"
            >
              <h1 className="font-bold text-base" style={{ color: theme.semantic.text.primary }}>
                {group.name}
              </h1>
              <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                {onlineMembers.length} online • {group.members?.length || 0} members
              </p>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGroupInfo(true)}
            className="px-2.5 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold transition active:scale-95 shadow-sm text-white"
            style={{ backgroundColor: '#25D366' }}
            title="Share Group Invite"
          >
            <span>📱</span>
            <span className="hidden sm:inline">Invite</span>
          </button>
          <button
            onClick={() => setShowGroupInfo(!showGroupInfo)}
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="more" size="sm" style={{ color: theme.semantic.text.secondary }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8F9FA]"
      >
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div 
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: theme.semantic.background.accent,
                  color: theme.semantic.text.secondary
                }}
              >
                {date}
              </div>
            </div>

            {/* Messages for this date */}
            <div className="space-y-4">
              {dayMessages.map((message, msgIdx) => {
                const currentUserId = user?.id || user?._id;
                const isCurrentUser = message.senderId?.toString() === currentUserId?.toString();
                const isSystem = message.type === 'system';

                if (isSystem) {
                  return (
                    <div key={message._id || message.id || `${date}-sys-${msgIdx}`} className="flex justify-center">
                      <div 
                        className="px-4 py-2 rounded-xl text-sm text-center max-w-xs"
                        style={{
                          backgroundColor: theme.colors.accent[100],
                          color: theme.colors.accent[700]
                        }}
                      >
                        {message.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message._id || message.id || `${date}-${msgIdx}`} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-center mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {!isCurrentUser && (
                          <img
                            src={message.senderAvatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'}
                            alt={message.senderName}
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                          />
                        )}
                        <span className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                          {message.senderName || (isCurrentUser ? 'You' : 'Member')}
                        </span>
                        {isCurrentUser && (
                          <img
                            src={message.senderAvatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'}
                            alt={message.senderName}
                            className="w-6 h-6 rounded-full ml-2 object-cover"
                          />
                        )}
                      </div>
                      
                      <div
                        className={`p-3 rounded-2xl ${
                          isCurrentUser ? 'rounded-br-md' : 'rounded-bl-md'
                        }`}
                        style={{
                          backgroundColor: isCurrentUser 
                            ? theme.colors.primary[500] 
                            : theme.semantic.card.background,
                          color: isCurrentUser 
                            ? 'white' 
                            : theme.semantic.text.primary,
                          borderColor: !isCurrentUser ? theme.semantic.card.border : 'transparent',
                          borderWidth: !isCurrentUser ? '1px' : '0'
                        }}
                      >
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                      
                      <div className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        <span style={{ color: theme.semantic.text.tertiary }}>
                          {formatTime(message.createdAt || message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mt-4">
            <div className="max-w-[80%]">
              <div
                className="p-3 rounded-2xl rounded-bl-md"
                style={{
                  backgroundColor: theme.semantic.card.background,
                  borderColor: theme.semantic.card.border,
                  borderWidth: '1px'
                }}
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.primary[400], animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.primary[400], animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.primary[400], animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Message Suggestions */}
      {showSuggestions && messages.length <= 1 && !isKeyboardOpen && (
        <div className="px-4 py-3 border-t" style={{ borderTopColor: theme.semantic.border.light }}>
          <p className="text-xs font-medium mb-3" style={{ color: theme.semantic.text.secondary }}>
            Quick messages to get started:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setNewMessage(suggestion);
                  setShowSuggestions(false);
                }}
                className="px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: theme.colors.primary[100],
                  color: theme.colors.primary[700],
                  border: `1px solid ${theme.colors.primary[200]}`
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div 
        className={`px-4 border-t backdrop-blur-sm flex-shrink-0 z-40 ${
          isKeyboardOpen ? 'py-2 fixed bottom-0 left-0 right-0' : 'py-4'
        }`}
        style={{ 
          backgroundColor: isKeyboardOpen 
            ? theme.semantic.background.primary 
            : `${theme.semantic.background.primary}F0`,
          borderColor: theme.semantic.border.light,
          boxShadow: isKeyboardOpen 
            ? `0 -2px 10px ${theme.semantic.card.shadow}` 
            : `0 -4px 20px ${theme.semantic.card.shadow}`,
          transform: isKeyboardOpen ? 'translateY(0)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div className={`flex items-end gap-3 ${isKeyboardOpen ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
          <button
            className={`rounded-full flex-shrink-0 transition-colors hover:scale-105 ${
              isKeyboardOpen ? 'p-2' : 'p-3'
            }`}
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="plus" size="sm" style={{ color: theme.semantic.text.secondary }} />
          </button>
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={`w-full rounded-2xl resize-none focus:outline-none focus:ring-2 text-sm border ${
                isKeyboardOpen ? 'px-3 py-2' : 'px-4 py-3'
              }`}
              style={{
                backgroundColor: theme.semantic.card.background,
                borderColor: theme.semantic.card.border,
                color: theme.semantic.text.primary,
                '--tw-ring-color': theme.colors.primary[500],
                minHeight: isKeyboardOpen ? '40px' : '48px',
                maxHeight: isKeyboardOpen ? '80px' : '120px',
                lineHeight: '1.5'
              }}
              rows={1}
              maxLength={500}
              onInput={(e) => {
                e.target.style.height = 'auto';
                const maxHeight = isKeyboardOpen ? 80 : 120;
                const minHeight = isKeyboardOpen ? 40 : 48;
                e.target.style.height = Math.max(Math.min(e.target.scrollHeight, maxHeight), minHeight) + 'px';
              }}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
              newMessage.trim() ? 'scale-100 opacity-100 hover:scale-105' : 'scale-95 opacity-60'
            } ${isKeyboardOpen ? 'p-2' : 'p-3'}`}
            style={{
              backgroundColor: theme.colors.primary[500],
              color: 'white',
              minWidth: isKeyboardOpen ? '40px' : '48px',
              minHeight: isKeyboardOpen ? '40px' : '48px'
            }}
          >
            <Icon name="send" size="sm" />
          </button>
        </div>
      </div>
      
      {/* Group Info Modal */}
      {showGroupInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                Group Info
              </h3>
              <button
                onClick={() => setShowGroupInfo(false)}
                className="p-2 rounded-full"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                <Icon name="close" size="sm" style={{ color: theme.semantic.text.primary }} />
              </button>
            </div>
            
            {/* Group Avatar and Name */}
            <div className="text-center mb-6">
              <img
                src={group.avatar}
                alt={group.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
              />
              <h2 className="text-xl font-bold mb-1" style={{ color: theme.semantic.text.primary }}>
                {group.name}
              </h2>
              <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                {group.description || 'Wedding planning group'}
              </p>
            </div>
            
            {/* Group Members */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm" style={{ color: theme.semantic.text.primary }}>
                  Members ({group.members?.length || 0})
                </h4>
                {isCurrentUserAdmin() && (
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg transition active:scale-95"
                    style={{ backgroundColor: theme.colors.primary[50], color: theme.colors.primary[600] }}
                  >
                    + Invite via WhatsApp
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {group.members?.map(member => {
                  const mId = member._id || member.id || member.userId;
                  const isPending = member.status === 'pending';
                  const isCopied = copiedMemberId === (member._id || member.id);
                  return (
                    <div 
                      key={mId || Math.random()} 
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
                      style={{ 
                        backgroundColor: theme.semantic.background.secondary,
                        borderColor: theme.semantic.border.light 
                      }}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate" style={{ color: theme.semantic.text.primary }}>
                            {member.name}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: theme.semantic.text.secondary }}>
                            {member.relation || 'Member'} {member.phone ? `• ${member.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {member.role === 'admin' ? (
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: theme.colors.accent[100],
                              color: theme.colors.accent[700]
                            }}
                          >
                            Admin
                          </span>
                        ) : isPending ? (
                          <>
                            <button
                              type="button"
                              disabled={isGeneratingLink}
                              onClick={() => handleWhatsAppMember(member)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1 shadow-sm transition active:scale-95"
                              style={{ backgroundColor: '#25D366' }}
                              title="Share on WhatsApp"
                            >
                              <span>📱</span>
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              disabled={isGeneratingLink}
                              onClick={() => handleCopyMemberLink(member)}
                              className="p-1 rounded-lg border text-xs font-semibold transition active:scale-95"
                              style={{
                                backgroundColor: isCopied ? '#ECFDF5' : 'white',
                                borderColor: isCopied ? '#10B981' : theme.semantic.border.light,
                                color: isCopied ? '#059669' : theme.semantic.text.primary
                              }}
                              title="Copy Invite Link"
                            >
                              <Icon name={isCopied ? 'check' : 'copy'} size="xs" />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Joined
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Group Actions */}
            <div className="space-y-3">
              {isCurrentUserAdmin() && (
                <>
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                    style={{
                      backgroundColor: theme.colors.primary[100],
                      color: theme.colors.primary[700]
                    }}
                  >
                    Add Members
                  </button>
                  <button
                    onClick={handleOpenSettings}
                    className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                    style={{
                      backgroundColor: theme.colors.secondary[100],
                      color: theme.colors.secondary[700]
                    }}
                  >
                    Group Settings
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                    style={{
                      backgroundColor: theme.colors.error?.[100] || '#fee2e2',
                      color: theme.colors.error?.[700] || '#dc2626'
                    }}
                  >
                    Delete Group
                  </button>
                </>
              )}
              {!isCurrentUserAdmin() && (
                <button
                  className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.secondary[100],
                    color: theme.colors.secondary[700]
                  }}
                >
                  Leave Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto space-y-5"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.semantic.border.light }}>
              <h3 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                Group Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupSettings(false)}
                className="p-1.5 rounded-full hover:bg-stone-100"
              >
                <Icon name="close" size="sm" style={{ color: theme.semantic.text.secondary }} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.semantic.text.secondary }}>
                  Group Icon
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={settingsAvatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop'}
                    alt="Group Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 shadow-sm flex-shrink-0"
                    style={{ borderColor: theme.colors.primary[500] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium mb-1.5" style={{ color: theme.semantic.text.primary }}>Choose a preset icon:</p>
                    <div className="flex gap-2">
                      {[
                        { label: 'Wedding', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop' },
                        { label: 'Couple', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=150&h=150&fit=crop' },
                        { label: 'Rings', url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=150&h=150&fit=crop' },
                        { label: 'Party', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=150&h=150&fit=crop' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSettingsAvatar(preset.url)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition ${settingsAvatar === preset.url ? 'ring-2 ring-purple-600 scale-105' : 'opacity-70 hover:opacity-100'}`}
                          style={{ borderColor: settingsAvatar === preset.url ? theme.colors.primary[500] : 'transparent' }}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: theme.semantic.text.secondary }}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="e.g. Tiwari Family Wedding"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary 
                  }}
                  required
                />
              </div>

              {/* Group Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: theme.semantic.text.secondary }}>
                  Description
                </label>
                <textarea
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  placeholder="Add a short description or notes for the family..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: theme.semantic.border.light,
                    color: theme.semantic.text.primary 
                  }}
                />
              </div>

              {/* Shared Planning Resources Permissions */}
              <div className="pt-2 border-t" style={{ borderColor: theme.semantic.border.light }}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: theme.semantic.text.secondary }}>
                  Shared Planning Access
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'checklist', label: 'Wedding Checklist & Tasks', desc: 'Allow members to view wedding checklist' },
                    { key: 'timeline', label: 'Wedding Timeline & Schedule', desc: 'Allow members to follow event timelines' },
                    { key: 'inspiration', label: 'Inspiration Board & Gallery', desc: 'Allow members to see saved decor and styles' },
                    { key: 'guestList', label: 'Guest List Access', desc: 'Allow members to view RSVPs and guest counts' },
                    { key: 'budget', label: 'Budget Planner Access', desc: 'Allow members to view budget breakdowns' }
                  ].map((resource) => (
                    <label 
                      key={resource.key}
                      className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer hover:bg-stone-50 transition"
                      style={{ borderColor: theme.semantic.border.light }}
                    >
                      <div>
                        <p className="text-xs font-bold" style={{ color: theme.semantic.text.primary }}>
                          {resource.label}
                        </p>
                        <p className="text-[10px]" style={{ color: theme.semantic.text.secondary }}>
                          {resource.desc}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsShared[resource.key])}
                        onChange={(e) => setSettingsShared(prev => ({ ...prev, [resource.key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-3 border-t" style={{ borderColor: theme.semantic.border.light }}>
                <button
                  type="button"
                  onClick={() => setShowGroupSettings(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-stone-50"
                  style={{ borderColor: theme.semantic.border.light, color: theme.semantic.text.primary }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition active:scale-95"
                  style={{ backgroundColor: theme.colors.primary[500] }}
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#fee2e2' }}
              >
                <Icon name="warning" size="xl" style={{ color: '#dc2626' }} />
              </div>
              
              <h3 className="text-lg font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
                Delete Group?
              </h3>
              <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
                This action cannot be undone. All messages and group data will be permanently deleted.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: theme.semantic.background.accent,
                    color: theme.semantic.text.primary
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: theme.semantic.background.primary }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                Add Members
              </h3>
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                }}
                className="p-2 rounded-full"
                style={{ backgroundColor: theme.semantic.background.accent }}
              >
                <Icon name="close" size="sm" style={{ color: theme.semantic.text.primary }} />
              </button>
            </div>
            
            {availableContacts.length === 0 ? (
              <div className="text-center py-8">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: theme.semantic.background.accent }}
                >
                  <Icon name="users" size="xl" style={{ color: theme.semantic.text.secondary }} />
                </div>
                <p className="text-sm" style={{ color: theme.semantic.text.secondary }}>
                  All contacts are already in this group
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {availableContacts.map((contact) => {
                    const isSelected = selectedNewMembers.includes(contact.id);
                    
                    return (
                      <div
                        key={contact.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedNewMembers(prev => prev.filter(id => id !== contact.id));
                          } else {
                            setSelectedNewMembers(prev => [...prev, contact.id]);
                          }
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected ? 'ring-2' : ''
                        }`}
                        style={{
                          backgroundColor: isSelected 
                            ? theme.colors.primary[50] 
                            : theme.semantic.card.background,
                          borderColor: isSelected 
                            ? theme.colors.primary[200] 
                            : theme.semantic.card.border,
                          borderWidth: '1px',
                          '--tw-ring-color': theme.colors.primary[500]
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                                {contact.name}
                              </p>
                              <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                                {contact.relation}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {isSelected ? (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: theme.colors.primary[500] }}
                              >
                                <Icon name="check" size="xs" style={{ color: 'white' }} />
                              </div>
                            ) : (
                              <div 
                                className="w-6 h-6 rounded-full border-2"
                                style={{ borderColor: theme.semantic.border.primary }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAddMembers(false);
                      setSelectedNewMembers([]);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                    style={{
                      backgroundColor: theme.semantic.background.accent,
                      color: theme.semantic.text.primary
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMembers}
                    disabled={selectedNewMembers.length === 0}
                    className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                    style={{
                      backgroundColor: selectedNewMembers.length === 0 
                        ? theme.semantic.text.tertiary 
                        : theme.colors.primary[500],
                      color: 'white'
                    }}
                  >
                    Add ({selectedNewMembers.length})
                  </button>
                </div>
              </>
            )}

            {/* Quick Invite Any Contact via WhatsApp */}
            <div className="pt-4 border-t mt-4" style={{ borderColor: theme.semantic.border.light }}>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: theme.semantic.text.secondary }}>
                Invite by Phone & Share on WhatsApp
              </h4>
              <form onSubmit={handleQuickInviteMember} className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Rahul, Khushu)"
                  value={quickInviteName}
                  onChange={(e) => setQuickInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{ borderColor: theme.semantic.border.light }}
                />
                <input
                  type="tel"
                  placeholder="10-digit Phone Number (e.g. 9876543210)"
                  value={quickInvitePhone}
                  onChange={(e) => setQuickInvitePhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border focus:outline-none"
                  style={{ borderColor: theme.semantic.border.light }}
                />
                <button
                  type="submit"
                  disabled={isInvitingQuick}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-sm transition active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  {isInvitingQuick ? (
                    <span>Generating WhatsApp Invite...</span>
                  ) : (
                    <>
                      <span>📱</span>
                      <span>Send WhatsApp Invitation</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;