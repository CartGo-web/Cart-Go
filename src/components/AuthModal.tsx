import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, Store, ShoppingBag, ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { CartGoLogo } from './CartGoLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name or store owner name.');
        }
        if (role === 'seller' && !phone.trim()) {
          throw new Error('Seller contact/phone number is compulsory to register and list items on Cart Go.');
        }
        await signup(email, password, displayName, role, phone);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Back and Close Top Header */}
        <div className="flex items-center justify-between p-3 px-4 bg-slate-900 border-b border-slate-800 text-white">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FF9900]" />
            <span>Back to Store</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#FF9900] via-[#FF5500] to-[#E03000] p-6 text-white text-center relative">
          <div className="flex justify-center mb-3">
            <CartGoLogo size="lg" variant="dark" showTagline={false} />
          </div>
          <h2 className="text-xl font-extrabold">Welcome to Cart Go</h2>
          <p className="text-xs text-orange-100 mt-1">
            {isLoginTab ? 'Login to manage orders and sell products' : 'Create your buyer or seller account'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                isLoginTab
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                !isLoginTab
                  ? 'border-[#FF5500] text-[#FF5500]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2 font-medium">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Store Owner Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Store Owner / Merchant Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Contact Phone Number</span>
                    {role === 'seller' && (
                      <span className="text-[10px] text-[#FF5500] font-bold">Compulsory for Sellers</span>
                    )}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required={role === 'seller'}
                      placeholder="e.g. +92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                />
              </div>
            </div>

            {!isLoginTab && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center justify-center gap-2 ${
                      role === 'buyer'
                        ? 'border-[#FF5500] bg-orange-50 text-[#FF5500]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="buyer"
                      checked={role === 'buyer'}
                      onChange={() => setRole('buyer')}
                      className="hidden"
                    />
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shopper / Buyer</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center justify-center gap-2 ${
                      role === 'seller'
                        ? 'border-[#FF5500] bg-orange-50 text-[#FF5500]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="seller"
                      checked={role === 'seller'}
                      onChange={() => setRole('seller')}
                      className="hidden"
                    />
                    <Store className="w-4 h-4" />
                    <span>Merchant / Seller</span>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold text-xs rounded-lg transition-all shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : isLoginTab ? 'Login Now' : 'Create Cart Go Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
