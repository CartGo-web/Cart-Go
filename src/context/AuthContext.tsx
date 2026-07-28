import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, query, where, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | { uid: string; email: string | null; displayName: string | null } | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  signup: (email: string, pass: string, name: string, role: UserRole, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginDemoUser: (role: UserRole) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load local fallback user if exists
  const loadLocalUser = () => {
    try {
      const saved = localStorage.getItem('cartgo_local_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isAdminEmail =
          parsed.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
          parsed.email?.toLowerCase() === 'cartgosupport@gmail.com';
        if (parsed.disabled && !isAdminEmail) {
          localStorage.removeItem('cartgo_local_user');
          return false;
        }
        setCurrentUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.displayName });
        setUserProfile(parsed);
        return true;
      }
    } catch (e) {
      console.warn('Error reading local user', e);
    }
    return false;
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if admin email
        const isAdminUser =
          user.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
          user.email?.toLowerCase() === 'cartgosupport@gmail.com';
        setCurrentUser(user);
        localStorage.removeItem('cartgo_local_user');

        const userRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Handle disabled user
            if (data.disabled === true && !isAdminUser) {
              await signOut(auth);
              localStorage.removeItem('cartgo_local_user');
              setCurrentUser(null);
              setUserProfile(null);
              return;
            }
            // Always ensure role is admin for hashirfarman0047@gmail.com
            if (isAdminUser && data.role !== 'admin') {
              data.role = 'admin';
              data.disabled = false;
              setDoc(userRef, { role: 'admin', disabled: false, lastLogin: new Date().toISOString() }, { merge: true }).catch(() => {});
            } else {
              // Update last login timestamp for super admin tracking
              setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true }).catch(() => {});
            }
            setUserProfile(data);
          } else {
            const newProf: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: isAdminUser ? 'Super Admin' : (user.displayName || 'Cart Go User'),
              role: isAdminUser ? 'admin' : 'buyer',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              disabled: false,
            };
            try {
              await setDoc(userRef, newProf);
            } catch (err) {
              console.warn('Error saving user profile to Firestore:', err);
            }
            setUserProfile(newProf);
          }
        }, (err) => {
          console.warn('Profile listener error:', err);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: isAdminUser ? 'Super Admin' : (user.displayName || 'Cart Go User'),
            role: isAdminUser ? 'admin' : 'buyer',
            createdAt: new Date().toISOString(),
            disabled: false,
          });
        });
      } else {
        const hasLocal = loadLocalUser();
        if (!hasLocal) {
          setCurrentUser(null);
          setUserProfile(null);
        }
        if (unsubProfile) unsubProfile();
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = async (identifier: string, pass: string) => {
    const rawInput = identifier.trim();
    const cleanEmail = rawInput.toLowerCase();
    const isAdminEmail = cleanEmail === 'hashirfarman0047@gmail.com' || cleanEmail === 'cartgosupport@gmail.com';

    // Helper to persist user into local registry cache
    const saveToLocalRegistry = (profile: UserProfile) => {
      try {
        localStorage.setItem('cartgo_local_user', JSON.stringify(profile));
        const existing = localStorage.getItem('cartgo_registered_users');
        let list: UserProfile[] = existing ? JSON.parse(existing) : [];
        list = list.filter((u) => u.email?.toLowerCase() !== profile.email?.toLowerCase());
        list.push(profile);
        localStorage.setItem('cartgo_registered_users', JSON.stringify(list));
      } catch (e) {
        console.warn('Error updating local registry:', e);
      }
    };

    // Special Super Admin check
    if (isAdminEmail) {
      const isDefaultAdminPass = pass === 'Hashir5656' || pass === 'CartGo2026!' || pass === 'admin123' || pass === 'Admin123' || pass.toLowerCase() === 'admin';
      const adminUid = cleanEmail === 'cartgosupport@gmail.com' ? 'admin_cartgosupport' : 'admin_hashirfarman0047';

      // Check if admin has a custom password override set in Firestore or local registry
      let adminDoc: UserProfile | null = null;
      try {
        const snap = await getDoc(doc(db, 'users', adminUid));
        if (snap.exists()) {
          adminDoc = snap.data() as UserProfile;
        }
      } catch (e) {
        console.warn('Error fetching admin doc:', e);
      }

      if (!adminDoc) {
        try {
          const savedUsers = localStorage.getItem('cartgo_registered_users');
          if (savedUsers) {
            const usersList = JSON.parse(savedUsers) as UserProfile[];
            const found = usersList.find((u) => u.email?.toLowerCase() === cleanEmail || u.uid === adminUid);
            if (found) adminDoc = found;
          }
        } catch (e) {}
      }

      const expectedAdminPass = adminDoc?.customPassword || adminDoc?.registeredPassword;
      const isAdminPassValid = expectedAdminPass
        ? (pass === expectedAdminPass || isDefaultAdminPass)
        : isDefaultAdminPass;

      if (!isAdminPassValid) {
        throw new Error('Incorrect password! Please enter the correct Super Admin password.');
      }

      const adminProf: UserProfile = {
        uid: adminUid,
        email: cleanEmail,
        displayName: 'Super Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        disabled: false,
        registeredPassword: pass,
      };

      try {
        await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (e) {
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        } catch (createErr) {
          // Fallback to direct admin state if Auth domain is offline or restricted
        }
      }

      saveToLocalRegistry(adminProf);
      setCurrentUser({ uid: adminUid, email: cleanEmail, displayName: 'Super Admin' });
      setUserProfile(adminProf);

      try {
        await setDoc(doc(db, 'users', adminUid), adminProf, { merge: true });
      } catch (err) {
        console.warn('Admin firestore doc save note:', err);
      }
      return;
    }

    // 1. Locate user account in Firestore or Local Storage by Email OR Username (displayName)
    let existingDocData: UserProfile | null = null;
    let existingDocId: string | null = null;

    try {
      // Query by Email
      const qEmail = query(collection(db, 'users'), where('email', '==', cleanEmail));
      let qSnap = await getDocs(qEmail);

      // Search by exact Username (displayName)
      if (qSnap.empty) {
        const qName = query(collection(db, 'users'), where('displayName', '==', rawInput));
        qSnap = await getDocs(qName);
      }

      // Search by lowercase Username (displayNameLower)
      if (qSnap.empty) {
        const qNameLower = query(collection(db, 'users'), where('displayNameLower', '==', rawInput.toLowerCase()));
        qSnap = await getDocs(qNameLower);
      }

      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        existingDocId = firstDoc.id;
        existingDocData = firstDoc.data() as UserProfile;
      }
    } catch (err) {
      console.warn('Error querying Firestore user record:', err);
    }

    // Fallback search in local storage registry
    if (!existingDocData) {
      try {
        const savedUsers = localStorage.getItem('cartgo_registered_users');
        if (savedUsers) {
          const usersList = JSON.parse(savedUsers) as UserProfile[];
          const found = usersList.find(
            (u) =>
              u.email?.toLowerCase() === cleanEmail ||
              u.displayName?.toLowerCase() === cleanEmail ||
              u.displayName?.toLowerCase() === rawInput.toLowerCase()
          );
          if (found) {
            existingDocData = found;
            existingDocId = found.uid;
          }
        }
      } catch (e) {
        console.warn('Error reading local registered users:', e);
      }
    }

    // Canonical email address to use for auth
    const canonicalEmail = existingDocData?.email ? existingDocData.email.toLowerCase() : cleanEmail;

    // Reject if disabled
    if (existingDocData?.disabled === true && !isAdminEmail) {
      await signOut(auth).catch(() => {});
      throw new Error('Your account has been disabled by the administrator. Your profile remains safely preserved.');
    }

    // 2. Strict Password Check against registered credentials or Super Admin override BEFORE signing in
    if (existingDocData) {
      const activePassword = existingDocData.customPassword || existingDocData.registeredPassword;
      if (activePassword && pass !== activePassword) {
        throw new Error('Incorrect password! The password you entered does not match the password registered for this account.');
      }
    }

    // 3. Authenticate with Firebase Auth
    try {
      const userCred = await signInWithEmailAndPassword(auth, canonicalEmail, pass);
      if (userCred.user) {
        const userRef = doc(db, 'users', userCred.user.uid);
        const userDoc = await getDoc(userRef);

        const userData = userDoc.exists() ? (userDoc.data() as UserProfile) : existingDocData;

        if (userData?.disabled === true && !isAdminEmail) {
          await signOut(auth);
          throw new Error('Your account has been disabled by the administrator. Your profile remains safely preserved.');
        }

        // Verify registered password if present
        const savedPassword = userData?.customPassword || userData?.registeredPassword;
        if (savedPassword && pass !== savedPassword) {
          await signOut(auth);
          throw new Error('Incorrect password! The password you entered does not match the password registered for this account.');
        }

        // Prepare updated profile
        const updatedProfileData: UserProfile = userData
          ? { ...userData, registeredPassword: pass, displayNameLower: userData.displayName?.toLowerCase() }
          : {
              uid: userCred.user.uid,
              email: canonicalEmail,
              displayName: 'Cart Go User',
              displayNameLower: 'cart go user',
              role: 'buyer',
              createdAt: new Date().toISOString(),
              disabled: false,
              registeredPassword: pass,
            };

        // Update last login timestamp and preserve registered password
        await setDoc(userRef, { lastLogin: new Date().toISOString(), registeredPassword: pass, displayNameLower: updatedProfileData.displayName?.toLowerCase() }, { merge: true }).catch(() => {});
        saveToLocalRegistry(updatedProfileData);
        setUserProfile(updatedProfileData);
        return;
      }
    } catch (err: any) {
      if (
        err.message?.includes('disabled by the administrator') ||
        err.message?.includes('Registration is COMPULSORY') ||
        err.message?.includes('Incorrect password') ||
        err.message?.includes('Invalid password')
      ) {
        throw err;
      }

      const code = err.code || '';
      console.warn('Firebase login warning:', code, err.message);

      // Handle wrong password error explicitly
      if (code === 'auth/wrong-password') {
        throw new Error('Incorrect password! The password you entered does not match the password registered for this account.');
      }

      if (code === 'auth/invalid-credential') {
        if (existingDocData) {
          throw new Error('Incorrect password! The password you entered does not match the password registered for this account.');
        } else {
          throw new Error('Incorrect password or account not found! If you have not registered yet, please click "1. Register Account" above to create your account.');
        }
      }

      // Handle user not found error
      if (code === 'auth/user-not-found') {
        if (existingDocData) {
          const activePassword = existingDocData.customPassword || existingDocData.registeredPassword;
          if (!activePassword || pass !== activePassword) {
            throw new Error('Incorrect password! The password you entered does not match the password registered for this account.');
          }
          // Log user in using saved profile in fallback mode
          const fallbackUid = existingDocId || existingDocData.uid || ('local_' + btoa(canonicalEmail).replace(/=/g, ''));
          const updatedProf = { ...existingDocData, lastLogin: new Date().toISOString(), registeredPassword: pass, displayNameLower: existingDocData.displayName?.toLowerCase() };
          saveToLocalRegistry(updatedProf);
          setCurrentUser({ uid: fallbackUid, email: canonicalEmail, displayName: existingDocData.displayName });
          setUserProfile(updatedProf);
          return;
        } else {
          throw new Error('Account not found! Registration is COMPULSORY. You MUST register your account first before logging in. Please click "1. Register Account" above.');
        }
      }

      // Handle fallback/network/domain errors
      if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/auth-domain-config-required' ||
        code === 'auth/network-request-failed' ||
        code === 'auth/internal-error'
      ) {
        if (!existingDocData) {
          throw new Error('Account not found! Registration is COMPULSORY. You MUST register your account first before logging in.');
        }

        const activePassword = existingDocData.customPassword || existingDocData.registeredPassword;
        if (!activePassword || pass !== activePassword) {
          throw new Error('Incorrect password! The password you entered does not match the password registered for this account.');
        }

        const fallbackUid = existingDocId || existingDocData.uid || ('local_' + btoa(canonicalEmail).replace(/=/g, ''));
        const updatedProf = { ...existingDocData, lastLogin: new Date().toISOString(), registeredPassword: pass, displayNameLower: existingDocData.displayName?.toLowerCase() };
        saveToLocalRegistry(updatedProf);
        setCurrentUser({ uid: fallbackUid, email: canonicalEmail, displayName: existingDocData.displayName });
        setUserProfile(updatedProf);
        return;
      }

      if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address or registered username.');
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Access to this account has been temporarily disabled due to many failed login attempts. Try again later.');
      }
      throw err;
    }
  };

  const loginWithGoogle = async (preferredRole: UserRole = 'buyer') => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      if (user) {
        const isAdminUser =
          user.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
          user.email?.toLowerCase() === 'cartgosupport@gmail.com';
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists() && !isAdminUser) {
          // Sign out immediately because user has not registered first
          await signOut(auth);
          throw new Error('Account not found! Registration is COMPULSORY. You MUST register your account first before logging in.');
        }

        let prof: UserProfile;
        if (userDoc.exists()) {
          prof = userDoc.data() as UserProfile;
          if (prof.disabled === true && !isAdminUser) {
            await signOut(auth);
            throw new Error('Your account has been disabled by the administrator.');
          }
          await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
        } else {
          prof = {
            uid: user.uid,
            email: user.email || '',
            displayName: 'Super Admin',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            disabled: false,
          };
          await setDoc(userRef, prof);
        }
        setCurrentUser(user);
        setUserProfile(prof);
      }
    } catch (err: any) {
      console.error('Google Auth login error:', err);
      if (
        err.message?.includes('disabled by the administrator') ||
        err.message?.includes('Registration is COMPULSORY')
      ) {
        throw err;
      }
      throw new Error(err.message || 'Google Authentication failed. Please try registering an account first.');
    }
  };

  const signup = async (email: string, pass: string, name: string, role: UserRole, phone?: string) => {
    if (pass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // Helper to persist user into local registry cache
    const saveToLocalRegistry = (profile: UserProfile) => {
      try {
        localStorage.setItem('cartgo_local_user', JSON.stringify(profile));
        const existing = localStorage.getItem('cartgo_registered_users');
        let list: UserProfile[] = existing ? JSON.parse(existing) : [];
        list = list.filter(
          (u) =>
            u.email?.toLowerCase() !== cleanEmail &&
            u.displayName?.toLowerCase() !== trimmedName.toLowerCase()
        );
        list.push(profile);
        localStorage.setItem('cartgo_registered_users', JSON.stringify(list));
      } catch (e) {
        console.warn('Error updating local registry during signup:', e);
      }
    };

    // Check if user email or registered username already exists in Firestore or local registry
    try {
      const qEmail = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const qSnapEmail = await getDocs(qEmail);
      if (!qSnapEmail.empty) {
        throw new Error('An account with this email address already exists. Please switch to the "Login" tab.');
      }

      const qName = query(collection(db, 'users'), where('displayNameLower', '==', trimmedName.toLowerCase()));
      const qSnapName = await getDocs(qName);
      if (!qSnapName.empty) {
        throw new Error('An account with this registered name/username already exists. Please choose a different name or switch to the "Login" tab.');
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes('already exists')) {
        throw checkErr;
      }
    }

    try {
      const savedUsers = localStorage.getItem('cartgo_registered_users');
      if (savedUsers) {
        const usersList = JSON.parse(savedUsers) as UserProfile[];
        if (usersList.some((u) => u.email?.toLowerCase() === cleanEmail)) {
          throw new Error('An account with this email address already exists. Please switch to the "Login" tab.');
        }
        if (usersList.some((u) => u.displayName?.toLowerCase() === trimmedName.toLowerCase() || u.displayNameLower?.toLowerCase() === trimmedName.toLowerCase())) {
          throw new Error('An account with this registered name/username already exists. Please choose a different name or switch to the "Login" tab.');
        }
      }
    } catch (locErr: any) {
      if (locErr.message?.includes('already exists')) {
        throw locErr;
      }
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: trimmedName });
        const newProf: UserProfile = {
          uid: res.user.uid,
          email: cleanEmail,
          displayName: trimmedName,
          displayNameLower: trimmedName.toLowerCase(),
          phone: phone || '',
          role,
          createdAt: new Date().toISOString(),
          disabled: false,
          registeredPassword: pass,
        };
        try {
          await setDoc(doc(db, 'users', res.user.uid), newProf, { merge: true });
        } catch (e) {
          console.warn('Could not save user profile doc:', e);
        }
        saveToLocalRegistry(newProf);
        setUserProfile(newProf);
      }
    } catch (err: any) {
      const code = err.code || '';
      console.warn('Firebase signup warning:', code, err.message);

      if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/auth-domain-config-required' ||
        code === 'auth/network-request-failed' ||
        code === 'auth/internal-error'
      ) {
        const fallbackUid = 'local_' + btoa(cleanEmail).replace(/=/g, '');
        const fallbackProf: UserProfile = {
          uid: fallbackUid,
          email: cleanEmail,
          displayName: trimmedName,
          displayNameLower: trimmedName.toLowerCase(),
          phone: phone || '',
          role,
          createdAt: new Date().toISOString(),
          disabled: false,
          registeredPassword: pass,
        };
        saveToLocalRegistry(fallbackProf);
        setCurrentUser({ uid: fallbackUid, email: cleanEmail, displayName: trimmedName });
        setUserProfile(fallbackProf);

        try {
          await setDoc(doc(db, 'users', fallbackUid), fallbackProf, { merge: true });
        } catch (e) {
          console.warn('Could not save fallback user doc to Firestore:', e);
        }
        return;
      }

      if (code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists. Please switch to the "Login" tab.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters long.');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    localStorage.removeItem('cartgo_local_user');
    setCurrentUser(null);
    setUserProfile(null);
  };

  const loginDemoUser = async (_role: UserRole) => {
    // Deprecated - user requested removal of demo logins
    throw new Error('Demo accounts have been disabled. Please login or create a new account.');
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...userProfile, ...data } as UserProfile;
    if (currentUser.uid.startsWith('local_') || currentUser.uid.startsWith('admin_')) {
      localStorage.setItem('cartgo_local_user', JSON.stringify(updated));
    } else {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (e) {
        console.warn('Error updating profile in firestore', e);
      }
    }
    setUserProfile(updated);
  };

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email?.toLowerCase() === 'hashirfarman0047@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'cartgosupport@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        login,
        loginWithGoogle,
        signup,
        logout,
        loginDemoUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
