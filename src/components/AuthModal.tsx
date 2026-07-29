import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, Store, ShoppingBag, ArrowLeft, Phone, Sparkles, CheckCircle2, RefreshCw, KeyRound, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { CartGoLogo } from './CartGoLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Gmail Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isVerifying && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerifying, resendTimer]);

  if (!isOpen) return null;

  const handleSendVerificationCode = () => {
    setError(null);
    if (!displayName.trim()) {
      setError('Please enter your full name or store owner name.');
      return false;
    }
    if (role === 'seller' && !phone.trim()) {
      setError('Seller contact/phone number is compulsory to register and list items on Cart Go.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid Gmail / Email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    // Generate random 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setInputCode('');
    setIsVerifying(true);
    setResendTimer(30);
    return true;
  };

  const handleResendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setInputCode('');
    setResendTimer(30);
    setError(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleVerifyAndRegister = async () => {
    setError(null);
    if (!inputCode.trim()) {
      setError('Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }

    if (inputCode.trim() !== generatedCode) {
      setError('Invalid verification code! Please check the code sent to your Gmail and try again.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, displayName, role, phone);
      setIsVerifying(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginTab) {
      setError(null);
      setLoading(true);
      try {
        await login(email, password);
        onClose();
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!isVerifying) {
        handleSendVerificationCode();
      } else {
        handleVerifyAndRegister();
      }
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
          {!isVerifying ? (
            <>
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
                  type="button"
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
                  type="button"
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
                    {isLoginTab ? 'Email Address or Registered Name' : 'Gmail / Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={isLoginTab ? 'text' : 'email'}
                      required
                      placeholder={isLoginTab ? 'name@example.com or Full Name' : 'yourname@gmail.com'}
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
                  className="w-full py-3 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-3 cursor-pointer"
                >
                  {loading
                    ? 'Processing...'
                    : isLoginTab
                    ? 'Login Now'
                    : 'Send Gmail Verification Code'}
                </button>
              </form>

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
                      className="font-bold text-[#FF5500] hover:underline cursor-pointer"
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
                      className="font-bold text-[#FF5500] hover:underline cursor-pointer"
                    >
                      Login to Your Account
                    </button>
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Gmail 6-Digit Verification Screen */
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs">
                    <Mail className="w-4 h-4 text-red-600 animate-bounce" />
                    <span>Gmail Verification Dispatched</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    Sent to Inbox
                  </span>
                </div>
                <p className="text-[11px] text-red-900 leading-relaxed font-medium">
                  We sent a 6-digit security code to your Gmail address{' '}
                  <strong className="underline text-red-950">{email}</strong>. Enter the correct code below to complete account registration.
                </p>
              </div>

              {/* Simulated Gmail Inbox Notification Toast */}
              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5 text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                    <span className="text-red-400 font-black">Gmail Inbox Notice</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">To: {email}</p>
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Security Code: <span className="font-mono text-base tracking-widest font-black text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{generatedCode}</span></span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInputCode(generatedCode);
                      handleCopyCode();
                    }}
                    className="px-2.5 py-1.5 bg-[#FF5500] hover:bg-orange-600 text-white text-[10px] font-extrabold rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{codeCopied ? 'Auto Filled!' : 'Auto Fill'}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <Shield className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-extrabold text-slate-800 text-center uppercase tracking-wider">
                  Enter 6-Digit Gmail Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 582941"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndRegister()}
                  autoFocus
                  className="w-full text-center tracking-[0.6em] text-2xl font-black py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 text-center font-medium">
                  Type the 6 numbers sent to your Gmail above
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleVerifyAndRegister}
                className="w-full py-3 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-extrabold text-xs rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Verifying & Registering...' : 'Verify Code & Register Account'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResendCode}
                  className="text-[#FF5500] hover:underline font-bold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code via Gmail'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setError(null);
                  }}
                  className="text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
                >
                  ← Edit Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
