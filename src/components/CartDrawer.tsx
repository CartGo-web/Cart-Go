import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  ArrowRight,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPKR } from '../utils/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountAmount,
    deliveryFee,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const success = applyCoupon(couponInput);
    if (!success) {
      setCouponError('Invalid voucher code. Try CARTGO20 or WELCOME50');
    } else {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Cart Header */}
          <div className="p-4 sm:p-6 bg-[#111827] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#FF9900]" />
              <div>
                <h2 className="text-base font-bold flex items-center gap-1.5">
                  <span>Shopping Cart</span>
                  <span className="text-[10px] bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white font-extrabold px-2 py-0.5 rounded-full">Cart Go</span>
                </h2>
                <p className="text-xs text-slate-400">{cart.length} unique items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-orange-50 text-[#F57224] rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore products and hot marketplace deals on Cart Go!
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[#FF5500] text-white text-xs font-bold rounded-lg hover:bg-[#E04400] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemId = item.cartItemId || item.product.id;
                return (
                  <div
                    key={itemId}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-center"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 bg-white"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">
                        {item.product.title}
                      </h4>

                      {/* Display Selected Variants */}
                      {item.selectedVariantText && (
                        <div className="text-[10px] font-bold text-[#FF5500] bg-orange-100/80 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                          Variant: {item.selectedVariantText}
                        </div>
                      )}

                      <p className="text-xs font-bold text-[#F57224]">
                        {formatPKR(item.product.price)}{' '}
                        <span className="text-[10px] font-medium text-slate-500">
                          ({item.product.deliveryFee && item.product.deliveryFee > 0 ? `+${formatPKR(item.product.deliveryFee)} Delivery` : 'Free Delivery'})
                        </span>
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center border border-slate-200 rounded-md bg-white">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(itemId)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right font-extrabold text-xs text-slate-900">
                      {formatPKR(item.product.price * item.quantity)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              {/* Voucher Code Form */}
              <div>
                {appliedCoupon ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Voucher '{appliedCoupon}' Applied</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Voucher Code (e.g. CARTGO20)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPKR(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Voucher Savings</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span className={deliveryFee > 0 ? 'font-semibold text-slate-900' : 'font-extrabold text-emerald-600'}>
                    {deliveryFee > 0 ? formatPKR(deliveryFee) : 'FREE'}
                  </span>
                </div>

                {/* Delivery Charges Notice */}
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
                  <Truck className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                  <div className="text-[11px] font-semibold leading-tight">
                    <span>
                      {deliveryFee > 0
                        ? `Delivery charges included in Grand Total (${formatPKR(deliveryFee)}).`
                        : 'Free Delivery applied on all items in your cart!'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-[#FF5500] text-base">{formatPKR(grandTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
