import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'topbar' | 'header-action' | 'mobile-item' | 'banner';
  className?: string;
  onModalStateChange?: (open: boolean) => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'topbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  // If already installed as a standalone PWA, hide or show a subtle badge
  if (isInstalled && variant === 'mobile-item') {
    return null;
  }

  return (
    <>
      {variant === 'topbar' && (
        <button
          type="button"
          id="btn-pwa-topbar-download"
          onClick={handleClick}
          className={`flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold transition-all py-0.5 px-2 rounded-md hover:bg-slate-800/80 cursor-pointer ${className}`}
          title="Download Cart Go App on Desktop or Mobile"
        >
          <Download className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{isInstalled ? 'App Installed' : 'Download App'}</span>
          {!isInstalled && (
            <span className="text-[9px] bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
              Free
            </span>
          )}
        </button>
      )}

      {variant === 'header-action' && (
        <button
          type="button"
          id="btn-pwa-header-action"
          onClick={handleClick}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white text-xs font-black rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer border border-orange-400/40 ${className}`}
          title="Download Cart Go App for PC, Mac, Android, iPhone"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>{isInstalled ? 'App Ready' : 'Download App'}</span>
        </button>
      )}

      {variant === 'mobile-item' && (
        <button
          type="button"
          id="btn-pwa-mobile-menu"
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white transition-colors cursor-pointer border border-slate-700/60 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-white">
                Download Cart Go App
              </span>
              <span className="block text-xs text-slate-400">
                Install on Desktop, Android & iPhone
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-400/30">
            Install
          </span>
        </button>
      )}

      {/* Detail Modal showing 1-click install & address bar download instructions */}
      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
