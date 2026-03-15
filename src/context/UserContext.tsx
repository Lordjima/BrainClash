import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { PublicProfile, UserStats, UserWallet, InventoryEntry, UserBadge } from '../types';

interface UserContextType {
  profile: PublicProfile | null;
  stats: UserStats | null;
  wallet: UserWallet | null;
  inventory: InventoryEntry[];
  badges: UserBadge[];
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setProfile(null);
      setStats(null);
      setWallet(null);
      setInventory([]);
      setBadges([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubProfile = onSnapshot(doc(db, `users/${user.uid}/public`, 'profile'), (snap) => {
      if (snap.exists()) setProfile(snap.data() as PublicProfile);
    });

    const unsubStats = onSnapshot(doc(db, `users/${user.uid}/stats`, 'global'), (snap) => {
      if (snap.exists()) setStats(snap.data() as UserStats);
    });

    const unsubWallet = onSnapshot(doc(db, `users/${user.uid}/wallet`, 'main'), (snap) => {
      if (snap.exists()) setWallet(snap.data() as UserWallet);
    });

    const unsubInventory = onSnapshot(collection(db, `users/${user.uid}/inventory`), (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryEntry)));
    });

    const unsubBadges = onSnapshot(collection(db, `users/${user.uid}/badges`), (snap) => {
      setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as UserBadge)));
      setIsLoading(false);
    });

    return () => {
      unsubProfile();
      unsubStats();
      unsubWallet();
      unsubInventory();
      unsubBadges();
    };
  }, [user, isAuthReady]);

  return (
    <UserContext.Provider value={{ profile, stats, wallet, inventory, badges, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
