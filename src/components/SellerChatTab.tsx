import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  User,
  Store,
  Sparkles,
  ShoppingBag,
  Clock,
  Check,
  CheckCheck,
  Zap,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Filter,
  Phone,
  Mail,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { ChatConversation, Product } from '../types';
import { formatPKR } from '../utils/formatters';

interface SellerChatTabProps {
  products?: Product[];
  onOpenProductDetails?: (productId: string) => void;
}

const SELLER_CANNED_REPLIES = [
  '✅ Yes! This product is 100% in stock and ready for immediate dispatch.',
  '🚚 We deliver nationwide via courier in 2-4 business days with tracking.',
  '💵 Cash on Delivery (COD) is fully supported across Pakistan!',
  '🎁 We can offer a 5% special discount on your order!',
  '📦 Every order is quality checked and securely bubble-wrapped before shipping.',
  '📞 Please let us know if you have any questions about size or specifications.',
];

export const SellerChatTab: React.FC<SellerChatTabProps> = ({
  products = [],
  onOpenProductDetails,
}) => {
  const {
    conversations,
    activeConversation,
    activeMessages,
    loadingMessages,
    selectConversation,
    sendMessage,
    markConversationAsRead,
    totalUnreadForSeller,
    isConversationMatchingSeller,
  } = useChat();

  const { currentUser, userProfile, isAdmin } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'products'>('all');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Filter conversations specifically for this seller/store or all if admin
  const sellerConversations = useMemo(() => {
    return conversations.filter((c) => isConversationMatchingSeller(c));
  }, [conversations, isConversationMatchingSeller]);

  // Filtered by search query and type
  const filteredConversations = useMemo(() => {
    return sellerConversations.filter((c) => {
      const query = searchFilter.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (c.buyerName && c.buyerName.toLowerCase().includes(query)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(query)) ||
        (c.productTitle && c.productTitle.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterType === 'unread') {
        return (c.unreadSellerCount || 0) > 0;
      }
      if (filterType === 'products') {
        return Boolean(c.productTitle || c.productId);
      }
      return true;
    });
  }, [sellerConversations, searchFilter, filterType]);

  // Auto select first conversation if none is selected and threads exist
  useEffect(() => {
    if (!activeConversation && filteredConversations.length > 0) {
      selectConversation(filteredConversations[0].id);
    }
  }, [activeConversation, filteredConversations, selectConversation]);

  // Auto scroll to bottom of active message stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // If there's an active conversation, mark as read for seller
  useEffect(() => {
    if (activeConversation?.id) {
      markConversationAsRead(activeConversation.id, 'seller');
    }
  }, [activeConversation?.id, markConversationAsRead]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (activeConversation) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeConversation]);

  const handleSendReply = async (customText?: string) => {
    const text = (customText || replyText).trim();
    if (!text || sending || !activeConversation) return;

    setSending(true);
    try {
      await sendMessage({
        text,
        conversationId: activeConversation.id,
        recipientId: activeConversation.buyerId,
        recipientName: activeConversation.buyerName,
      });
      setReplyText('');
    } catch (err) {
      console.error('Failed to send seller reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[620px] max-h-[750px]">
      {/* Left Sidebar: Customer Threads List */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 text-[#FF5500] rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>Customer Messages</span>
                  {totalUnreadForSeller > 0 && (
                    <span className="px-2 py-0.5 bg-[#FF5500] text-white text-[10px] font-black rounded-full animate-pulse">
                      {totalUnreadForSeller} new
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500">Live chat inquiries from shoppers</p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer or product..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({sellerConversations.length})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                filterType === 'unread'
                  ? 'bg-[#FF5500] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread {totalUnreadForSeller > 0 && `(${totalUnreadForSeller})`}
            </button>
            <button
              onClick={() => setFilterType('products')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                filterType === 'products'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Product Inquiries
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No Customer Chats Yet</p>
              <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                When customers ask questions from your product listings or store page, their messages will appear here in real-time.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const hasUnread = (conv.unreadSellerCount || 0) > 0;
              const timeFormatted = conv.updatedAt || conv.lastMessageAt
                ? new Date(conv.updatedAt || conv.lastMessageAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })
                : '';

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#FF5500] shadow-sm ring-1 ring-[#FF5500]/20'
                      : hasUnread
                      ? 'bg-orange-50/70 border-orange-200 hover:bg-orange-100/60'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Customer Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs relative">
                    {conv.buyerName ? conv.buyerName.charAt(0).toUpperCase() : 'C'}
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#FF5500] border-2 border-white"></span>
                    )}
                  </div>

                  {/* Thread Summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {conv.buyerName || 'Shopper'}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {timeFormatted}
                      </span>
                    </div>

                    {/* Product Inquired Tag */}
                    {conv.productTitle && (
                      <div className="flex items-center gap-1 my-0.5 text-[10px] font-extrabold text-[#FF5500] truncate">
                        <ShoppingBag className="w-3 h-3 shrink-0" />
                        <span className="truncate">{conv.productTitle}</span>
                      </div>
                    )}

                    {/* Snippet */}
                    <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  {hasUnread && (
                    <span className="px-1.5 py-0.5 bg-[#FF5500] text-white text-[9px] font-extrabold rounded-full shrink-0">
                      {conv.unreadSellerCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat Conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {activeConversation.buyerName ? activeConversation.buyerName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {activeConversation.buyerName || 'Customer'}
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Customer
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeConversation.buyerEmail || 'Inquiring via Cart Go'}
                  </p>
                </div>
              </div>

              {/* Product Reference Card in Header (if applicable) */}
              {activeConversation.productTitle && (
                <div className="hidden sm:flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-xl max-w-[260px]">
                  {activeConversation.productImage && (
                    <img
                      src={activeConversation.productImage}
                      alt={activeConversation.productTitle}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] font-black text-[#FF5500] uppercase block">Inquired Item</span>
                    <p className="text-[11px] font-bold text-slate-900 truncate">{activeConversation.productTitle}</p>
                  </div>
                  {activeConversation.productId && onOpenProductDetails && (
                    <button
                      onClick={() => onOpenProductDetails(activeConversation.productId!)}
                      className="p-1 hover:bg-orange-200 text-slate-600 hover:text-[#FF5500] rounded-lg transition-colors cursor-pointer"
                      title="View listing"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAFC]">
              {/* Security & Verification Banner */}
              <div className="text-center py-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Real-Time Customer Live Chat</span>
                </span>
              </div>

              {loadingMessages && activeMessages.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin"></span>
                  <span>Loading messages...</span>
                </div>
              )}

              {/* Message Bubbles */}
              {activeMessages.map((msg) => {
                const isSellerReply = msg.senderRole === 'seller' || msg.senderId === currentUser?.uid;
                const msgTime = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSellerReply ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Product Card Attachment */}
                    {msg.productTitle && (
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] p-2.5 rounded-xl border flex items-center gap-3 mb-0.5 bg-white shadow-2xs ${
                          isSellerReply ? 'border-orange-200' : 'border-slate-200'
                        }`}
                      >
                        {msg.productImage && (
                          <img
                            src={msg.productImage}
                            alt={msg.productTitle}
                            className="w-11 h-11 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0 text-left">
                          <span className="text-[9px] font-extrabold text-[#FF5500] uppercase block">
                            Product Inquiry
                          </span>
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {msg.productTitle}
                          </p>
                          {msg.productPrice && (
                            <span className="text-[11px] font-black text-slate-700">
                              {formatPKR(msg.productPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                        isSellerReply
                          ? 'bg-[#111827] text-white rounded-tr-none font-medium'
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-200 font-normal'
                      }`}
                    >
                      <span className={`block text-[10px] font-black uppercase tracking-wider mb-0.5 ${isSellerReply ? 'text-[#FF9900]' : 'text-slate-500'}`}>
                        {isSellerReply ? 'You (Store)' : (msg.senderName || 'Customer')}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 px-1">
                      <span>{msgTime}</span>
                      {isSellerReply && (
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

            {/* Quick Canned Responses Strip */}
            <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#FF5500]" />
                1-Click Replies:
              </span>
              {SELLER_CANNED_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReply(reply)}
                  className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-[#FF5500] text-[10px] font-bold rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Seller Message Composer */}
            <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Reply to ${activeConversation.buyerName || 'customer'}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="p-2.5 px-4 bg-[#FF5500] hover:bg-[#E04400] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                  title="Send reply (Enter)"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send Reply</span>
                </button>
              </form>

              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
                <span>Press <kbd className="bg-slate-100 px-1 py-0.5 rounded text-[9px] border font-mono">Enter ↵</kbd> to reply</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Customer will see your response immediately
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Empty Selection State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#FF5500] flex items-center justify-center shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-800">
                Select a Customer Conversation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose a customer thread from the left sidebar to view their message history, product inquiries, and reply in real time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
