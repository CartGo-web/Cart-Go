import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PlusCircle,
  Package,
  ShoppingBag,
  TrendingUp,
  Image as ImageIcon,
  Trash2,
  Edit,
  CheckCircle,
  Store,
  Sparkles,
  UploadCloud,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Eye,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ArrowLeft,
  Bell,
  Truck,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Product, Order, OrderStatus, SellerNotification } from '../types';
import { CATEGORIES } from '../data/categories';
import { db } from '../lib/firebase';
import { formatPKR } from '../utils/formatters';
import { getShareableProductUrl, getShareableStoreUrl, shareUrl } from '../utils/share';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517668808822-9e428824603b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  const { currentUser, userProfile, isAdmin, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'add' | 'products' | 'orders' | 'notifications' | 'about'>('add');

  // Notifications State
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [sellerPhone, setSellerPhone] = useState(userProfile?.phone || '');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [stock, setStock] = useState('20');
  const [isFlashSale, setIsFlashSale] = useState(false);

  useEffect(() => {
    if (userProfile?.phone) {
      setSellerPhone(userProfile.phone);
    }
  }, [userProfile]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mainFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  const [storeCopied, setStoreCopied] = useState(false);
  const [sharedProductId, setSharedProductId] = useState<string | null>(null);

  // Newly Created Link Popup/Modal State
  const [newlyCreatedLinkInfo, setNewlyCreatedLinkInfo] = useState<{
    productId: string;
    productTitle: string;
    productUrl: string;
    storeUrl: string;
  } | null>(null);
  const [copiedProdLink, setCopiedProdLink] = useState(false);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);

  const handleShareMyStore = async () => {
    if (!currentUser) return;
    const url = getShareableStoreUrl(currentUser.uid);
    const result = await shareUrl({
      title: `${userProfile?.displayName || 'Merchant'}'s Store on Cart Go`,
      text: `Visit my store on Cart Go to check out my latest products!`,
      url,
    });
    if (result === 'copied' || result === 'shared') {
      setStoreCopied(true);
      setTimeout(() => setStoreCopied(false), 2500);
    }
  };

  const handleShareProduct = async (p: Product) => {
    const url = getShareableProductUrl(p.id);
    const result = await shareUrl({
      title: p.title,
      text: `Check out ${p.title} on Cart Go!`,
      url,
    });
    if (result === 'copied' || result === 'shared') {
      setSharedProductId(p.id);
      setTimeout(() => setSharedProductId(null), 2500);
    }
  };

  // My Products & Orders
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Buyer Details Modal State
  const [selectedBuyerOrder, setSelectedBuyerOrder] = useState<Order | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const compressImageFile = (file: File, maxSide = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSide) {
              height = Math.round((height * maxSide) / width);
              width = maxSide;
            }
          } else {
            if (height > maxSide) {
              width = Math.round((width * maxSide) / height);
              height = maxSide;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } else {
            resolve((event.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.src = (event.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const ensureCompressedDataUrl = (dataUrl: string, maxDimension = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files) as File[]) {
      try {
        const compressedBase64 = await compressImageFile(file, 800, 0.7);
        if (compressedBase64) {
          if (isGallery) {
            setAdditionalImages((prev) => [...prev, compressedBase64]);
          } else {
            setImageUrl(compressedBase64);
          }
        }
      } catch (err) {
        console.warn('Image upload compression error:', err);
      }
    }
    e.target.value = '';
  };

  const handleRemoveAdditionalImage = (indexToRemove: number) => {
    setAdditionalImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Seller Products
    const qProd = query(collection(db, 'products'), where('sellerId', '==', currentUser.uid));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setMyProducts(list);
    }, (err) => console.warn('Seller products listener error:', err));

    // Fetch All Orders to filter items belonging to this seller
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        const sellerItems = orderData.items.filter((item) => item.sellerId === currentUser.uid);
        if (sellerItems.length > 0) {
          list.push({ ...orderData, items: sellerItems });
        }
      });
      setSellerOrders(list);
    }, (err) => console.warn('Seller orders listener error:', err));

    // Fetch Seller Notifications
    const qNotifs = query(collection(db, 'notifications'));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      const list: SellerNotification[] = [];
      snapshot.forEach((docSnap) => {
        const notifData = { id: docSnap.id, ...docSnap.data() } as SellerNotification;
        if (notifData.recipientId === 'all' || notifData.recipientId === currentUser.uid) {
          list.push(notifData);
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    }, (err) => console.warn('Seller notifications listener error:', err));

    return () => {
      unsubProd();
      unsubOrders();
      unsubNotifs();
    };
  }, [currentUser]);

  if (!isOpen) return null;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const contactPhone = sellerPhone || userProfile?.phone || '';
      if (!contactPhone.trim()) {
        throw new Error('Seller contact phone number is compulsory to publish listings on Cart Go.');
      }

      if (!userProfile?.phone && contactPhone.trim()) {
        await updateUserProfile({ phone: contactPhone.trim() });
      }

      // Default fallback picture if seller does not provide an image URL or upload
      let finalMainImage = imageUrl ? imageUrl.trim() : '';
      if (!finalMainImage) {
        finalMainImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
      } else if (finalMainImage.startsWith('data:image/')) {
        finalMainImage = await ensureCompressedDataUrl(finalMainImage, 800, 0.7);
      }

      // Compress additional gallery images and filter out reference sample photos
      let finalGallery: string[] = [];
      if (additionalImages && additionalImages.length > 0) {
        for (const imgStr of additionalImages) {
          if (imgStr.startsWith('data:image/')) {
            const compressed = await ensureCompressedDataUrl(imgStr, 800, 0.7);
            finalGallery.push(compressed);
          } else {
            finalGallery.push(imgStr);
          }
        }
      }

      // Strip out any reference sample preset images so only genuine seller photos are saved
      finalGallery = finalGallery.filter(
        (img) => img && !PRESET_IMAGES.includes(img) && img !== finalMainImage
      );

      const parsedPrice = parseFloat(price) || 0;
      const parsedStock = parseInt(stock, 10) || 0;
      const parsedOriginal = originalPrice ? parseFloat(originalPrice) : null;

      const newProductPayload: Record<string, any> = {
        title,
        description,
        price: parsedPrice,
        category,
        imageUrl: finalMainImage,
        stock: parsedStock,
        sellerId: currentUser.uid,
        sellerName: userProfile?.displayName || 'Cart Go Seller',
        sellerPhone: contactPhone.trim(),
        rating: 5.0,
        reviewCount: 0,
        salesCount: 0,
        isFlashSale,
        createdAt: new Date().toISOString(),
      };

      if (parsedOriginal !== null && !isNaN(parsedOriginal)) {
        newProductPayload.originalPrice = parsedOriginal;
      }

      if (finalGallery.length > 0) {
        newProductPayload.additionalImages = finalGallery;
      }

      // Check estimated size
      let payloadSize = JSON.stringify(newProductPayload).length;
      if (payloadSize > 800000) {
        // Apply aggressive compression if still over 800KB
        finalMainImage = await ensureCompressedDataUrl(finalMainImage, 600, 0.5);
        finalGallery = await Promise.all(finalGallery.map((g) => ensureCompressedDataUrl(g, 600, 0.5)));
        newProductPayload.imageUrl = finalMainImage;
        if (finalGallery.length > 0) {
          newProductPayload.additionalImages = finalGallery;
        }
        payloadSize = JSON.stringify(newProductPayload).length;
      }

      if (payloadSize >= 1000000) {
        throw new Error('Product payload with attached images is too large. Please reduce the number or resolution of images.');
      }

      const docRef = await addDoc(collection(db, 'products'), newProductPayload);
      const newProdId = docRef.id;
      const prodUrl = getShareableProductUrl(newProdId);
      const storeUrl = getShareableStoreUrl(currentUser.uid);

      // Save for popup link display
      setNewlyCreatedLinkInfo({
        productId: newProdId,
        productTitle: title,
        productUrl: prodUrl,
        storeUrl: storeUrl,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setOriginalPrice('');
      setImageUrl('');
      setAdditionalImages([]);
      setSuccessMsg('Product published successfully & shareable link created!');
      setTimeout(() => setSuccessMsg(null), 5000);
      setActiveTab('products');
    } catch (err: any) {
      console.error('Failed to publish product', err);
      setErrorMsg(err.message || 'Failed to publish product. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingId(productId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteDoc(doc(db, 'products', productId));
      setMyProducts((prev) => prev.filter((p) => p.id !== productId));
      setSuccessMsg('Product deleted successfully from marketplace.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete product', err);
      setErrorMsg('Failed to delete product: ' + (err.message || 'Permission or network error'));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  const handleCleanAllData = async () => {
    if (!window.confirm('Are you sure you want to clean ALL sample products, customer orders, and local cart data? This will clear all existing sample items.')) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Delete all products
      const prodSnap = await getDocs(collection(db, 'products'));
      for (const docSnap of prodSnap.docs) {
        await deleteDoc(doc(db, 'products', docSnap.id));
      }

      // Delete all orders
      const orderSnap = await getDocs(collection(db, 'orders'));
      for (const docSnap of orderSnap.docs) {
        await deleteDoc(doc(db, 'orders', docSnap.id));
      }

      // Clear local storage
      localStorage.removeItem('cartgo_cart_v1');
      localStorage.removeItem('cartgo_wishlist_v1');
      localStorage.removeItem('daraz_cart_v1');
      localStorage.removeItem('daraz_wishlist_v1');

      setMyProducts([]);
      setSellerOrders([]);
      setSuccessMsg('All sample data, products, and customer orders have been cleaned successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error cleaning sample data:', err);
      setErrorMsg('Failed to clean sample data: ' + (err.message || 'Error occurred'));
    }
  };

  const totalEarnings = sellerOrders.reduce((acc, order) => {
    const orderSum = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return acc + orderSum;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-[#111827] p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors shrink-0"
              title="Back to Marketplace"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#FF5500] flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>Cart Go Seller Center</span>
              </h2>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-[#FF9900] font-semibold">{userProfile?.displayName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {(isAdmin || userProfile?.role === 'admin') && onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all border border-amber-300"
                title="Open Super Admin Console"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-900" />
                <span>Super Admin Console</span>
              </button>
            )}
            {currentUser && (
              <button
                onClick={handleShareMyStore}
                className="px-3 py-1.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all hidden sm:flex"
                title="Copy public store link to share with customers"
              >
                {storeCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{storeCopied ? 'Store Link Copied!' : 'Share My Store Link'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-50 text-[#FF5500]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Active Listings</span>
              <div className="text-base font-extrabold text-slate-900">{myProducts.length}</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Orders</span>
              <div className="text-base font-extrabold text-slate-900">{sellerOrders.length}</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Sales Revenue</span>
              <div className="text-base font-extrabold text-[#FF5500]">{formatPKR(totalEarnings)}</div>
            </div>
          </div>
        </div>

        {/* Store Link Showcase Banner */}
        {currentUser && (
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-y border-orange-200/80 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-[#FF9900] to-[#FF5500] text-white rounded-xl shadow-xs shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Your Merchant Store Link</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Live Link
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                  {getShareableStoreUrl(currentUser.uid)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShareMyStore}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#FF5500] hover:bg-[#E04400] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                {storeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{storeCopied ? 'Store Link Copied!' : 'Copy Store Link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 pt-2 bg-white gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('add')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'add'
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Product</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Listings ({myProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Received Customer Orders ({sellerOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors relative ${
                activeTab === 'notifications'
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>System Notifications ({notifications.length})</span>
              {notifications.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>About Seller & Courier</span>
            </button>
          </div>

          {/* Clean All Sample Data Button */}
          <button
            onClick={handleCleanAllData}
            className="mb-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            title="Clean all sample products and orders"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clean All Sample Data</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {/* Newly Created Product Link Card */}
          {newlyCreatedLinkInfo && (
            <div className="mb-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl shadow-lg relative animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setNewlyCreatedLinkInfo(null)}
                className="absolute top-3 right-3 text-emerald-600 hover:text-emerald-900 p-1 rounded-full hover:bg-emerald-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>🎉 Product Published & Links Created!</span>
              </div>
              <p className="text-xs text-emerald-700 font-semibold mb-4">
                Share your newly listed product link or store page link with your customers anywhere:
              </p>

              <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                {/* Product Link Box */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Direct Link for "{newlyCreatedLinkInfo.productTitle}"
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedLinkInfo.productUrl}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await shareUrl({
                          title: newlyCreatedLinkInfo.productTitle,
                          text: `Check out ${newlyCreatedLinkInfo.productTitle} on Cart Go!`,
                          url: newlyCreatedLinkInfo.productUrl,
                        });
                        if (result === 'copied' || result === 'shared') {
                          setCopiedProdLink(true);
                          setTimeout(() => setCopiedProdLink(false), 2000);
                        }
                      }}
                      className="px-3 py-2 bg-[#FF5500] hover:bg-[#E04400] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      {copiedProdLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedProdLink ? 'Copied!' : 'Copy Product Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Store Link Box */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Your Store Page Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedLinkInfo.storeUrl}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const result = await shareUrl({
                          title: `${userProfile?.displayName || 'Merchant'}'s Store`,
                          text: `Visit my store on Cart Go!`,
                          url: newlyCreatedLinkInfo.storeUrl,
                        });
                        if (result === 'copied' || result === 'shared') {
                          setCopiedStoreLink(true);
                          setTimeout(() => setCopiedStoreLink(false), 2000);
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      {copiedStoreLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedStoreLink ? 'Copied!' : 'Copy Store Link'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewlyCreatedLinkInfo(null)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Got It, Done
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* 3% Company Commission Banner */}
              <div className="p-3.5 bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 border-2 border-[#FF5500]/40 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#FF5500] text-white rounded-xl shadow-xs shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Company Sale Fee Policy</span>
                    <p className="text-xs text-[#FF5500] font-extrabold">
                      3 percent of your sale will be given to our company.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-[#FF5500] text-white px-2.5 py-1 rounded-full uppercase shrink-0">
                  3% Fee
                </span>
              </div>

              {/* Courier Delivery & Support Notice */}
              <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-orange-200/90 rounded-2xl shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                    <Truck className="w-4.5 h-4.5 text-[#FF5500]" />
                    <span>Seller Courier Delivery & Shipping Setup</span>
                  </div>
                  <span className="text-[10px] bg-orange-100 text-[#FF5500] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    Important Notice
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  You configure your favourite courier company to deliver it to your customer. For seller, sometimes delivery charges may not be shown on checkout but it will be included.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-800 font-bold pt-1 border-t border-orange-200/70">
                  <Mail className="w-4 h-4 text-[#FF5500]" />
                  <span>Support Email:</span>
                  <a
                    href="mailto:cartgosupport@gmail.com"
                    className="text-[#FF5500] hover:underline font-extrabold"
                  >
                    cartgosupport@gmail.com
                  </a>
                </div>
              </div>
              <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#FF5500]" />
                  <span className="text-xs font-bold text-slate-800">
                    Seller Contact Number <span className="text-[#FF5500]">*</span>
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-48 sm:w-64 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wireless Noise Cancelling Headphones"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sale Price (PKR / Rs.) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="1500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Price (PKR / Rs.)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="2500"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                  />
                </div>
              </div>

              {/* Product Picture Upload Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#F57224]" />
                    <span>Product Pictures & Photos</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Upload from device or enter URL
                  </span>
                </div>

                {/* Main Cover Picture Upload */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Main Cover Picture *
                  </span>

                  <input
                    type="file"
                    ref={mainFileInputRef}
                    onChange={(e) => handleFileUpload(e, false)}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => mainFileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:border-[#F57224] rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <UploadCloud className="w-4 h-4 text-[#F57224]" />
                      <span>Upload Main Picture from Computer / Mobile</span>
                    </button>

                    {imageUrl && (
                      <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-lg">
                        <img
                          src={imageUrl}
                          alt="Cover preview"
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <span className="text-[10px] text-emerald-600 font-bold">Main Photo Ready</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Gallery Pictures */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Additional Product Views & Angle Photos (Optional)
                  </span>

                  <input
                    type="file"
                    ref={galleryFileInputRef}
                    onChange={(e) => handleFileUpload(e, true)}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  <div className="flex flex-wrap gap-2 items-center">
                    {additionalImages.map((img, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                          title="Remove picture"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#F57224] flex flex-col items-center justify-center text-slate-500 hover:text-[#F57224] transition-colors bg-white"
                      title="Add more pictures"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[9px] font-bold">+Photo</span>
                    </button>
                  </div>
                </div>

                {/* Image URL fallback */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    (Optional) Paste Image URL directly:
                  </span>
                  <input
                    type="url"
                    placeholder="https://example.com/my-product-photo.jpg (optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#F57224]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide key features, materials, warranty details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="flash"
                  checked={isFlashSale}
                  onChange={(e) => setIsFlashSale(e.target.checked)}
                  className="w-4 h-4 text-[#F57224] rounded accent-[#F57224]"
                />
                <label htmlFor="flash" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Feature in Cart Go Daily Flash Sale section
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#F57224] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                {submitting ? 'Publishing Listing...' : 'Publish Product to Marketplace'}
              </button>
            </form>
          )}

          {activeTab === 'products' && (
            <div className="space-y-3">
              {myProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  You haven't listed any products yet. Switch to "List New Product" to create your first listing!
                </p>
              ) : (
                myProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-12 h-12 rounded-lg object-cover bg-white"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                          <span className="text-[#F57224] font-bold">{formatPKR(p.price)}</span>
                          <span>Stock: {p.stock}</span>
                          <span className="capitalize">Category: {p.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareProduct(p)}
                        className="p-2 text-slate-500 hover:text-[#FF5500] hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Share Product Link"
                      >
                        {sharedProductId === p.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {sharedProductId === p.id ? 'Copied!' : 'Share Link'}
                        </span>
                      </button>

                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                          <span className="text-[10px] font-bold text-rose-700 px-1">Delete product?</span>
                          <button
                            type="button"
                            disabled={deletingId === p.id}
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded transition-colors"
                          >
                            {deletingId === p.id ? 'Deleting...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {sellerOrders.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No orders received yet. Once buyers order your products, they will appear here!
                </p>
              ) : (
                sellerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">Order ID: #{order.id.slice(0, 8)}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-[#F57224]" />
                          <span>Buyer: <strong className="text-slate-800">{order.shippingAddress?.fullName || order.buyerName}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBuyerOrder(order)}
                          className="px-3 py-1.5 bg-[#F57224]/10 hover:bg-[#F57224] text-[#F57224] hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Buyer Details</span>
                        </button>

                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#F57224]"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Contact & Location Bar */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-3 text-slate-600">
                          {order.shippingAddress?.phone && (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <strong className="text-slate-900">{order.shippingAddress.phone}</strong>
                            </span>
                          )}
                          {order.shippingAddress?.city && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#F57224] shrink-0" />
                              <span>City: <strong className="text-slate-900">{order.shippingAddress.city}</strong></span>
                            </span>
                          )}
                        </div>

                        <div className="text-[#F57224] font-black text-sm">
                          Total: {formatPKR(order.totalAmount)}
                        </div>
                      </div>

                      {/* Full Shipping Address Display */}
                      {order.shippingAddress && (
                        <div className="flex items-start gap-1.5 text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                          <MapPin className="w-3.5 h-3.5 text-[#F57224] shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <span className="font-extrabold text-slate-900 mr-1">Delivery Address:</span>
                            <span>{order.shippingAddress.fullName} — {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode ? `(${order.shippingAddress.postalCode})` : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ordered Items */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <span className="font-medium text-slate-700">{item.title}</span>
                          </div>
                          <span className="font-bold text-slate-800">
                            {item.quantity} x {formatPKR(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-[#FF5500]/10 border border-[#FF5500]/20 p-4 rounded-xl flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#FF5500] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Platform Announcements & Admin Alerts</h4>
                  <p className="text-[11px] text-slate-600">Official updates from Cart Go Super Admin team</p>
                </div>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  No notifications received yet. Announcements from the administration team will appear here!
                </p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF5500]"></span>
                        <span>{notif.title}</span>
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {notif.message}
                    </p>
                    <div className="text-[10px] text-slate-400 font-medium">
                      From: <strong className="text-slate-700">{notif.senderName || 'Cart Go Administration'}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-md border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-tr from-[#FF9900] to-[#FF5500] rounded-xl text-white shadow-sm shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">About Seller Operations on Cart Go</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Merchant guidelines, courier configuration, delivery charges, and support information
                    </p>
                  </div>
                </div>
              </div>

              {/* 3% Company Sale Commission Fee Section */}
              <div className="p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-2 border-[#FF5500]/40 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-sm">
                  <Sparkles className="w-5 h-5 text-[#FF5500]" />
                  <span>Company Sale Fee Policy</span>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-orange-200 text-xs space-y-1">
                  <p className="font-extrabold text-[#FF5500] text-sm">
                    3 percent of your sale will be given to our company.
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Cart Go charges a flat 3% commission on completed seller sales to maintain database synchronization, cloud security, merchant tools, and platform hosting.
                  </p>
                </div>
              </div>

              {/* Courier Configuration Section */}
              <div className="p-5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-amber-950 font-extrabold text-sm">
                  <Truck className="w-5 h-5 text-[#FF5500]" />
                  <span>Courier & Delivery Charges Notice for Sellers</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-amber-200 text-xs text-slate-800 space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-900 text-xs">
                    "You configure your favourite courier company to deliver it to your customer, for seller sometimes delivery charges may not be shown on checkout but it will be included."
                  </p>
                  <p className="text-slate-600">
                    As an independent merchant on Cart Go, you have full freedom to partner with any preferred logistics or courier service (e.g. TCS, Leopards, Trax, M&P, Rider, or local COD dispatchers).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs space-y-1">
                    <span className="font-extrabold text-slate-900 block">1. Flexible Logistics Setup</span>
                    <p className="text-slate-600 text-[11px]">
                      Select any courier that suits your origin city and pricing structure. Booking numbers and tracking details can be shared with buyers directly.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs space-y-1">
                    <span className="font-extrabold text-slate-900 block">2. Delivery Charges Billing</span>
                    <p className="text-slate-600 text-[11px]">
                      Even if delivery fees are not itemized at the instant buyer checkout, the courier fee will be included when dispatching and collecting Cash on Delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Email Section */}
              <div className="p-5 bg-blue-50/90 border-2 border-blue-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-blue-950 font-extrabold text-sm">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Official Cart Go Seller Support</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Have questions about your seller account, payouts, order dispatches, or listing verification? Our official support team is here to assist you:
                </p>

                <div className="p-4 bg-white rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5500] flex items-center justify-center font-bold shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Dedicated Seller Helpdesk</span>
                      <a
                        href="mailto:cartgosupport@gmail.com"
                        className="text-sm font-black text-[#FF5500] hover:underline"
                      >
                        cartgosupport@gmail.com
                      </a>
                    </div>
                  </div>

                  <a
                    href="mailto:cartgosupport@gmail.com"
                    className="px-4 py-2 bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white font-bold text-xs rounded-xl hover:shadow-md transition-all shrink-0"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buyer Details Modal */}
      {selectedBuyerOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#F57224] p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <User className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-bold">Buyer & Delivery Details</h3>
                  <p className="text-xs text-orange-100">Order ID #{selectedBuyerOrder.id.slice(0, 10)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBuyerOrder(null)}
                className="p-1 rounded-full hover:bg-orange-600 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Buyer Profile Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#F57224]" />
                    <span>Buyer Contact Details</span>
                  </h4>
                  <span className="text-[10px] bg-orange-100 text-[#F57224] font-extrabold px-2 py-0.5 rounded-full">
                    Verified Customer
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-bold text-slate-900">
                      {selectedBuyerOrder.shippingAddress?.fullName || selectedBuyerOrder.buyerName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedBuyerOrder.buyerEmail || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedBuyerOrder.shippingAddress?.phone || 'N/A'}
                      </span>
                      {selectedBuyerOrder.shippingAddress?.phone && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                selectedBuyerOrder.shippingAddress?.phone || '',
                                'phone'
                              )
                            }
                            className="p-1 text-slate-500 hover:text-[#F57224] rounded transition-colors"
                            title="Copy phone number"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`tel:${selectedBuyerOrder.shippingAddress?.phone}`}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition-colors"
                          >
                            Call
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#F57224]" />
                    <span>Shipping Address</span>
                  </h4>
                  {selectedBuyerOrder.shippingAddress?.address && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          `${selectedBuyerOrder.shippingAddress?.fullName}, ${selectedBuyerOrder.shippingAddress?.address}, ${selectedBuyerOrder.shippingAddress?.city} ${selectedBuyerOrder.shippingAddress?.postalCode}`,
                          'address'
                        )
                      }
                      className="text-[10px] font-bold text-[#F57224] hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'address' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-800">
                  <p className="font-semibold">{selectedBuyerOrder.shippingAddress?.address || 'Address not provided'}</p>
                  <p className="text-slate-600">
                    City: <strong className="text-slate-800">{selectedBuyerOrder.shippingAddress?.city || 'N/A'}</strong> • Postal Code: <strong className="text-slate-800">{selectedBuyerOrder.shippingAddress?.postalCode || 'N/A'}</strong>
                  </p>
                </div>
              </div>

              {/* Payment & Order Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#F57224]" />
                    Payment Method
                  </span>
                  <p className="font-extrabold text-slate-900 uppercase">
                    {selectedBuyerOrder.paymentMethod === 'cod'
                      ? 'Cash on Delivery (COD)'
                      : selectedBuyerOrder.paymentMethod === 'card'
                      ? 'Credit / Debit Card'
                      : 'Digital Wallet'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Order Status
                  </span>
                  <select
                    value={selectedBuyerOrder.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus;
                      handleUpdateOrderStatus(selectedBuyerOrder.id, newStatus);
                      setSelectedBuyerOrder({ ...selectedBuyerOrder, status: newStatus });
                    }}
                    className="w-full p-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-[#F57224]"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Ordered Products ({selectedBuyerOrder.items.length})
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedBuyerOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-10 h-10 object-cover rounded-md bg-white border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatPKR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">Total Order Amount:</span>
                  <span className="font-black text-lg text-[#F57224]">
                    {formatPKR(selectedBuyerOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 text-right shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBuyerOrder(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Close Buyer Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
