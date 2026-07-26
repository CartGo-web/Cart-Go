import React from 'react';
import { Home, Store, ShoppingBag, PackageCheck, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface MobileBottomNavProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSeller: () => void;
  onOpenNotifications?: () => void;
  onResetHome: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenAuth,
  onOpenCart,
  onOpenOrders,
  onOpenSeller,
  onOpenNotifications,
  onResetHome,
}) => {
  const { currentUser, userProfile } = useAuth();
  const { totalItemsCount } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111827]/95 backdrop-blur-md border-t border-slate-800 text-slate-300 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={onResetHome}
          className="flex flex-col items-center justify-center py-1 px-2 text-slate-300 hover:text-white transition-colors active:scale-95"
        >
          <Home className="w-5 h-5 text-slate-300" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>

        {/* Sell */}
        <button
          onClick={onOpenSeller}
          className="flex flex-col items-center justify-center py-1 px-2 text-orange-400 hover:text-orange-300 transition-colors active:scale-95"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Sell</span>
        </button>

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center py-1 px-2 text-slate-300 hover:text-white transition-colors relative active:scale-95"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#FF5500] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">Cart</span>
        </button>

        {/* Orders */}
        <button
          onClick={currentUser ? onOpenOrders : onOpenAuth}
          className="flex flex-col items-center justify-center py-1 px-2 text-slate-300 hover:text-white transition-colors active:scale-95"
        >
          <PackageCheck className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Orders</span>
        </button>

        {/* Login / Register OR Account */}
        {currentUser ? (
          <button
            onClick={onOpenOrders}
            className="flex flex-col items-center justify-center py-1 px-2 text-slate-300 hover:text-white transition-colors active:scale-95"
          >
            <div className="w-5 h-5 bg-[#FF5500] text-white rounded-full flex items-center justify-center text-[10px] font-extrabold uppercase">
              {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
            </div>
            <span className="text-[10px] font-bold mt-0.5 truncate max-w-[50px]">
              Account
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center justify-center py-1 px-2.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white rounded-xl shadow-md transition-all active:scale-95 border border-orange-400/30"
          >
            <UserIcon className="w-5 h-5 text-white" />
            <span className="text-[10px] font-black mt-0.5 whitespace-nowrap">
              Login / Reg
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
