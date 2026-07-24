import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  Store,
  MessageSquare,
  Plus,
  Minus,
  CheckCircle2,
  Share2,
  Check,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { formatPKR } from '../utils/formatters';
import { getShareableProductUrl, getShareableStoreUrl, shareUrl } from '../utils/share';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onSelectStore?: (sellerId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onBuyNow,
  onSelectStore,
}) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [productCopied, setProductCopied] = useState(false);
  const [storeCopied, setStoreCopied] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrl);
      setQuantity(1);

      // Fetch reviews from Firestore
      const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Review);
        });
        setReviews(list);
      }, (err) => console.warn('Reviews fetch error:', err));

      return () => unsub();
    }
  }, [product]);

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const images = [product.imageUrl, ...(product.additionalImages || [])];

  const handleShareProduct = async () => {
    const url = getShareableProductUrl(product.id);
    const result = await shareUrl({
      title: product.title,
      text: `Buy ${product.title} on Cart Go!`,
      url,
    });
    if (result === 'copied' || result === 'shared') {
      setProductCopied(true);
      setTimeout(() => setProductCopied(false), 2500);
    }
  };

  const handleShareStore = async () => {
    if (!product.sellerId) return;
    const url = getShareableStoreUrl(product.sellerId);
    const result = await shareUrl({
      title: `${product.sellerName}'s Store on Cart Go`,
      text: `Check out ${product.sellerName}'s store on Cart Go!`,
      url,
    });
    if (result === 'copied' || result === 'shared') {
      setStoreCopied(true);
      setTimeout(() => setStoreCopied(false), 2500);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        buyerId: currentUser.uid,
        buyerName: userProfile?.displayName || 'Verified Buyer',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to post review', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative my-8">
        {/* Top Navigation Bar in Modal */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-[#FF5500] bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Left Column: Gallery */}
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-xl bg-slate-50 overflow-hidden border border-slate-100 relative">
              <img
                src={selectedImage || product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img ? 'border-[#FF5500]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Seller Info Box with Store Link & Share */}
            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white flex items-center justify-center font-bold shadow-sm">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">{product.sellerName}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[10px] text-slate-500">Verified Merchant</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-white text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-full">
                  Verified Seller
                </span>
              </div>

              {/* Seller Action Links */}
              <div className="flex items-center gap-2 pt-1 border-t border-orange-100">
                {product.sellerId && onSelectStore && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectStore(product.sellerId!);
                    }}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-orange-100 text-[#FF5500] border border-orange-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visit Store Page</span>
                  </button>
                )}

                <button
                  onClick={handleShareStore}
                  className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors relative"
                  title="Share Store Link"
                >
                  {storeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{storeCopied ? 'Store Copied!' : 'Share Store'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Product Details & Purchase Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-orange-100 text-[#FF5500] font-bold text-[10px] uppercase rounded-full tracking-wider">
                  Category: {product.category}
                </span>

                {/* Share Product Button */}
                <button
                  onClick={handleShareProduct}
                  className="py-1 px-2.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF5500] font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Share this product link"
                >
                  {productCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{productCopied ? 'Link Copied!' : 'Share Product'}</span>
                </button>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {product.title}
              </h1>

              {/* Rating Summary */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">{reviews.length + product.reviewCount} Ratings</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">{product.salesCount} Sold</span>
              </div>

              {/* Price Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-baseline gap-3">
                <span className="text-2xl font-black text-[#FF5500]">{formatPKR(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatPKR(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>

              {/* Quantity Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-xs font-bold text-slate-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Stock: <span className="font-bold text-slate-700">{product.stock} available</span>
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-[#FF5500]">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>Delivery charges are according to your location</span>
                </div>
                <p className="text-[11px] text-slate-600 pl-6">
                  Cash on Delivery (COD) is the only available payment method.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="py-3 px-4 bg-orange-50 hover:bg-orange-100 text-[#FF5500] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-orange-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => onBuyNow(product, quantity)}
                  className="py-3 px-4 bg-[#FF5500] hover:bg-[#E04400] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    inWishlist ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600' : ''}`} />
                  <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>

                <button
                  onClick={handleShareProduct}
                  className="py-2 px-3 text-xs font-semibold text-slate-500 hover:text-[#FF5500] flex items-center justify-center gap-1.5 transition-colors"
                >
                  {productCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  <span>{productCopied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#F57224]" />
              <span>Verified Buyer Reviews ({reviews.length})</span>
            </h3>
          </div>

          {/* Post Review Form */}
          {currentUser ? (
            <form onSubmit={handleAddReview} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-700">Write a Review for this Product</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                placeholder="Share details of your experience with this item..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
              />

              <div className="flex items-center justify-between">
                {reviewSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Review submitted!
                  </span>
                ) : (
                  <span></span>
                )}
                <button
                  type="submit"
                  disabled={submittingReview || !newComment.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
              Please login to post a review for this product.
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No buyer reviews yet. Be the first to leave a review!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{rev.buyerName}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
