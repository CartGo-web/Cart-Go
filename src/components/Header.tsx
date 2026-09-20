import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Store,
  PackageCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  PlusCircle,
  ArrowLeft,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import { CATEGORIES } from '../data/categories';
import { CartGoLogo } from './CartGoLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenSeller: () => void;
  onOpenAdmin?: () => void;
  onOpenNotifications?: () => void;
  onSelectCategory: (categoryId: string | null) => void;
  selectedCategory: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenWishlist: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenCart,
  onOpenOrders,
  onOpenSeller,
  onOpenAdmin,
  onOpenNotifications,
  onSelectCategory,
  selectedCategory,
  searchQuery,
  setSearchQuery,
  onOpenWishlist,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { totalItemsCount, wishlist } = useCart();
  const { setIsCustomerChatOpen, totalUnreadForCustomer } = useChat();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm font-sans">
      {/* Top Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <PWAInstallButton variant="topbar" />
            <span className="text-slate-600 hidden sm:inline">|</span>
            <button
              onClick={onOpenSeller}
              className="hover:text-orange-400 font-medium flex items-center gap-1.5 text-orange-400 transition-colors"
              title="Sell on Cart Go - 3 percent of your sale will be given to our company"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Sell on Cart Go</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-md border border-orange-400/30 font-semibold hidden md:inline">
                3% sale commission
              </span>
            </button>
            {(isAdmin || userProfile?.role === 'admin') && onOpenAdmin && (
              <>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <button
                  onClick={onOpenAdmin}
                  className="hover:bg-amber-500/30 font-extrabold flex items-center gap-1.5 text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-400/40 transition-colors shadow-xs"
                  title="Open Cart Go Super Admin Console"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Super Admin Console</span>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:cartgosupport@gmail.com"
              className="hover:text-orange-400 font-medium flex items-center gap-1 text-slate-200 transition-colors"
              title="Official Support Email: cartgosupport@gmail.com"
            >
              <span>Help & Support: <strong className="text-orange-400">cartgosupport@gmail.com</strong></span>
            </a>
            <span className="text-slate-600">|</span>
            {currentUser ? (
              <button
                onClick={onOpenOrders}
                className="hover:text-orange-400 flex items-center gap-1 text-slate-200"
              >
                <PackageCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Track My Orders</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hover:text-orange-400 text-slate-200"
              >
                Order Tracking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-[#111827] text-white py-3 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              onClick={() => onSelectCategory(null)}
              className="flex items-center gap-2 group text-left transition-transform hover:scale-105"
            >
              <CartGoLogo size="md" variant="dark" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search in Cart Go (e.g. Headphones, Shoes, Coffee Maker)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-white placeholder-slate-400 pl-4 pr-12 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5500] text-sm shadow-inner"
              />
              <button className="absolute right-1 top-1 bottom-1 px-4 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white rounded-lg flex items-center justify-center transition-colors shadow-sm">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Customer Live Chat Button */}
            <button
              onClick={() => setIsCustomerChatOpen(true)}
              className="relative p-2 text-white hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Customer Live Chat Support"
            >
              <MessageSquare className="w-6 h-6 text-[#FF9900]" />
              {totalUnreadForCustomer > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF5500] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-slate-900 animate-pulse">
                  {totalUnreadForCustomer}
                </span>
              )}
            </button>

            {/* Notifications Icon for Logged in Users */}
            {currentUser && onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-white hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1.5"
                title="My Notifications & Messages"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-[#FF5500] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 animate-pulse">
                  •
                </span>
              </button>
            )}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-white hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1.5"
              title="Wishlist"
            >
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#F57224]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-white hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#F57224]">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-semibold">Cart</span>
            </button>

            {/* PWA Download App Button */}
            <PWAInstallButton variant="header-action" />

            {/* Super Admin Console direct button for Super Admin */}
            {(isAdmin || userProfile?.role === 'admin') && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-extrabold rounded-lg shadow-sm transition-all border border-amber-300 hover:scale-105"
                title="Open Cart Go Super Admin Console"
              >
                <Sparkles className="w-4 h-4 fill-slate-900" />
                <span>Super Admin Console</span>
              </button>
            )}

            {/* User Account */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 py-1.5 px-3 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  <div className="w-6 h-6 bg-white text-[#F57224] rounded-full flex items-center justify-center font-bold uppercase text-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline">
                    {userProfile?.displayName || 'My Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl py-2 z-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {userProfile?.displayName || 'Marketplace User'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        userProfile?.role === 'manager'
                          ? 'bg-blue-50 text-blue-700'
                          : userProfile?.role === 'seller'
                          ? 'bg-orange-50 text-orange-600'
                          : userProfile?.role === 'admin'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {userProfile?.role === 'manager'
                          ? `Store Manager${userProfile.storeName ? ` (${userProfile.storeName})` : ''}`
                          : userProfile?.role || 'buyer'}
                      </span>
                    </div>

                    {(isAdmin || userProfile?.role === 'admin') && onOpenAdmin && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 border-y border-amber-200"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>🛡️ Super Admin Console</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>My Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSeller();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4 text-orange-500" />
                      <span>{userProfile?.role === 'manager' ? 'Store Manager Dashboard' : 'Seller Dashboard (Sell)'}</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white text-xs font-extrabold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                title="Login or Register Account"
              >
                <UserIcon className="w-4 h-4 text-white" />
                <span className="whitespace-nowrap">Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-3 md:hidden">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 pl-4 pr-10 py-2 rounded-lg text-xs"
            />
            <Search className="absolute right-3 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-medium text-slate-700 whitespace-nowrap">
          {(selectedCategory !== null || searchQuery) && (
            <button
              onClick={() => {
                onSelectCategory(null);
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-full transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
              title="Back to home/all products"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
              <span>← Back</span>
            </button>
          )}

          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${
              selectedCategory === null && !searchQuery
                ? 'bg-[#F57224] text-white font-bold shadow-sm'
                : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#F57224] text-white font-bold shadow-sm'
                  : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 text-white p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Prominent Login / Register Banner for Non-Logged In Users */}
          {!currentUser ? (
            <div className="p-3 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-2 border-[#FF5500]/50 rounded-2xl space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#FF5500] text-white rounded-lg">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Join Cart Go Today</h4>
                    <p className="text-[10px] text-slate-300">Login or create account in 10 seconds</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-0.5 rounded-full uppercase">
                  Fast COD
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-white" />
                  <span>Login / Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF9900]" />
                  <span>Register Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{userProfile?.displayName || 'Marketplace User'}</p>
                <p className="text-[10px] text-slate-400">{currentUser.email}</p>
              </div>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-0.5 rounded-full uppercase font-bold">
                {userProfile?.role || 'buyer'}
              </span>
            </div>
          )}

          {(isAdmin || userProfile?.role === 'admin') && onOpenAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full text-left px-4 py-3 bg-amber-500 text-slate-900 rounded-xl font-extrabold text-xs flex items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 fill-slate-900" />
                <span>🛡️ Super Admin Console</span>
              </div>
              <span className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono">ADMIN</span>
            </button>
          )}

          {/* Download App Mobile Item */}
          <PWAInstallButton variant="mobile-item" />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSeller();
              }}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-orange-400 flex items-center gap-2 border border-slate-700"
            >
              <Store className="w-4 h-4" />
              <span>Seller Dashboard</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrders();
                }}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-200 flex items-center gap-2 border border-slate-700"
              >
                <PackageCheck className="w-4 h-4 text-orange-400" />
                <span>My Orders</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="px-3 py-2.5 bg-[#FF5500] hover:bg-[#E04400] text-white rounded-xl font-bold flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                <span>Track Orders</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Support: <strong className="text-orange-400">cartgosupport@gmail.com</strong></span>
            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-rose-400 font-bold hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
