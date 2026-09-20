import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Header } from './components/Header';
import { BannerSlider } from './components/BannerSlider';
import { FlashSale } from './components/FlashSale';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomerChatModal } from './components/CustomerChatModal';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CheckoutSuccessToast } from './components/CheckoutSuccessToast';
import { SellerDashboard } from './components/SellerDashboard';
import { OrdersModal } from './components/OrdersModal';
import { WishlistModal } from './components/WishlistModal';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsModal } from './components/NotificationsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Review, Product } from './types';
import { db } from './lib/firebase';
import { SEED_PRODUCTS } from './data/seedProducts';
import { CATEGORIES } from './data/categories';
import { CartGoLogo } from './components/CartGoLogo';
import {
  collection,
  onSnapshot,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import {
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  Store,
  Heart,
  Share2,
  Check,
  ShieldCheck,
  X,
  ArrowLeft,
  Star,
  MessageSquare,
} from 'lucide-react';
import { PriceFilterBar, PriceFilterState } from './components/PriceFilterBar';
import { getShareableProductUrl, getShareableStoreUrl, shareUrl } from './utils/share';

function MarketplaceMain() {
  const { currentUser, userProfile } = useAuth();
  const { addToCart, syncProducts } = useCart();
  const { openCustomerChatWithSeller } = useChat();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'lowToHigh' | 'highToLow' | 'newest'>('popular');
  const [storeShareCopied, setStoreShareCopied] = useState(false);

  // Advanced Price & Discovery Filters State
  const [priceFilter, setPriceFilter] = useState<PriceFilterState>({
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    freeDeliveryOnly: false,
    minRating: null,
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [sellerDashboardOpen, setSellerDashboardOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Seller Reviews State
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [newSellerRating, setNewSellerRating] = useState(5);
  const [newSellerComment, setNewSellerComment] = useState('');
  const [submittingSellerReview, setSubmittingSellerReview] = useState(false);
  const [sellerReviewSuccess, setSellerReviewSuccess] = useState(false);

  // Fetch Seller Reviews when store selected
  useEffect(() => {
    if (!selectedStoreId) {
      setSellerReviews([]);
      return;
    }
    const q = query(collection(db, 'reviews'), where('sellerId', '==', selectedStoreId));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Review);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSellerReviews(list);
      },
      (err) => console.warn('Seller reviews fetch error:', err)
    );

    return () => unsub();
  }, [selectedStoreId]);

  const handleAddSellerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedStoreId) return;
    if (!newSellerComment.trim()) return;

    setSubmittingSellerReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        sellerId: selectedStoreId,
        sellerName: storeName || 'Verified Merchant',
        buyerId: currentUser.uid,
        buyerName: userProfile?.displayName || 'Verified Buyer',
        rating: newSellerRating,
        comment: newSellerComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewSellerComment('');
      setSellerReviewSuccess(true);
      setTimeout(() => setSellerReviewSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to post seller review:', err);
    } finally {
      setSubmittingSellerReview(false);
    }
  };

  // URL Deep Link Sync Helpers
  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    try {
      const url = new URL(window.location.href);
      if (product) {
        url.searchParams.set('product', product.id);
      } else {
        url.searchParams.delete('product');
      }
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('URL update error:', e);
    }
  };

  const handleSelectStore = (sellerId: string | null) => {
    setSelectedStoreId(sellerId);
    try {
      const url = new URL(window.location.href);
      if (sellerId) {
        url.searchParams.set('store', sellerId);
      } else {
        url.searchParams.delete('store');
      }
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('URL update error:', e);
    }
  };

  // Auto-open Super Admin console when super admin logs in
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.email === 'hashirfarman0047@gmail.com') {
      setAdminDashboardOpen(true);
    }
  }, [userProfile]);
  useEffect(() => {
    const handleUrlParams = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const prodId = params.get('product') || params.get('productId');
        const storeId = params.get('store') || params.get('storeId') || params.get('sellerId');

        if (storeId) {
          setSelectedStoreId(storeId);
        }

        if (prodId && products.length > 0) {
          const found = products.find((p) => p.id === prodId);
          if (found) {
            setSelectedProduct(found);
          }
        }
      } catch (e) {
        console.warn('URL parse error:', e);
      }
    };

    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, [products]);

  // Live Products Listener
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const initProducts = () => {
      try {
        const prodCol = collection(db, 'products');

        // Live Listener
        unsub = onSnapshot(
          prodCol,
          (snapshot) => {
            const list: Product[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data && data.title) {
                list.push({
                  id: docSnap.id,
                  title: data.title || 'Untitled Product',
                  description: data.description || '',
                  price: typeof data.price === 'number' ? data.price : 0,
                  originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
                  category: data.category || 'electronics',
                  imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
                  stock: typeof data.stock === 'number' ? data.stock : 10,
                  sellerId: data.sellerId || 'seller',
                  sellerName: data.sellerName || 'Verified Cart Go Seller',
                  rating: typeof data.rating === 'number' ? data.rating : 5.0,
                  reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
                  salesCount: typeof data.salesCount === 'number' ? data.salesCount : 0,
                  isFlashSale: !!data.isFlashSale,
                  deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
                  additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages : undefined,
                  variants: Array.isArray(data.variants) ? data.variants : undefined,
                  tags: Array.isArray(data.tags) ? data.tags : undefined,
                  videoUrl: typeof data.videoUrl === 'string' && data.videoUrl.trim() ? data.videoUrl.trim() : undefined,
                  createdAt: data.createdAt || new Date().toISOString(),
                });
              }
            });
            setProducts(list);
            setLoadingProducts(false);
          },
          (err) => {
            console.warn('Error fetching products:', err);
            setProducts([]);
            setLoadingProducts(false);
          }
        );
      } catch (err) {
        console.warn('Error initializing products:', err);
        setProducts([]);
        setLoadingProducts(false);
      }
    };

    initProducts();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Sync live updated product details across active detail modal, cart & wishlist
  useEffect(() => {
    if (products.length > 0) {
      syncProducts(products);
      if (selectedProduct) {
        const updated = products.find((p) => p.id === selectedProduct.id);
        if (updated) {
          setSelectedProduct(updated);
        }
      }
    }
  }, [products]);

  // Dynamic price bounds across all active catalog products
  const allProductPrices = products
    .map((p) => (typeof p.price === 'number' ? p.price : 0))
    .filter((pr) => pr > 0);
  const absoluteMinPrice = allProductPrices.length > 0 ? Math.floor(Math.min(...allProductPrices)) : 0;
  const absoluteMaxPrice = allProductPrices.length > 0 ? Math.ceil(Math.max(...allProductPrices)) : 50000;

  // Filtered and Sorted Products
  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    const matchesStore = !selectedStoreId || p.sellerId === selectedStoreId;
    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    // Price Filtering
    const itemPrice = typeof p.price === 'number' ? p.price : 0;
    const matchesMinPrice = priceFilter.minPrice === null || itemPrice >= priceFilter.minPrice;
    const matchesMaxPrice = priceFilter.maxPrice === null || itemPrice <= priceFilter.maxPrice;

    // Discovery & Availability Filters
    const matchesStock = !priceFilter.inStockOnly || (typeof p.stock === 'number' && p.stock > 0);
    const matchesDelivery = !priceFilter.freeDeliveryOnly || (typeof p.deliveryFee !== 'number' || p.deliveryFee === 0);
    const matchesRating = priceFilter.minRating === null || (typeof p.rating === 'number' && p.rating >= priceFilter.minRating);

    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) {
      return matchesStore && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesStock && matchesDelivery && matchesRating;
    }

    const titleMatch = (p.title || '').toLowerCase().includes(searchLower);
    const descMatch = (p.description || '').toLowerCase().includes(searchLower);
    const sellerMatch = (p.sellerName || '').toLowerCase().includes(searchLower);
    const tagMatch = Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(searchLower));

    return (
      matchesStore &&
      matchesCategory &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesStock &&
      matchesDelivery &&
      matchesRating &&
      (titleMatch || descMatch || sellerMatch || tagMatch)
    );
  });

  const storeProducts = selectedStoreId ? products.filter((p) => p.sellerId === selectedStoreId) : [];
  const storeName = storeProducts[0]?.sellerName || 'Verified Merchant Store';

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = typeof a.price === 'number' ? a.price : 0;
    const priceB = typeof b.price === 'number' ? b.price : 0;

    if (sortBy === 'lowToHigh') return priceA - priceB;
    if (sortBy === 'highToLow') return priceB - priceA;
    if (sortBy === 'newest') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    }
    const salesA = typeof a.salesCount === 'number' ? a.salesCount : 0;
    const salesB = typeof b.salesCount === 'number' ? b.salesCount : 0;
    return salesB - salesA; // 'popular'
  });

  const handleClearAllFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    handleSelectStore(null);
    setPriceFilter({
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      freeDeliveryOnly: false,
      minRating: null,
    });
  };

  const hasAnyFilterActive =
    Boolean(selectedCategory) ||
    Boolean(searchQuery) ||
    Boolean(selectedStoreId) ||
    priceFilter.minPrice !== null ||
    priceFilter.maxPrice !== null ||
    priceFilter.inStockOnly ||
    priceFilter.freeDeliveryOnly ||
    priceFilter.minRating !== null;

  const handleBuyNow = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    setSelectedProduct(null);
    if (!currentUser) {
      setAuthModalOpen(true);
    } else {
      setCheckoutModalOpen(true);
    }
  };

  const handleOrderSuccess = (orderId: string) => {
    setCheckoutModalOpen(false);
    setOrderSuccessId(orderId);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-orange-100 selection:text-[#F57224] pb-16 md:pb-0">
      {/* Header */}
      <Header
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenOrders={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setOrdersModalOpen(true);
        }}
        onOpenSeller={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setSellerDashboardOpen(true);
        }}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onOpenNotifications={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setNotificationsModalOpen(true);
        }}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenWishlist={() => setWishlistModalOpen(true)}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Order Success Banner */}
      {orderSuccessId && (
        <div className="bg-emerald-600 text-white py-3 px-4 shadow-md sticky top-[108px] z-30 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>
                Order Placed Successfully! Order ID:{' '}
                <span className="font-mono font-bold bg-emerald-700 px-2 py-0.5 rounded">
                  #{orderSuccessId.slice(0, 10)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setOrderSuccessId(null);
                  setOrdersModalOpen(true);
                }}
                className="underline hover:text-emerald-100 font-bold"
              >
                Track Order Status
              </button>
              <button
                onClick={() => setOrderSuccessId(null)}
                className="p-1 hover:bg-emerald-700 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Prominent Back Button (Visible when viewing category, store, or search results) */}
        {hasAnyFilterActive && (
          <div className="flex items-center justify-between bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-xs animate-in fade-in duration-150">
            <button
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all transform active:scale-98 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF9900]" />
              <span>← Reset All Filters & View All Products</span>
            </button>

            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Active discovery view: <strong className="text-slate-800 font-bold">{selectedStoreId ? storeName : selectedCategory ? CATEGORIES.find(c=>c.id===selectedCategory)?.name : searchQuery ? `Search: "${searchQuery}"` : 'Custom Price Filter'}</strong>
            </span>
          </div>
        )}
        {/* Banner Carousel & Features Strip (Shown on home view) */}
        {!selectedCategory && !searchQuery && !selectedStoreId && (
          <>
            <BannerSlider onExploreClick={() => setSelectedCategory('electronics')} />
            <FlashSale
              products={products}
              onSelectProduct={handleSelectProduct}
              onViewAllFlashSales={() => setSelectedCategory('electronics')}
            />
            <CategoryGrid onSelectCategory={setSelectedCategory} />
          </>
        )}

        {/* Store Showcase Header Banner */}
        {selectedStoreId && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700 space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF9900] to-[#FF5500] flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white/20 shrink-0">
                  <Store className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black">{storeName}</h2>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Cart Go Merchant
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {sellerReviews.length > 0
                        ? (sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length).toFixed(1)
                        : '5.0'}{' '}
                      / 5.0
                    </span>
                    <span>•</span>
                    <span>{sellerReviews.length} Buyer Review{sellerReviews.length === 1 ? '' : 's'}</span>
                    <span>•</span>
                    <span>{storeProducts.length} Product{storeProducts.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStoreId) {
                      openCustomerChatWithSeller(selectedStoreId, storeName);
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Seller</span>
                </button>

                <button
                  onClick={async () => {
                    const url = getShareableStoreUrl(selectedStoreId);
                    const res = await shareUrl({
                      title: `${storeName} on Cart Go`,
                      text: `Check out ${storeName}'s store on Cart Go!`,
                      url,
                    });
                    if (res === 'copied' || res === 'shared') {
                      setStoreShareCopied(true);
                      setTimeout(() => setStoreShareCopied(false), 2500);
                    }
                  }}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
                >
                  {storeShareCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
                  <span>{storeShareCopied ? 'Store Link Copied!' : 'Share Store Link'}</span>
                </button>

                <button
                  onClick={() => handleSelectStore(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700 shrink-0"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Store View</span>
                </button>
              </div>
            </div>

            {/* Buyer Reviews Section for Seller */}
            <div className="pt-4 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Buyer Reviews & Ratings for {storeName} ({sellerReviews.length})</span>
                </h3>
              </div>

              {/* Form to submit review for seller */}
              {currentUser ? (
                <form onSubmit={handleAddSellerReview} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">Give your review about this seller</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Seller Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewSellerRating(s)}
                          className="p-0.5 focus:outline-none"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= newSellerRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    placeholder={`Write your experience with seller ${storeName}...`}
                    value={newSellerComment}
                    onChange={(e) => setNewSellerComment(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                  />

                  <div className="flex items-center justify-between">
                    {sellerReviewSuccess ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Review submitted for seller!
                      </span>
                    ) : (
                      <span></span>
                    )}
                    <button
                      type="submit"
                      disabled={submittingSellerReview || !newSellerComment.trim()}
                      className="px-4 py-2 bg-[#FF5500] hover:bg-[#E04400] text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submittingSellerReview ? 'Submitting...' : 'Post Seller Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-400 text-center">
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="text-[#FF5500] font-bold hover:underline"
                  >
                    Register or Login
                  </button>{' '}
                  to submit a review about this seller.
                </div>
              )}

              {/* List of Seller Reviews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {sellerReviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic col-span-2">
                    No buyer reviews for this seller yet. Be the first buyer to review {storeName}!
                  </p>
                ) : (
                  sellerReviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{rev.buyerName}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Items Grid */}
        <div className="space-y-4">
          {/* Price Range Slider & Discovery Filters */}
          <PriceFilterBar
            absoluteMin={absoluteMinPrice}
            absoluteMax={absoluteMaxPrice}
            filterState={priceFilter}
            onFilterChange={setPriceFilter}
            totalMatching={sortedProducts.length}
            totalProducts={products.length}
          />

          {/* Section Header with Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F57224]" />
                <span>
                  {selectedStoreId
                    ? `Store Showcase: ${storeName}`
                    : selectedCategory
                    ? CATEGORIES.find((c) => c.id === selectedCategory)?.name
                    : searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : 'All Products & Daily Marketplace Listings'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {sortedProducts.length} items from verified sellers
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {/* Category / Store / Price Clear Badge */}
              {hasAnyFilterActive && (
                <button
                  onClick={handleClearAllFilters}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Clear All Filters ✕
                </button>
              )}

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-medium">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="lowToHigh">Price: Low to High</option>
                  <option value="highToLow">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs animate-pulse space-y-3"
                >
                  <div className="aspect-square bg-slate-200 rounded-lg w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4 shadow-2xs">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {hasAnyFilterActive
                  ? 'No products match your price range or filter criteria'
                  : 'No Products Listed Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {hasAnyFilterActive
                  ? 'Try adjusting your min/max price range, clearing price presets, or resetting filters.'
                  : 'The marketplace currently has no active product listings. Click below to add your first product listing as a seller!'}
              </p>
              <div className="flex justify-center gap-3">
                {hasAnyFilterActive && (
                  <button
                    onClick={handleClearAllFilters}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!currentUser) setAuthModalOpen(true);
                    else setSellerDashboardOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#FF5500] text-white text-xs font-bold rounded-xl hover:bg-[#E04400] transition-colors flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>List a Product on Cart Go</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleSelectProduct}
                  onSelectStore={handleSelectStore}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#111827] text-slate-400 text-xs mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-3">
              <CartGoLogo size="sm" variant="dark" />
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The fast & reliable online marketplace connecting buyers and sellers everywhere. Buy tech, fashion, health, and home appliances with 100% verified authenticity and safe Cash on Delivery.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Customer Care & Support</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="text-slate-300 font-medium">
                Support Email:{' '}
                <a href="mailto:cartgosupport@gmail.com" className="text-[#FF5500] hover:underline font-bold">
                  cartgosupport@gmail.com
                </a>
              </li>
              <li className="hover:text-orange-400 cursor-pointer">Help Center & FAQs</li>
              <li className="hover:text-orange-400 cursor-pointer">How to Buy & Track</li>
              <li className="hover:text-orange-400 cursor-pointer">Merchant & Buyer Policy</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Earn With Cart Go</h4>
            <ul className="space-y-2 text-[11px]">
              <li
                onClick={() => {
                  if (!currentUser) setAuthModalOpen(true);
                  else setSellerDashboardOpen(true);
                }}
                className="hover:text-orange-400 cursor-pointer font-bold text-orange-400 flex items-center gap-1"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Sell on Cart Go</span>
              </li>
              <li className="text-slate-400 text-[10px] leading-tight bg-slate-800/80 p-2 rounded border border-slate-700/80">
                <strong className="text-orange-400 block mb-0.5">Seller Courier Notice:</strong>
                You configure your favourite courier company to deliver it to your customer. For sellers, delivery charges may not always be shown on checkout but will be included.
              </li>
              <li className="hover:text-orange-400 cursor-pointer">Seller Code of Conduct</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Payment & Delivery</h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Cash on Delivery (COD) is the primary method of payment. Delivery charges are calculated based on your location.
            </p>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white font-extrabold rounded text-[10px]">
                COD ONLY
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                Safe Delivery
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} Cart Go. All rights reserved. Built with React & Firebase.
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onProceedToCheckout={() => {
          setCartDrawerOpen(false);
          if (!currentUser) setAuthModalOpen(true);
          else setCheckoutModalOpen(true);
        }}
      />
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />
      <CheckoutSuccessToast
        orderId={orderSuccessId}
        onClose={() => setOrderSuccessId(null)}
        onViewOrder={(_id) => {
          setOrderSuccessId(null);
          setOrdersModalOpen(true);
        }}
      />
      <SellerDashboard
        isOpen={sellerDashboardOpen}
        onClose={() => setSellerDashboardOpen(false)}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
      />
      <AdminDashboard
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
      />
      <OrdersModal
        isOpen={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
      />
      <WishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        onSelectProduct={handleSelectProduct}
      />
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => handleSelectProduct(null)}
        onBuyNow={handleBuyNow}
        onSelectStore={handleSelectStore}
      />
      <CustomerChatModal
        onOpenProduct={(prod) => handleSelectProduct(prod)}
        onOpenStore={(storeId) => handleSelectStore(storeId)}
      />

      {/* Sticky Mobile Bottom Navigation Bar for easy 1-click access to Login/Register */}
      <MobileBottomNav
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenOrders={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setOrdersModalOpen(true);
        }}
        onOpenSeller={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setSellerDashboardOpen(true);
        }}
        onOpenNotifications={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setNotificationsModalOpen(true);
        }}
        onResetHome={() => {
          setSelectedCategory(null);
          setSearchQuery('');
          setSelectedStoreId(null);
        }}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ChatProvider>
          <MarketplaceMain />
        </ChatProvider>
      </CartProvider>
    </AuthProvider>
  );
}
