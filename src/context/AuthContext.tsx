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
        if (parsed.disabled) {
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

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Special Super Admin check
    if (cleanEmail === 'hashirfarman0047@gmail.com' && pass === 'Hashir5656') {
      const adminUid = 'admin_hashirfarman0047';
      const adminProf: UserProfile = {
        uid: adminUid,
        email: 'hashirfarman0047@gmail.com',
        displayName: 'Super Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        disabled: false,
      };

      try {
        await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (e) {
        // If Firebase Auth does not have this account registered, use seamlessly
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        } catch (createErr) {
          // Fallback to direct admin state if Auth domain is offline or restricted
        }
      }

      localStorage.setItem('cartgo_local_user', JSON.stringify(adminProf));
      setCurrentUser({ uid: adminUid, email: cleanEmail, displayName: 'Super Admin' });
      setUserProfile(adminProf);

      try {
        await setDoc(doc(db, 'users', adminUid), adminProf, { merge: true });
      } catch (err) {
        console.warn('Admin firestore doc save note:', err);
      }
      return;
    }

    // Check if user has a custom password set by Super Admin or user profile in Firestore
    let existingDocData: UserProfile | null = null;
    let existingDocId: string | null = null;

    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        existingDocId = firstDoc.id;
        existingDocData = firstDoc.data() as UserProfile;
      }
    } catch (err) {
      console.warn('Error querying Firestore user record:', err);
    }

    if (existingDocData?.disabled === true) {
      await signOut(auth).catch(() => {});
      throw new Error('Your account has been disabled by the administrator. Your profile remains safely preserved.');
    }

    // Check if Super Admin set a custom password override on this account
    if (existingDocData && existingDocData.customPassword) {
      if (pass !== existingDocData.customPassword) {
        throw new Error('Invalid password. If your password was changed by Super Admin, please enter the updated password.');
      }

      // Password matches Super Admin's override! Log user in cleanly.
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        if (userCred.user) {
          const userRef = doc(db, 'users', userCred.user.uid);
          await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
          setUserProfile(existingDocData);
          return;
        }
      } catch (authErr) {
        // Log in via profile if Firebase Auth credentials differ from Super Admin override
        const activeUid = existingDocId || existingDocData.uid || ('local_' + btoa(cleanEmail).replace(/=/g, ''));
        const updatedProf = { ...existingDocData, lastLogin: new Date().toISOString() };
        localStorage.setItem('cartgo_local_user', JSON.stringify(updatedProf));
        setCurrentUser({ uid: activeUid, email: cleanEmail, displayName: existingDocData.displayName });
        setUserProfile(updatedProf);
        await setDoc(doc(db, 'users', activeUid), { lastLogin: new Date().toISOString() }, { merge: true }).catch(() => {});
        return;
      }
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (userCred.user) {
        const userRef = doc(db, 'users', userCred.user.uid);
        const userDoc = await getDoc(userRef);

        // Compulsory Registration Check: User profile document MUST exist in Firestore
        if (!userDoc.exists()) {
          await signOut(auth);
          throw new Error('Account not found! Registration is COMPULSORY. You MUST register your account first before logging in.');
        }

        const userData = userDoc.data();
        if (userData?.disabled === true) {
          await signOut(auth);
          throw new Error('Your account has been disabled by the administrator. Your profile remains safely preserved.');
        }

        // Record last login
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
        setUserProfile(userData as UserProfile);
      }
    } catch (err: any) {
      if (
        err.message?.includes('disabled by the administrator') ||
        err.message?.includes('Registration is COMPULSORY') ||
        err.message?.includes('Invalid password')
      ) {
        throw err;
      }

      const code = err.code || '';
      console.warn('Firebase login warning:', code, err.message);

      if (code === 'auth/operation-not-allowed' || code === 'auth/auth-domain-config-required' || code === 'auth/network-request-failed') {
        const fallbackUid = existingDocId || ('local_' + btoa(cleanEmail).replace(/=/g, ''));
        
        // Check if user registered locally first
        const existingLocal = localStorage.getItem('cartgo_local_user');
        if (existingLocal) {
          const parsed = JSON.parse(existingLocal) as UserProfile;
          if (parsed.email.toLowerCase() === cleanEmail) {
            if (parsed.disabled) {
              throw new Error('Your account has been disabled by the administrator.');
            }
            setCurrentUser({ uid: fallbackUid, email: cleanEmail, displayName: parsed.displayName });
            setUserProfile(parsed);
            return;
          }
        }

        // Check Firestore for fallback UID doc
        if (existingDocData) {
          if (existingDocData.disabled) {
            throw new Error('Your account has been disabled by the administrator.');
          }
          setCurrentUser({ uid: fallbackUid, email: cleanEmail, displayName: existingDocData.displayName });
          setUserProfile(existingDocData);
          return;
        }

        // If not registered locally or in Firestore, REJECT LOGIN!
        throw new Error('Account not found! Registration is COMPULSORY. You MUST register your account first before logging in.');
      }

      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        throw new Error('Account not found! Registration is COMPULSORY. You MUST register your account first before logging in.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
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

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        const newProf: UserProfile = {
          uid: res.user.uid,
          email: cleanEmail,
          displayName: name,
          phone: phone || '',
          role,
          createdAt: new Date().toISOString(),
          disabled: false,
        };
        try {
          await setDoc(doc(db, 'users', res.user.uid), newProf, { merge: true });
        } catch (e) {
          console.warn('Could not save user profile doc:', e);
        }
        setUserProfile(newProf);
      }
    } catch (err: any) {
      const code = err.code || '';
      console.warn('Firebase signup warning:', code, err.message);

      if (code === 'auth/operation-not-allowed' || code === 'auth/auth-domain-config-required' || code === 'auth/network-request-failed') {
        const fallbackUid = 'local_' + btoa(cleanEmail).replace(/=/g, '');
        const fallbackProf: UserProfile = {
          uid: fallbackUid,
          email: cleanEmail,
          displayName: name,
          phone: phone || '',
          role,
          createdAt: new Date().toISOString(),
          disabled: false,
        };
        localStorage.setItem('cartgo_local_user', JSON.stringify(fallbackProf));
        setCurrentUser({ uid: fallbackUid, email: cleanEmail, displayName: name });
        setUserProfile(fallbackProf);

        try {
          await setDoc(doc(db, 'users', fallbackUid), fallbackProf, { merge: true });
        } catch (e) {
          console.warn('Could not save fallback user doc to Firestore:', e);
        }
        return;
      }

      if (code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please switch to the "Login" tab.');
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
