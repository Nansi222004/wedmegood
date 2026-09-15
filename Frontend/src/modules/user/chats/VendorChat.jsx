import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { chatApi } from '../../../services/chatApi';
import { socketService } from '../../../services/socket';

const VendorChat = () => {
  const { vendorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isVendorTyping, setIsVendorTyping] = useState(false);
  const [isVendorOnline, setIsVendorOnline] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const token = localStorage.getItem('token');
  const stateInfo = location.state || {};

  const vendorName = stateInfo.vendorName || conversation?.vendorId?.businessName || conversation?.vendorId?.name || 'Vendor Partner';
  const vendorCategory = stateInfo.vendorCategory || conversation?.vendorId?.category || 'Wedding Professional';
  const vendorImage = stateInfo.vendorImage || conversation?.vendorId?.profileImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=150';

  // 1. Initialize Conversation and History
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      try {
        setLoading(true);
        let convId = stateInfo.conversationId;

        // If conversationId not passed in navigation state, search user conversations for this vendor
        if (!convId) {
          const res = await chatApi.getUserConversations();
          if (res.success && Array.isArray(res.data)) {
            const found = res.data.find(c => {
              const vId = c.vendorId?._id ? c.vendorId._id.toString() : (c.vendorId ? c.vendorId.toString() : '');
              return vId === vendorId;
            });
            if (found) {
              convId = found._id;
            }
          }
        }

        if (convId) {
          const convRes = await chatApi.getUserConversationById(convId);
          if (convRes.success && isMounted) {
            setConversation(convRes.data);
          }

          const msgRes = await chatApi.getMessages(convId);
          if (msgRes.success && isMounted) {
            setMessages(msgRes.data || []);
          }

          // Mark as read immediately on open
          chatApi.markAsRead(convId).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to initialize chat:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token) {
      initChat();
    }

    return () => {
      isMounted = false;
    };
  }, [vendorId, stateInfo.conversationId, token]);

  // 2. Socket Connection & Room Event Listeners
  useEffect(() => {
    if (!token || !conversation?._id) return;

    socketService.connect(token);
    socketService.joinConversation(conversation._id);
    socketService.markAsRead(conversation._id);

    const unsubMsg = socketService.onMessage(({ message }) => {
      if (message.conversationId?.toString() === conversation._id?.toString()) {
        setMessages(prev => {
          // Deduplicate if already present via clientMessageId or ID
          if (prev.some(m => m._id === message._id || (message.clientMessageId && m.clientMessageId === message.clientMessageId))) {
            return prev.map(m => (m._id === message._id || (message.clientMessageId && m.clientMessageId === message.clientMessageId)) ? message : m);
          }
          return [...prev, message];
        });

        // Automatically mark incoming messages as read if active
        socketService.markAsRead(conversation._id);
      }
    });

    const unsubRead = socketService.onRead(({ conversationId }) => {
      if (conversationId === conversation._id) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    });

    const unsubTypingStart = socketService.onTypingStart(({ conversationId, sender }) => {
      if (conversationId === conversation._id && sender.role === 'Vendor') {
        setIsVendorTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop(({ conversationId, sender }) => {
      if (conversationId === conversation._id && sender.role === 'Vendor') {
        setIsVendorTyping(false);
      }
    });

    const unsubOnline = socketService.onUserOnline(({ id, role }) => {
      const vId = conversation.vendorId?._id ? conversation.vendorId._id.toString() : (conversation.vendorId || '');
      if (role === 'Vendor' && id === vId) {
        setIsVendorOnline(true);
      }
    });

    const unsubOffline = socketService.onUserOffline(({ id, role }) => {
      const vId = conversation.vendorId?._id ? conversation.vendorId._id.toString() : (conversation.vendorId || '');
      if (role === 'Vendor' && id === vId) {
        setIsVendorOnline(false);
      }
    });

    return () => {
      socketService.leaveConversation(conversation._id);
      unsubMsg();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
      unsubOnline();
      unsubOffline();
    };
  }, [conversation?._id, token]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isVendorTyping]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!conversation?._id) return;

    socketService.startTyping(conversation._id);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(conversation._id);
    }, 1500);
  };

  // Send Text Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || !conversation?._id) return;

    const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Optimistic local message bubble
    const optimisticMsg = {
      _id: clientMessageId,
      conversationId: conversation._id,
      senderRole: 'User',
      type: 'text',
      text,
      clientMessageId,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    socketService.stopTyping(conversation._id);

    socketService.sendMessage({
      conversationId: conversation._id,
      text,
      type: 'text',
      clientMessageId
    }, (res) => {
      if (res && res.success) {
        setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? res.data : m));
      }
    });

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Upload Media / Document Attachment
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?._id) return;

    try {
      setUploading(true);
      const res = await chatApi.uploadAttachment(conversation._id, file);
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Failed to upload attachment:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Chat Report
  const handleSubmitReport = async () => {
    if (!conversation?._id) return;
    try {
      setSubmittingReport(true);
      const res = await chatApi.reportChat(conversation._id, {
        reason: reportReason,
        description: reportDescription
      });
      if (res.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSuccess(false);
          setReportDescription('');
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to report conversation:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => navigate('/user/chats')}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back to chats"
          >
            <Icon name="chevronDown" size="sm" className="rotate-90 text-slate-700" />
          </button>

          <div className="relative flex-shrink-0">
            <img
              src={vendorImage}
              alt={vendorName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=150';
              }}
            />
            {isVendorOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
              {vendorName}
              {conversation?.vendorId?.isVerified && (
                <Icon name="check" size="xs" className="text-rose-600 inline" />
              )}
            </h1>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
              {isVendorTyping ? (
                <span className="text-rose-600 font-medium animate-pulse">typing...</span>
              ) : isVendorOnline ? (
                <span className="text-emerald-600 font-medium">Online</span>
              ) : (
                <span>{vendorCategory}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Report Conversation"
            aria-label="Report"
          >
            <Icon name="shield" size="sm" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="animate-spin h-7 w-7 border-3 border-rose-500 border-t-transparent rounded-full"></div>
            <p className="text-xs text-slate-400 font-medium">Loading message history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
              <Icon name="chat" size="md" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Direct Vendor Chat</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Say hi to {vendorName} to discuss requirements, customize packages, and receive instant quotes.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderRole === 'User';
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg._id || idx} className="flex justify-center my-2">
                  <div className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded-full font-medium shadow-2xs">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg._id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-xs break-words ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-100 rounded-tl-xs'
                  }`}
                >
                  {/* QUOTE MESSAGE TYPE */}
                  {msg.type === 'quote' && msg.quoteId && (
                    <div className="bg-amber-50 text-slate-900 p-3 rounded-xl border border-amber-200 mb-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          Custom Proposal
                        </span>
                        <span className="text-sm font-black text-amber-950">
                          ₹{msg.quoteId.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                      {msg.quoteId.items && msg.quoteId.items.length > 0 && (
                        <ul className="text-xs space-y-1 mb-3 text-slate-700">
                          {msg.quoteId.items.map((it, i) => (
                            <li key={i} className="flex justify-between">
                              <span>• {it.name || it.service}</span>
                              <span className="font-semibold">₹{it.price?.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => navigate('/user/quotes')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        View & Accept Quote
                      </button>
                    </div>
                  )}

                  {/* IMAGE ATTACHMENTS */}
                  {msg.attachments?.filter(a => a.type?.toLowerCase() === 'image').map((att, aIdx) => (
                    <div key={aIdx} className="mb-2 rounded-lg overflow-hidden cursor-pointer">
                      <img
                        src={att.url}
                        alt={att.name || 'attachment'}
                        className="max-h-60 rounded-lg object-cover w-full hover:opacity-95"
                        onClick={() => setPreviewImage(att.url)}
                      />
                    </div>
                  ))}

                  {/* DOCUMENT ATTACHMENTS */}
                  {msg.attachments?.filter(a => a.type?.toLowerCase() === 'document').map((att, aIdx) => (
                    <a
                      key={aIdx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-2 p-2 rounded-lg text-xs font-semibold mb-1 ${
                        isMe ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <Icon name="document" size="sm" />
                      <span className="truncate flex-1">{att.name || 'View Document'}</span>
                      <Icon name="download" size="xs" />
                    </a>
                  ))}

                  {/* TEXT CONTENT */}
                  {msg.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* TIME & READ STATUS */}
                  <div
                    className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                      isMe ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {isMe && (
                      <span>
                        {msg.isRead ? (
                          <span title="Read" className="font-bold">✓✓</span>
                        ) : (
                          <span title="Delivered">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isVendorTyping && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[11px] font-medium">{vendorName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="bg-white border-t border-slate-200 p-3 sticky bottom-0 z-10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 max-w-4xl mx-auto">
          {/* Attachment button */}
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
            disabled={uploading || !conversation}
            className="p-2.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Attach file or photo"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="attachment" size="md" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            ref={inputRef}
            placeholder={conversation ? `Message ${vendorName}...` : 'Start a conversation...'}
            value={newMessage}
            onChange={handleInputChange}
            disabled={!conversation}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || !conversation}
            className="p-2.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
            aria-label="Send message"
          >
            <Icon name="send" size="md" />
          </button>
        </form>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Report Conversation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Help us keep the Utsavo marketplace safe. Let us know what happened.
            </p>

            {reportSuccess ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center text-sm font-semibold">
                ✓ Report submitted. Our trust & safety team will review this.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="Inappropriate Content">Inappropriate Content</option>
                    <option value="Harassment">Harassment / Abusive Behavior</option>
                    <option value="Spam">Spam / Unsolicited Messages</option>
                    <option value="Fraud">Fraud / Off-platform Payment Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide additional context for the moderation team..."
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={submittingReport}
                    className="flex-1 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 disabled:opacity-50"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorChat;