import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const AIAssistant = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Initial welcome message and suggestions
  useEffect(() => {
    const welcomeMessage = {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI Wedding Assistant 💫 I'm here to help you plan your perfect wedding. What would you like to know?",
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setSuggestions([
      "Help me plan my wedding budget",
      "Suggest vendors for my wedding",
      "What should I do 3 months before wedding?",
      "Compare photographers vs videographers",
      "Create a wedding timeline",
      "Help me choose a venue",
      "Guest list management tips",
      "Bridal outfit suggestions"
    ]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mock AI responses based on user input
  const getAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Budget related responses
    if (message.includes('budget') || message.includes('cost') || message.includes('price')) {
      return {
        content: "💰 **Wedding Budget Planning**\n\nHere's a typical Indian wedding budget breakdown:\n\n• **Venue & Catering**: 40-50% (₹4-5L for ₹10L budget)\n• **Photography**: 10-15% (₹1-1.5L)\n• **Outfits & Jewelry**: 15-20% (₹1.5-2L)\n• **Decoration**: 8-12% (₹80K-1.2L)\n• **Makeup & Beauty**: 5-8% (₹50K-80K)\n• **Miscellaneous**: 10-15% (₹1-1.5L)\n\nWould you like me to create a personalized budget plan for you?",
        suggestions: ["Create my budget plan", "Show me venue options", "Compare photographer prices", "Budget calculator"]
      };
    }
    
    // Vendor suggestions
    if (message.includes('vendor') || message.includes('photographer') || message.includes('makeup') || message.includes('venue')) {
      return {
        content: "🎯 **Vendor Recommendations**\n\nBased on your location and preferences, here are some top-rated vendors:\n\n**Photographers:**\n• Premium Wedding Studios (4.9★) - ₹80K-1.2L\n• Royal Captures (4.8★) - ₹60K-90K\n\n**Makeup Artists:**\n• Bridal Glow Studio (4.9★) - ₹25K-40K\n• Elegant Beauty (4.7★) - ₹18K-30K\n\n**Venues:**\n• Grand Palace Hotel (4.8★) - ₹2L-3L\n• Garden Paradise (4.6★) - ₹1.5L-2.5L\n\nWould you like detailed information about any of these?",
        suggestions: ["Show photographer portfolios", "Compare venue packages", "Book a consultation", "View all vendors"]
      };
    }
    
    // Timeline related
    if (message.includes('timeline') || message.includes('plan') || message.includes('month') || message.includes('checklist')) {
      return {
        content: "📅 **Wedding Planning Timeline**\n\n**6 Months Before:**\n• Book venue and major vendors\n• Send save-the-dates\n• Start shopping for outfits\n\n**3 Months Before:**\n• Finalize guest list\n• Book makeup artist and photographer\n• Order invitations\n\n**1 Month Before:**\n• Final venue walkthrough\n• Confirm all vendor details\n• Pack for honeymoon\n\n**1 Week Before:**\n• Rehearsal dinner\n• Final headcount to caterer\n• Relax and enjoy!\n\nWould you like a detailed checklist for any specific timeframe?",
        suggestions: ["6-month checklist", "1-month checklist", "Day-of timeline", "Download timeline"]
      };
    }
    
    // Comparison requests
    if (message.includes('compare') || message.includes('vs') || message.includes('difference')) {
      return {
        content: "⚖️ **Vendor Comparison**\n\nI can help you compare vendors based on:\n\n• **Price Range**: Budget-friendly vs Premium\n• **Style**: Traditional vs Modern vs Fusion\n• **Experience**: Years in business & portfolio\n• **Reviews**: Customer ratings & feedback\n• **Services**: What's included in packages\n• **Availability**: Your wedding date availability\n\nWhich vendors would you like me to compare for you?",
        suggestions: ["Compare photographers", "Compare venues", "Compare makeup artists", "Price comparison"]
      };
    }
    
    // Venue related
    if (message.includes('venue') || message.includes('hall') || message.includes('location')) {
      return {
        content: "🏛️ **Venue Selection Guide**\n\n**Indoor Venues:**\n• Banquet halls - Climate controlled, elegant\n• Hotels - Full-service, convenient\n• Heritage properties - Unique, photogenic\n\n**Outdoor Venues:**\n• Garden venues - Natural beauty, spacious\n• Beach resorts - Scenic, romantic\n• Farmhouses - Rustic, customizable\n\n**Key Factors to Consider:**\n• Guest capacity (50-500+ people)\n• Catering policies (in-house vs external)\n• Decoration restrictions\n• Parking availability\n• Backup plans for weather\n\nWhat's your preferred venue type and guest count?",
        suggestions: ["Show indoor venues", "Show outdoor venues", "Calculate venue capacity", "Venue checklist"]
      };
    }
    
    // Guest list related
    if (message.includes('guest') || message.includes('invitation') || message.includes('rsvp')) {
      return {
        content: "👥 **Guest List Management**\n\n**Planning Tips:**\n• Start with immediate family and close friends\n• Consider venue capacity constraints\n• Plan for 10-15% no-shows typically\n• Send save-the-dates 6 months early\n• Send invitations 6-8 weeks before\n\n**Guest Categories:**\n• Family (immediate & extended)\n• Friends (close & acquaintances)\n• Colleagues & professional contacts\n• Plus-ones and children\n\n**RSVP Management:**\n• Set clear RSVP deadline\n• Follow up with non-responders\n• Track dietary restrictions\n• Plan seating arrangements\n\nHow many guests are you planning to invite?",
        suggestions: ["Guest list template", "RSVP tracking", "Seating planner", "Invitation ideas"]
      };
    }
    
    // Photography related
    if (message.includes('photo') || message.includes('camera') || message.includes('album')) {
      return {
        content: "📸 **Wedding Photography Guide**\n\n**Photography Styles:**\n• Traditional - Posed, formal shots\n• Candid - Natural, unposed moments\n• Artistic - Creative, dramatic angles\n• Documentary - Storytelling approach\n\n**Package Inclusions:**\n• Pre-wedding shoot\n• Wedding day coverage (8-12 hours)\n• Edited photos (300-800 images)\n• Wedding album (50-100 pages)\n• Online gallery access\n\n**Questions to Ask:**\n• How many photographers included?\n• Turnaround time for photos?\n• Raw files included?\n• Backup equipment available?\n• Previous work samples?\n\nWhat photography style interests you most?",
        suggestions: ["View photographer portfolios", "Pre-wedding shoot ideas", "Album designs", "Photography packages"]
      };
    }
    
    // Outfit/fashion related
    if (message.includes('dress') || message.includes('outfit') || message.includes('lehenga') || message.includes('saree')) {
      return {
        content: "👗 **Bridal Outfit Guide**\n\n**Traditional Options:**\n• Lehenga - Classic, versatile, comfortable\n• Saree - Elegant, timeless, regional styles\n• Sharara/Gharara - Flowy, comfortable\n• Anarkali - Graceful, flattering\n\n**Color Trends:**\n• Red - Traditional, auspicious\n• Pink - Romantic, modern\n• Gold - Luxurious, festive\n• Pastels - Soft, contemporary\n\n**Shopping Timeline:**\n• Start looking 4-6 months before\n• Order 3-4 months before\n• Final fittings 2-4 weeks before\n• Backup outfit ready\n\n**Budget Allocation:**\n• Bridal outfit: ₹50K-2L+\n• Jewelry: ₹30K-1L+\n• Accessories: ₹10K-30K\n\nWhat's your preferred style and color palette?",
        suggestions: ["Lehenga designs", "Saree styles", "Color combinations", "Shopping guide"]
      };
    }
    
    // Default responses for general queries
    const defaultResponses = [
      {
        content: "✨ I'd be happy to help you with that! As your AI wedding assistant, I can provide guidance on:\n\n• **Budget Planning** - Create realistic budgets\n• **Vendor Selection** - Find the perfect team\n• **Timeline Management** - Stay organized\n• **Style Consultation** - Match your vision\n• **Problem Solving** - Handle wedding stress\n• **Guest Management** - Handle invitations & RSVPs\n• **Photography Planning** - Capture perfect moments\n• **Outfit Selection** - Look stunning on your day\n\nWhat specific aspect of wedding planning would you like to explore?",
        suggestions: ["Plan my budget", "Find vendors", "Create timeline", "Style advice", "Guest list help", "Photography tips"]
      },
      {
        content: "🎊 Every wedding is unique! I can help you create a personalized plan based on:\n\n• Your budget range\n• Wedding style preferences\n• Guest count\n• Season and location\n• Cultural traditions\n• Personal priorities\n\nTell me more about your dream wedding vision!",
        suggestions: ["Traditional Indian wedding", "Modern fusion style", "Intimate celebration", "Grand celebration", "Destination wedding", "Budget wedding"]
      },
      {
        content: "💡 **Smart Wedding Tips**\n\n• Book popular vendors 6+ months in advance\n• Always have a backup plan for outdoor events\n• Create a shared planning document with your partner\n• Set aside 10-15% extra budget for unexpected costs\n• Take breaks from planning to avoid burnout\n• Start with the big decisions (venue, date, budget)\n• Keep a wedding planning binder or app\n• Delegate tasks to family and friends\n\nWhat area of wedding planning feels most overwhelming right now?",
        suggestions: ["Vendor coordination", "Budget management", "Timeline stress", "Decision fatigue", "Family expectations", "Stress management"]
      }
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage);
      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setSuggestions(aiResponse.suggestions || []);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5s
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.semantic.background.primary }}>
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
            <div className="flex items-center">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: theme.colors.accent[500] }}
              >
                <Icon name="sparkles" size="sm" style={{ color: 'white' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: theme.semantic.text.primary }}>
                  AI Wedding Assistant
                </h1>
                <p className="text-xs" style={{ color: theme.semantic.text.secondary }}>
                  {isTyping ? 'Typing...' : 'Online • Ready to help'}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setMessages([]);
              setSuggestions([]);
              // Re-add welcome message
              setTimeout(() => {
                const welcomeMessage = {
                  id: 1,
                  type: 'ai',
                  content: "Hi! I'm your AI Wedding Assistant 💫 I'm here to help you plan your perfect wedding. What would you like to know?",
                  timestamp: new Date()
                };
                setMessages([welcomeMessage]);
                setSuggestions([
                  "Help me plan my wedding budget",
                  "Suggest vendors for my wedding",
                  "What should I do 3 months before wedding?",
                  "Compare photographers vs videographers",
                  "Create a wedding timeline",
                  "Help me choose a venue",
                  "Guest list management tips",
                  "Bridal outfit suggestions"
                ]);
              }, 100);
            }}
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.semantic.background.accent }}
            title="Clear Chat"
          >
            <Icon name="refresh" size="sm" style={{ color: theme.semantic.text.secondary }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {message.type === 'ai' && (
                <div className="flex items-center mb-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                    style={{ backgroundColor: theme.colors.accent[500] }}
                  >
                    <Icon name="sparkles" size="xs" style={{ color: 'white' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                    AI Assistant
                  </span>
                </div>
              )}
              
              <div
                className={`p-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'rounded-br-md' 
                    : 'rounded-bl-md'
                }`}
                style={{
                  backgroundColor: message.type === 'user' 
                    ? theme.colors.primary[500] 
                    : theme.semantic.card.background,
                  color: message.type === 'user' 
                    ? 'white' 
                    : theme.semantic.text.primary,
                  borderColor: message.type === 'ai' ? theme.semantic.card.border : 'transparent',
                  borderWidth: message.type === 'ai' ? '1px' : '0'
                }}
              >
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
              </div>
              
              <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                <span style={{ color: theme.semantic.text.tertiary }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                  style={{ backgroundColor: theme.colors.accent[500] }}
                >
                  <Icon name="sparkles" size="xs" style={{ color: 'white' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: theme.semantic.text.secondary }}>
                  AI Assistant
                </span>
              </div>
              
              <div
                className="p-3 rounded-2xl rounded-bl-md"
                style={{
                  backgroundColor: theme.semantic.card.background,
                  borderColor: theme.semantic.card.border,
                  borderWidth: '1px'
                }}
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.accent[400], animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.accent[400], animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.colors.accent[400], animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-2 rounded-full text-xs font-medium transition-colors"
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
        className="px-4 py-4 border-t backdrop-blur-sm flex-shrink-0"
        style={{ 
          backgroundColor: `${theme.semantic.background.primary}95`,
          borderTopColor: theme.semantic.border.light 
        }}
      >
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about wedding planning..."
              className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none focus:ring-2 text-sm border"
              style={{
                backgroundColor: theme.semantic.card.background,
                borderColor: theme.semantic.card.border,
                color: theme.semantic.text.primary,
                '--tw-ring-color': theme.colors.primary[500],
                minHeight: '52px',
                maxHeight: '120px',
                lineHeight: '1.5'
              }}
              rows={2}
              maxLength={500}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.max(Math.min(e.target.scrollHeight, 120), 52) + 'px';
              }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`p-3 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
              inputMessage.trim() && !isTyping 
                ? 'scale-100 opacity-100 hover:scale-105' 
                : 'scale-95 opacity-60'
            }`}
            style={{
              backgroundColor: theme.colors.primary[500],
              color: 'white',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Icon name="send" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;