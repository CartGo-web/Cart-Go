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
  Download,
  FolderArchive,
  Code2,
  FileCode,
  Folder,
  FileText,
  CheckCircle,
  HardDrive,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Layers,
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
  const [activeTab, setActiveTab] = useState<'sellers' | 'analytics' | 'notifications' | 'code' | 'email'>('sellers');

  // Data States
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [notificationsList, setNotificationsList] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Email & SMTP Test States
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message?: string; error?: string; configured?: boolean } | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ sender: string; configured: boolean } | null>(null);

  // Source Code Download & Stats State
  const [downloadingCode, setDownloadingCode] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [codeStats, setCodeStats] = useState<{
    fileCount: number;
    totalSizeBytes: number;
    totalSizeKB: number;
    files: { path: string; size: number }[];
    exportedAt: string;
  } | null>(null);
  const [loadingCodeStats, setLoadingCodeStats] = useState(false);
  const [codeFileSearch, setCodeFileSearch] = useState('');
  const [copiedCommand, setCopiedCommand] = useState(false);

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
  const [showCurrentPasswordText, setShowCurrentPasswordText] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Super Admin In-Table Password Visibility Map
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);

  const togglePasswordVisibility = (uid: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  const handleCopyUserPassword = (user: UserProfile) => {
    const pass = user.customPassword || user.registeredPassword || 'CartGo2026!';
    navigator.clipboard.writeText(pass);
    setCopiedPasswordId(user.uid);
    setTimeout(() => setCopiedPasswordId(null), 2000);
  };

  const handleOpenPasswordModal = (user: UserProfile) => {
    setSelectedUserForPasswordChange(user);
    setNewPasswordInput('');
    setShowPasswordText(false);
    setShowCurrentPasswordText(false);
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

  const fetchCodeStats = async () => {
    setLoadingCodeStats(true);
    try {
      const res = await fetch('/api/admin/code-stats');
      if (res.ok) {
        const data = await res.json();
        setCodeStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch code stats:', e);
    } finally {
      setLoadingCodeStats(false);
    }
  };

  const handleDownloadSourceCode = async () => {
    setDownloadingCode(true);
    setDownloadSuccess(null);
    setDownloadError(null);
    try {
      const res = await fetch('/api/admin/download-source-code');
      if (!res.ok) {
        throw new Error('Server returned an error while archiving files');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `cartgo-marketplace-source-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess('🎉 Complete source code ZIP downloaded successfully to your computer!');
      setTimeout(() => setDownloadSuccess(null), 8000);
    } catch (err: any) {
      console.error('Error downloading source code:', err);
      setDownloadError(err.message || 'Failed to download source code archive');
      setTimeout(() => setDownloadError(null), 8000);
    } finally {
      setDownloadingCode(false);
    }
  };

  const fetchSmtpStatus = async () => {
    try {
      const res = await fetch('/api/admin/smtp-status');
      if (res.ok) {
        const data = await res.json();
        setSmtpStatus(data);
      }
    } catch (e) {
      console.warn('Failed to fetch SMTP status:', e);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailRecipient }),
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        error: err.message || 'Failed to dispatch test email request.',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleCopySetupCommand = () => {
    navigator.clipboard.writeText('npm install && npm run dev');
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 3000);
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
              onClick={handleDownloadSourceCode}
              disabled={downloadingCode}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-xs border border-purple-400/30 disabled:opacity-50"
              title="Download Whole Project Source Code as a ZIP Archive"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingCode ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{downloadingCode ? 'Packaging Code...' : 'Download Code (.ZIP)'}</span>
              <span className="sm:hidden">{downloadingCode ? '...' : '.ZIP'}</span>
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

        {downloadSuccess && (
          <div className="bg-purple-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="p-1 hover:bg-purple-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {downloadError && (
          <div className="bg-rose-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>{downloadError}</span>
            </div>
            <button onClick={() => setDownloadError(null)} className="p-1 hover:bg-rose-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {resetSuccess && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
            <span>{resetSuccess}</span>
            <button onClick={() => setResetSuccess(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex flex-wrap gap-2">
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

          <button
            onClick={() => {
              setActiveTab('code');
              fetchCodeStats();
            }}
            className={`py-2.5 px-4 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'code'
                ? 'bg-white text-purple-600 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Source Code & Download</span>
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-extrabold">.ZIP</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('email');
              fetchSmtpStatus();
            }}
            className={`py-2.5 px-4 font-bold text-xs rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'email'
                ? 'bg-white text-emerald-600 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email & Verification SMTP</span>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-extrabold">cartgosupport@gmail.com</span>
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
                            <th className="p-3">Account Password</th>
                            <th className="p-3 text-center">Total Orders</th>
                            <th className="p-3 text-right">Total Revenue</th>
                            <th className="p-3">Account Status</th>
                            <th className="p-3 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayUsersList.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400">
                                {showSellersOnly
                                  ? 'No registered seller accounts found. (Sellers will appear here as soon as they sign up or list products).'
                                  : 'No registered users found matching your search.'}
                              </td>
                            </tr>
                          ) : (
                            displayUsersList.map((user) => {
                              const stats = sellerStatsMap.get(user.uid) || { totalOrders: 0, totalRevenue: 0 };
                              const userPassword = user.customPassword || user.registeredPassword || 'CartGo2026!';
                              const isPasswordRevealed = !!revealedPasswords[user.uid];
                              const isSuperAdminEmail =
                                user.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
                                user.email?.toLowerCase() === 'cartgosupport@gmail.com';

                              return (
                                <tr
                                  key={user.uid}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    user.disabled ? 'bg-rose-50/40' : ''
                                  }`}
                                >
                                  <td className="p-3 pl-4 font-bold text-slate-900 flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                                      user.role === 'seller' 
                                        ? 'bg-orange-100 text-orange-700' 
                                        : user.role === 'manager'
                                        ? 'bg-blue-100 text-blue-700'
                                        : user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {user.displayName ? user.displayName.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <span>{user.displayName || 'Marketplace User'}</span>
                                      <span className="block text-[10px] font-normal text-slate-400">UID: {user.uid.slice(0, 10)}...</span>
                                      {user.storeName && (
                                        <span className="block text-[10px] font-semibold text-blue-600">Store: {user.storeName}</span>
                                      )}
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
                                        : user.role === 'manager'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {user.role === 'manager' ? 'Store Manager' : user.role}
                                    </span>
                                  </td>

                                  {/* Super Admin Password Visibility Column */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span className="font-mono text-xs font-bold text-slate-900 select-all min-w-[70px]">
                                        {isPasswordRevealed ? userPassword : '••••••••'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(user.uid)}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                        title={isPasswordRevealed ? 'Hide Password' : 'Show Password (Super Admin Only)'}
                                      >
                                        {isPasswordRevealed ? (
                                          <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyUserPassword(user)}
                                        className="p-1 text-slate-400 hover:text-[#FF5500] hover:bg-orange-50 rounded transition-colors"
                                        title="Copy User Password"
                                      >
                                        {copiedPasswordId === user.uid ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        )}
                                      </button>
                                    </div>
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
                                     {isSuperAdminEmail ? (
                                       <span className="text-[10px] text-slate-400 font-bold">Protected</span>
                                     ) : (
                                       <div className="flex items-center justify-end gap-1.5">
                                         <button
                                           onClick={() => handleOpenPasswordModal(user)}
                                           className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center gap-1"
                                           title="View & Change User Password"
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

              {/* TAB 4: SOURCE CODE EXPORT & BACKUP */}
              {activeTab === 'code' && (
                <div className="space-y-6">
                  {/* Hero Download Card */}
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-indigo-900/50 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">
                          <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
                          <span>Full-Stack Marketplace Codebase</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          Download Whole Project Source Code (.ZIP)
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          Export the entire production-ready source tree including all React components, Express backend APIs, Gemini AI batch generators, Firebase configuration, styles, and full project dependencies.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                        <button
                          onClick={handleDownloadSourceCode}
                          disabled={downloadingCode}
                          className="px-6 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 border border-purple-400/40 disabled:opacity-50"
                        >
                          <Download className={`w-5 h-5 ${downloadingCode ? 'animate-bounce' : ''}`} />
                          <span>{downloadingCode ? 'Packaging Source Archive...' : 'Download Code (.ZIP)'}</span>
                        </button>

                        <button
                          onClick={handleCopySetupCommand}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
                        >
                          {copiedCommand ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Local Run: npm i && npm run dev</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Codebase Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-semibold">Total Source Files</p>
                        <h4 className="text-lg font-black text-slate-900">
                          {codeStats ? `${codeStats.fileCount} Files` : loadingCodeStats ? 'Scanning...' : '35+ Files'}
                        </h4>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-semibold">Source Package Size</p>
                        <h4 className="text-lg font-black text-slate-900">
                          {codeStats ? `~${codeStats.totalSizeKB} KB` : loadingCodeStats ? 'Calculating...' : '~500 KB'}
                        </h4>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-semibold">Architecture</p>
                        <h4 className="text-sm font-black text-emerald-700 truncate">React 19 + Express</h4>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-semibold">Export Format</p>
                        <h4 className="text-sm font-black text-amber-700">Standard .ZIP Archive</h4>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Grid: File Explorer & Local Run Instructions */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Source File Inspector */}
                    <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Project Files Tree</h4>
                        </div>
                        <button
                          onClick={fetchCodeStats}
                          disabled={loadingCodeStats}
                          className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 font-semibold"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingCodeStats ? 'animate-spin' : ''}`} />
                          <span>Scan Files</span>
                        </button>
                      </div>

                      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={codeFileSearch}
                            onChange={(e) => setCodeFileSearch(e.target.value)}
                            placeholder="Search project files (e.g. AdminDashboard, server.ts, firebase)..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="p-2 overflow-y-auto max-h-[380px] divide-y divide-slate-100 font-mono text-xs">
                        {loadingCodeStats && !codeStats ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-purple-600" />
                            <span>Scanning workspace directory files...</span>
                          </div>
                        ) : !codeStats || codeStats.files.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-sans">
                            Click "Scan Files" to inspect project source directory.
                          </div>
                        ) : (
                          codeStats.files
                            .filter((f) => f.path.toLowerCase().includes(codeFileSearch.toLowerCase()))
                            .map((f) => {
                              const isTsx = f.path.endsWith('.tsx');
                              const isTs = f.path.endsWith('.ts') && !isTsx;
                              const isJson = f.path.endsWith('.json');
                              const isCss = f.path.endsWith('.css');
                              const isHtml = f.path.endsWith('.html');

                              return (
                                <div
                                  key={f.path}
                                  className="py-1.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors group"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {isTsx ? (
                                      <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    ) : isTs ? (
                                      <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    ) : isJson ? (
                                      <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    ) : isCss ? (
                                      <FileText className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                                    ) : isHtml ? (
                                      <FileCode className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                    <span className="text-slate-800 group-hover:text-purple-700 truncate font-sans text-xs">
                                      {f.path}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 shrink-0 font-sans ml-2">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Right: Setup Instructions & Options */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Local Run Guide */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-emerald-600" />
                          <span>How to Run Locally on Your PC</span>
                        </h4>

                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800 mb-1">1. Unzip the downloaded file</p>
                            <p className="text-[11px] text-slate-500">Extract <code className="bg-slate-200 px-1 rounded text-slate-800">cartgo-source-code.zip</code> to any folder on your computer.</p>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800 mb-1">2. Install packages & dependencies</p>
                            <code className="block bg-slate-900 text-emerald-400 p-2 rounded text-[11px] font-mono select-all">
                              npm install
                            </code>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800 mb-1">3. Configure your API key</p>
                            <p className="text-[11px] text-slate-500 mb-1">Create a <code className="bg-slate-200 px-1 rounded text-slate-800">.env</code> file:</p>
                            <code className="block bg-slate-900 text-purple-300 p-2 rounded text-[11px] font-mono select-all">
                              GEMINI_API_KEY=your_gemini_key
                            </code>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800 mb-1">4. Start development server</p>
                            <code className="block bg-slate-900 text-emerald-400 p-2 rounded text-[11px] font-mono select-all">
                              npm run dev
                            </code>
                            <p className="text-[10px] text-slate-400 mt-1">Runs server on <code className="text-slate-700">http://localhost:3000</code></p>
                          </div>
                        </div>
                      </div>

                      {/* AI Studio Platform Export */}
                      <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-indigo-950">
                          <ExternalLink className="w-4 h-4 text-indigo-600" />
                          <span>AI Studio Export Alternative</span>
                        </div>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                          You can also export directly via Google AI Studio's top menu (Share / Export to GitHub or ZIP). Both options export the identical complete repository.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EMAIL & VERIFICATION SMTP DIAGNOSTICS */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  {/* Top Status Header */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <span>Cart Go Official Account Verification Service</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${smtpStatus?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {smtpStatus?.configured ? 'Live Gmail SMTP Configured' : 'Simulated / Hybrid Mode Active'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Official sender address: <strong className="text-emerald-700 font-mono">cartgosupport@gmail.com</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={fetchSmtpStatus}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Status</span>
                    </button>
                  </div>

                  {/* Two Column Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Live Test Email Sender */}
                    <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Send className="w-4 h-4 text-emerald-600" />
                          <span>Send Test Email from cartgosupport@gmail.com</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Verify that live emails and 6-digit confirmation codes are successfully delivered to inboxes.
                        </p>
                      </div>

                      <form onSubmit={handleSendTestEmail} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Recipient Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={testEmailRecipient}
                            onChange={(e) => setTestEmailRecipient(e.target.value)}
                            placeholder="Enter any recipient email (e.g. your personal Gmail)..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={sendingTestEmail}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingTestEmail ? 'Sending Test Email...' : 'Send Live Test Email'}</span>
                        </button>
                      </form>

                      {/* Result Box */}
                      {testEmailResult && (
                        <div className={`p-4 rounded-xl text-xs font-medium border ${testEmailResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                          <div className="font-bold flex items-center gap-1.5 mb-1">
                            {testEmailResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                            <span>{testEmailResult.success ? 'Success!' : 'Configuration Notice'}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {testEmailResult.message || testEmailResult.error}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Gmail Configuration & Registration Flow Overview */}
                    <div className="lg:col-span-6 space-y-4">
                      {/* Registration Verification Protocol */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
                          <span>Instant Registration & Email Support</span>
                        </h4>
                        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                            <div>
                              <strong className="text-slate-800">Instant Account Creation:</strong> Users register directly with their Name, Phone, Email, and Password without any email verification code barrier.
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                            <div>
                              <strong className="text-slate-800">Direct Database Sync:</strong> Accounts are instantly saved to Firestore and local registry for seamless immediate shopping and selling.
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                            <div>
                              <strong className="text-slate-800">Support & Password Resets from cartgosupport@gmail.com:</strong> Official SMTP dispatch sends password reset notifications and store announcements.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Setup Guide for Live Gmail SMTP */}
                      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs space-y-2.5">
                        <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          <span>Gmail App Password Configuration</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          To send real emails from <code className="text-amber-300">cartgosupport@gmail.com</code> into real inboxes:
                        </p>
                        <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                          <li>Go to Google Account (<code className="text-amber-300">cartgosupport@gmail.com</code>) &gt; Security.</li>
                          <li>Enable 2-Step Verification if not active.</li>
                          <li>Search for <strong>"App passwords"</strong> and generate a 16-character password.</li>
                          <li>Set <code className="text-amber-300">GMAIL_APP_PASSWORD=your_16_char_password</code> in Settings / Secrets.</li>
                        </ol>
                      </div>
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
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{selectedUserForPasswordChange.displayName || 'Marketplace User'}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-extrabold uppercase text-[10px]">
                    {selectedUserForPasswordChange.role === 'manager' ? 'Store Manager' : selectedUserForPasswordChange.role}
                  </span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{selectedUserForPasswordChange.email}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  UID: {selectedUserForPasswordChange.uid}
                </div>

                {/* Current Active Password Box */}
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Current Account Password:</span>
                    <span className="font-mono text-xs font-black text-purple-900">
                      {showCurrentPasswordText
                        ? (selectedUserForPasswordChange.customPassword || selectedUserForPasswordChange.registeredPassword || 'CartGo2026!')
                        : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowCurrentPasswordText(!showCurrentPasswordText)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                      title={showCurrentPasswordText ? 'Hide Password' : 'Show Password'}
                    >
                      {showCurrentPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUserPassword(selectedUserForPasswordChange)}
                      className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-md transition-colors flex items-center gap-1 text-[11px]"
                      title="Copy Password"
                    >
                      {copiedPasswordId === selectedUserForPasswordChange.uid ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
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
    </div>
  );
};
