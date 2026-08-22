import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Store,
  Sparkles,
  Check,
  CheckCheck,
  ShieldCheck,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Bot,
  Zap,
  Tag,
  Clock,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { formatPKR } from '../utils/formatters';

interface CustomerChatModalProps {
  onOpenProduct?: (productId: string) => void;
  onOpenStore?: (sellerId: string) => void;
}

const QUICK_INQUIRIES = [
  '👋 Hi! Is this item available in stock?',
  '🚚 When will this be delivered to my city?',
  '💵 Is Cash on Delivery (COD) supported?',
  '🏷️ Can I get a special discount for a larger order?',
  '🛡️ Does this product come with a warranty or guarantee?',
];

export const CustomerChatModal: React.FC<CustomerChatModalProps> = ({
  onOpenProduct,
  onOpenStore,
}) => {
  const {
    isCustomerChatOpen,
    closeCustomerChat,
    activeConversation,
    conversations,
    activeMessages,
    loadingMessages,
    sendMessage,
    selectConversation,
    activeInquiryProduct,
    clearActiveInquiryProduct,
  } = useChat();

  const { currentUser, userProfile } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [viewingAllConversations, setViewingAllConversations] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (!isMinimized && isCustomerChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, isMinimized, isCustomerChatOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCustomerChatOpen && !isMinimized && !viewingAllConversations) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isCustomerChatOpen, isMinimized, viewingAllConversations, activeConversation]);

  // Filter conversations for the current buyer
  const buyerConversations = conversations.filter(
    (c) => c.buyerId === currentUser?.uid || !currentUser?.uid
  );

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || sending) return;

    setSending(true);
    try {
      await sendMessage({ text: textToSend });
      setInputMessage('');
      if (soundEnabled) {
        playSendTone();
      }
    } catch (err) {
      console.error('Failed to send customer message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const playSendTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  if (!isCustomerChatOpen) return null;

  const sellerName = activeConversation?.sellerName || 'Verified Store';

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Minimized Floating Bar */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 bg-[#111827] text-white rounded-2xl shadow-2xl border border-slate-700 hover:border-[#FF5500] transition-all cursor-pointer group hover:scale-102"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#FF5500] flex items-center justify-center text-white font-bold shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111827]"></span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>Chat with {sellerName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-[10px] text-slate-400">Click to expand live chat</p>
          </div>
          <Maximize2 className="w-4 h-4 text-slate-400 group-hover:text-white ml-2" />
        </button>
      ) : (
        /* Full Chat Window */
        <div className="w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-[#111827] text-white p-3.5 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {viewingAllConversations ? (
                <button
                  onClick={() => setViewingAllConversations(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Back to conversation"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#FF5500] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
                  <Store className="w-4.5 h-4.5" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {viewingAllConversations ? 'Your Store Chats' : sellerName}
                  </h3>
                  {!viewingAllConversations && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate">
                    {viewingAllConversations
                      ? `${buyerConversations.length} active threads`
                      : 'Live Seller Support • Replies in ~5m'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1 text-slate-400">
              {buyerConversations.length > 1 && !viewingAllConversations && (
                <button
                  onClick={() => setViewingAllConversations(true)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-md transition-colors cursor-pointer mr-1"
                  title="Switch to another store conversation"
                >
                  All Chats ({buyerConversations.length})
                </button>
              )}

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={closeCustomerChat}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {viewingAllConversations ? (
            /* List of buyer's conversations */
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
              <p className="text-[11px] font-bold text-slate-500 uppercase px-1">Active Store Inquiries</p>
              {buyerConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id);
                    setViewingAllConversations(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 bg-white hover:border-[#FF5500] shadow-xs cursor-pointer ${
                    conv.id === activeConversation?.id ? 'border-[#FF5500] ring-1 ring-[#FF5500]/20' : 'border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF5500] flex items-center justify-center font-bold text-xs shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{conv.sellerName}</h4>
                      <span className="text-[9px] text-slate-400">
                        {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                    {conv.unreadBuyerCount > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#FF5500] text-white text-[9px] font-bold rounded-full">
                        {conv.unreadBuyerCount} new
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Active Live Chat Messages View */
            <>
              {/* Inquired Product Card Banner (if initiated from a product) */}
              {activeInquiryProduct && (
                <div className="bg-orange-50/90 border-b border-orange-200 p-2.5 px-3.5 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {activeInquiryProduct.imageUrl && (
                      <img
                        src={activeInquiryProduct.imageUrl}
                        alt="Product preview"
                        className="w-10 h-10 rounded-lg object-cover border border-orange-200 shrink-0 bg-white"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase text-[#FF5500] tracking-wider block">
                        Inquiring About Item
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                        {activeInquiryProduct.title}
                      </h4>
                      <div className="text-[11px] font-black text-[#FF5500]">
                        {typeof activeInquiryProduct.price === 'number' ? formatPKR(activeInquiryProduct.price) : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeInquiryProduct.id && onOpenProduct && (
                      <button
                        onClick={() => onOpenProduct(activeInquiryProduct.id!)}
                        className="p-1.5 bg-white hover:bg-orange-100 border border-orange-200 text-slate-700 hover:text-[#FF5500] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="View product details"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={clearActiveInquiryProduct}
                      className="p-1.5 hover:bg-orange-200/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Dismiss product tag"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                {/* Welcome Card & Safety Notice */}
                <div className="text-center py-2 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Direct Live Chat with {sellerName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Ask about sizing, stock availability, courier options, or custom requests.
                  </p>
                </div>

                {/* Loading indicator */}
                {loadingMessages && activeMessages.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin"></span>
                    <span>Connecting to live chat...</span>
                  </div>
                )}

                {/* Messages List */}
                {activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid || msg.senderRole === 'buyer';
                  const msgTime = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      {/* Attached Product Box */}
                      {msg.productTitle && (
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] p-2 rounded-xl border flex items-center gap-2 mb-0.5 bg-white shadow-2xs ${
                            isMe ? 'border-orange-200' : 'border-slate-200'
                          }`}
                        >
                          {msg.productImage && (
                            <img
                              src={msg.productImage}
                              alt={msg.productTitle}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 text-left">
                            <span className="text-[9px] font-extrabold text-[#FF5500] uppercase block">
                              Product Reference
                            </span>
                            <p className="text-[11px] font-bold text-slate-900 truncate">
                              {msg.productTitle}
                            </p>
                            {msg.productPrice && (
                              <span className="text-[10px] font-black text-slate-700">
                                {formatPKR(msg.productPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                          isMe
                            ? 'bg-[#FF5500] text-white rounded-tr-none font-medium'
                            : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/90 font-normal'
                        }`}
                      >
                        {!isMe && (
                          <span className="block text-[10px] font-black text-[#FF5500] uppercase tracking-wider mb-0.5">
                            {msg.senderName || 'Seller'}
                          </span>
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {/* Timestamp & Status */}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 px-1">
                        <span>{msgTime}</span>
                        {isMe && (
                          <span className="text-emerald-600 font-bold flex items-center">
                            <CheckCheck className="w-3 h-3 inline" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Inquiry Prompts Carousel */}
              {activeMessages.length < 3 && (
                <div className="px-3 py-1.5 bg-slate-100/90 border-t border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase shrink-0 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#FF5500]" />
                    Quick Ask:
                  </span>
                  {QUICK_INQUIRIES.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-[#FF5500] text-[10px] font-bold rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Composer Footer */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={`Message ${sellerName}...`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sending}
                    className="p-2.5 px-3.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                    title="Send message (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400">
                  <span>Press <kbd className="bg-slate-100 px-1 py-0.5 rounded text-[9px] border font-mono">Enter ↵</kbd> to send</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Instant Seller Delivery
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
