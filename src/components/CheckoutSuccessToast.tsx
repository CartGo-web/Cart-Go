import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Sparkles, X, ArrowRight, PackageCheck, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutSuccessToastProps {
  orderId: string | null;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
  durationMs?: number;
}

export const CheckoutSuccessToast: React.FC<CheckoutSuccessToastProps> = ({
  orderId,
  onClose,
  onViewOrder,
  durationMs = 6500,
}) => {
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Play a cheerful success chime when the toast triggers
  useEffect(() => {
    if (!orderId) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Simple uplifting 3-note chime (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.08, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.35);
        });
      }
    } catch {
      // Audio playback catch
    }
  }, [orderId]);

  // Handle countdown progress bar & auto-dismiss
  useEffect(() => {
    if (!orderId) {
      setProgress(100);
      return;
    }

    startTimeRef.current = Date.now();
    setProgress(100);

    const interval = 50; // update every 50ms for smooth progress bar
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(timerRef.current);
        onClose();
      }
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [orderId, durationMs, onClose]);

  if (!orderId) return null;

  const shortOrderId = orderId.length > 10 ? `#${orderId.slice(0, 8)}...` : `#${orderId}`;

  return (
    <AnimatePresence>
      <motion.div
        id="checkout-success-toast"
        role="alert"
        aria-live="polite"
        initial={{ opacity: 0, y: -25, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="fixed top-4 right-4 sm:right-6 z-[100] max-w-md w-[calc(100vw-2rem)] sm:w-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden backdrop-blur-md"
      >
        {/* Animated celebration aura */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-500/25 via-[#FF9900]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="p-4 sm:p-5 relative flex items-start gap-3.5">
          {/* Success Icon with Glow Badge */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Toast Body */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                Order Confirmed
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 truncate">
                {shortOrderId}
              </span>
            </div>

            <h4 className="text-sm font-extrabold text-white leading-snug">
              Thank you! Your order has been placed.
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We received your order via <strong className="text-amber-400 font-semibold">Cash on Delivery</strong>. Sellers are getting your items ready!
            </p>

            {/* Quick Action CTA Button */}
            <div className="mt-3 flex items-center gap-2.5">
              <button
                type="button"
                id="btn-view-order-from-toast"
                onClick={() => {
                  onViewOrder(orderId);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Track Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="btn-dismiss-toast-text"
                onClick={onClose}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            id="btn-close-checkout-toast"
            onClick={onClose}
            aria-label="Close notification"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Progress Bar for Countdown auto-dismiss */}
        <div className="h-1 w-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-[#FF9900] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
