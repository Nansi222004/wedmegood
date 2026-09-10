import { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/ui/Icon';

const VendorChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your UC Assistant. How can I help you today?", sender: 'bot', time: 'Just now' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle keyboard visibility for mobile to prevent "card pushing" issues
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 500) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        text: getBotResponse(input),
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  const getBotResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('payout')) return "Payouts are processed every Friday. Check the Earnings tab!";
    if (q.includes('lead')) return "New leads appear in your dashboard. Keep your profile updated!";
    return "I'm here to help! Try asking about payouts, leads, or profile settings.";
  };

  return (
    <div className={`fixed ${isKeyboardVisible ? 'bottom-0 inset-x-0' : 'bottom-20 lg:bottom-8 right-8 lg:right-12'} z-[9999] pointer-events-none transition-all duration-300`}>
      <style>{`
        @keyframes float-btn {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.03); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes sparkle-rotate {
          0% { transform: rotate(0deg) scale(1); opacity: 0.9; }
          50% { transform: rotate(12deg) scale(1.18); opacity: 1; filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7)); }
          100% { transform: rotate(0deg) scale(1); opacity: 0.9; }
        }
        .animate-float-btn {
          animation: float-btn 3s ease-in-out infinite;
        }
        .animate-sparkle-icon {
          animation: sparkle-rotate 2.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* Chat Window - Fixed keyboard pushing issue */}
      {isOpen && (
        <div className={`
          ${isKeyboardVisible ? 'w-full h-[60vh] rounded-t-[2.5rem] rounded-b-none' : 'w-[300px] sm:w-[360px] h-[400px] sm:h-[480px] rounded-[2.5rem] mb-4 shadow-2xl'}
          bg-white border border-slate-100 flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300 origin-bottom-right
        `}>
           {/* Header */}
           <div className="p-4 flex items-center justify-between text-white shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
              <div className="flex items-center gap-2.5">
                 <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Icon name="sparkles" size="xs" />
                 </div>
                 <div>
                    <h3 className="text-xs font-black tracking-tight leading-none uppercase">UC Assistant</h3>
                    <p className="text-[8px] font-black text-white/50 mt-1 uppercase tracking-widest">Always Online</p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all">
                 <Icon name="chevronDown" size="xs" />
              </button>
           </div>

           {/* Messages */}
           <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-slate-50/50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[88%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2 rounded-2xl text-[11px] font-bold shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-[#7c3aed] text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                         {msg.text}
                      </div>
                      <p className="text-[7px] font-black text-slate-300 mt-1 uppercase tracking-tighter px-1">{msg.time}</p>
                   </div>
                </div>
              ))}
              <div ref={chatEndRef} />
           </div>

           {/* Input */}
           <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-50 flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 h-10 bg-slate-50 border-0 rounded-xl px-4 text-[11px] font-bold focus:ring-0"
              />
              <button 
                type="submit"
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
              >
                 <Icon name="mail" size="xs" />
              </button>
           </form>
        </div>
      )}

      {/* Toggle Button - Hidden when keyboard is visible to save space */}
      {!isKeyboardVisible && (
        <div className={`flex justify-end pointer-events-auto ${!isOpen ? 'animate-float-btn' : ''}`}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)' }}
          >
            {isOpen ? (
              <Icon name="chevronDown" size="sm" />
            ) : (
              <div className="animate-sparkle-icon flex items-center justify-center">
                <Icon name="sparkles" size="sm" />
              </div>
            )}
            {!isOpen && (
              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorChatbot;
