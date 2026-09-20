import React from 'react';
import {
  X,
  Download,
  Smartphone,
  Monitor,
  Share2,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  Zap,
  WifiOff,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div
      id="pwa-install-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="pwa-install-modal-content"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-white my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-[#FF9900] via-[#FF5500] to-[#E03000]" />

        {/* Close Button */}
        <button
          id="btn-close-pwa-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header with App Icon */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-orange-500/30 p-2.5 shadow-lg flex items-center justify-center shrink-0">
              <img
                src="/icon.svg"
                alt="Cart Go Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">Cart Go</h3>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-400/30">
                  Web App (PWA)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Desktop & Mobile Application
              </p>
            </div>
          </div>

          {/* If already installed */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 mb-5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-white font-semibold">Cart Go is Already Installed!</strong>
                You are currently running the official standalone app on your device.
              </div>
            </div>
          ) : (
            <>
              {/* Primary Action Button when browser native prompt is available */}
              {isInstallable && (
                <div className="mb-6">
                  <button
                    id="btn-trigger-pwa-native-install"
                    onClick={handleNativeInstall}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF9900] via-[#FF5500] to-[#E03000] hover:from-[#FF8800] hover:to-[#D02800] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Download className="w-5 h-5 animate-bounce" />
                    <span>Download & Install Cart Go Now</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Instant 1-click install • No app store download needed
                  </p>
                </div>
              )}

              {/* Guide for Address Bar Download (Desktop Chrome / Edge) */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Monitor className="w-5 h-5 text-orange-400" />
                  <h4 className="text-sm font-bold text-white">
                    Desktop (Chrome, Edge, Brave): Address Bar Download
                  </h4>
                </div>
                <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-700 font-mono text-[11px]">
                    <span className="text-slate-500">https://...</span>
                    <span className="flex-1 text-slate-300 font-sans">cartgo.com</span>
                    <div className="flex items-center gap-1 text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-400/40 text-[10px] font-sans font-bold">
                      <Download className="w-3 h-3" />
                      <span>Install / Download Icon</span>
                    </div>
                  </div>
                  <p className="leading-relaxed">
                    Look at the <strong>right side of your browser address bar</strong> at the top of the window. Click the <strong className="text-orange-400">Install icon</strong> (a computer with a down arrow or a plus badge) to install Cart Go directly to your Desktop and taskbar.
                  </p>
                </div>
              </div>

              {/* Mobile Guides (Android & iOS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {/* Android */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Android (Chrome)</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-snug">
                    <li>Tap the <strong>three dots (⋮)</strong> in Chrome.</li>
                    <li>Tap <strong className="text-orange-400">Install app</strong> or <strong className="text-orange-400">Add to Home screen</strong>.</li>
                    <li>Cart Go will appear like a native mobile app!</li>
                  </ol>
                </div>

                {/* iPhone / iPad */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-snug">
                    <li className="flex items-center gap-1.5">
                      <span>Tap the <strong>Share</strong> button</span>
                      <Share2 className="w-3 h-3 text-blue-400 inline shrink-0" />
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span>Scroll down and select</span>
                      <strong className="text-orange-400 text-[11px]">Add to Home Screen</strong>
                    </li>
                    <li>Tap <strong>Add</strong> in the top-right corner.</li>
                  </ol>
                </div>
              </div>
            </>
          )}

          {/* Benefits Grid */}
          <div className="border-t border-slate-800 pt-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Why Install Cart Go?
            </h5>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="block text-[11px] font-bold text-white">Instant Launch</span>
                <span className="text-[10px] text-slate-400">Opens in 1 click</span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <WifiOff className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <span className="block text-[11px] font-bold text-white">Works Offline</span>
                <span className="text-[10px] text-slate-400">Cached catalog</span>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block text-[11px] font-bold text-white">Zero Storage</span>
                <span className="text-[10px] text-slate-400">Lightweight & fast</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/60 px-6 py-3.5 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Cart Go Progressive Web App</span>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-semibold py-1 px-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
