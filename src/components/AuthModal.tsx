import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, Store, ShoppingBag, ArrowLeft, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { CartGoLogo } from './CartGoLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(role);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google Authentication failed. Please use email registration/login.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative my-auto flex flex-col max-h-[92vh]">
        {/* Back and Close Top Header */}
        <div className="flex items-center justify-between p-3 px-4 bg-slate-900 border-b border-slate-800 text-white shrink-0">
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
        <div className="bg-gradient-to-r from-[#FF9900] via-[#FF5500] to-[#E03000] p-5 text-white text-center relative shrink-0">
          <div className="flex justify-center mb-2">
            <CartGoLogo size="lg" variant="dark" showTagline={false} />
          </div>
          <h2 className="text-xl font-extrabold">Welcome to Cart Go</h2>
          <p className="text-xs text-orange-100 mt-1 font-medium">
            {isLoginTab
              ? 'Login to your registered Cart Go account'
              : 'Register your Cart Go buyer or seller account'}
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Compulsory Registration Warning Banner */}
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-[#FF5500]/40 text-amber-950 text-[11px] rounded-xl flex items-center gap-2.5 font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-[#FF5500] shrink-0" />
            <span>
              <strong>COMPULSORY RULE:</strong> You MUST click <u>"1. Register Account"</u> first to register your account before logging in. Unregistered logins are blocked.
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => {
                setIsLoginTab(false);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                !isLoginTab
                  ? 'border-[#FF5500] text-[#FF5500] bg-orange-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>1. Register Account</span>
            </button>
            <button
              onClick={() => {
                setIsLoginTab(true);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                isLoginTab
                  ? 'border-[#FF5500] text-[#FF5500] bg-orange-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>2. Login</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex flex-col gap-2">
              <div className="flex items-start gap-2 font-medium">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
              {isLoginTab && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(false);
                    setError(null);
                  }}
                  className="mt-1 py-1.5 px-3 bg-[#FF5500] hover:bg-[#E04400] text-white font-bold text-xs rounded-lg transition-colors text-center w-full shadow-xs"
                >
                  👉 Click Here to Create Account Now
                </button>
              )}
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

                {role === 'seller' && (
                  <div className="mt-2 p-2.5 bg-orange-50 border border-orange-200 text-[#FF5500] text-[11px] rounded-lg font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Sell on Cart Go Notice: 3 percent of your sale will be given to our company.</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-3"
            >
              {loading ? 'Processing...' : isLoginTab ? 'Login Now' : 'Create Cart Go Account'}
            </button>
          </form>

          {/* Social / Google Firebase Auth Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or Access via Google Firebase Auth
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-md disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Firebase Authentication)</span>
            </button>
          </div>

          {/* Bottom Switcher Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            {isLoginTab ? (
              <p className="text-xs text-slate-600">
                Don't have a Cart Go account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(false);
                    setError(null);
                  }}
                  className="font-bold text-[#FF5500] hover:underline"
                >
                  Register Account Here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Already registered your account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(true);
                    setError(null);
                  }}
                  className="font-bold text-[#FF5500] hover:underline"
                >
                  Login to Your Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
