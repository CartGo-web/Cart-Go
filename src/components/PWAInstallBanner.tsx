import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

const STORAGE_KEY = 'cartgo_pwa_banner_dismissed_v1';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY);
      if (!isDismissed && !isInstalled) {
        setDismissed(false);
      }
    } catch {
      // localStorage catch
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage catch
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  if (dismissed || isInstalled) return null;

  return (
    <>
      <div
        id="pwa-install-banner"
        className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 text-white border-b border-orange-500/30 px-3 py-2 shadow-md relative z-30"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 p-1 flex items-center justify-center shrink-0 shadow-sm">
              <Download className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-white">Get the Cart Go App</span>
              <span className="text-slate-300 ml-1.5 hidden sm:inline">
                • Install for fast 1-tap checkout, instant notifications & desktop access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-pwa-banner-install"
              onClick={handleInstallClick}
              className="px-3 py-1 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold rounded-lg shadow-sm transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download / Install</span>
            </button>
            <button
              type="button"
              id="btn-pwa-banner-dismiss"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
