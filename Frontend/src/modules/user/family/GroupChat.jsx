import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { familyContacts, groupMessages } from '../../../data/contacts';

const GroupChat = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams();
  const messagesEndRef = useRef(null);
  
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

  // Check if current user is admin
  const isCurrentUserAdmin = () => {
    const currentUserId = 1; // Current user ID
    const currentUserContact = familyContacts.find(c => c.id === currentUserId);
    return currentUserContact?.role === 'admin' || group?.createdBy === currentUserId;
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

  // Initialize group and messages
  useEffect(() => {
    if (location.state?.group) {
      setGroup(location.state.group);
      
      // If it's a new group, add welcome message
      if (location.state.isNewGroup) {
        const welcomeMessage = {
          id: Date.now(),
          senderId: 'system',
          senderName: 'System',
          senderAvatar: '',
          message: `🎉 Welcome to ${location.state.group.name}! Start planning your dream wedding together.`,
          timestamp: new Date().toISOString(),
          type: 'system'
        };
        setMessages([welcomeMessage]);
      } else {
        // Load existing messages
        setMessages(groupMessages[groupId] || []);
      }
    } else {
      // Load group from localStorage or API
      const savedGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
      const foundGroup = savedGroups.find(g => g.id === parseInt(groupId));
      
      if (foundGroup) {
        setGroup(foundGroup);
        setMessages(groupMessages[groupId] || []);
      } else {
        navigate('/user/family/contacts');
      }
    }

    // Simulate online members
    const memberIds = location.state?.group?.members || [];
    const online = memberIds.filter(() => Math.random() > 0.3);
    setOnlineMembers(online);

    // Set available contacts for adding members (exclude current members)
    const currentMembers = location.state?.group?.members || [];
    const available = familyContacts.filter(contact => !currentMembers.includes(contact.id));
    setAvailableContacts(available);
  }, [groupId, location.state, navigate]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      senderId: 1, // Current user
      senderName: 'Priya Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setShowSuggestions(false); // Hide suggestions after first message

    // Simulate typing indicator and response
    setIsTyping(true);
    setTimeout(() => {
      const responses = [
        "That sounds great! 👍",
        "I agree with that plan!",
        "Perfect timing! ✨",
        "Let me check and get back to you.",
        "Wonderful idea! 💕",
        "Count me in! 🎉",
        "I'm so excited for this! 😍",
        "Great suggestion! Let's do it.",
        "That works perfectly for me!",
        "Love this idea! 💖"
      ];
      
      const randomMember = group?.members?.find(id => id !== 1);
      const memberData = familyContacts.find(c => c.id === randomMember);
      
      if (memberData && Math.random() > 0.3) { // 70% chance of response
        const responseMessage = {
          id: Date.now() + 1,
          senderId: memberData.id,
          senderName: memberData.name,
          senderAvatar: memberData.avatar,
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, responseMessage]);
        
        // Sometimes add a second response from another member
        if (Math.random() > 0.7 && group?.members?.length > 2) {
          setTimeout(() => {
            const anotherMember = group.members.find(id => id !== 1 && id !== memberData.id);
            const anotherMemberData = familyContacts.find(c => c.id === anotherMember);
            
            if (anotherMemberData) {
              const secondResponse = {
                id: Date.now() + 2,
                senderId: anotherMemberData.id,
                senderName: anotherMemberData.name,
                senderAvatar: anotherMemberData.avatar,
                message: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date().toISOString(),
                type: 'text'
              };
              
              setMessages(prev => [...prev, secondResponse]);
            }
          }, 1000 + Math.random() * 2000);
        }
      }
      setIsTyping(false);
    }, 1500 + Math.random() * 2000);
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

  // Delete group function
  const handleDeleteGroup = () => {
    const savedGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
    const updatedGroups = savedGroups.filter(g => g.id !== parseInt(groupId));
    localStorage.setItem('familyGroups', JSON.stringify(updatedGroups));
    
    // Show success message and navigate back
    setShowDeleteConfirm(false);
    navigate('/user/family/groups', { 
      state: { message: 'Group deleted successfully' }
    });
  };

  // Add members function
  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) return;

    const updatedGroup = {
      ...group,
      members: [...group.members, ...selectedNewMembers]
    };

    // Update localStorage
    const savedGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
    const updatedGroups = savedGroups.map(g => 
      g.id === parseInt(groupId) ? updatedGroup : g
    );
    localStorage.setItem('familyGroups', JSON.stringify(updatedGroups));

    // Update local state
    setGroup(updatedGroup);
    
    // Add system message about new members
    const newMemberNames = selectedNewMembers
      .map(id => familyContacts.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    
    const systemMessage = {
      id: Date.now(),
      senderId: 'system',
      senderName: 'System',
      senderAvatar: '',
      message: `${newMemberNames} ${selectedNewMembers.length === 1 ? 'has' : 'have'} been added to the group! 🎉`,
      timestamp: new Date().toISOString(),
      type: 'system'
    };
    
    setMessages(prev => [...prev, systemMessage]);

    // Update available contacts
    const newAvailable = availableContacts.filter(contact => !selectedNewMembers.includes(contact.id));
    setAvailableContacts(newAvailable);
    
    // Reset and close modal
    setSelectedNewMembers([]);
    setShowAddMembers(false);
  };

  // Remove member function (admin only)
  const handleRemoveMember = (memberId) => {
    if (!isCurrentUserAdmin() || memberId === 1) return; // Can't remove self or if not admin

    const updatedGroup = {
      ...group,
      members: group.members.filter(id => id !== memberId)
    };

    // Update localStorage
    const savedGroups = JSON.parse(localStorage.getItem('familyGroups') || '[]');
    const updatedGroups = savedGroups.map(g => 
      g.id === parseInt(groupId) ? updatedGroup : g
    );
    localStorage.setItem('familyGroups', JSON.stringify(updatedGroups));

    // Update local state
    setGroup(updatedGroup);
    
    // Add system message about member removal
    const removedMember = familyContacts.find(c => c.id === memberId);
    if (removedMember) {
      const systemMessage = {
        id: Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: '',
        message: `${removedMember.name} has been removed from the group.`,
        timestamp: new Date().toISOString(),
        type: 'system'
      };
      
      setMessages(prev => [...prev, systemMessage]);
    }

    // Update available contacts
    const removedContact = familyContacts.find(c => c.id === memberId);
    if (removedContact) {
      setAvailableContacts(prev => [...prev, removedContact]);
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
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
      className={`min-h-screen flex flex-col ${isKeyboardOpen ? 'keyboard-open' : ''}`} 
      style={{ 
        backgroundColor: theme.semantic.background.primary,
        height: isKeyboardOpen ? '100vh' : 'auto',
        maxHeight: isKeyboardOpen ? '100vh' : 'none'
      }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4 border-b backdrop-blur-sm flex-shrink-0"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderBottomColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
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
              className="p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="video" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </button>
            <button
              className="p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="more" size="sm" style={{ color: theme.semantic.text.secondary }} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className={`flex-1 overflow-y-auto px-4 py-4 ${isKeyboardOpen ? 'pb-2' : 'pb-6'}`}
        style={{
          maxHeight: isKeyboardOpen 
            ? 'calc(100vh - 140px)' // Adjust for header + input when keyboard is open
            : 'calc(100vh - 200px)'  // Normal height
        }}
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
              {dayMessages.map((message) => {
                const isCurrentUser = message.senderId === 1;
                const isSystem = message.type === 'system';

                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center">
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
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {!isCurrentUser && (
                        <div className="flex items-center mb-1">
                          <img
                            src={message.senderAvatar}
                            alt={message.senderName}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                            {message.senderName}
                          </span>
                        </div>
                      )}
                      
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
                          {formatTime(message.timestamp)}
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
          borderTopColor: theme.semantic.border.light,
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
              <h4 className="font-semibold mb-3" style={{ color: theme.semantic.text.primary }}>
                Members ({group.members?.length || 0})
              </h4>
              <div className="space-y-3">
                {group.members?.map(memberId => {
                  const member = familyContacts.find(c => c.id === memberId);
                  if (!member) return null;
                  
                  return (
                    <div key={memberId} className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {member.isOnline && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: theme.colors.accent[500] }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: theme.semantic.text.primary }}>
                          {member.name}
                        </p>
                        <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                          {member.relation}
                        </p>
                      </div>
                      {member.role === 'admin' && (
                        <div 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: theme.colors.accent[100],
                            color: theme.colors.accent[700]
                          }}
                        >
                          Admin
                        </div>
                      )}
                      {isCurrentUserAdmin() && member.id !== 1 && member.role !== 'admin' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 rounded-full hover:bg-red-100 transition-colors"
                          title="Remove member"
                        >
                          <Icon name="close" size="xs" style={{ color: '#dc2626' }} />
                        </button>
                      )}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;