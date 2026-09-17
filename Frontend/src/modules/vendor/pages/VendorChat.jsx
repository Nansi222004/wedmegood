import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../../../components/ui/Icon';
import { vendorApi } from '../vendorApi';
import { chatApi } from '../../../services/chatApi';
import { socketService } from '../../../services/socket';
import { useToast } from '../../../components/ui/Toast';

const VendorChat = () => {
  const location = useLocation();
  const { showToast, ToastComponent } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [isClientOnline, setIsClientOnline] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Quote Sharing Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [sharingQuoteId, setSharingQuoteId] = useState(null);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const token = localStorage.getItem('vendorToken');

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatApi.getVendorConversations();
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);

        // Check if navigated with a specific conversation, lead, or user
        const targetConvId = location.state?.conversationId;
        const targetLeadId = location.state?.leadId;
        const targetUserId = location.state?.userId;

        if (targetConvId) {
          const match = res.data.find(c => c._id?.toString() === targetConvId.toString());
          if (match) setActiveChat(match);
        } else if (targetLeadId) {
          const match = res.data.find(c => 
            (c.leadId?._id?.toString() === targetLeadId.toString()) ||
            (c.leadId?.toString() === targetLeadId.toString()) ||
            (targetUserId && (c.userId?._id?.toString() === targetUserId.toString() || c.userId?.toString() === targetUserId.toString()))
          );
          if (match) setActiveChat(match);
        } else if (targetUserId) {
          const match = res.data.find(c => 
            (c.userId?._id?.toString() === targetUserId.toString()) ||
            (c.userId?.toString() === targetUserId.toString())
          );
          if (match) setActiveChat(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  // 2. Fetch Messages for Active Chat
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const res = await chatApi.getMessages(conversationId, {}, true);
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, []);

  // Initial conversation load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Connect Socket on mount
  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }
    return () => {
      // Keep connection or disconnect on unmount
    };
  }, [token]);

  // Socket setup for active conversation
  useEffect(() => {
    if (!activeChat?._id || !token) return;

    fetchMessages(activeChat._id);
    socketService.joinConversation(activeChat._id);
    socketService.markAsRead(activeChat._id);
    chatApi.markAsRead(activeChat._id, true).catch(() => {});

    // Listen for incoming messages
    const unsubMsg = socketService.onMessage(({ message }) => {
      const msgConvId = message.conversationId?._id || message.conversationId;
      if (msgConvId?.toString() === activeChat._id?.toString()) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id || (message.clientMessageId && m.clientMessageId === message.clientMessageId))) {
            return prev.map(m => (m._id === message._id || (message.clientMessageId && m.clientMessageId === message.clientMessageId)) ? message : m);
          }
          return [...prev, message];
        });

        // Auto mark as read since vendor is viewing this chat
        socketService.markAsRead(activeChat._id);
      }

      // Update sidebar conversation preview
      setConversations(prevList =>
        prevList.map(c => {
          if (c._id?.toString() === msgConvId?.toString()) {
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt || new Date().toISOString(),
              vendorUnreadCount: (c._id?.toString() === activeChat._id?.toString() || message.senderModel === 'Vendor')
                ? 0
                : (c.vendorUnreadCount || 0) + 1
            };
          }
          return c;
        })
      );
    });

    // Listen for read receipts
    const unsubRead = socketService.onRead(({ conversationId }) => {
      if (conversationId?.toString() === activeChat._id?.toString()) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    });

    // Listen for typing events
    const unsubTypingStart = socketService.onTypingStart(({ conversationId, sender }) => {
      if (conversationId?.toString() === activeChat._id?.toString() && sender?.role === 'User') {
        setIsClientTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop(({ conversationId, sender }) => {
      if (conversationId?.toString() === activeChat._id?.toString() && sender?.role === 'User') {
        setIsClientTyping(false);
      }
    });

    // Listen for presence updates
    const unsubOnline = socketService.onUserOnline(({ id, role }) => {
      const otherUserId = activeChat.userId?._id || activeChat.userId;
      if (role === 'User' && id?.toString() === otherUserId?.toString()) {
        setIsClientOnline(true);
      }
    });

    const unsubOffline = socketService.onUserOffline(({ id, role }) => {
      const otherUserId = activeChat.userId?._id || activeChat.userId;
      if (role === 'User' && id?.toString() === otherUserId?.toString()) {
        setIsClientOnline(false);
      }
    });

    return () => {
      unsubMsg();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
      unsubOnline();
      unsubOffline();
      socketService.leaveConversation(activeChat._id);
    };
  }, [activeChat?._id, token, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isClientTyping]);

  // Typing emitter for vendor
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!activeChat?._id) return;

    socketService.startTyping(activeChat._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(activeChat._id);
    }, 2000);
  };

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.stopTyping(activeChat._id);

    const clientMsgId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    try {
      const res = await chatApi.sendMessage(
        activeChat._id,
        {
          text: messageText,
          type: 'text',
          clientMessageId: clientMsgId
        },
        true
      );

      if (res.success && res.data) {
        setMessages(prev => {
          if (prev.some(m => m._id === res.data._id || m.clientMessageId === clientMsgId)) {
            return prev.map(m => (m._id === res.data._id || m.clientMessageId === clientMsgId) ? res.data : m);
          }
          return [...prev, res.data];
        });

        setConversations(prevList =>
          prevList.map(c =>
            c._id === activeChat._id
              ? { ...c, lastMessage: res.data, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Handle Attachment Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    try {
      setUploading(true);
      const uploadRes = await chatApi.uploadAttachment(activeChat._id, file, '', true);

      if (uploadRes.success && uploadRes.data?.url) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'document';
        const clientMsgId = 'client_att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        const msgRes = await chatApi.sendMessage(
          activeChat._id,
          {
            text: file.name,
            type: fileType,
            clientMessageId: clientMsgId,
            metadata: {
              fileUrl: uploadRes.data.url,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            }
          },
          true
        );

        if (msgRes.success && msgRes.data) {
          setMessages(prev => [...prev, msgRes.data]);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showToast(err.message || 'File upload failed.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Load quotes for sharing
  const handleOpenQuoteModal = async () => {
    setShowQuoteModal(true);
    setLoadingQuotes(true);
    try {
      const res = await vendorApi.getQuotes(token);
      if (res.success && Array.isArray(res.data)) {
        // Filter quotes for this user if available, or show recent quotes
        const clientUserId = activeChat?.userId?._id?.toString() || activeChat?.userId?.toString();
        const filtered = res.data.filter(q => {
          const qUserId = q.userId?._id?.toString() || q.userId?.toString();
          return !clientUserId || qUserId === clientUserId || q.status === 'Sent' || q.status === 'Draft';
        });
        setQuotes(filtered.length > 0 ? filtered : res.data);
      }
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Share selected quote in chat
  const handleShareQuote = async (quoteId) => {
    if (!activeChat || !quoteId) return;
    try {
      setSharingQuoteId(quoteId);
      const res = await chatApi.shareQuote(activeChat._id, quoteId);
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setShowQuoteModal(false);
        showToast('Quote shared successfully in chat.', 'success');
      }
    } catch (err) {
      console.error('Failed to share quote:', err);
      showToast(err.message || 'Failed to share quote.', 'error');
    } finally {
      setSharingQuoteId(null);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportDescription.trim() || !activeChat) return;

    try {
      setSubmittingReport(true);
      const res = await chatApi.reportChat(
        activeChat._id,
        {
          reason: reportReason,
          description: reportDescription
        },
        true
      );

      if (res.success) {
        setReportSuccess(true);
        showToast('Report submitted successfully.', 'success');
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportDescription('');
        }, 1500);
      }
    } catch (err) {
      console.error('Report submission failed:', err);
      showToast(err.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const clientName = c.userId?.name || c.otherParticipant?.name || 'Customer';
    return clientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getClientDisplayName = (conv) => {
    return conv?.userId?.name || conv?.otherParticipant?.name || 'Customer';
  };

  const getClientDisplayImage = (conv) => {
    return conv?.userId?.profileImage || conv?.userId?.image || conv?.otherParticipant?.image || null;
  };

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
      
      {/* Sidebar - Client Conversations List */}
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
              placeholder="Search clients..."
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
            filteredConversations.map(chat => {
              const name = getClientDisplayName(chat);
              const img = getClientDisplayImage(chat);
              const isSelected = activeChat?._id === chat._id;
              const unread = chat.vendorUnreadCount || 0;

              return (
                <div 
                  key={chat._id}
                  onClick={() => setActiveChat(chat)}
                  className={`rounded-2xl p-3.5 cursor-pointer transition-all duration-300 border flex items-center gap-3 active:scale-[0.98] ${
                    isSelected 
                      ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-md shadow-violet-100 translate-x-0.5' 
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50/60 hover:translate-x-0.5'
                  }`}
                >
                  <div className="h-11 w-11 rounded-full flex items-center justify-center text-[12px] font-black relative shrink-0 overflow-hidden shadow-xs border border-white">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className={`${isSelected ? 'text-[#7C3AED] bg-white' : 'bg-violet-50 text-[#7C3AED]'} w-full h-full flex items-center justify-center font-black`}>
                        {name.charAt(0) || 'C'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-[11.5px] font-extrabold truncate leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {name}
                      </h4>
                      <span className={`text-[8px] font-extrabold shrink-0 uppercase tracking-tight ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                        {chat.updatedAt && new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[9.5px] font-medium truncate leading-none ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {chat.lastMessage?.type === 'quote' ? '📄 Shared a Quote' : (chat.lastMessage?.text || 'No messages yet')}
                      </p>
                      {unread > 0 && !isSelected && (
                        <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#7C3AED] text-white text-[8px] font-black flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
                  {getClientDisplayImage(activeChat) ? (
                    <img src={getClientDisplayImage(activeChat)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getClientDisplayName(activeChat).charAt(0) || 'C'
                  )}
                </div>
                <div>
                  <h3 className="text-[12px] font-black text-slate-900 leading-none truncate max-w-[120px] sm:max-w-none">
                    {getClientDisplayName(activeChat)}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${isClientOnline ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'}`} />
                    <p className="text-[8.5px] font-extrabold uppercase tracking-widest text-slate-400">
                      {isClientOnline ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Share Quote Button */}
                <button
                  onClick={handleOpenQuoteModal}
                  className="px-3 py-1.5 rounded-xl bg-violet-50 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white text-[10px] font-bold transition-all flex items-center gap-1.5 border border-violet-100"
                >
                  <Icon name="document" size="xs" />
                  <span>Share Quote</span>
                </button>

                {/* Report Client Button */}
                <button
                  onClick={() => setShowReportModal(true)}
                  title="Report User"
                  className="h-8.5 w-8.5 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-all"
                >
                  <Icon name="flag" size="xs" />
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs overflow-y-auto no-scrollbar space-y-4">
              {messages.map(msg => {
                const isMe = msg.senderModel === 'Vendor';
                const isSystem = msg.type === 'system';

                if (isSystem) {
                  return (
                    <div key={msg._id || msg.clientMessageId} className="flex justify-center my-2">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[9.5px] font-bold border border-slate-200/50">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg._id || msg.clientMessageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'} chat-pop`}>
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Quote Card Message */}
                      {msg.type === 'quote' && (
                        <div className={`p-3.5 rounded-2xl text-[11px] shadow-sm mb-1 ${
                          isMe ? 'bg-gradient-to-br from-violet-900 to-indigo-950 text-white rounded-tr-none' : 'bg-slate-900 text-white rounded-tl-none'
                        }`}>
                          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-300 flex items-center gap-1">
                              <span>📄 Formal Quote</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-white/20 uppercase">
                              {msg.metadata?.quoteStatus || 'Pending'}
                            </span>
                          </div>
                          <h4 className="text-[12px] font-extrabold text-white mb-1">{msg.metadata?.quoteTitle || msg.text}</h4>
                          <p className="text-[16px] font-black text-amber-300 mb-2">
                            ₹{Number(msg.metadata?.quoteAmount || 0).toLocaleString('en-IN')}
                          </p>
                          {msg.metadata?.quoteItems?.length > 0 && (
                            <ul className="text-[9.5px] space-y-0.5 opacity-90 mb-2 pl-2 border-l border-white/20">
                              {msg.metadata.quoteItems.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="truncate">• {item.name || item.description}</li>
                              ))}
                            </ul>
                          )}
                          <p className="text-[8px] opacity-70">
                            Valid until: {msg.metadata?.quoteValidUntil ? new Date(msg.metadata.quoteValidUntil).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      )}

                      {/* Image Message */}
                      {msg.type === 'image' && (
                        <div className="mb-1 rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-w-[280px]">
                          <img 
                            src={msg.metadata?.fileUrl || msg.text} 
                            alt="Attachment" 
                            className="w-full h-auto max-h-[220px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setPreviewImage(msg.metadata?.fileUrl || msg.text)}
                          />
                        </div>
                      )}

                      {/* Document Message */}
                      {msg.type === 'document' && (
                        <a
                          href={msg.metadata?.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors mb-1"
                        >
                          <Icon name="document" size="sm" />
                          <div className="min-w-0">
                            <p className="text-[10.5px] font-bold truncate">{msg.metadata?.fileName || msg.text}</p>
                            <p className="text-[8px] text-slate-400">Document Attachment</p>
                          </div>
                        </a>
                      )}

                      {/* Standard Text Message */}
                      {(!msg.type || msg.type === 'text') && (
                        <div className={`px-4 py-2.5 rounded-2xl text-[11px] font-semibold leading-relaxed shadow-xs ${isMe 
                          ? 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/40'}`}
                        >
                          {msg.text}
                        </div>
                      )}

                      {/* Message Metadata & Read Receipts */}
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <p className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isMe && (
                          <span className={`text-[10px] ${msg.isRead ? 'text-[#7C3AED] font-black' : 'text-slate-300'}`}>
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isClientTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold py-1">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>Client is typing...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="bg-white rounded-2xl p-2 border border-slate-100 shadow-md flex items-center gap-2">
              {/* Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-[#7C3AED] flex items-center justify-center text-slate-400 transition-all active:scale-95 shrink-0"
                title="Attach image or file"
              >
                {uploading ? (
                  <div className="h-4 w-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="plus" size="xs" />
                )}
              </button>

              <input 
                type="text" 
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message to client..."
                className="flex-1 bg-transparent border-0 px-2 text-[11px] font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              />

              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-md active:scale-90 transition-all shrink-0 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                <svg className="w-4 h-4 rotate-45 -translate-x-0.5 translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

      {/* Quote Selector Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Share Formal Quote</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Select an existing quote to share with this client</p>
              </div>
              <button 
                onClick={() => setShowQuoteModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="py-4 max-h-[300px] overflow-y-auto space-y-3 no-scrollbar">
              {loadingQuotes ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : quotes.length > 0 ? (
                quotes.map(q => (
                  <div 
                    key={q._id} 
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-violet-50/50 hover:border-violet-200 transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-[11px] font-black text-slate-900">{q.title || 'Wedding Service Quote'}</h4>
                      <p className="text-[13px] font-black text-[#7C3AED] mt-0.5">₹{Number(q.totalAmount || q.amount || 0).toLocaleString('en-IN')}</p>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Status: {q.status}</span>
                    </div>
                    <button
                      onClick={() => handleShareQuote(q._id)}
                      disabled={sharingQuoteId === q._id}
                      className="px-3.5 py-1.5 rounded-xl bg-[#7C3AED] text-white text-[10px] font-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {sharingQuoteId === q._id ? 'Sharing...' : 'Share'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-[11px]">
                  No active quotes found. Create a quote first from Quotes management.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-[14px] font-black text-slate-900">Report Client</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Report abusive or inappropriate conduct to administrators</p>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  ✓
                </div>
                <h4 className="text-[13px] font-bold text-slate-900">Report Submitted</h4>
                <p className="text-[11px] text-slate-500 mt-1">Our trust & safety team has logged this incident.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="py-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700 bg-white"
                  >
                    <option value="Inappropriate Content">Inappropriate Content</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Spam / Scams">Spam / Scams</option>
                    <option value="Non-payment">Payment Dispute / Fraud</option>
                    <option value="Other">Other Policy Violation</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide details about the issue..."
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 ring-violet-200"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport || !reportDescription.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Enlarged preview" className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      )}

      {/* Toast Component */}
      <ToastComponent />
    </div>
  );
};

export default VendorChat;
