import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

export interface StoreDeliveryInfo {
  storeId: string;
  storeName: string;
  fee: number;
  itemCount: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariants?: Record<string, string>,
    selectedVariantText?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  syncProducts: (latestProducts: Product[]) => void;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  storesCount: number;
  storeDeliveryBreakdown: StoreDeliveryInfo[];
  grandTotal: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_KEY = 'cartgo_cart_v1';
const LOCAL_WISHLIST_KEY = 'cartgo_wishlist_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(wishlist));
    } catch (err) {
      console.warn('Failed to save wishlist to localStorage', err);
    }
  }, [wishlist]);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedVariants?: Record<string, string>,
    selectedVariantText?: string
  ) => {
    setCart((prev) => {
      const targetCartItemId = selectedVariantText
        ? `${product.id}-${selectedVariantText}`
        : product.id;

      const existing = prev.find(
        (item) => (item.cartItemId || item.product.id) === targetCartItemId
      );

      if (existing) {
        return prev.map((item) =>
          (item.cartItemId || item.product.id) === targetCartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          cartItemId: targetCartItemId,
          product,
          quantity,
          selectedVariants,
          selectedVariantText,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) =>
      prev.filter((item) => (item.cartItemId || item.product.id) !== cartItemId)
    );
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        (item.cartItemId || item.product.id) === cartItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const syncProducts = (latestProducts: Product[]) => {
    if (!latestProducts || latestProducts.length === 0) return;

    setCart((prev) =>
      prev.map((item) => {
        const updated = latestProducts.find((p) => p.id === item.product.id);
        if (updated) {
          return { ...item, product: updated };
        }
        return item;
      })
    );

    setWishlist((prev) =>
      prev.map((item) => {
        const updated = latestProducts.find((p) => p.id === item.id);
        return updated || item;
      })
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Per-Store Delivery Fee Calculation:
  // If customer buys more than 1 item from the SAME store, charge delivery fee ONCE for that store.
  // If customer buys items from 2 or more different stores, charge delivery fee SEPARATELY per store.
  const storeMap = new Map<string, { storeName: string; maxFee: number; totalItems: number }>();

  cart.forEach((item) => {
    const storeKey = item.product.sellerId || item.product.sellerName || 'default_store';
    const storeName = item.product.sellerName || 'Verified Store';
    const itemFee = typeof item.product.deliveryFee === 'number' ? item.product.deliveryFee : 0;

    if (!storeMap.has(storeKey)) {
      storeMap.set(storeKey, {
        storeName,
        maxFee: itemFee,
        totalItems: item.quantity,
      });
    } else {
      const existing = storeMap.get(storeKey)!;
      existing.totalItems += item.quantity;
      if (itemFee > existing.maxFee) {
        existing.maxFee = itemFee;
      }
    }
  });

  let deliveryFee = 0;
  const storeDeliveryBreakdown: StoreDeliveryInfo[] = [];

  storeMap.forEach((val, key) => {
    deliveryFee += val.maxFee;
    storeDeliveryBreakdown.push({
      storeId: key,
      storeName: val.storeName,
      fee: val.maxFee,
      itemCount: val.totalItems,
    });
  });

  const storesCount = storeMap.size;
  const discountAmount = 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        syncProducts,
        subtotal,
        discountAmount,
        deliveryFee,
        storesCount,
        storeDeliveryBreakdown,
        grandTotal,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
