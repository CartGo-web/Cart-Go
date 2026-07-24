import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { formatPKR } from '../utils/formatters';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-[#F57224] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded-xl transition-colors"
              title="Back to Store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 fill-current" />
              <div>
                <h2 className="text-lg font-bold">My Wishlist</h2>
                <p className="text-xs text-orange-100">{wishlist.length} saved products</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
        </div>

        {/* List */}
        <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Your wishlist is empty</h3>
              <p className="text-xs text-slate-500">
                Tap the heart icon on any product to save it here for later!
              </p>
            </div>
          ) : (
            wishlist.map((product) => (
              <div
                key={product.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
              >
                <div
                  onClick={() => {
                    onClose();
                    onSelectProduct(product);
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-14 h-14 rounded-lg object-cover bg-white"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-[#F57224]">
                      {product.title}
                    </h4>
                    <span className="text-sm font-extrabold text-[#F57224]">
                      {formatPKR(product.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="py-2 px-3 bg-[#F57224] hover:bg-orange-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
