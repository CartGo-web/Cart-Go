export type UserRole = 'buyer' | 'seller' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  lastLogin?: string;
  disabled?: boolean;
  customPassword?: string;
  passwordUpdatedAt?: string;
}

export interface SellerNotification {
  id: string;
  title: string;
  message: string;
  recipientId: string; // 'all' or specific seller user ID
  senderName: string;
  createdAt: string;
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
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerId: string;
  deliveryFee?: number;
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
