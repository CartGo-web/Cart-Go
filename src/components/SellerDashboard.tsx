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
  Tag,
  Bot,
  Wand2,
  Zap,
  RefreshCw,
  Layers,
  Loader2,
  Users,
  UserPlus,
  Shield,
  Key,
  MessageSquare,
} from 'lucide-react';
import { ShopifyImporter } from './ShopifyImporter';
import { ProductTagManager } from './ProductTagManager';
import { ProductVideoManager } from './ProductVideoManager';
import { StoreManagersTab } from './StoreManagersTab';
import { SellerChatTab } from './SellerChatTab';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Product, Order, OrderStatus, SellerNotification, ProductVariant } from '../types';
import { CATEGORIES } from '../data/categories';

const ProductVariantManager: React.FC<{
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}> = ({ variants, onChange }) => {
  const [newOptionTexts, setNewOptionTexts] = useState<Record<string, string>>({});

  const handleAddGroup = (defaultName = '') => {
    const newGroup: ProductVariant = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      name: defaultName,
      options: [],
    };
    onChange([...variants, newGroup]);
  };

  const handleRemoveGroup = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const handleNameChange = (id: string, name: string) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, name } : v)));
  };

  const handleAddOption = (groupId: string) => {
    const text = (newOptionTexts[groupId] || '').trim();
    if (!text) return;
    onChange(
      variants.map((v) => {
        if (v.id === groupId) {
          if (!v.options.includes(text)) {
            return { ...v, options: [...v.options, text] };
          }
        }
        return v;
      })
    );
    setNewOptionTexts((prev) => ({ ...prev, [groupId]: '' }));
  };

  const handleRemoveOption = (groupId: string, optionIndex: number) => {
    onChange(
      variants.map((v) => {
        if (v.id === groupId) {
          return {
            ...v,
            options: v.options.filter((_, idx) => idx !== optionIndex),
          };
        }
        return v;
      })
    );
  };

  return (
    <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-[#FF5500]" />
            <span>Product Variants & Options (Optional)</span>
          </label>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Sellers can add multiple variant groups (e.g. Color, Size, Storage) with more than two variants. If added, buyers must select a variant before purchasing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleAddGroup('')}
          className="px-3 py-1.5 bg-[#FF5500] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Variant Group</span>
        </button>
      </div>

      {/* Quick Preset Group Adders */}
      {variants.length === 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-slate-500">Quick Presets:</span>
          {['Color', 'Size', 'Storage', 'Style', 'Pack / Quantity'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddGroup(preset)}
              className="px-2.5 py-1 bg-white hover:bg-orange-100 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-[#FF5500] text-[11px] font-bold rounded-md transition-colors cursor-pointer"
            >
              + Add {preset}
            </button>
          ))}
        </div>
      )}

      {/* Render Variant Groups */}
      <div className="space-y-3 pt-1">
        {variants.map((v) => (
          <div
            key={v.id}
            className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs relative"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Variant Group Name (e.g. Color, Size, Storage)"
                value={v.name}
                onChange={(e) => handleNameChange(v.id, e.target.value)}
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
              />
              <button
                type="button"
                onClick={() => handleRemoveGroup(v.id)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Remove variant group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Options list */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {v.options.map((opt, optIdx) => (
                <span
                  key={optIdx}
                  className="px-2.5 py-1 bg-orange-100 text-[#FF5500] font-bold text-xs rounded-md flex items-center gap-1.5 border border-orange-200"
                >
                  <span>{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(v.id, optIdx)}
                    className="hover:text-rose-700 text-orange-400 font-extrabold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Input for adding new option */}
              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Add option (e.g. Red, Blue, Small, XL, 128GB)..."
                  value={newOptionTexts[v.id] || ''}
                  onChange={(e) =>
                    setNewOptionTexts((prev) => ({ ...prev, [v.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption(v.id);
                    }
                  }}
                  className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
                />
                <button
                  type="button"
                  onClick={() => handleAddOption(v.id)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>
            {v.options.length === 0 && (
              <p className="text-[10px] text-amber-600 italic font-medium">
                Type an option name above and press Enter or click "+ Add" (sellers can add more than two variants).
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
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
  const { totalUnreadForSeller } = useChat();
  const [activeTab, setActiveTab] = useState<'ai' | 'add' | 'shopify' | 'products' | 'chat' | 'store' | 'managers' | 'orders' | 'notifications' | 'about'>('ai');

  const isStoreManager = userProfile?.role === 'manager';
  const isStoreOwner = userProfile?.role === 'seller' || isAdmin;
  const effectiveSellerId = isStoreManager
    ? (userProfile?.storeId || userProfile?.storeOwnerId || currentUser?.uid || '')
    : (currentUser?.uid || '');
  const effectiveStoreName = isStoreManager
    ? (userProfile?.storeName || 'Assigned Store')
    : (userProfile?.displayName || 'My Store');

  // AI Store Automation State
  const [aiMode, setAiMode] = useState<'create' | 'edit' | 'batch'>('create');
  const [aiRawInput, setAiRawInput] = useState('');
  const [aiSelectedProdId, setAiSelectedProdId] = useState<string>('');
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [aiBatchInput, setAiBatchInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [aiFormPrompt, setAiFormPrompt] = useState('');
  const [aiFormLoading, setAiFormLoading] = useState(false);
  const [aiCustomImage, setAiCustomImage] = useState<string>('');
  const [aiImageUploading, setAiImageUploading] = useState<boolean>(false);

  const handleAiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiImageUploading(true);
    try {
      const compressed = await compressImageFile(file, 800, 0.7);
      if (compressed) {
        setAiCustomImage(compressed);
      } else {
        throw new Error('Image compression returned empty result');
      }
    } catch (err) {
      console.error('Failed to upload custom AI image:', err);
      setAiError('Failed to process image file. Please try a different photo.');
    } finally {
      setAiImageUploading(false);
    }
  };

  // Batch Multi-Product AI State with Custom Pictures
  const [batchModeType, setBatchModeType] = useState<'structured' | 'text'>('structured');
  const [batchItems, setBatchItems] = useState<{ id: string; text: string; customImage: string }[]>([
    { id: '1', text: '', customImage: '' },
    { id: '2', text: '', customImage: '' },
  ]);

  const handleAddBatchItem = () => {
    setBatchItems((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), text: '', customImage: '' },
    ]);
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  const handleBatchItemImageUpload = async (id: string, file: File) => {
    setAiImageUploading(true);
    try {
      const compressed = await compressImageFile(file, 800, 0.7);
      if (compressed) {
        setBatchItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, customImage: compressed } : item))
        );
      }
    } catch (err) {
      console.error('Batch item image upload error:', err);
      setAiError('Failed to process item picture.');
    } finally {
      setAiImageUploading(false);
    }
  };

  const handleBatchMultiPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAiImageUploading(true);
    try {
      const newItems: { id: string; text: string; customImage: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file, 800, 0.7);
        if (compressed) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          newItems.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 6) + i,
            text: `Product Photo: ${cleanName}`,
            customImage: compressed,
          });
        }
      }
      if (newItems.length > 0) {
        setBatchItems((prev) => {
          const validExisting = prev.filter((it) => it.text.trim() || it.customImage);
          return [...validExisting, ...newItems];
        });
        setBatchModeType('structured');
      }
    } catch (err) {
      console.error('Batch multi-photo upload error:', err);
      setAiError('Failed to upload some product photos. Please try again.');
    } finally {
      setAiImageUploading(false);
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);

  // Form State for Adding Product
  const [title, setTitle] = useState('');
  const [sellerPhone, setSellerPhone] = useState(userProfile?.phone || '');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [stock, setStock] = useState('20');
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('0');

  // Store Settings & Name State
  const [storeNameInput, setStoreNameInput] = useState(userProfile?.displayName || '');
  const [storePhoneInput, setStorePhoneInput] = useState(userProfile?.phone || '');
  const [storeAddressInput, setStoreAddressInput] = useState(userProfile?.address || '');
  const [updatingStore, setUpdatingStore] = useState(false);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName && !storeNameInput) setStoreNameInput(userProfile.displayName);
      if (userProfile.phone) {
        setSellerPhone(userProfile.phone);
        if (!storePhoneInput) setStorePhoneInput(userProfile.phone);
      }
      if (userProfile.address && !storeAddressInput) setStoreAddressInput(userProfile.address);
    }
  }, [userProfile]);

  // Product Editing State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editAdditionalImages, setEditAdditionalImages] = useState<string[]>([]);
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editIsFlashSale, setEditIsFlashSale] = useState(false);
  const [editDeliveryFee, setEditDeliveryFee] = useState('0');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const editFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!storeNameInput.trim()) {
      setErrorMsg('Store Name cannot be blank.');
      return;
    }

    setUpdatingStore(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const newName = storeNameInput.trim();
      const newPhone = storePhoneInput.trim();
      const newAddress = storeAddressInput.trim();

      // 1. Update userProfile in Firestore / Auth
      await updateUserProfile({
        displayName: newName,
        phone: newPhone,
        address: newAddress,
      });

      // 2. Update sellerName & sellerPhone on all products listed by this seller in 'products' collection
      const qProds = query(collection(db, 'products'), where('sellerId', '==', currentUser.uid));
      const snapProds = await getDocs(qProds);
      const updatePromises = snapProds.docs.map((docSnap) =>
        updateDoc(doc(db, 'products', docSnap.id), {
          sellerName: newName,
          sellerPhone: newPhone,
        })
      );
      await Promise.all(updatePromises);

      setSuccessMsg(`Store Name & Profile updated to "${newName}" successfully! All your active product listings have been updated.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to update store details:', err);
      setErrorMsg('Failed to update store details: ' + (err.message || 'Error occurred'));
    } finally {
      setUpdatingStore(false);
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditTitle(p.title || '');
    setEditPrice(p.price ? p.price.toString() : '');
    setEditOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setEditStock(p.stock !== undefined ? p.stock.toString() : '20');
    setEditCategory(p.category || CATEGORIES[0].id);
    setEditDescription(p.description || '');
    setEditImageUrl(p.imageUrl || '');
    setEditAdditionalImages(p.additionalImages || []);
    setEditVariants(
      p.variants
        ? p.variants.map((v) => ({
            id: v.id || Math.random().toString(),
            name: v.name,
            options: [...(v.options || [])],
          }))
        : []
    );
    setEditIsFlashSale(!!p.isFlashSale);
    setEditDeliveryFee(p.deliveryFee !== undefined ? p.deliveryFee.toString() : '0');
    setEditTags(p.tags || []);
    setEditVideoUrl(p.videoUrl || '');
  };

  const handleSaveEditedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !currentUser) return;

    if (!editTitle.trim()) {
      setErrorMsg('Product title is required.');
      return;
    }

    setSubmittingEdit(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let finalMainImage = editImageUrl ? editImageUrl.trim() : editingProduct.imageUrl;
      if (finalMainImage.startsWith('data:image/')) {
        finalMainImage = await ensureCompressedDataUrl(finalMainImage, 800, 0.7);
      }

      let finalGallery: string[] = [];
      if (editAdditionalImages && editAdditionalImages.length > 0) {
        for (const imgStr of editAdditionalImages) {
          if (imgStr.startsWith('data:image/')) {
            const compressed = await ensureCompressedDataUrl(imgStr, 800, 0.7);
            finalGallery.push(compressed);
          } else {
            finalGallery.push(imgStr);
          }
        }
      }
      finalGallery = finalGallery.filter((img) => img && !PRESET_IMAGES.includes(img) && img !== finalMainImage);

      const parsedPrice = parseFloat(editPrice) || editingProduct.price;
      const parsedStock = parseInt(editStock, 10);
      const parsedOriginal = editOriginalPrice ? parseFloat(editOriginalPrice) : null;

      const validVariants = editVariants
        .filter((v) => v.name.trim() && v.options && v.options.length > 0)
        .map((v) => ({
          id: v.id || Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: v.name.trim(),
          options: v.options.map((o) => o.trim()).filter(Boolean),
        }));

      const updatedPayload: Record<string, any> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: parsedPrice,
        category: editCategory,
        imageUrl: finalMainImage,
        stock: isNaN(parsedStock) ? editingProduct.stock : parsedStock,
        isFlashSale: editIsFlashSale,
        deliveryFee: parseFloat(editDeliveryFee) || 0,
        additionalImages: finalGallery,
        variants: validVariants,
        tags: editTags,
        videoUrl: editVideoUrl.trim() || '',
        sellerId: editingProduct.sellerId || effectiveSellerId,
        sellerName: editingProduct.sellerName || effectiveStoreName || userProfile?.displayName || storeNameInput || 'Verified Cart Go Seller',
        sellerPhone: sellerPhone || storePhoneInput || editingProduct.sellerPhone || '',
        updatedAt: new Date().toISOString(),
      };

      if (parsedOriginal !== null && !isNaN(parsedOriginal)) {
        updatedPayload.originalPrice = parsedOriginal;
      } else {
        updatedPayload.originalPrice = null;
      }

      const finalPayload = await optimizeProductPayloadSize(updatedPayload);
      await updateDoc(doc(db, 'products', editingProduct.id), finalPayload);

      setSuccessMsg(`"${editTitle.trim()}" updated successfully!`);
      setEditingProduct(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to edit product:', err);
      setErrorMsg('Failed to update product: ' + (err.message || 'Error occurred'));
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleShareMyStore = async () => {
    if (!currentUser || !effectiveSellerId) return;
    const url = getShareableStoreUrl(effectiveSellerId);
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

  const compressImageFile = (file: File, maxSide = 640, quality = 0.65): Promise<string> => {
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

  const ensureCompressedDataUrl = (dataUrl: string, maxDimension = 640, quality = 0.65): Promise<string> => {
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

  const optimizeProductPayloadSize = async (payload: Record<string, any>): Promise<Record<string, any>> => {
    const resultPayload = { ...payload };
    let payloadSize = JSON.stringify(resultPayload).length;

    // Target safe size: 650KB (Firestore maximum per doc is 1MB)
    if (payloadSize <= 650000) {
      return resultPayload;
    }

    // Step 1: Compress images to 500px, quality 0.55
    if (resultPayload.imageUrl && resultPayload.imageUrl.startsWith('data:image/')) {
      resultPayload.imageUrl = await ensureCompressedDataUrl(resultPayload.imageUrl, 500, 0.55);
    }
    if (Array.isArray(resultPayload.additionalImages) && resultPayload.additionalImages.length > 0) {
      resultPayload.additionalImages = await Promise.all(
        resultPayload.additionalImages.map((img: string) =>
          img.startsWith('data:image/') ? ensureCompressedDataUrl(img, 500, 0.55) : Promise.resolve(img)
        )
      );
    }

    payloadSize = JSON.stringify(resultPayload).length;
    if (payloadSize <= 650000) {
      return resultPayload;
    }

    // Step 2: More aggressive compression to 380px, quality 0.45
    if (resultPayload.imageUrl && resultPayload.imageUrl.startsWith('data:image/')) {
      resultPayload.imageUrl = await ensureCompressedDataUrl(resultPayload.imageUrl, 380, 0.45);
    }
    if (Array.isArray(resultPayload.additionalImages) && resultPayload.additionalImages.length > 0) {
      resultPayload.additionalImages = await Promise.all(
        resultPayload.additionalImages.map((img: string) =>
          img.startsWith('data:image/') ? ensureCompressedDataUrl(img, 380, 0.45) : Promise.resolve(img)
        )
      );
    }

    payloadSize = JSON.stringify(resultPayload).length;
    if (payloadSize <= 650000) {
      return resultPayload;
    }

    // Step 3: If gallery images array is large, keep top 6 images
    if (Array.isArray(resultPayload.additionalImages) && resultPayload.additionalImages.length > 6) {
      resultPayload.additionalImages = resultPayload.additionalImages.slice(0, 6);
    }

    return resultPayload;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files) as File[]) {
      try {
        const compressedBase64 = await compressImageFile(file, 640, 0.65);
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

  const handleAiProcessProduct = async () => {
    if (aiMode === 'create' && !aiRawInput.trim()) {
      setAiError('Please enter product details, supplier notes, or prompt for the AI.');
      return;
    }
    if (aiMode === 'edit') {
      if (!aiSelectedProdId) {
        setAiError('Please select a product to edit with AI.');
        return;
      }
      if (!aiEditInstruction.trim()) {
        setAiError('Please enter what you want AI to change on this product.');
        return;
      }
    }

    setAiLoading(true);
    setAiError(null);
    setAiSuccessMsg(null);

    try {
      const selectedProd = myProducts.find((p) => p.id === aiSelectedProdId);

      const res = await fetch('/api/ai/process-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: aiMode,
          rawInput: aiRawInput.trim(),
          existingProduct: selectedProd,
          instruction: aiEditInstruction.trim(),
          customImage: aiCustomImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI processing failed');
      }

      const aiProduct = data.product;

      if (aiMode === 'edit' && selectedProd) {
        const validVariants = (aiProduct.variants || [])
          .filter((v: any) => v.name && v.options && v.options.length > 0)
          .map((v: any) => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            name: v.name.trim(),
            options: v.options.map((o: any) => o.toString().trim()).filter(Boolean),
          }));

        const updatePayload: Record<string, any> = {
          title: aiProduct.title || selectedProd.title,
          description: aiProduct.description || selectedProd.description,
          price: typeof aiProduct.price === 'number' ? aiProduct.price : selectedProd.price,
          category: aiProduct.category || selectedProd.category,
          stock: typeof aiProduct.stock === 'number' ? aiProduct.stock : selectedProd.stock,
          deliveryFee: typeof aiProduct.deliveryFee === 'number' ? aiProduct.deliveryFee : (selectedProd.deliveryFee || 0),
          tags: aiProduct.tags || selectedProd.tags || [],
          imageUrl: aiCustomImage || aiProduct.imageUrl || selectedProd.imageUrl,
          sellerId: selectedProd.sellerId || currentUser?.uid,
          sellerName: userProfile?.displayName || storeNameInput || selectedProd.sellerName || 'Verified Cart Go Seller',
          sellerPhone: userProfile?.phone || storePhoneInput || selectedProd.sellerPhone || '',
          updatedAt: new Date().toISOString(),
        };

        if (aiProduct.originalPrice && aiProduct.originalPrice > updatePayload.price) {
          updatePayload.originalPrice = aiProduct.originalPrice;
        }

        if (validVariants.length > 0) {
          updatePayload.variants = validVariants;
        }

        const optimizedPayload = await optimizeProductPayloadSize(updatePayload);
        await updateDoc(doc(db, 'products', selectedProd.id), optimizedPayload);

        setAiSuccessMsg(`✨ AI successfully updated "${updatePayload.title}"! Changes are live on your store.`);
        setAiEditInstruction('');
        setAiCustomImage('');
      } else {
        const validVariants = (aiProduct.variants || [])
          .filter((v: any) => v.name && v.options && v.options.length > 0)
          .map((v: any) => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            name: v.name.trim(),
            options: v.options.map((o: any) => o.toString().trim()).filter(Boolean),
          }));

        const newProdPayload: Record<string, any> = {
          title: aiProduct.title || 'AI Generated Product',
          description: aiProduct.description || 'High quality item generated by AI Store Assistant.',
          price: typeof aiProduct.price === 'number' ? aiProduct.price : 1999,
          category: aiProduct.category || 'electronics',
          imageUrl: aiCustomImage || aiProduct.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          stock: typeof aiProduct.stock === 'number' ? aiProduct.stock : 20,
          sellerId: effectiveSellerId || currentUser?.uid || 'anonymous',
          sellerName: effectiveStoreName || userProfile?.displayName || storeNameInput || 'Cart Go Seller',
          sellerPhone: userProfile?.phone || storePhoneInput || '',
          rating: 5.0,
          reviewCount: 0,
          salesCount: 0,
          isFlashSale: false,
          deliveryFee: typeof aiProduct.deliveryFee === 'number' ? aiProduct.deliveryFee : 0,
          tags: aiProduct.tags || [],
          createdAt: new Date().toISOString(),
        };

        if (aiProduct.originalPrice && aiProduct.originalPrice > newProdPayload.price) {
          newProdPayload.originalPrice = aiProduct.originalPrice;
        }

        if (validVariants.length > 0) {
          newProdPayload.variants = validVariants;
        }

        const optimizedPayload = await optimizeProductPayloadSize(newProdPayload);
        const docRef = await addDoc(collection(db, 'products'), optimizedPayload);

        setAiSuccessMsg(`✨ AI successfully generated & published "${newProdPayload.title}" (ID: ${docRef.id}) directly to your store!`);
        setAiRawInput('');
        setAiCustomImage('');
      }
    } catch (err: any) {
      console.error('AI store action error:', err);
      setAiError(err.message || 'AI store operation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiBatchGenerate = async () => {
    const activeItems = batchItems.filter((it) => it.text.trim() || it.customImage);

    if (batchModeType === 'structured' && activeItems.length === 0) {
      setAiError('Please add at least one product with text details or attach a photo.');
      return;
    }

    if (batchModeType === 'text' && !aiBatchInput.trim()) {
      setAiError('Please enter a list of items for batch AI generation.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSuccessMsg(null);

    try {
      const payloadBody: Record<string, any> = {
        bulkInput: aiBatchInput.trim(),
      };

      if (batchModeType === 'structured' && activeItems.length > 0) {
        payloadBody.itemsWithImages = activeItems.map((it) => ({
          text: it.text.trim(),
          customImage: it.customImage || undefined,
        }));
      }

      const res = await fetch('/api/ai/batch-generate-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch AI generation failed');
      }

      const products = data.products || [];
      if (products.length === 0) {
        throw new Error('No products could be parsed from the batch input.');
      }

      let publishedCount = 0;
      for (const item of products) {
        const payload: Record<string, any> = {
          title: item.title || 'AI Product',
          description: item.description || 'Quality product auto-listed by AI.',
          price: typeof item.price === 'number' ? item.price : 1500,
          category: item.category || 'electronics',
          imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          stock: typeof item.stock === 'number' ? item.stock : 15,
          sellerId: effectiveSellerId || currentUser?.uid || 'anonymous',
          sellerName: effectiveStoreName || userProfile?.displayName || storeNameInput || 'Cart Go Seller',
          sellerPhone: userProfile?.phone || storePhoneInput || '',
          rating: 5.0,
          reviewCount: 0,
          salesCount: 0,
          isFlashSale: false,
          deliveryFee: typeof item.deliveryFee === 'number' ? item.deliveryFee : 0,
          tags: item.tags || [],
          createdAt: new Date().toISOString(),
        };

        if (item.originalPrice && item.originalPrice > payload.price) {
          payload.originalPrice = item.originalPrice;
        }

        const optimized = await optimizeProductPayloadSize(payload);
        await addDoc(collection(db, 'products'), optimized);
        publishedCount++;
      }

      setAiSuccessMsg(`🎉 Success! AI generated & published ${publishedCount} products directly into your store catalog!`);
      setAiBatchInput('');
      setBatchItems([
        { id: '1', text: '', customImage: '' },
        { id: '2', text: '', customImage: '' },
      ]);
    } catch (err: any) {
      console.error('Batch AI error:', err);
      setAiError(err.message || 'Batch AI auto-publishing failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiFormFill = async () => {
    if (!aiFormPrompt.trim()) {
      setErrorMsg('Please enter product info or prompt in the AI Auto-Fill bar above.');
      return;
    }
    setAiFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/ai/process-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'create', rawInput: aiFormPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate form fields');
      }

      const p = data.product;
      if (p.title) setTitle(p.title);
      if (p.description) setDescription(p.description);
      if (p.price) setPrice(p.price.toString());
      if (p.originalPrice) setOriginalPrice(p.originalPrice.toString());
      if (p.category) setCategory(p.category);
      if (p.stock) setStock(p.stock.toString());
      if (p.deliveryFee !== undefined) setDeliveryFee(p.deliveryFee.toString());
      if (p.imageUrl) setImageUrl(p.imageUrl);
      if (p.tags) setTags(p.tags);

      setSuccessMsg('✨ Form fields successfully populated by AI! Review and click "Publish Product to Store".');
    } catch (err: any) {
      setErrorMsg(err.message || 'AI Auto-Fill failed');
    } finally {
      setAiFormLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || !effectiveSellerId) return;

    // Fetch Seller Products (for store owner or assigned store manager)
    const qProd = query(collection(db, 'products'), where('sellerId', '==', effectiveSellerId));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setMyProducts(list);
    }, (err) => console.warn('Seller products listener error:', err));

    // Fetch All Orders to filter items belonging to this store
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        const sellerItems = orderData.items.filter((item) => item.sellerId === effectiveSellerId);
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
        if (
          notifData.recipientId === 'all' ||
          notifData.recipientId === currentUser.uid ||
          notifData.recipientId === effectiveSellerId
        ) {
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
  }, [currentUser, effectiveSellerId]);

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

      const validVariants = variants
        .filter((v) => v.name.trim() && v.options && v.options.length > 0)
        .map((v) => ({
          id: v.id || Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: v.name.trim(),
          options: v.options.map((o) => o.trim()).filter(Boolean),
        }));

      const newProductPayload: Record<string, any> = {
        title,
        description,
        price: parsedPrice,
        category,
        imageUrl: finalMainImage,
        stock: parsedStock,
        sellerId: effectiveSellerId,
        sellerName: effectiveStoreName,
        sellerPhone: contactPhone.trim(),
        rating: 5.0,
        reviewCount: 0,
        salesCount: 0,
        isFlashSale,
        deliveryFee: parseFloat(deliveryFee) || 0,
        createdAt: new Date().toISOString(),
      };

      if (validVariants.length > 0) {
        newProductPayload.variants = validVariants;
      }

      if (tags.length > 0) {
        newProductPayload.tags = tags;
      }

      if (videoUrl.trim()) {
        newProductPayload.videoUrl = videoUrl.trim();
      }

      if (parsedOriginal !== null && !isNaN(parsedOriginal)) {
        newProductPayload.originalPrice = parsedOriginal;
      }

      if (finalGallery.length > 0) {
        newProductPayload.additionalImages = finalGallery;
      }

      // Automatically optimize payload size to fit safely under Firestore doc size limits
      const finalProductPayload = await optimizeProductPayloadSize(newProductPayload);

      const docRef = await addDoc(collection(db, 'products'), finalProductPayload);
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
      setVariants([]);
      setTags([]);
      setVideoUrl('');
      setDeliveryFee('0');
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

  const totalEarnings = sellerOrders.reduce((acc, order) => {
    const orderSum = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return acc + orderSum;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative my-auto max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header - Fixed/Sticky Top */}
        <div className="bg-[#111827] p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold border border-slate-700"
              title="Return to Homepage"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF9900]" />
              <span className="hidden sm:inline">Homepage</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#FF5500] flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2 truncate">
                <span>{isStoreManager ? 'Store Manager Portal' : 'Cart Go Seller Center'}</span>
                {isStoreManager && (
                  <span className="bg-blue-500/30 text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-400/40 uppercase">
                    Manager Access
                  </span>
                )}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                {isStoreManager ? (
                  <>Managing: <strong className="text-white">{effectiveStoreName}</strong> (Logged in as <span className="text-[#FF9900] font-semibold">{userProfile?.displayName || userProfile?.email}</span>)</>
                ) : (
                  <>Logged in as <span className="text-[#FF9900] font-semibold">{userProfile?.displayName || 'Merchant'}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {(isAdmin || userProfile?.role === 'admin') && onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all border border-amber-300 shrink-0"
                title="Open Super Admin Console"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-900" />
                <span className="hidden md:inline">Admin Console</span>
              </button>
            )}
            {currentUser && (
              <button
                onClick={handleShareMyStore}
                className="px-3 py-1.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all hidden sm:flex shrink-0"
                title="Copy public store link to share with customers"
              >
                {storeCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{storeCopied ? 'Link Copied!' : 'Share Store Link'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#FF5500] hover:bg-[#E04400] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar - Horizontally Scrollable & Sticky */}
        <div className="bg-slate-900 text-slate-300 border-b border-slate-800 px-3 sm:px-6 pt-2 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'ai'
                ? 'border-purple-500 text-purple-400 bg-purple-950/80 rounded-t-lg'
                : 'border-transparent text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="flex items-center gap-1.5">
              <span>AI Store Automation</span>
              <span className="text-[9px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.2 rounded-full font-black uppercase">
                AI Auto
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'add'
                ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>List New Product</span>
          </button>

          <button
            onClick={() => setActiveTab('shopify')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'shopify'
                ? 'border-[#008060] text-[#008060] bg-emerald-950/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4 text-[#008060]" />
            <span className="flex items-center gap-1">
              <span>Shopify 1-Click</span>
              <span className="text-[9px] bg-[#008060] text-white px-1.5 py-0.2 rounded-full font-black uppercase">
                1-Click
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'products'
                ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Listings ({myProducts.length})</span>
          </button>

          {!isStoreManager && (
            <button
              onClick={() => setActiveTab('store')}
              className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === 'store'
                  ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Edit Store Profile</span>
            </button>
          )}

          {isStoreOwner && (
            <button
              onClick={() => setActiveTab('managers')}
              className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                activeTab === 'managers'
                  ? 'border-blue-500 text-blue-400 bg-blue-950/80 rounded-t-lg'
                  : 'border-transparent text-blue-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Store Managers</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'orders'
                ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Received Orders ({sellerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 relative ${
              activeTab === 'chat'
                ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#FF9900]" />
            <span>Live Customer Chat</span>
            {totalUnreadForSeller > 0 && (
              <span className="px-1.5 py-0.5 bg-[#FF5500] text-white text-[9px] font-black rounded-full animate-pulse">
                {totalUnreadForSeller} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 relative ${
              activeTab === 'notifications'
                ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications ({notifications.length})</span>
            {notifications.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-2.5 px-3.5 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'about'
                ? 'border-[#FF5500] text-[#FF5500] bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>About Seller & Courier</span>
          </button>
        </div>

        {/* Smooth Scrollable Main Body Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 scroll-smooth bg-white">
          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
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

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="bg-white p-3 rounded-xl border border-slate-200 hover:border-[#FF5500] flex items-center gap-3 text-left transition-all cursor-pointer group"
            >
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-orange-50 group-hover:text-[#FF5500] transition-colors relative">
                <MessageSquare className="w-5 h-5" />
                {totalUnreadForSeller > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse"></span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Customer Chats</span>
                <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>Chat Hub</span>
                  {totalUnreadForSeller > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#FF5500] text-white text-[9px] font-black rounded-full">
                      {totalUnreadForSeller}
                    </span>
                  )}
                </div>
              </div>
            </button>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Revenue</span>
                <div className="text-base font-extrabold text-[#FF5500]">{formatPKR(totalEarnings)}</div>
              </div>
            </div>
          </div>

          {/* Store Link Showcase Banner */}
          {currentUser && (
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200/80 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  <span>{storeCopied ? 'Link Copied!' : 'Copy Store Link'}</span>
                </button>
              </div>
            </div>
          )}

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

          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* AI Automation Main Banner */}
              <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-xl relative overflow-hidden border border-purple-500/30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black uppercase rounded-full shadow-xs tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Gemini 3.6 Flash Engine
                      </span>
                      <span className="text-xs text-purple-300 font-semibold">• Store Catalog Automation</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                      <Bot className="w-6 h-6 text-purple-400" />
                      AI Store Assistant & Auto-Publisher
                    </h3>
                    <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
                      Give raw supplier data, notes, bullet points, or instructions — AI automatically generates titles, prices in PKR, sales copy, tags, features, and publishes or edits products directly in your store catalog!
                    </p>
                  </div>
                </div>

                {/* Sub-Mode Selector */}
                <div className="mt-5 pt-4 border-t border-purple-800/60 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiMode('create');
                      setAiError(null);
                      setAiSuccessMsg(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      aiMode === 'create'
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                        : 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 hover:text-white'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>1-Click AI Auto-Publish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiMode('edit');
                      setAiError(null);
                      setAiSuccessMsg(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      aiMode === 'edit'
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                        : 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 hover:text-white'
                    }`}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>AI Auto-Edit Existing Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiMode('batch');
                      setAiError(null);
                      setAiSuccessMsg(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      aiMode === 'batch'
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                        : 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Batch Multi-Product AI Generator</span>
                  </button>
                </div>
              </div>

              {/* Status Messages */}
              {aiError && (
                <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
                  <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-rose-900">AI Operation Error</span>
                    <span>{aiError}</span>
                  </div>
                </div>
              )}

              {aiSuccessMsg && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-start gap-3 shadow-md animate-in fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-emerald-950">Store Updated Live!</span>
                    <span>{aiSuccessMsg}</span>
                  </div>
                </div>
              )}

              {/* MODE 1: CREATE & AUTO-PUBLISH */}
              {aiMode === 'create' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-purple-600" />
                        1-Click AI Product Generator & Auto-Publisher
                      </h4>
                      <p className="text-xs text-slate-500">
                        Enter raw product details or supplier notes. AI will structure, price, tag, and publish it live directly to your store.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Direct Auto-Publish On
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Raw Product Information / Supplier Specs / Voice Notes:
                    </label>
                    <textarea
                      rows={4}
                      value={aiRawInput}
                      onChange={(e) => setAiRawInput(e.target.value)}
                      placeholder="e.g. Wireless Noise Cancelling Over-Ear Headphones, Bluetooth 5.3, 40-hour battery life, fast USB-C charging, comfortable memory foam pads, Matte Black & Silver colors, selling price 4500 PKR, original 6000 PKR, 25 items in stock, free delivery..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Custom Product Picture Block for AI Vision */}
                  <div className="p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-700 shrink-0" />
                        <span className="text-xs font-black text-purple-950">
                          Attach Custom Product Picture (AI Vision Auto-Analyze)
                        </span>
                      </div>
                      <span className="text-[10px] font-black bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Custom Photo
                      </span>
                    </div>

                    <p className="text-[11px] text-purple-900/80 leading-relaxed font-medium">
                      Upload your own product photo or paste an image URL. Gemini AI Vision will analyze your picture to write an exact title, specs, and sales copy matching the image!
                    </p>

                    {aiCustomImage ? (
                      <div className="flex items-center gap-4 bg-white p-2.5 border border-purple-300 rounded-xl">
                        <div className="relative group shrink-0">
                          <img
                            src={aiCustomImage}
                            alt="Custom Product Photo"
                            className="w-20 h-20 object-cover rounded-lg border border-purple-200 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setAiCustomImage('')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 transition-colors"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Photo Attached
                          </span>
                          <p className="text-[11px] text-slate-600">
                            AI will analyze this picture & set it as the primary store image.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAiCustomImage('')}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            Remove photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-purple-100/50 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl cursor-pointer text-xs font-bold text-purple-900 transition-all shadow-2xs">
                          <UploadCloud className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>{aiImageUploading ? 'Processing Photo...' : '📷 Upload Product Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={aiImageUploading}
                            onChange={handleAiImageUpload}
                            className="hidden"
                          />
                        </label>

                        <div className="flex items-center bg-white border border-purple-300 rounded-xl px-3 py-2 shadow-2xs">
                          <input
                            type="url"
                            value={aiCustomImage}
                            onChange={(e) => setAiCustomImage(e.target.value)}
                            placeholder="Or paste custom image URL..."
                            className="w-full text-xs font-medium text-slate-800 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preset Quick Fill Chips */}
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                      Try Sample Prompts (1-Click Fill):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          label: '🎧 Wireless Earbuds',
                          text: 'Pro Bluetooth 5.3 Earbuds with ANC, 30h battery, IPX5 waterproof, wireless charging case. Selling 2999 PKR, original 4500 PKR, 30 stock, free delivery.',
                        },
                        {
                          label: '💼 Leather Laptop Bag',
                          text: 'Premium Genuine Brown Leather Messenger Laptop Bag for 15.6 inch laptops, multiple zipped compartments, water resistant. Selling 3800 PKR, 15 stock.',
                        },
                        {
                          label: '⌚ Smart Fitness Watch',
                          text: 'AMOLED Smartwatch with HR sensor, SpO2 monitoring, 100+ sports modes, 7 day battery, IP68. Selling 4200 PKR, original 6000 PKR, 20 stock.',
                        },
                        {
                          label: '☕ Herbal Green Tea Set',
                          text: 'Organic Chamomile & Jasmine Herbal Green Tea Gift Box with 50 tea bags, antioxidant rich. Selling 1250 PKR, 50 stock.',
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiRawInput(preset.text)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={aiLoading}
                      onClick={handleAiProcessProduct}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Generating & Publishing to Store...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                          <span>✨ Generate & Auto-Publish to Store</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: EDIT EXISTING PRODUCT */}
              {aiMode === 'edit' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Edit className="w-4 h-4 text-purple-600" />
                        AI Auto-Edit Existing Product
                      </h4>
                      <p className="text-xs text-slate-500">
                        Select any of your listed products and tell AI what to update (prices, discounts, descriptions, stock, tags, features).
                      </p>
                    </div>
                  </div>

                  {myProducts.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <p className="text-xs font-bold text-slate-500">
                        You don't have any products in your store catalog yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAiMode('create')}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
                      >
                        Create Product with AI First
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Select Product to Edit:
                        </label>
                        <select
                          value={aiSelectedProdId}
                          onChange={(e) => setAiSelectedProdId(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                        >
                          <option value="">-- Choose a Product from your Store --</option>
                          {myProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} — {formatPKR(p.price)} (Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Product Picture Block for AI Vision */}
                      <div className="p-4 bg-purple-50/80 border border-purple-200/90 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-700 shrink-0" />
                            <span className="text-xs font-black text-purple-950">
                              New Custom Picture for AI Update (Optional)
                            </span>
                          </div>
                          <span className="text-[10px] font-black bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Replace Image
                          </span>
                        </div>

                        <p className="text-[11px] text-purple-900/80 leading-relaxed font-medium">
                          Upload a new photo or paste an image URL if you want AI to replace this product's main image and adjust description according to the new picture!
                        </p>

                        {aiCustomImage ? (
                          <div className="flex items-center gap-4 bg-white p-2.5 border border-purple-300 rounded-xl">
                            <div className="relative group shrink-0">
                              <img
                                src={aiCustomImage}
                                alt="Custom Product Photo"
                                className="w-20 h-20 object-cover rounded-lg border border-purple-200 shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setAiCustomImage('')}
                                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 transition-colors"
                                title="Remove Photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> New Photo Attached
                              </span>
                              <p className="text-[11px] text-slate-600">
                                This image will replace the current product picture.
                              </p>
                              <button
                                type="button"
                                onClick={() => setAiCustomImage('')}
                                className="text-[11px] font-bold text-rose-600 hover:underline"
                              >
                                Remove photo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <label className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-purple-100/50 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl cursor-pointer text-xs font-bold text-purple-900 transition-all shadow-2xs">
                              <UploadCloud className="w-4 h-4 text-purple-600 shrink-0" />
                              <span>{aiImageUploading ? 'Processing Photo...' : '📷 Upload New Photo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={aiImageUploading}
                                onChange={handleAiImageUpload}
                                className="hidden"
                              />
                            </label>

                            <div className="flex items-center bg-white border border-purple-300 rounded-xl px-3 py-2 shadow-2xs">
                              <input
                                type="url"
                                value={aiCustomImage}
                                onChange={(e) => setAiCustomImage(e.target.value)}
                                placeholder="Or paste image URL to update..."
                                className="w-full text-xs font-medium text-slate-800 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          AI Edit Instruction / Modification Prompt:
                        </label>
                        <textarea
                          rows={3}
                          value={aiEditInstruction}
                          onChange={(e) => setAiEditInstruction(e.target.value)}
                          placeholder="e.g. Lower price to 2499 PKR for Eid sale, set original price to 3500 PKR, update stock to 50, rewrite description to sound bulleted and premium..."
                          className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all"
                        />
                      </div>

                      {/* Quick Edit Instruction Chips */}
                      <div>
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                          Quick Instructions:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            '🏷️ Apply 15% discount & set price',
                            '📦 Increase stock quantity to 50',
                            '✨ Add 5 premium feature bullet points',
                            '🚚 Enable Free Delivery for this item',
                            '🔥 Mark as Flash Sale deal',
                          ].map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAiEditInstruction(chip)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={aiLoading || !aiSelectedProdId}
                          onClick={handleAiProcessProduct}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>AI Updating Product...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                              <span>⚡ AI Auto-Update Product</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* MODE 3: BATCH MULTI-PRODUCT GENERATOR WITH CUSTOM PICTURES */}
              {aiMode === 'batch' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Layers className="w-4.5 h-4.5 text-purple-600" />
                        Batch Multi-Product AI Auto-Publisher
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Generate and publish multiple products at once! Add custom photos for each product or upload a bulk set of photos for AI Vision auto-analysis.
                      </p>
                    </div>

                    {/* Batch Input Mode Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setBatchModeType('structured')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          batchModeType === 'structured'
                            ? 'bg-white text-purple-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Cards with Photos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBatchModeType('text')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          batchModeType === 'text'
                            ? 'bg-white text-purple-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        <span>Line Text List</span>
                      </button>
                    </div>
                  </div>

                  {batchModeType === 'structured' ? (
                    <div className="space-y-4">
                      {/* Bulk Multi-Photo Upload Dropzone */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                          <span className="text-xs font-black text-purple-950 flex items-center justify-center sm:justify-start gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Bulk Upload Photos for Different Products
                          </span>
                          <p className="text-[11px] text-purple-800/80 font-medium">
                            Select 2 to 10 product photos from your device at once. AI Vision will analyze each picture, extract product details, and auto-list them all!
                          </p>
                        </div>

                        <label className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all shrink-0 flex items-center gap-2">
                          <UploadCloud className="w-4 h-4" />
                          <span>{aiImageUploading ? 'Processing Photos...' : '📷 Bulk Upload Photos'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={aiImageUploading}
                            onChange={handleBatchMultiPhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Individual Product Items Cards List */}
                      <div className="space-y-3">
                        {batchItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-purple-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                Product #{index + 1}
                              </span>

                              {batchItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatchItem(item.id)}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                                  title="Remove this product item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove Item</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Left 2 cols: Product Notes / Title */}
                              <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-700">
                                  Product Details / Title / Price Notes:
                                </label>
                                <textarea
                                  rows={3}
                                  value={item.text}
                                  onChange={(e) =>
                                    setBatchItems((prev) =>
                                      prev.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it))
                                    )
                                  }
                                  placeholder={`e.g. Smart Watch Series 9, Black, AMOLED Display, 4500 PKR, 25 Stock`}
                                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                              </div>

                              {/* Right col: Custom Picture Attachment */}
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Product Picture:</span>
                                </label>

                                {item.customImage ? (
                                  <div className="relative group bg-white p-2 border border-purple-200 rounded-xl flex items-center gap-3">
                                    <img
                                      src={item.customImage}
                                      alt={`Product ${index + 1}`}
                                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                                    />
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block truncate">
                                        ✓ Photo Attached
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setBatchItems((prev) =>
                                            prev.map((it) => (it.id === item.id ? { ...it, customImage: '' } : it))
                                          )
                                        }
                                        className="text-[11px] font-bold text-rose-600 hover:underline block"
                                      >
                                        Remove photo
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <label className="flex items-center justify-center gap-2 p-2.5 bg-white hover:bg-purple-50 border border-dashed border-purple-300 rounded-xl cursor-pointer text-xs font-bold text-purple-900 transition-all shadow-2xs">
                                      <UploadCloud className="w-4 h-4 text-purple-600 shrink-0" />
                                      <span>Upload Photo</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={aiImageUploading}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleBatchItemImageUpload(item.id, file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>

                                    <input
                                      type="url"
                                      value={item.customImage}
                                      onChange={(e) =>
                                        setBatchItems((prev) =>
                                          prev.map((it) => (it.id === item.id ? { ...it, customImage: e.target.value } : it))
                                        )
                                      }
                                      placeholder="Or paste image URL..."
                                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleAddBatchItem}
                          className="px-4 py-2 bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-900 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-purple-600" />
                          <span>Add Another Product Card</span>
                        </button>

                        <span className="text-xs font-medium text-slate-500">
                          Total Items: {batchItems.filter((it) => it.text.trim() || it.customImage).length} Product(s)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Batch Product List (Line by Line):
                      </label>
                      <textarea
                        rows={6}
                        value={aiBatchInput}
                        onChange={(e) => setAiBatchInput(e.target.value)}
                        placeholder={`1. Smart Watch Series 9, AMOLED display, 4500 PKR, 20 stock\n2. Genuine Leather Men Wallet, Brown, 1500 PKR, 35 stock\n3. Wireless Gaming Mouse RGB 3200 DPI, 2200 PKR, 15 stock\n4. Stainless Steel Thermal Water Bottle 750ml, 1800 PKR, 40 stock`}
                        className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={
                        aiLoading ||
                        (batchModeType === 'structured'
                          ? batchItems.filter((it) => it.text.trim() || it.customImage).length === 0
                          : !aiBatchInput.trim())
                      }
                      onClick={handleAiBatchGenerate}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>AI Generating & Auto-Publishing Batch...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                          <span>🚀 Batch AI Generate & Publish All ({batchModeType === 'structured' ? batchItems.filter((it) => it.text.trim() || it.customImage).length : 'Multi'} Items)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shopify' && (
            <ShopifyImporter
              onSuccess={(count) => {
                setSuccessMsg(`Imported ${count} products directly from Shopify!`);
                setTimeout(() => setSuccessMsg(null), 5000);
                setActiveTab('products');
              }}
            />
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Shopify 1-Click Sync Callout Banner */}
              <div className="p-3.5 bg-gradient-to-r from-[#008060]/10 via-emerald-500/10 to-[#008060]/10 border-2 border-[#008060]/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#008060] text-white rounded-xl shadow-xs shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                      Already Have A Shopify Store?
                      <span className="bg-[#008060] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
                        1-Click Import
                      </span>
                    </span>
                    <p className="text-xs text-[#008060] font-extrabold">
                      Import all your store products, images, stock & prices automatically!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('shopify')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-[#008060] hover:bg-[#006048] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  <span>Open Shopify Importer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

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

              {/* AI Quick Auto-Fill Form Box */}
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-300 rounded-2xl shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                    <span className="text-xs font-black text-purple-900">
                      AI Instant Form Auto-Fill
                    </span>
                  </div>
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    Gemini AI
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiFormPrompt}
                    onChange={(e) => setAiFormPrompt(e.target.value)}
                    placeholder="Type raw product title/specs (e.g. Smart Watch Series 8 black 3500 PKR)..."
                    className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    disabled={aiFormLoading}
                    onClick={handleAiFormFill}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {aiFormLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>✨ Auto-Fill Form</span>
                      </>
                    )}
                  </button>
                </div>
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

              {/* Custom Delivery Charges Section */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#FF5500]" />
                    <span>Custom Delivery / Shipping Charges (PKR / Rs.)</span>
                  </label>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${parseFloat(deliveryFee) > 0 ? 'bg-orange-100 text-[#FF5500]' : 'bg-emerald-100 text-emerald-700'}`}>
                    {parseFloat(deliveryFee) > 0 ? `Rs. ${deliveryFee}` : 'FREE Delivery'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 (Free Delivery) or custom fee (e.g. 150, 200...)"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                    />
                  </div>

                  <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeliveryFee('0')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                        deliveryFee === '0'
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Free (Rs. 0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryFee('149')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                        deliveryFee === '149'
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Rs. 149
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryFee('250')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                        deliveryFee === '250'
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Rs. 250
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Specify custom delivery charges for this product. Set Rs. 0 to offer Free Shipping to buyers.
                </p>
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

              {/* Product Variants & Options (Optional) */}
              <ProductVariantManager variants={variants} onChange={setVariants} />

              {/* Product Search Keywords & Tags */}
              <ProductTagManager tags={tags} onChange={setTags} />

              {/* Product Demo Video (Optional) */}
              <ProductVideoManager videoUrl={videoUrl} onChange={setVideoUrl} />

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
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                          <span className="text-[#F57224] font-bold">{formatPKR(p.price)}</span>
                          <span>Stock: {p.stock}</span>
                          <span className="capitalize">Category: {p.category}</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${p.deliveryFee && p.deliveryFee > 0 ? 'bg-orange-100 text-[#FF5500]' : 'bg-emerald-100 text-emerald-700'}`}>
                            {p.deliveryFee && p.deliveryFee > 0 ? `Delivery: ${formatPKR(p.deliveryFee)}` : 'Free Delivery'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiSelectedProdId(p.id);
                          setAiMode('edit');
                          setActiveTab('ai');
                        }}
                        className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-purple-200 shrink-0"
                        title="Edit with AI Assistant"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                        <span className="hidden sm:inline">AI Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(p)}
                        className="p-2 text-slate-600 hover:text-[#FF5500] hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Edit Product Details"
                      >
                        <Edit className="w-4 h-4 text-[#FF5500]" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

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

          {activeTab === 'store' && (
            <form onSubmit={handleSaveStoreProfile} className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-md border border-slate-700 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-[#FF9900] to-[#FF5500] rounded-xl text-white shadow-xs shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Store Name & Seller Profile Settings</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Change your store name, shop brand title, contact phone number, and location visible to buyers across Cart Go.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Store Name / Shop Brand Name <span className="text-[#FF5500]">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unique Electronics Store"
                      value={storeNameInput}
                      onChange={(e) => setStoreNameInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Updating your store name will instantly update the seller name across all your active marketplace listings.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Seller Contact Phone Number <span className="text-[#FF5500]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +92 300 1234567"
                        value={storePhoneInput}
                        onChange={(e) => setStorePhoneInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Store Location / Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Shop #4, Main Market, Lahore"
                        value={storeAddressInput}
                        onChange={(e) => setStoreAddressInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingStore}
                  className="w-full py-3 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{updatingStore ? 'Updating Store Name & Details...' : 'Save Store Name & Details'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'managers' && isStoreOwner && (
            <StoreManagersTab
              currentUser={currentUser}
              userProfile={userProfile}
              effectiveStoreId={effectiveSellerId}
              effectiveStoreName={effectiveStoreName}
            />
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

          {activeTab === 'chat' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <SellerChatTab products={myProducts} />
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
          {/* Bottom Action / Homepage Navigation Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl mt-6">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <Store className="w-4 h-4 text-[#FF5500]" />
              <span>Cart Go Merchant Center — Easy Product Listing & Order Fulfillment</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#FF9900]" />
                <span>Return to Homepage / Store</span>
              </button>
            </div>
          </div>
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

      {/* Edit Product Modal Overlay */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative my-auto max-h-[90vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-[#FF9900]" />
                <div>
                  <h3 className="text-sm font-extrabold">Edit Product Listing</h3>
                  <p className="text-xs text-slate-300">Modify product title, price, stock, images & category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditedProduct} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Product Title / Name <span className="text-[#FF5500]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Category <span className="text-[#FF5500]">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Price (PKR / Rs.) <span className="text-[#FF5500]">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Original / Strikethrough Price
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Stock Quantity <span className="text-[#FF5500]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                  />
                </div>
              </div>

              {/* Custom Delivery Charges Section in Edit Modal */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#FF5500]" />
                    <span>Custom Delivery / Shipping Fee (PKR / Rs.)</span>
                  </label>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${parseFloat(editDeliveryFee) > 0 ? 'bg-orange-100 text-[#FF5500]' : 'bg-emerald-100 text-emerald-700'}`}>
                    {parseFloat(editDeliveryFee) > 0 ? `Rs. ${editDeliveryFee}` : 'FREE Delivery'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 (Free) or custom fee (e.g. 150)"
                      value={editDeliveryFee}
                      onChange={(e) => setEditDeliveryFee(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                    />
                  </div>

                  <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditDeliveryFee('0')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                        editDeliveryFee === '0'
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Free (Rs. 0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDeliveryFee('149')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                        editDeliveryFee === '149'
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Rs. 149
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDeliveryFee('250')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                        editDeliveryFee === '250'
                          ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Rs. 250
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Product Description <span className="text-[#FF5500]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                />
              </div>

              {/* Cover Image Upload / String */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block font-bold text-slate-800 uppercase flex items-center gap-1.5 text-[11px]">
                  <ImageIcon className="w-4 h-4 text-[#FF5500]" />
                  <span>Main Product Cover Image</span>
                </label>

                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const compressed = await compressImageFile(file, 800, 0.7);
                      if (compressed) setEditImageUrl(compressed);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:border-[#FF5500] rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-[#FF5500]" />
                    <span>Upload New Cover Image</span>
                  </button>

                  {editImageUrl && (
                    <img
                      src={editImageUrl}
                      alt="Cover preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-300 bg-white"
                    />
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Image URL Link (Optional):
                  </span>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editFlashModal"
                  checked={editIsFlashSale}
                  onChange={(e) => setEditIsFlashSale(e.target.checked)}
                  className="w-4 h-4 text-[#FF5500] rounded accent-[#FF5500]"
                />
                <label htmlFor="editFlashModal" className="font-bold text-slate-800 cursor-pointer">
                  Feature in Cart Go Flash Sale Section
                </label>
              </div>

              {/* Product Variants & Options (Optional) */}
              <ProductVariantManager variants={editVariants} onChange={setEditVariants} />

              {/* Product Search Keywords & Tags */}
              <ProductTagManager tags={editTags} onChange={setEditTags} />

              {/* Product Demo Video (Optional) */}
              <ProductVideoManager videoUrl={editVideoUrl} onChange={setEditVideoUrl} />

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
