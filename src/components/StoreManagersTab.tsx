import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Package,
  ShoppingBag,
  Sparkles,
  Key,
  X,
  RefreshCw,
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

interface StoreManagersTabProps {
  currentUser: any;
  userProfile: UserProfile | null;
  effectiveStoreId: string;
  effectiveStoreName: string;
}

export const StoreManagersTab: React.FC<StoreManagersTabProps> = ({
  currentUser,
  userProfile,
  effectiveStoreId,
  effectiveStoreName,
}) => {
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Permissions
  const [permissions, setPermissions] = useState<string[]>([
    'add_product',
    'edit_product',
    'delete_product',
    'view_orders',
    'update_orders',
  ]);

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    name: string;
    email: string;
    pass: string;
    phone: string;
    storeName: string;
  } | null>(null);

  // Password Visibility for Manager Cards
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAllId, setCopiedAllId] = useState<string | null>(null);

  // Deletion Modal State
  const [managerToDelete, setManagerToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Real-time Firestore query for managers belonging to this store/owner
  useEffect(() => {
    if (!currentUser || !effectiveStoreId) return;

    setLoading(true);
    // Listen to users collection where role is manager
    const q = query(collection(db, 'users'), where('role', '==', 'manager'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
          // Filter managers belonging to this store or created by this owner
          if (
            data.storeId === effectiveStoreId ||
            data.storeOwnerId === currentUser.uid ||
            data.createdBy === currentUser.uid
          ) {
            list.push(data);
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setManagers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Store managers listener note:', err);
        // Fallback to local storage registry
        try {
          const saved = localStorage.getItem('cartgo_registered_users');
          if (saved) {
            const list = JSON.parse(saved) as UserProfile[];
            const filtered = list.filter(
              (u) =>
                u.role === 'manager' &&
                (u.storeId === effectiveStoreId || u.storeOwnerId === currentUser.uid || u.createdBy === currentUser.uid)
            );
            setManagers(filtered);
          }
        } catch (e) {
          console.warn('Error reading local managers registry:', e);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, effectiveStoreId]);

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = 'Mgr@';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPass = password.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMsg('Please enter the manager full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessReceipt(null);

    try {
      const managerUid = `mgr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newManagerProfile: UserProfile = {
        uid: managerUid,
        email: cleanEmail,
        displayName: cleanName,
        displayNameLower: cleanName.toLowerCase(),
        role: 'manager',
        phone: cleanPhone || '',
        storeId: effectiveStoreId,
        storeOwnerId: currentUser.uid,
        storeName: effectiveStoreName,
        registeredPassword: cleanPass,
        customPassword: cleanPass,
        managerPermissions: permissions,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        disabled: false,
      };

      // 1. Save to Firestore users collection
      await setDoc(doc(db, 'users', managerUid), newManagerProfile);

      // 2. Also register in localStorage cache for instant login without latency
      try {
        const existingUsersStr = localStorage.getItem('cartgo_registered_users');
        let existingUsers: UserProfile[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
        existingUsers = existingUsers.filter((u) => u.email?.toLowerCase() !== cleanEmail);
        existingUsers.push(newManagerProfile);
        localStorage.setItem('cartgo_registered_users', JSON.stringify(existingUsers));
      } catch (e) {
        console.warn('Local registry update note:', e);
      }

      setSuccessReceipt({
        name: cleanName,
        email: cleanEmail,
        pass: cleanPass,
        phone: cleanPhone,
        storeName: effectiveStoreName,
      });

      // Reset Form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setShowPassword(false);
    } catch (err: any) {
      console.error('Failed to create store manager:', err);
      setErrorMsg(err.message || 'Failed to create manager account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!managerToDelete) return;

    setDeleting(true);
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'users', managerToDelete.uid));

      // 2. Remove from local storage registry
      try {
        const saved = localStorage.getItem('cartgo_registered_users');
        if (saved) {
          const list = JSON.parse(saved) as UserProfile[];
          const updated = list.filter((u) => u.uid !== managerToDelete.uid && u.email !== managerToDelete.email);
          localStorage.setItem('cartgo_registered_users', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Local delete note:', e);
      }

      setManagers((prev) => prev.filter((m) => m.uid !== managerToDelete.uid));
      setManagerToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete manager account:', err);
      alert('Failed to delete manager: ' + (err.message || 'Error occurred'));
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllCredentials = (mgr: { name: string; email: string; pass: string; storeName: string }, id: string) => {
    const text = `🏪 Cart Go - Store Manager Access Credentials\nStore: ${mgr.storeName}\nManager Name: ${mgr.name}\nLogin Email / Username: ${mgr.email}\nPassword: ${mgr.pass}\n\nLogin at: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedAllId(id);
    setTimeout(() => setCopiedAllId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-blue-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-white">Store Team & Manager Management</h3>
            <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              Store Owner Portal
            </span>
          </div>
          <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
            Create and manage authorized staff accounts for <strong>{effectiveStoreName}</strong>. Managers can log in with their assigned email and password to add, edit, or delete store products, as well as view and update customer order statuses.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-4 py-2.5 text-center shrink-0">
          <span className="text-[10px] text-blue-200 uppercase font-bold block">Active Managers</span>
          <span className="text-2xl font-black text-white">{managers.length}</span>
        </div>
      </div>

      {/* Grid: Create Form & Active Managers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Create Manager Account Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-[#FF5500]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Create Manager Account</h4>
              <p className="text-[11px] text-slate-500">Issue new staff credentials for your store</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successReceipt && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Manager Account Created!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessReceipt(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-emerald-200 font-mono text-[11px] space-y-1">
                <p><strong>Name:</strong> {successReceipt.name}</p>
                <p><strong>Login Email:</strong> {successReceipt.email}</p>
                <p><strong>Password:</strong> {successReceipt.pass}</p>
                <p><strong>Store:</strong> {successReceipt.storeName}</p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyAllCredentials(successReceipt, 'receipt')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copiedAllId === 'receipt' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Credentials Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>1-Click Copy Manager Credentials</span>
                  </>
                )}
              </button>
            </div>
          )}

          <form onSubmit={handleCreateManager} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manager Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmed Ali"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manager Login Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ahmed.manager@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Account Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters password..."
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone / WhatsApp <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Permissions Checklist */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-extrabold text-slate-800 block">
                Assigned Store Capabilities:
              </span>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes('add_product')}
                    onChange={() => togglePermission('add_product')}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Add New Store Products</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes('edit_product')}
                    onChange={() => togglePermission('edit_product')}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Edit Existing Products & Pricing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes('delete_product')}
                    onChange={() => togglePermission('delete_product')}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Delete Store Listings</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes('view_orders')}
                    onChange={() => togglePermission('view_orders')}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>View Customer Orders & Buyer Details</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={permissions.includes('update_orders')}
                    onChange={() => togglePermission('update_orders')}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Update Order Status (Pending, Shipped, Delivered)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Manager Account...' : 'Create Manager Account'}</span>
            </button>
          </form>
        </div>

        {/* Right: Active Managers List & Management */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Active Store Managers ({managers.length})</h4>
                  <p className="text-[11px] text-slate-500">Authorized personnel operating this store</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                <span>Loading store managers...</span>
              </div>
            ) : managers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <h5 className="font-bold text-xs text-slate-700">No Manager Accounts Yet</h5>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Use the form on the left to create manager accounts. Managers can log in to help you list products, manage inventory, and fulfill orders.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {managers.map((mgr) => {
                  const pass = mgr.customPassword || mgr.registeredPassword || 'CartGo2026!';
                  const isPassRevealed = !!revealedPasswords[mgr.uid];

                  return (
                    <div
                      key={mgr.uid}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 uppercase shadow-xs">
                            {mgr.displayName ? mgr.displayName.charAt(0) : 'M'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-extrabold text-xs text-slate-900 truncate">
                                {mgr.displayName || 'Store Manager'}
                              </h5>
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 font-extrabold text-[9px] rounded-full uppercase">
                                Manager
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{mgr.email}</span>
                              </span>
                              {mgr.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{mgr.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyAllCredentials(
                                {
                                  name: mgr.displayName || 'Manager',
                                  email: mgr.email,
                                  pass: pass,
                                  storeName: effectiveStoreName,
                                },
                                mgr.uid
                              )
                            }
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Copy Manager Login Details"
                          >
                            {copiedAllId === mgr.uid ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className="hidden sm:inline">
                              {copiedAllId === mgr.uid ? 'Copied' : 'Credentials'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setManagerToDelete(mgr)}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs transition-colors shadow-2xs"
                            title="Delete Manager Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Password Row */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-500">Account Password:</span>
                          <span className="font-mono text-xs font-bold text-slate-900 select-all">
                            {isPassRevealed ? pass : '••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedPasswords((prev) => ({
                                ...prev,
                                [mgr.uid]: !prev[mgr.uid],
                              }))
                            }
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title={isPassRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(pass, mgr.uid + '_pass')}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Copy Password"
                          >
                            {copiedId === mgr.uid + '_pass' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Permissions Tags */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">Permissions:</span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                          <Package className="w-2.5 h-2.5" /> Add / Edit / Delete Products
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md">
                          <ShoppingBag className="w-2.5 h-2.5" /> View & Update Orders
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {managerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900">Delete Manager Account?</h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{managerToDelete.displayName}</strong> ({managerToDelete.email})? They will immediately lose access to manage <strong>{effectiveStoreName}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManagerToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteManager}
                disabled={deleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete Manager'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
