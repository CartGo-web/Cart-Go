import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { ChatConversation, ChatMessage, Product } from '../types';

interface SendMessageOptions {
  text: string;
  conversationId?: string;
  recipientId?: string;
  recipientName?: string;
  product?: {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
  };
}

interface ChatContextType {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  activeMessages: ChatMessage[];
  loadingMessages: boolean;
  isCustomerChatOpen: boolean;
  setIsCustomerChatOpen: (open: boolean) => void;
  activeInquiryProduct: Partial<Product> | null;
  totalUnreadForSeller: number;
  totalUnreadForBuyer: number;
  totalUnreadForCustomer: number;
  effectiveGuestId: string;
  openCustomerChatWithSeller: (sellerId: string, sellerName: string, product?: Partial<Product>) => void;
  openCustomerChatModal: () => void;
  closeCustomerChat: () => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  markConversationAsRead: (conversationId: string, asRole: 'buyer' | 'seller') => Promise<void>;
  clearActiveInquiryProduct: () => void;
  isConversationMatchingSeller: (conv: ChatConversation) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_CONVERSATIONS_KEY = 'cartgo_chat_conversations_v2';
const LOCAL_MESSAGES_KEY_PREFIX = 'cartgo_chat_msgs_v2_';
const GUEST_STORAGE_KEY = 'cartgo_guest_chat_uid_v1';
const GUEST_NAME_KEY = 'cartgo_guest_chat_name_v1';

function getOrCreateGuestIdentity(): { guestId: string; guestName: string } {
  try {
    let gid = localStorage.getItem(GUEST_STORAGE_KEY);
    let gname = localStorage.getItem(GUEST_NAME_KEY);

    if (!gid) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      gid = `guest_${Date.now().toString(36)}_${randomCode}`;
      gname = `Customer #${randomCode}`;
      localStorage.setItem(GUEST_STORAGE_KEY, gid);
      localStorage.setItem(GUEST_NAME_KEY, gname);
    } else if (!gname) {
      const shortCode = gid.slice(-4) || '101';
      gname = `Customer #${shortCode}`;
      localStorage.setItem(GUEST_NAME_KEY, gname);
    }

    return { guestId: gid, guestName: gname };
  } catch {
    return { guestId: `guest_${Date.now().toString(36)}`, guestName: 'Shopper' };
  }
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin } = useAuth();

  const [guestIdentity] = useState<{ guestId: string; guestName: string }>(() => getOrCreateGuestIdentity());
  const effectiveGuestId = guestIdentity.guestId;

  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isCustomerChatOpen, setIsCustomerChatOpen] = useState(false);
  const [activeInquiryProduct, setActiveInquiryProduct] = useState<Partial<Product> | null>(null);

  // Identities
  const currentUid = currentUser?.uid || '';
  const currentBuyerId = currentUid || effectiveGuestId;
  const currentDisplayName = userProfile?.displayName || currentUser?.email?.split('@')[0] || guestIdentity.guestName;
  const currentUserRole = userProfile?.role || 'buyer';

  const isStoreManager = currentUserRole === 'manager';
  const isStoreSeller = currentUserRole === 'seller' || isAdmin;
  const effectiveSellerId = isStoreManager
    ? (userProfile?.storeId || userProfile?.storeOwnerId || currentUid)
    : currentUid;

  // Function to check if a conversation belongs to the current logged-in seller/admin/store manager
  const isConversationMatchingSeller = useCallback(
    (c: ChatConversation): boolean => {
      if (isAdmin) return true; // Admins oversee all marketplace conversations
      if (!currentUid) return false;
      if (c.sellerId === currentUid) return true;
      if (c.sellerId === effectiveSellerId) return true;
      if (userProfile?.storeId && c.sellerId === userProfile.storeId) return true;
      if (userProfile?.storeOwnerId && c.sellerId === userProfile.storeOwnerId) return true;
      if (isStoreSeller && (c.sellerId === 'seller' || c.sellerName === userProfile?.displayName)) return true;
      return false;
    },
    [isAdmin, currentUid, effectiveSellerId, userProfile, isStoreSeller]
  );

  // Audio tone for incoming messages
  const playIncomingTone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay policy catch
    }
  }, []);

  const previousUnreadRef = useRef<number>(0);

  // Real-time listener for ALL marketplace conversations from Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;

    try {
      const convCol = collection(db, 'conversations');
      unsub = onSnapshot(
        convCol,
        (snapshot) => {
          const list: ChatConversation[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as ChatConversation);
          });

          // Sort by last message / update descending
          list.sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.lastMessageAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.lastMessageAt || 0).getTime();
            return timeB - timeA;
          });

          setConversations(list);

          // Check if seller unread increased, trigger sound alert
          const sellerUnread = list
            .filter((c) => isConversationMatchingSeller(c))
            .reduce((sum, c) => sum + (c.unreadSellerCount || 0), 0);

          if (sellerUnread > previousUnreadRef.current && (isStoreSeller || isStoreManager)) {
            playIncomingTone();
          }
          previousUnreadRef.current = sellerUnread;

          try {
            localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(list));
          } catch (e) {
            console.warn('Failed to store conversations:', e);
          }
        },
        (err) => {
          console.warn('Firestore conversations collection listener warning:', err);
        }
      );
    } catch (err) {
      console.warn('Failed to attach conversations listener:', err);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [isConversationMatchingSeller, isStoreSeller, isStoreManager, playIncomingTone]);

  // Active Conversation computed
  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Real-time listener for active messages
  useEffect(() => {
    if (!activeConversationId) {
      setActiveMessages([]);
      setLoadingMessages(false);
      return;
    }

    // Load cached messages first for instant response
    try {
      const cached = localStorage.getItem(LOCAL_MESSAGES_KEY_PREFIX + activeConversationId);
      if (cached) {
        setActiveMessages(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('Error loading cached messages:', e);
    }

    setLoadingMessages(true);

    const msgsQ = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeConversationId)
    );

    const unsubscribe = onSnapshot(
      msgsQ,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
        });

        // Client-side sort by createdAt ascending
        list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        setActiveMessages(list);
        setLoadingMessages(false);

        try {
          localStorage.setItem(LOCAL_MESSAGES_KEY_PREFIX + activeConversationId, JSON.stringify(list));
        } catch (e) {
          console.warn('Failed to cache messages:', e);
        }
      },
      (err) => {
        console.warn('Messages listener error:', err);
        setLoadingMessages(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeConversationId]);

  // Compute total unread counts
  const totalUnreadForSeller = useMemo(() => {
    return conversations
      .filter((c) => isConversationMatchingSeller(c))
      .reduce((sum, c) => sum + (c.unreadSellerCount || 0), 0);
  }, [conversations, isConversationMatchingSeller]);

  const totalUnreadForBuyer = useMemo(() => {
    return conversations
      .filter((c) => c.buyerId === currentBuyerId || (currentUid && c.buyerId === currentUid))
      .reduce((sum, c) => sum + (c.unreadBuyerCount || 0), 0);
  }, [conversations, currentBuyerId, currentUid]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(
    async (conversationId: string, asRole: 'buyer' | 'seller') => {
      if (!conversationId) return;

      try {
        const updateData: Record<string, any> = {};
        if (asRole === 'buyer') {
          updateData.unreadBuyerCount = 0;
        } else {
          updateData.unreadSellerCount = 0;
        }

        await updateDoc(doc(db, 'conversations', conversationId), updateData);

        // Optimistically update local state
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, ...updateData } : c))
        );
      } catch (err) {
        console.warn('Failed to mark conversation read:', err);
      }
    },
    []
  );

  // Open customer chat with a specific seller
  const openCustomerChatWithSeller = useCallback(
    (sellerId: string, sellerName: string, product?: Partial<Product>) => {
      const targetSellerId = sellerId || 'seller';
      const targetSellerName = sellerName || 'Verified Merchant';

      // Generate deterministic or found conversation ID: buyerId_sellerId
      const convId = `${currentBuyerId}_${targetSellerId}`;

      // Check if conversation already exists
      const existing = conversations.find(
        (c) =>
          ((c.buyerId === currentBuyerId || (currentUid && c.buyerId === currentUid)) &&
            c.sellerId === targetSellerId) ||
          c.id === convId
      );

      if (product) {
        setActiveInquiryProduct(product);
      }

      if (existing) {
        setActiveConversationId(existing.id);
        markConversationAsRead(existing.id, 'buyer');
      } else {
        // Initialize active conversation id
        setActiveConversationId(convId);
      }

      setIsCustomerChatOpen(true);
    },
    [currentBuyerId, currentUid, conversations, markConversationAsRead]
  );

  const closeCustomerChat = useCallback(() => {
    setIsCustomerChatOpen(false);
  }, []);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        const isUserSeller = isConversationMatchingSeller(conv);
        markConversationAsRead(conversationId, isUserSeller ? 'seller' : 'buyer');
      }
    },
    [conversations, isConversationMatchingSeller, markConversationAsRead]
  );

  const clearActiveInquiryProduct = useCallback(() => {
    setActiveInquiryProduct(null);
  }, []);

  // Send message function (Bidirectional Buyer <-> Seller)
  const sendMessage = useCallback(
    async (options: SendMessageOptions) => {
      const text = options.text.trim();
      if (!text) return;

      const convId = options.conversationId || activeConversationId;
      if (!convId) {
        throw new Error('No active conversation selected');
      }

      const existingConv = conversations.find((c) => c.id === convId);

      // Determine sender identity & role
      const isSellerSender = existingConv
        ? isConversationMatchingSeller(existingConv)
        : false;

      const senderId = isSellerSender ? (effectiveSellerId || currentUid || 'seller') : currentBuyerId;
      const senderName = isSellerSender ? (userProfile?.displayName || 'Store Support') : currentDisplayName;
      const senderRole = isSellerSender ? 'seller' : 'buyer';

      const recipientId =
        options.recipientId ||
        (isSellerSender ? existingConv?.buyerId : existingConv?.sellerId) ||
        (isSellerSender ? 'customer' : 'seller');

      const recipientName =
        options.recipientName ||
        (isSellerSender ? existingConv?.buyerName : existingConv?.sellerName) ||
        (isSellerSender ? 'Customer' : 'Store');

      const nowIso = new Date().toISOString();

      const prodInfo =
        options.product ||
        (activeInquiryProduct?.id
          ? {
              id: activeInquiryProduct.id!,
              title: activeInquiryProduct.title || 'Inquired Product',
              imageUrl: activeInquiryProduct.imageUrl || '',
              price: activeInquiryProduct.price || 0,
            }
          : undefined);

      const messagePayload: Omit<ChatMessage, 'id'> = {
        conversationId: convId,
        senderId,
        senderName,
        senderRole,
        recipientId,
        recipientName,
        text,
        createdAt: nowIso,
        read: false,
        ...(prodInfo
          ? {
              productId: prodInfo.id,
              productTitle: prodInfo.title,
              productImage: prodInfo.imageUrl,
              productPrice: prodInfo.price,
            }
          : {}),
      };

      // 1. Optimistic message append
      const tempId = 'temp_' + Date.now() + Math.random().toString(36).substring(2, 5);
      const optimisticMsg: ChatMessage = { id: tempId, ...messagePayload };
      setActiveMessages((prev) => [...prev, optimisticMsg]);

      // 2. Add message to Firestore `messages` collection
      try {
        const docRef = await addDoc(collection(db, 'messages'), messagePayload);
        // Replace temp id with real Firestore ID
        setActiveMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: docRef.id } : m))
        );
      } catch (err) {
        console.warn('Firestore message add error:', err);
      }

      // 3. Update or create the `conversations` document
      const resolvedBuyerId = isSellerSender
        ? (existingConv?.buyerId || recipientId)
        : currentBuyerId;

      const resolvedBuyerName = isSellerSender
        ? (existingConv?.buyerName || recipientName)
        : currentDisplayName;

      const resolvedSellerId = isSellerSender
        ? (effectiveSellerId || currentUid || 'seller')
        : (existingConv?.sellerId || recipientId || 'seller');

      const resolvedSellerName = isSellerSender
        ? (userProfile?.displayName || 'Store Support')
        : (existingConv?.sellerName || recipientName || 'Verified Merchant');

      const prevUnreadBuyer = existingConv?.unreadBuyerCount || 0;
      const prevUnreadSeller = existingConv?.unreadSellerCount || 0;

      const conversationDocData: Partial<ChatConversation> = {
        id: convId,
        buyerId: resolvedBuyerId,
        buyerName: resolvedBuyerName,
        buyerEmail: isSellerSender ? (existingConv?.buyerEmail || '') : (currentUser?.email || ''),
        sellerId: resolvedSellerId,
        sellerName: resolvedSellerName,
        lastMessage: text,
        lastMessageAt: nowIso,
        lastSenderId: senderId,
        updatedAt: nowIso,
        unreadBuyerCount: isSellerSender ? prevUnreadBuyer + 1 : 0,
        unreadSellerCount: !isSellerSender ? prevUnreadSeller + 1 : 0,
        ...(prodInfo
          ? {
              productId: prodInfo.id,
              productTitle: prodInfo.title,
              productImage: prodInfo.imageUrl,
              productPrice: prodInfo.price,
            }
          : {}),
      };

      try {
        await setDoc(doc(db, 'conversations', convId), conversationDocData, { merge: true });
      } catch (err) {
        console.warn('Firestore conversation update error:', err);
      }

      // Clear active inquiry product box after inquiry sent
      if (activeInquiryProduct) {
        setActiveInquiryProduct(null);
      }
    },
    [
      activeConversationId,
      conversations,
      isConversationMatchingSeller,
      effectiveSellerId,
      currentUid,
      currentBuyerId,
      currentDisplayName,
      userProfile,
      currentUser,
      activeInquiryProduct,
    ]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeMessages,
        loadingMessages,
        isCustomerChatOpen,
        setIsCustomerChatOpen,
        activeInquiryProduct,
        totalUnreadForSeller,
        totalUnreadForBuyer,
        totalUnreadForCustomer: totalUnreadForBuyer,
        effectiveGuestId,
        openCustomerChatWithSeller,
        openCustomerChatModal: () => setIsCustomerChatOpen(true),
        closeCustomerChat,
        selectConversation,
        sendMessage,
        markConversationAsRead,
        clearActiveInquiryProduct,
        isConversationMatchingSeller,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
