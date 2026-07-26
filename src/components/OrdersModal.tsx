import React, { useState, useEffect } from 'react';
import {
  X,
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { formatPKR } from '../utils/formatters';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_MAP: Record<OrderStatus, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: 'Order Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  processing: { label: 'Processing', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  shipped: { label: 'Out for Delivery', bg: 'bg-purple-50', text: 'text-purple-700', icon: Truck },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertCircle },
};

export const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'orders'), where('buyerId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list);
    }, (err) => console.warn('Buyer orders listener error:', err));

    return () => unsub();
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-[#111827] p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors"
              title="Back to Store"
            >
              <ArrowLeft className="w-5 h-5 text-[#FF9900]" />
            </button>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-[#FF9900]" />
              <div>
                <h2 className="text-lg font-bold">My Orders & Order Tracking</h2>
                <p className="text-xs text-slate-400">Live order status and purchase history</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Orders Placed Yet</h3>
              <p className="text-xs text-slate-500">Your completed purchases will appear here!</p>
            </div>
          ) : (
            orders.map((order) => {
              const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={order.id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Order #{order.id.slice(0, 10)}</span>
                      <p className="text-[11px] text-slate-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${statusInfo.bg} ${statusInfo.text}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 line-clamp-1">{item.title}</span>
                            <span className="text-slate-500 text-[11px]">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatPKR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#F57224]" />
                      <span className="truncate max-w-xs">
                        Deliver to: {order.shippingAddress?.fullName}, {order.shippingAddress?.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">
                        {order.deliveryFee && order.deliveryFee > 0 ? `(Inc. ${formatPKR(order.deliveryFee)} Delivery)` : '(Free Delivery)'}
                      </span>
                      <span className="text-slate-500">Total:</span>
                      <span className="text-base font-extrabold text-[#F57224]">
                        {formatPKR(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
