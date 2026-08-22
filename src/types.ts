export type UserRole = 'buyer' | 'seller' | 'admin' | 'manager';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  displayNameLower?: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  lastLogin?: string;
  disabled?: boolean;
  registeredPassword?: string;
  customPassword?: string;
  passwordUpdatedAt?: string;
  // Manager-specific attributes
  storeId?: string; // UID of the store this manager manages
  storeOwnerId?: string; // UID of the seller who created this manager
  storeName?: string; // Name of the store this manager operates
  managerPermissions?: string[]; // e.g. ['add_product', 'edit_product', 'delete_product', 'view_orders', 'update_orders']
  createdBy?: string;
}

export interface SellerNotification {
  id: string;
  title: string;
  message: string;
  recipientId: string; // 'all' or specific seller user ID
  senderName: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string; // Variant type e.g. "Size", "Color", "Storage", "Flavor", "Style", "Pack"
  options: string[]; // Options array e.g. ["Small", "Medium", "Large", "XL"]
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  additionalImages?: string[];
  variants?: ProductVariant[];
  tags?: string[];
  videoUrl?: string;
  stock: number;
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  isFlashSale?: boolean;
  deliveryFee?: number;
  createdAt: string;
}

export interface CartItem {
  cartItemId?: string;
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
  selectedVariantText?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerId: string;
  deliveryFee?: number;
  selectedVariants?: Record<string, string>;
  selectedVariantText?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentMethod: 'cod' | 'card' | 'wallet';
  createdAt: string;
}

export interface Review {
  id: string;
  productId?: string;
  sellerId?: string;
  sellerName?: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
  imageUrl: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller' | 'admin' | 'manager';
  recipientId: string;
  recipientName: string;
  text: string;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  productPrice?: number;
  createdAt: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  unreadBuyerCount: number;
  unreadSellerCount: number;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  productPrice?: number;
  createdAt?: string;
  updatedAt: string;
}
