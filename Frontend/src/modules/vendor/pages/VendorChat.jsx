import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';

const VendorChat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);
  const token = localStorage.getItem('vendorToken');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await vendorApi.getConversations(token);
      if (res.success) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const res = await vendorApi.getMessages(conversationId, token);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      const interval = setInterval(() => fetchMessages(activeChat._id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat, fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const res = await vendorApi.sendMessage({
        conversationId: activeChat._id,
        text: messageText
      }, token);

      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        // Update local last message in conversation sidebar list
        setConversations(prevList => 
          prevList.map(c => 
            c._id === activeChat._id 
              ? { ...c, lastMessage: { text: messageText }, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-[#7C3AED] border-t-transparent rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Chats...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-3 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .chat-font { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes chatPop { from{opacity:0;transform:scale(0.96) translateY(5px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .chat-pop { animation: chatPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Sidebar - Contacts List */}
      <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col gap-3 chat-font slide-up`}>
         <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-[12px] font-black text-slate-900 tracking-wider uppercase">Conversations</h2>
              <span className="text-[8.5px] font-black text-[#7C3AED] bg-violet-50 px-2 py-0.5 rounded-full">
                {conversations.length} total
              </span>
            </div>
            <div className="mt-3 relative">
               <input 
                 type="text" 
                 placeholder="Search chats..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-9 rounded-xl bg-slate-50 border-0 px-3 pl-9 text-[10.5px] font-semibold focus:ring-1 ring-violet-200 transition-all text-slate-700 placeholder-slate-400"
               />
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="search" size="xs" />
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pb-4">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(chat => (
                <div 
                  key={chat._id}
                  onClick={() => setActiveChat(chat)}
                  className={`rounded-2xl p-3.5 cursor-pointer transition-all duration-300 border flex items-center gap-3 active:scale-[0.98] ${
                    activeChat?._id === chat._id 
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-md shadow-violet-100 translate-x-0.5' 
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50/60 hover:translate-x-0.5'
                  }`}
                >
                  <div className="h-11 w-11 rounded-full flex items-center justify-center text-[12px] font-black relative shrink-0 overflow-hidden shadow-xs border border-white">
                     {chat.otherParticipant?.image ? (
                        <img src={chat.otherParticipant.image} alt="" className="h-full w-full object-cover" />
                     ) : (
                        chat.otherParticipant?.name?.charAt(0) || '?'
                     )}
                     <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                        <h4 className={`text-[11.5px] font-extrabold truncate leading-tight ${activeChat?._id === chat._id ? 'text-white' : 'text-slate-900'}`}>
                          {chat.otherParticipant?.name}
                        </h4>
                        <span className={`text-[8px] font-extrabold shrink-0 uppercase tracking-tight ${activeChat?._id === chat._id ? 'text-white/70' : 'text-slate-400'}`}>
                           {chat.updatedAt && new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                     <p className={`text-[9.5px] font-medium truncate mt-1 leading-none ${activeChat?._id === chat._id ? 'text-white/80' : 'text-slate-400'}`}>
                       {chat.lastMessage?.text || 'No messages'}
                     </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No conversations found</p>
              </div>
            )}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${activeChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col gap-3 min-w-0 chat-font slide-up`}>
         {activeChat ? (
            <>
               {/* Chat Header */}
               <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setActiveChat(null)} className="lg:hidden h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                        <Icon name="chevronLeft" size="xs" />
                     </button>
                     <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[#7C3AED] font-black text-[12px] border border-slate-100 overflow-hidden shadow-xs">
                        {activeChat.otherParticipant?.image ? (
                           <img src={activeChat.otherParticipant.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                           activeChat.otherParticipant?.name?.charAt(0) || '?'
                        )}
                     </div>
                     <div>
                        <h3 className="text-[12px] font-black text-slate-900 leading-none truncate max-w-[120px] sm:max-w-none">
                          {activeChat.otherParticipant?.name}
                        </h3>
                        <p className="text-[8.5px] font-extrabold text-emerald-500 mt-1 uppercase tracking-widest">Online</p>
                     </div>
                  </div>
                  <div className="flex gap-1.5">
                     <button className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-[#7C3AED] flex items-center justify-center text-slate-400 transition-all active:scale-95">
                       <Icon name="phone" size="xs" />
                     </button>
                     <button className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-[#7C3AED] flex items-center justify-center text-slate-400 transition-all active:scale-95">
                       <Icon name="more" size="xs" />
                     </button>
                  </div>
               </div>

               {/* Messages Feed */}
               <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs overflow-y-auto no-scrollbar space-y-4">
                  {messages.map(msg => {
                     const isMe = msg.senderModel === 'Vendor';
                     return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} chat-pop`}>
                           <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-[11px] font-semibold leading-relaxed shadow-xs ${isMe 
                                 ? 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white rounded-tr-none' 
                                 : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/40'}`}
                              >
                                 {msg.text}
                              </div>
                              <p className="text-[7.5px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider px-1">
                                 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                     );
                  })}
                  <div ref={chatEndRef} />
               </div>

               {/* Message Input Form */}
               <form onSubmit={handleSendMessage} className="bg-white rounded-2xl p-1.5 border border-slate-100 shadow-md flex items-center gap-2">
                  <button type="button" className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all active:scale-95 shrink-0">
                     <Icon name="plus" size="xs" />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-0 px-2 text-[11px] font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="h-8.5 w-8.5 rounded-xl flex items-center justify-center text-white shadow-md active:scale-90 transition-all shrink-0 hover:brightness-105"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                  >
                     <svg className="w-3.5 h-3.5 rotate-45 -translate-x-0.5 translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                     </svg>
                  </button>
               </form>
            </>
         ) : (
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center p-8 shadow-xs">
               <div className="h-14 w-14 rounded-2xl bg-violet-50 text-[#7C3AED] flex items-center justify-center mb-4">
                  <Icon name="chat" size="lg" />
               </div>
               <h3 className="text-[11px] font-black text-slate-400 tracking-wider uppercase">Select a chat to start messaging</h3>
            </div>
         )}
      </div>
    </div>
  );
};

export default VendorChat;
