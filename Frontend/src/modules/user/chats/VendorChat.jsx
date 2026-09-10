import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { useLenisContext } from '../../../providers/LenisProvider';
import Icon from '../../../components/ui/Icon';

const VendorChat = () => {
  const { vendorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Get Lenis instance to disable it for this page
  const lenis = useLenisContext();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVendorOnline, setIsVendorOnline] = useState(true);

  // Get vendor info from navigation state or default
  const vendorInfo = location.state || {
    vendorName: 'Vendor',
    vendorCategory: 'Service Provider',
    vendorImage: 'https://via.placeholder.com/48x48?text=Vendor'
  };

  useEffect(() => {
    // Disable Lenis smooth scrolling for chat page
    if (lenis) {
      lenis.stop();
    }

    // Hide main header when chat component mounts
    const mainHeader = document.querySelector('header');
    if (mainHeader) {
      mainHeader.style.display = 'none';
    }

    // Re-enable Lenis and show header when component unmounts
    return () => {
      if (lenis) {
        lenis.start();
      }
      if (mainHeader) {
        mainHeader.style.display = '';
      }
    };
  }, [lenis]);

  useEffect(() => {
    // Initialize chat with some sample messages
    const initialMessages = [
      {
        id: 1,
        text: `Hi! Thank you for adding me to your cart. I'm excited to be part of your special day!`,
        sender: 'vendor',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        isRead: true
      },
      {
        id: 2,
        text: `I'd love to discuss your requirements and how I can make your wedding perfect. When is your wedding date?`,
        sender: 'vendor',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        isRead: true
      },
      {
        id: 3,
        text: `Hi! I'm interested in your services for my wedding. Can you share more details about your packages?`,
        sender: 'user',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        isRead: true
      },
      {
        id: 4,
        text: `Absolutely! I have several packages available. Let me know your budget and preferences, and I'll recommend the best option for you.`,
        sender: 'vendor',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        isRead: true
      },
      {
        id: 5,
        text: `My wedding is on March 15th, 2024. I'm looking for something elegant but not too expensive.`,
        sender: 'user',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        isRead: true
      }
    ];
    
    setMessages(initialMessages);
    
    // Simulate vendor online status
    setIsVendorOnline(Math.random() > 0.3); // 70% chance of being online
  }, [vendorId]); // Only depend on vendorId, not on changing objects

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Auto-focus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Simulate vendor typing and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const vendorResponse = {
        id: Date.now() + 1,
        text: generateVendorResponse(),
        sender: 'vendor',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      setMessages(prev => [...prev, vendorResponse]);
    }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds
  };

  const generateVendorResponse = () => {
    const responses = [
      "Thank you for your message! I'll get back to you with all the details shortly.",
      "That sounds wonderful! Let me prepare a customized quote for you.",
      "I'd be happy to help with that. Let me check my availability for your date.",
      "Great question! I have experience with similar requirements and would love to help.",
      "I understand your needs perfectly. Let me share some options that would work well for you.",
      "Perfect! I can definitely accommodate that for your special day. Let me send you some samples.",
      "I'm excited to work with you! Your wedding sounds like it's going to be beautiful.",
      "Let me put together a detailed proposal for you. I'll send it over within the next hour."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const handleWhatsAppRedirect = () => {
    const message = encodeURIComponent(
      `Hi! I found your ${vendorInfo.vendorCategory.toLowerCase()} service "${vendorInfo.vendorName}" on Utsavo and I'm interested in learning more about it for my wedding. Could you please share more details?`
    );
    const whatsappUrl = `https://wa.me/919876543210?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container" style={{ backgroundColor: '#e5ddd5' }}>
      {/* Fixed Chat Header */}
      <div className="chat-header" style={{ backgroundColor: theme.colors.primary[600] }}>
        <div className="chat-header-content">
          <button
            onClick={() => navigate('/user/chats')}
            className="chat-back-btn"
            style={{ backgroundColor: 'transparent' }}
          >
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: 'white' }} />
          </button>
          
          <div className="chat-vendor-avatar">
            <img
              src={vendorInfo.vendorImage}
              alt={vendorInfo.vendorName}
              className="chat-avatar-img"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/40x40?text=Vendor';
              }}
            />
            {isVendorOnline && (
              <div 
                className="chat-online-indicator"
                style={{ 
                  backgroundColor: '#10b981',
                  borderColor: theme.colors.primary[600]
                }}
              />
            )}
          </div>
          
          <div className="chat-vendor-info">
            <h1 
              className="chat-vendor-name"
              style={{ color: 'white' }}
            >
              {vendorInfo.vendorName}
            </h1>
            <p 
              className="chat-vendor-status"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {isVendorOnline ? 'Online' : 'Last seen recently'}
            </p>
          </div>

          <div className="chat-header-actions">
            <button
              onClick={handleWhatsAppRedirect}
              className="chat-action-btn"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Icon name="phone" size="sm" style={{ color: 'white' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-container">
        <div className="chat-messages-list">
          {messages.map((message, index) => {
            const showTimestamp = index === 0 || 
              (new Date(message.timestamp) - new Date(messages[index - 1].timestamp)) > 300000; // 5 minutes
            
            return (
              <div key={message.id} className="chat-message-wrapper">
                {showTimestamp && (
                  <div className="chat-timestamp-wrapper">
                    <span 
                      className="chat-timestamp"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#667781',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div className={`chat-message-row ${message.sender === 'user' ? 'chat-message-user' : 'chat-message-vendor'}`}>
                  <div
                    className={`chat-message-bubble ${message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-vendor'}`}
                    style={{
                      backgroundColor: message.sender === 'user' 
                        ? '#d9fdd3'
                        : 'white',
                      color: '#111b21',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <p className="chat-message-text">{message.text}</p>
                    <p 
                      className="chat-message-time"
                      style={{ color: '#667781' }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-message-wrapper">
              <div className="chat-message-row chat-message-vendor">
                <div
                  className="chat-message-bubble chat-bubble-vendor chat-typing-indicator"
                  style={{ 
                    backgroundColor: 'white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="chat-typing-dots">
                    <div 
                      className="chat-typing-dot"
                      style={{ backgroundColor: '#667781' }}
                    />
                    <div 
                      className="chat-typing-dot"
                      style={{ backgroundColor: '#667781' }}
                    />
                    <div 
                      className="chat-typing-dot"
                      style={{ backgroundColor: '#667781' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div 
        className="chat-input-container"
        style={{ 
          backgroundColor: '#f0f2f5',
          borderTopColor: 'transparent'
        }}
      >
        <div className="chat-input-wrapper">
          <div className="chat-input-field">
            <textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="chat-textarea"
              style={{
                backgroundColor: 'white',
                borderColor: 'transparent',
                color: '#111b21'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.primary[500];
                e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary[500]}25`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="chat-send-btn"
            style={{
              backgroundColor: newMessage.trim() 
                ? theme.colors.primary[500] 
                : '#d1d7db'
            }}
          >
            <Icon 
              name="send" 
              size="sm" 
              style={{ color: 'white' }} 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorChat;