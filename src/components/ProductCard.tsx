import React, { useState } from 'react';
import { Star, Heart, ShoppingBag, ShieldCheck, Share2, Check, Store } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatPKR } from '../utils/formatters';
import { getShareableProductUrl, shareUrl } from '../utils/share';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onSelectStore?: (sellerId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onSelectStore }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [copied, setCopied] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getShareableProductUrl(product.id);
    const result = await shareUrl({
      title: product.title,
      text: `Check out ${product.title} on Cart Go!`,
      url,
    });
    if (result === 'copied' || result === 'shared') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden group relative">
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-[#FF5500] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
          -{discountPercent}%
        </span>
      )}

      {/* Top Action Buttons (Share & Wishlist) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className={`p-1.5 rounded-full backdrop-blur-md transition-all relative ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-white/80 hover:bg-white text-slate-500 hover:text-[#FF5500] shadow-sm'
          }`}
          title="Share Product Link"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied && (
            <span className="absolute right-0 top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in duration-150">
              Link Copied!
            </span>
          )}
        </button>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
            inWishlist
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      {/* Image Area */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-square w-full bg-slate-50 overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded">
            Only {product.stock} left!
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Seller Tag - Clickable Store Link */}
          <div
            onClick={(e) => {
              if (onSelectStore && product.sellerId) {
                e.stopPropagation();
                onSelectStore(product.sellerId);
              }
            }}
            className={`flex items-center gap-1 text-[10px] font-semibold text-slate-500 mb-1 ${
              onSelectStore && product.sellerId ? 'hover:text-[#FF5500] cursor-pointer' : ''
            }`}
            title={`View ${product.sellerName}'s Store`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">{product.sellerName}</span>
            {product.sellerId && <Store className="w-2.5 h-2.5 text-slate-400 ml-auto shrink-0" />}
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="text-xs font-semibold text-slate-800 line-clamp-2 hover:text-[#FF5500] cursor-pointer transition-colors leading-snug"
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        <div>
          {/* Rating & Sold count */}
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating || 5.0}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount || 0})</span>
            </div>
            <span className="text-slate-400 text-[10px]">{product.salesCount || 0} sold</span>
          </div>

          {/* Pricing & Cart button */}
          <div className="flex items-end justify-between gap-1 pt-1 border-t border-slate-100">
            <div>
              <div className="text-sm font-extrabold text-[#FF5500]">
                {formatPKR(product.price)}
              </div>
              <div className="flex items-center gap-1.5">
                {product.originalPrice && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatPKR(product.originalPrice)}
                  </span>
                )}
                <span className={`text-[9px] font-bold px-1 rounded ${product.deliveryFee && product.deliveryFee > 0 ? 'text-slate-500 bg-slate-100' : 'text-emerald-700 bg-emerald-50'}`}>
                  {product.deliveryFee && product.deliveryFee > 0 ? `+${formatPKR(product.deliveryFee)} Shipping` : 'Free Delivery'}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (product.variants && product.variants.length > 0) {
                  onSelect(product);
                } else {
                  addToCart(product, 1);
                }
              }}
              className="p-2 bg-orange-50 hover:bg-[#FF5500] text-[#FF5500] hover:text-white rounded-lg transition-colors"
              title={product.variants && product.variants.length > 0 ? "Select Variant & Buy" : "Add to Cart"}
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
