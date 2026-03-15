import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserService } from '../services/UserService';

interface AuthContextType {
  user: User | null;
  twitchUser: any | null;
  isAuthReady: boolean;
  isAdmin: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [twitchUser, setTwitchUser] = useState<any | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadTwitchUser = () => {
      const stored = localStorage.getItem('twitch_user');
      if (stored) {
        try {
          setTwitchUser(JSON.parse(stored));
        } catch (e) {
          setTwitchUser(null);
        }
      } else {
        setTwitchUser(null);
      }
    };

    loadTwitchUser();
    window.addEventListener('twitch_user_updated', loadTwitchUser);
    return () => window.removeEventListener('twitch_user_updated', loadTwitchUser);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync user data with new architecture
        if (twitchUser) {
          await UserService.syncUser(twitchUser);
        }
        
        // Check admin status
        const adminStatus = await UserService.isAdmin(firebaseUser.uid);
        setIsAdmin(adminStatus);
        setIsAuthReady(true);
      } else {
        // If no firebase user, sign in anonymously
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will trigger again with the new user
        } catch (err) {
          console.error('Anonymous auth error:', err);
          setIsAuthReady(true); // Still ready even if error, to unblock UI
        }
      }
    });

    return unsub;
  }, [twitchUser]);

  const logout = () => {
    localStorage.removeItem('twitch_user');
    localStorage.removeItem('twitch_access_token');
    setTwitchUser(null);
    auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, twitchUser, isAuthReady, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
