import React, { useState } from 'react';
import {
  X,
  CreditCard,
  MapPin,
  Truck,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { formatPKR } from '../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { cart, subtotal, discountAmount, deliveryFee, grandTotal, clearCart } = useCart();
  const { currentUser, userProfile } = useAuth();

  const [fullName, setFullName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [city, setCity] = useState('Karachi');
  const [postalCode, setPostalCode] = useState('75500');
  const paymentMethod = 'cod'; // Cash on delivery is the only payment method
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please login to complete your order.');
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!fullName || !fullName.trim()) {
      setError('Recipient Full Name is required to place an order.');
      return;
    }

    if (!phone || !phone.trim() || phone.trim().replace(/\D/g, '').length < 7) {
      setError('Buyer Phone Number is strictly required to place an order. Without customer phone number buyer cannot buy anything.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
        sellerId: item.product.sellerId,
        deliveryFee: item.product.deliveryFee || 0,
        selectedVariants: item.selectedVariants || null,
        selectedVariantText: item.selectedVariantText || null,
      }));

      const newOrder = {
        buyerId: currentUser.uid,
        buyerName: fullName || userProfile?.displayName || 'Customer',
        buyerEmail: currentUser.email || '',
        items: orderItems,
        totalAmount: grandTotal,
        deliveryFee: deliveryFee || 0,
        status: 'pending',
        shippingAddress: {
          fullName,
          phone,
          address,
          city,
          postalCode,
        },
        paymentMethod,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      clearCart();
      onOrderSuccess(docRef.id);
    } catch (err: any) {
      console.error('Failed to place order', err);
      setError('Order placement failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#111827] p-5 sm:p-6 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#FF9900]" />
            </button>
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-[#FF9900]" />
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>Cart Go Safe Checkout</span>
                </h2>
                <p className="text-xs text-slate-400">Review address and complete your order</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </button>
        </div>

        <form onSubmit={handlePlaceOrder} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1: Shipping Address */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#F57224]" />
              <span>1. Shipping & Delivery Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Full Name <span className="text-[#F57224] font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Full Name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-[#F57224] font-bold">* (Strictly Compulsory)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                />
                <p className="text-[10px] text-[#F57224] font-bold mt-1">
                  Without customer phone number, buyer cannot complete order.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / House No.
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House 12, Street 4, Sector F-8"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F57224]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#FF5500]" />
              <span>2. Payment Method</span>
            </h3>

            {/* Single Payment Method: Cash on Delivery */}
            <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-[#FF5500] rounded-xl text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF5500] text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Cash on Delivery (COD)</span>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Only Way of Transaction
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pay with physical cash directly to the courier when your order arrives at your door.
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-[#FF5500] shrink-0 hidden sm:block" />
            </div>
          </div>

          {/* Delivery Charges & Courier Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#FF5500] shrink-0" />
                <span className="text-xs font-extrabold text-slate-900">
                  Delivery Charges & Courier Information
                </span>
              </div>
              <span className={`text-xs font-bold ${deliveryFee > 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                {deliveryFee > 0 ? formatPKR(deliveryFee) : 'FREE DELIVERY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug">
              {deliveryFee > 0
                ? `Delivery charges of ${formatPKR(deliveryFee)} set by the seller(s) are included in your final payable amount.`
                : 'Enjoy Free Delivery on all item(s) in this order! Cash on Delivery will be collected upon arrival at your doorstep.'}
            </p>
          </div>

          {/* Total & Submit Button */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Subtotal: {formatPKR(subtotal)}</span>
                {discountAmount > 0 && <span className="text-emerald-600 font-bold">(-{formatPKR(discountAmount)})</span>}
                <span>• Delivery: {deliveryFee > 0 ? formatPKR(deliveryFee) : 'Free'}</span>
              </div>
              <span className="text-xs text-slate-600 font-bold block">Grand Payable Total</span>
              <div className="text-2xl font-black text-[#FF5500]">{formatPKR(grandTotal)}</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-8 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Confirming Order...' : 'Confirm & Place Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
