import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | { uid: string; email: string | null; displayName: string | null } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
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
        const isAdminUser = user.email?.toLowerCase() === 'hashirfarman0047@gmail.com';
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

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      // Check if user is disabled in Firestore
      if (userCred.user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
          if (userDoc.exists() && userDoc.data()?.disabled === true) {
            await signOut(auth);
            throw new Error('Your account has been disabled by the administrator. Your profile and listed data remain safely saved in our database.');
          }
        } catch (checkErr: any) {
          if (checkErr.message?.includes('disabled by the administrator')) {
            throw checkErr;
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('disabled by the administrator')) {
        throw err;
      }

      const code = err.code || '';
      console.warn('Firebase login warning:', code, err.message);

      if (code === 'auth/operation-not-allowed' || code === 'auth/auth-domain-config-required' || code === 'auth/network-request-failed') {
        const fallbackUid = 'local_' + btoa(cleanEmail).replace(/=/g, '');
        
        // Check local storage if disabled
        const existingLocal = localStorage.getItem('cartgo_local_user');
        if (existingLocal) {
          const parsed = JSON.parse(existingLocal);
          if (parsed.disabled) {
            throw new Error('Your account has been disabled by the administrator. Your data remains safely preserved.');
          }
        }

        const fallbackProf: UserProfile = {
          uid: fallbackUid,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          role: 'buyer',
          createdAt: new Date().toISOString(),
          disabled: false,
        };
        localStorage.setItem('cartgo_local_user', JSON.stringify(fallbackProf));
        setCurrentUser({ uid: fallbackUid, email: cleanEmail, displayName: fallbackProf.displayName });
        setUserProfile(fallbackProf);
        return;
      }

      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. If you do not have an account yet, please click "Register Account".');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Access to this account has been temporarily disabled due to many failed login attempts. Try again later.');
      }
      throw err;
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
          await setDoc(doc(db, 'users', res.user.uid), newProf);
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
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
