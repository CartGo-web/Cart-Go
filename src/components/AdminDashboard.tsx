import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  BarChart3,
  Bell,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Send,
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  Store,
  RefreshCw,
  Search,
  AlertTriangle,
  Trash2,
  Key,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Order, SellerNotification, Product } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'sellers' | 'analytics' | 'notifications'>('sellers');

  // Data States
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [notificationsList, setNotificationsList] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Analytics Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Notification Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [targetSeller, setTargetSeller] = useState<string>('all');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [showSellersOnly, setShowSellersOnly] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Action Confirmation Modals State (replaces window.confirm)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [showDeleteAllUsersModal, setShowDeleteAllUsersModal] = useState(false);
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);

  // Change Password Modal State for Super Admin
  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  const handleOpenPasswordModal = (user: UserProfile) => {
    setSelectedUserForPasswordChange(user);
    setNewPasswordInput('');
    setShowPasswordText(false);
    setPasswordChangeSuccess(null);
    setPasswordChangeError(null);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordChange) return;

    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters long.');
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    try {
      // 1. Update Firestore user document with customPassword
      const userRef = doc(db, 'users', selectedUserForPasswordChange.uid);
      await updateDoc(userRef, {
        customPassword: newPasswordInput,
        passwordUpdatedAt: new Date().toISOString(),
      });

      // 2. Try sending Firebase Auth reset email as well if possible
      try {
        if (selectedUserForPasswordChange.email) {
          await sendPasswordResetEmail(auth, selectedUserForPasswordChange.email);
        }
      } catch (authErr) {
        console.warn('Optional password reset email dispatch notice:', authErr);
      }

      setPasswordChangeSuccess(
        `✅ Password for ${selectedUserForPasswordChange.displayName || selectedUserForPasswordChange.email} has been updated to "${newPasswordInput}". The user can now log in immediately with this new password!`
      );
      setNewPasswordInput('');
    } catch (err: any) {
      console.error('Error updating user password:', err);
      setPasswordChangeError(err.message || 'Failed to update user password. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleSendResetEmailOnly = async () => {
    if (!selectedUserForPasswordChange?.email) return;

    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    try {
      await sendPasswordResetEmail(auth, selectedUserForPasswordChange.email);
      setPasswordChangeSuccess(
        `📧 Password reset email sent directly to ${selectedUserForPasswordChange.email}!`
      );
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setPasswordChangeError(err.message || 'Could not send reset email.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    // Live subscription to Users collection
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const fetchedUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          fetchedUsers.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setUsersList(fetchedUsers);
        setLoading(false);
      },
      (err) => {
        console.warn('Error listening to users in real-time:', err);
        setLoading(false);
      }
    );

    // Live subscription to Orders collection
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrdersList(fetchedOrders);
      },
      (err) => {
        console.warn('Error listening to orders in real-time:', err);
      }
    );

    // Live subscription to Products collection
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const fetchedProducts: Product[] = [];
        snapshot.forEach((docSnap) => {
          fetchedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        setProductsList(fetchedProducts);
      },
      (err) => {
        console.warn('Error listening to products in real-time:', err);
      }
    );

    // Live subscription to Notifications collection
    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const fetchedNotifs: SellerNotification[] = [];
        snapshot.forEach((docSnap) => {
          fetchedNotifs.push({ id: docSnap.id, ...docSnap.data() } as SellerNotification);
        });
        setNotificationsList(fetchedNotifs);
      },
      (err) => {
        console.warn('Notifications listener note:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubOrders();
      unsubProducts();
      unsubNotifs();
    };
  }, [isOpen]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedUsers: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        fetchedUsers.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      });
      setUsersList(fetchedUsers);

      const ordersSnap = await getDocs(collection(db, 'orders'));
      const fetchedOrders: Order[] = [];
      ordersSnap.forEach((docSnap) => {
        fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      setOrdersList(fetchedOrders);
    } catch (err) {
      console.warn('Manual refresh warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccountStatus = async (user: UserProfile) => {
    const isSuperAdmin =
      user.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
      user.email?.toLowerCase() === 'cartgosupport@gmail.com';

    if (isSuperAdmin) {
      alert('Super Admin accounts cannot be disabled.');
      return;
    }

    const newStatus = !user.disabled;
    try {
      // Update local state for all matching user profiles
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === user.uid || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
            ? { ...u, disabled: newStatus }
            : u
        )
      );

      // 1. Update doc by UID
      if (user.uid) {
        await setDoc(doc(db, 'users', user.uid), { disabled: newStatus }, { merge: true });
      }

      // 2. Also update any duplicate docs matching same email
      if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const qSnap = await getDocs(q);
        for (const docSnap of qSnap.docs) {
          await setDoc(doc(db, 'users', docSnap.id), { disabled: newStatus }, { merge: true });
        }
      }

      setResetSuccess(
        `✅ Account for ${user.displayName || user.email} has been ${newStatus ? 'DISABLED' : 'ENABLED'}.`
      );
      setTimeout(() => setResetSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      alert('Could not update user account status in database: ' + (err.message || 'Error'));
    }
  };

  const confirmDeleteUser = async (user: UserProfile) => {
    const isSuperAdmin =
      user.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
      user.email?.toLowerCase() === 'cartgosupport@gmail.com';

    if (isSuperAdmin) {
      alert('Super Admin account is protected and cannot be deleted.');
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      // 1. Remove from local list state immediately
      setUsersList((prev) =>
        prev.filter(
          (u) => u.uid !== user.uid && (!user.email || u.email?.toLowerCase() !== user.email.toLowerCase())
        )
      );

      // 2. Delete main document by UID
      if (user.uid) {
        await deleteDoc(doc(db, 'users', user.uid));
      }

      // 3. Delete any duplicate docs matching same email or UID
      if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const userSnap = await getDocs(collection(db, 'users'));
        for (const docSnap of userSnap.docs) {
          const data = docSnap.data();
          if (docSnap.id === user.uid || (data.email && data.email.trim().toLowerCase() === cleanEmail)) {
            await deleteDoc(doc(db, 'users', docSnap.id));
          }
        }
      }

      setResetSuccess(`✅ User account for ${user.displayName || user.email} has been permanently deleted.`);
      setUserToDelete(null);
      setTimeout(() => setResetSuccess(null), 6000);
    } catch (err: any) {
      console.error('Error deleting user account:', err);
      alert('Failed to delete user account: ' + (err.message || 'Unknown error'));
      await fetchAdminData();
    } finally {
      setIsDeletingUser(false);
    }
  };

  const executeFactoryReset = async () => {
    setResettingData(true);
    setResetSuccess(null);
    setShowFactoryResetModal(false);

    try {
      // 1. Delete all products
      const prodSnap = await getDocs(collection(db, 'products'));
      for (const d of prodSnap.docs) {
        await deleteDoc(doc(db, 'products', d.id));
      }

      // 2. Delete all orders
      const orderSnap = await getDocs(collection(db, 'orders'));
      for (const d of orderSnap.docs) {
        await deleteDoc(doc(db, 'orders', d.id));
      }

      // 3. Delete all notifications
      const notifSnap = await getDocs(collection(db, 'notifications'));
      for (const d of notifSnap.docs) {
        await deleteDoc(doc(db, 'notifications', d.id));
      }

      // 4. Delete all users except Super Admin
      const userSnap = await getDocs(collection(db, 'users'));
      for (const d of userSnap.docs) {
        const uData = d.data() as UserProfile;
        const email = uData.email?.toLowerCase() || '';
        const isSuperAdmin =
          uData.role === 'admin' ||
          email === 'hashirfarman0047@gmail.com' ||
          email === 'cartgosupport@gmail.com';

        if (!isSuperAdmin) {
          await deleteDoc(doc(db, 'users', d.id));
        } else {
          // Keep super admin profile clean
          await setDoc(
            doc(db, 'users', d.id),
            {
              role: 'admin',
              disabled: false,
              displayName: 'Super Admin',
              email: uData.email || email || 'cartgosupport@gmail.com',
            },
            { merge: false }
          );
        }
      }

      // 5. Reset local state
      setProductsList([]);
      setOrdersList([]);
      setNotificationsList([]);

      // 6. Clear local storage cart
      try {
        localStorage.removeItem('cartgo_cart_v1');
      } catch (e) {
        console.warn('Storage clear note:', e);
      }

      setResetSuccess(
        '✅ Factory Reset Complete! All accounts, products, orders, revenue, and notifications have been completely wiped. Super Admin remains active.'
      );
      setTimeout(() => setResetSuccess(null), 10000);
    } catch (err: any) {
      console.error('Error wiping database:', err);
      alert('Error clearing database: ' + (err.message || 'Unknown error'));
    } finally {
      setResettingData(false);
    }
  };

  const executeDeleteAllUsers = async () => {
    setResettingData(true);
    setResetSuccess(null);
    setShowDeleteAllUsersModal(false);

    try {
      const userSnap = await getDocs(collection(db, 'users'));
      let deletedCount = 0;

      for (const d of userSnap.docs) {
        const uData = d.data() as UserProfile;
        const email = uData.email?.toLowerCase() || '';
        const isSuperAdmin =
          uData.role === 'admin' ||
          email === 'hashirfarman0047@gmail.com' ||
          email === 'cartgosupport@gmail.com';

        if (!isSuperAdmin) {
          await deleteDoc(doc(db, 'users', d.id));
          deletedCount++;
        } else {
          await setDoc(
            doc(db, 'users', d.id),
            {
              role: 'admin',
              disabled: false,
              displayName: 'Super Admin',
              email: uData.email || email || 'cartgosupport@gmail.com',
            },
            { merge: false }
          );
        }
      }

      setUsersList((prev) =>
        prev.filter(
          (u) =>
            u.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
            u.email?.toLowerCase() === 'cartgosupport@gmail.com'
        )
      );

      setResetSuccess(`✅ Deleted ${deletedCount} user accounts from Firebase. Only Super Admin remains.`);
      setTimeout(() => setResetSuccess(null), 10000);
    } catch (err: any) {
      console.error('Error deleting users:', err);
      alert('Error deleting user accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setResettingData(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setSendingNotif(true);
    setNotifSuccess(null);

    const targetUserObj = usersList.find((u) => u.uid === targetSeller);
    let recipientLabel = 'All Registered Users';
    if (targetSeller === 'all') recipientLabel = '📢 All Users (Buyers & Sellers)';
    else if (targetSeller === 'sellers') recipientLabel = '🏪 All Sellers';
    else if (targetSeller === 'buyers') recipientLabel = '🛍️ All Buyers';
    else if (targetUserObj)
      recipientLabel = `👤 ${targetUserObj.displayName || targetUserObj.email} (${targetUserObj.role || 'user'})`;

    const newNotif: Omit<SellerNotification, 'id'> = {
      title: notifTitle,
      message: notifMessage,
      recipientId: targetSeller,
      senderName: 'Cart Go Super Admin',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'notifications'), newNotif);
      setNotifTitle('');
      setNotifMessage('');
      setNotifSuccess(`Notification successfully sent to ${recipientLabel}!`);
      setTimeout(() => setNotifSuccess(null), 5000);
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification. Please try again.');
    } finally {
      setSendingNotif(false);
    }
  };

  if (!isOpen) return null;

  // Calculate Orders and Revenue per seller
  const sellerStatsMap = new Map<
    string,
    { totalOrders: number; totalRevenue: number; totalItemsSold: number }
  >();

  ordersList.forEach((order) => {
    const sellersInOrder = new Set<string>();
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (item.sellerId) {
          sellersInOrder.add(item.sellerId);
          const current = sellerStatsMap.get(item.sellerId) || {
            totalOrders: 0,
            totalRevenue: 0,
            totalItemsSold: 0,
          };
          current.totalRevenue += (item.price || 0) * (item.quantity || 1);
          current.totalItemsSold += item.quantity || 1;
          sellerStatsMap.set(item.sellerId, current);
        }
      });
    }
    sellersInOrder.forEach((sId) => {
      const current = sellerStatsMap.get(sId);
      if (current) {
        current.totalOrders += 1;
      }
    });
  });

  // Identify ALL seller UIDs (registered sellers + sellers with listed products + sellers with orders)
  const sellerUidSet = new Set<string>();

  usersList.filter((u) => u.role === 'seller').forEach((u) => sellerUidSet.add(u.uid));
  productsList.forEach((p) => {
    if (p.sellerId) sellerUidSet.add(p.sellerId);
  });
  ordersList.forEach((o) => {
    o.items?.forEach((i) => {
      if (i.sellerId) sellerUidSet.add(i.sellerId);
    });
  });

  // Build full list of sellers
  const allSellerProfiles: UserProfile[] = [];
  const addedUids = new Set<string>();

  usersList.forEach((u) => {
    if (sellerUidSet.has(u.uid) || u.role === 'seller') {
      allSellerProfiles.push(u);
      addedUids.add(u.uid);
    }
  });

  // Synthesize profiles for sellers with listed products or sales who don't have a user record
  sellerUidSet.forEach((uid) => {
    if (!addedUids.has(uid)) {
      const sampleProduct = productsList.find((p) => p.sellerId === uid);
      const sampleItem = ordersList.flatMap((o) => o.items || []).find((i) => i.sellerId === uid);
      const sellerName =
        sampleProduct?.sellerName || sampleItem?.sellerName || `Seller (${uid.slice(0, 6)})`;
      const sellerPhone = sampleProduct?.sellerPhone || 'Not Provided';
      allSellerProfiles.push({
        uid,
        email: 'seller@marketplace',
        displayName: sellerName,
        phone: sellerPhone,
        role: 'seller',
        disabled: false,
      });
      addedUids.add(uid);
    }
  });

  // Filter lists based on search term
  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSellers = allSellerProfiles.filter(
    (s) =>
      s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseUsersList = showSellersOnly ? filteredSellers : filteredUsers;

  // Sort newest registrations first
  const displayUsersList = [...baseUsersList].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Filter orders by year and month
  const filteredOrders = ordersList.filter((order) => {
    if (!order.createdAt) return true;
    const date = new Date(order.createdAt);
    const yearMatches =
      selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
    const monthMatches =
      selectedMonth === 'all' ||
      (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
    return yearMatches && monthMatches;
  });

  // Analytics totals
  const totalOrdersCount = filteredOrders.length;
  const totalSalesRevenue = filteredOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Group seller metrics for Analytics tab
  const sellerMetrics: Record<
    string,
    { sellerName: string; contact: string; email: string; orderCount: number; totalRevenue: number }
  > = {};

  allSellerProfiles.forEach((s) => {
    const stats = sellerStatsMap.get(s.uid) || { totalOrders: 0, totalRevenue: 0 };
    sellerMetrics[s.uid] = {
      sellerName: s.displayName || 'Seller',
      contact: s.phone || 'Not set',
      email: s.email,
      orderCount: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Top Navigation Bar with Back Button */}
        <div className="bg-[#111827] text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF9900]" />
              <span>← Back to Marketplace</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-[#FF9900] flex items-center justify-center font-black">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <span>Cart Go Super Admin Console</span>
                </h2>
                <p className="text-[10px] text-slate-400">Full platform management & seller metrics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteAllUsersModal(true)}
              disabled={resettingData}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Delete all user accounts from Firebase except Super Admin"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                Delete All Users Except Admin
              </span>
            </button>
            <button
              onClick={() => setShowFactoryResetModal(true)}
              disabled={resettingData}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Delete all website data except Super Admin"
            >
              <Trash2 className={`w-3.5 h-3.5 ${resettingData ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {resettingData ? 'Wiping Database...' : 'Wipe All Website Data'}
              </span>
            </button>
            <button
              onClick={fetchAdminData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-xs font-medium flex items-center gap-1"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {resetSuccess && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
            <span>{resetSuccess}</span>
            <button onClick={() => setResetSuccess(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`py-2.5 px-4 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'sellers'
                ? 'bg-white text-[#FF5500] border-[#FF5500] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sellers & Users ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2.5 px-4 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'analytics'
                ? 'bg-white text-[#FF5500] border-[#FF5500] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Sales & Order Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2.5 px-4 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'notifications'
                ? 'bg-white text-[#FF5500] border-[#FF5500] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Send Seller Notifications</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-[#FF9900]" />
              <span className="text-xs font-semibold">Loading platform metrics & database...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: SELLERS & USERS DIRECTORY */}
              {activeTab === 'sellers' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search seller name, email or contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold relative">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 absolute"></span>
                        <span className="ml-2">Real-time Sync Active</span>
                      </div>
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setShowSellersOnly(true)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            showSellersOnly
                              ? 'bg-white text-[#FF5500] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Sellers Only ({filteredSellers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSellersOnly(false)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            !showSellersOnly
                              ? 'bg-white text-[#FF5500] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Users ({filteredUsers.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <th className="p-3 pl-4">Seller / User Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Contact Number</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Total Orders</th>
                            <th className="p-3 text-right">Total Revenue</th>
                            <th className="p-3">Account Status</th>
                            <th className="p-3 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayUsersList.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                {showSellersOnly
                                  ? 'No registered seller accounts found. (Sellers will appear here as soon as they sign up or list products).'
                                  : 'No registered users found matching your search.'}
                              </td>
                            </tr>
                          ) : (
                            displayUsersList.map((user) => {
                              const stats = sellerStatsMap.get(user.uid) || { totalOrders: 0, totalRevenue: 0 };
                              return (
                                <tr
                                  key={user.uid}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    user.disabled ? 'bg-rose-50/40' : ''
                                  }`}
                                >
                                  <td className="p-3 pl-4 font-bold text-slate-900 flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${user.role === 'seller' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                                      {user.displayName ? user.displayName.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <span>{user.displayName || 'Marketplace User'}</span>
                                      <span className="block text-[10px] font-normal text-slate-400">UID: {user.uid.slice(0, 10)}...</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{user.email}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{user.phone || 'Not Provided'}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : user.role === 'seller'
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs rounded-lg border border-slate-200">
                                      {stats.totalOrders}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-extrabold text-[#FF5500] text-xs">
                                    Rs. {stats.totalRevenue.toLocaleString()}
                                  </td>
                                  <td className="p-3">
                                    {user.disabled ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                                        <XCircle className="w-3 h-3" />
                                        Disabled (Data Preserved)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Active & Verified
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right pr-4">
                                     {user.email?.toLowerCase() === 'hashirfarman0047@gmail.com' || user.email?.toLowerCase() === 'cartgosupport@gmail.com' ? (
                                       <span className="text-[10px] text-slate-400 font-bold">Protected</span>
                                     ) : (
                                       <div className="flex items-center justify-end gap-1.5">
                                         <button
                                           onClick={() => handleOpenPasswordModal(user)}
                                           className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center gap-1"
                                           title="Change User Password"
                                         >
                                           <Key className="w-3 h-3" />
                                           <span>Password</span>
                                         </button>
                                         <button
                                           onClick={() => handleToggleAccountStatus(user)}
                                           className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors shadow-xs ${
                                             user.disabled
                                               ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                               : 'bg-amber-600 hover:bg-amber-700 text-white'
                                           }`}
                                         >
                                           {user.disabled ? 'Enable' : 'Disable'}
                                         </button>
                                         <button
                                           onClick={() => setUserToDelete(user)}
                                           className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center gap-1"
                                           title="Delete User Account"
                                         >
                                           <Trash2 className="w-3 h-3" />
                                           <span>Delete</span>
                                         </button>
                                       </div>
                                     )}
                                   </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SALES & ORDER METRICS */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Filters bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#FF5500]" />
                      <span className="text-xs font-bold text-slate-800">Filter Orders by Date:</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Select Year */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-slate-500 font-semibold">Year:</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                        >
                          <option value="all">All Years</option>
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </select>
                      </div>

                      {/* Select Month */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-slate-500 font-semibold">Month:</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                        >
                          <option value="all">All Months</option>
                          <option value="01">January (01)</option>
                          <option value="02">February (02)</option>
                          <option value="03">March (03)</option>
                          <option value="04">April (04)</option>
                          <option value="05">May (05)</option>
                          <option value="06">June (06)</option>
                          <option value="07">July (07)</option>
                          <option value="08">August (08)</option>
                          <option value="09">September (09)</option>
                          <option value="10">October (10)</option>
                          <option value="11">November (11)</option>
                          <option value="12">December (12)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#FF5500] flex items-center justify-center font-bold">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">True Orders Received</p>
                        <h3 className="text-2xl font-black text-slate-900">{totalOrdersCount}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">In selected period ({selectedYear === 'all' ? 'All Time' : selectedYear})</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Total Revenue Generated</p>
                        <h3 className="text-2xl font-black text-emerald-600">Rs. {totalSalesRevenue.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Overall gross sales amount</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">Active Sellers Participating</p>
                        <h3 className="text-2xl font-black text-slate-900">{Object.keys(sellerMetrics).length}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Registered merchant accounts</p>
                      </div>
                    </div>
                  </div>

                  {/* Seller Sales & Orders Breakdown Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                        <Store className="w-4 h-4 text-[#FF9900]" />
                        <span>Seller-by-Seller Earnings & Order Details</span>
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <th className="p-3 pl-4">Seller Name</th>
                            <th className="p-3">Email & Contact Number</th>
                            <th className="p-3">Orders Received</th>
                            <th className="p-3 text-right pr-4">Money Earned Until Today</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.keys(sellerMetrics).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400">
                                No sellers recorded in system.
                              </td>
                            </tr>
                          ) : (
                            Object.entries(sellerMetrics).map(([sId, metrics]) => (
                              <tr key={sId} className="hover:bg-slate-50">
                                <td className="p-3 pl-4 font-bold text-slate-900">
                                  {metrics.sellerName}
                                </td>
                                <td className="p-3 text-slate-600">
                                  <div>{metrics.email}</div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{metrics.contact}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="px-2.5 py-1 bg-orange-50 text-orange-700 font-bold rounded-lg border border-orange-200">
                                    {metrics.orderCount} orders
                                  </span>
                                </td>
                                <td className="p-3 text-right pr-4 font-extrabold text-emerald-600 text-sm">
                                  Rs. {metrics.totalRevenue.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEND NOTIFICATION TO SELLERS */}
              {activeTab === 'notifications' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#FF5500]" />
                      <span>Compose System Notification</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Send urgent announcements, platform updates, or guidelines directly to seller dashboards.
                    </p>

                    {notifSuccess && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{notifSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleSendNotification} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Recipient (Group or Individual Person Separately)
                        </label>
                        <select
                          value={targetSeller}
                          onChange={(e) => setTargetSeller(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                        >
                          <option value="all">📢 Broadcast to EVERYONE (All Buyers & Sellers)</option>
                          <option value="sellers">🏪 Broadcast to ALL Sellers Only</option>
                          <option value="buyers">🛍️ Broadcast to ALL Buyers Only</option>
                          <optgroup label="👤 Send Direct Message to Individual Person Separately">
                            {usersList.map((u) => (
                              <option key={u.uid} value={u.uid}>
                                {u.role === 'seller' ? '🏪 Seller:' : u.role === 'admin' ? '⚡ Admin:' : '🛍️ Buyer:'} {u.displayName || 'User'} ({u.email} {u.phone ? `| Phone: ${u.phone}` : ''})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Notification Title / Subject
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Important Update Regarding Commission Fees"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Message Body
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Write your detailed announcement message here..."
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={sendingNotif}
                        className="w-full py-2.5 bg-gradient-to-r from-[#FF9900] to-[#FF5500] hover:from-[#FF8800] hover:to-[#E04400] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{sendingNotif ? 'Broadcasting...' : 'Send Notification Now'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Sent History */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-600" />
                      <span>Sent Notification History ({notificationsList.length})</span>
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1">
                      {notificationsList.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 text-xs">
                          No announcements sent yet.
                        </div>
                      ) : (
                        notificationsList.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                              <span className="text-[10px] text-slate-400">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-3">{notif.message}</p>
                            <div className="text-[10px] font-semibold text-orange-600 pt-1">
                              Recipient: {notif.recipientId === 'all' ? 'All Sellers' : notif.recipientId}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Super Admin Change User Password Modal Overlay */}
      {selectedUserForPasswordChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-sm">Super Admin: Change User Password</h3>
              </div>
              <button
                onClick={() => setSelectedUserForPasswordChange(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Target User Info Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{selectedUserForPasswordChange.displayName || 'Marketplace User'}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-extrabold uppercase text-[10px]">
                    {selectedUserForPasswordChange.role}
                  </span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{selectedUserForPasswordChange.email}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  UID: {selectedUserForPasswordChange.uid}
                </div>
              </div>

              {/* Alerts */}
              {passwordChangeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{passwordChangeSuccess}</span>
                </div>
              )}

              {passwordChangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    As Super Admin, setting a new password here immediately grants access with this password on user login.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4 text-amber-300" />
                    <span>{passwordChangeLoading ? 'Updating Password...' : 'Save & Override Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendResetEmailOnly}
                    disabled={passwordChangeLoading}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>Send Reset Password Email Instead</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
              <button
                onClick={() => setSelectedUserForPasswordChange(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Single User Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-200" />
                <h3 className="font-extrabold text-sm">Delete User Account</h3>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{userToDelete.displayName || 'Marketplace User'}</div>
                <div className="text-slate-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userToDelete.email}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">UID: {userToDelete.uid}</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Permanent Firebase Account Deletion</span>
                </div>
                <p className="text-[11px] leading-relaxed font-normal">
                  Are you sure you want to permanently delete this user document? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={() => confirmDeleteUser(userToDelete)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingUser ? 'Deleting Account...' : 'Permanently Delete User'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete All Users Modal */}
      {showDeleteAllUsersModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-200" />
                <h3 className="font-extrabold text-sm">Delete All Registered Accounts</h3>
              </div>
              <button
                onClick={() => setShowDeleteAllUsersModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bulk User Deletion Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed font-normal">
                  This will permanently delete all registered user and seller profiles from Firebase, except Super Admin accounts (hashirfarman0047@gmail.com / cartgosupport@gmail.com).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllUsersModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resettingData}
                  onClick={executeDeleteAllUsers}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{resettingData ? 'Deleting Accounts...' : 'Delete All Accounts'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Factory Reset Modal */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="font-extrabold text-sm">Wipe All Database Data</h3>
              </div>
              <button
                onClick={() => setShowFactoryResetModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <p className="font-bold">This complete factory reset will permanently wipe:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-800 font-medium">
                  <li>All user & seller accounts (except Super Admin)</li>
                  <li>All listed products & catalog</li>
                  <li>All customer orders & revenue analytics</li>
                  <li>All notification announcements</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFactoryResetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resettingData}
                  onClick={executeFactoryReset}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{resettingData ? 'Wiping Database...' : 'Wipe All Data Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
