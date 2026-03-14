import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { GlobalLeaderboardEntry, Theme, ShopItem, Badge, Chest } from './types';
import { InitializationService } from './services/InitializationService';

interface DataContextType {
  leaderboard: GlobalLeaderboardEntry[];
  themes: Record<string, Theme>;
  userProfile: GlobalLeaderboardEntry | null;
  shopItems: ShopItem[];
  badges: Badge[];
  chests: Chest[];
  isLoaded: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [themes, setThemes] = useState<Record<string, Theme>>({});
  const [userProfile, setUserProfile] = useState<GlobalLeaderboardEntry | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [chests, setChests] = useState<Chest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !auth) {
      setError('Firebase n\'est pas initialisé correctement. Vérifiez votre configuration.');
      setIsLoaded(true);
      return;
    }

    let unsubProfile: (() => void) | undefined;
    let isInitialAuthCheckDone = false;

    // Ensure we are signed in (anonymously if needed) to have a valid session for Firestore
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Initialize database if needed
        InitializationService.initializeDatabase();
      }
      
      if (!user) {
        signInAnonymously(auth).catch(err => {
          console.error('Anonymous auth error:', err);
          if (!isInitialAuthCheckDone) {
            isInitialAuthCheckDone = true;
            setIsLoaded(true);
          }
        });
        setUserProfile(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = undefined;
        }
        
        if (!isInitialAuthCheckDone) {
          isInitialAuthCheckDone = true;
          setIsLoaded(true);
        }
      } else {
        // Subscribe to profile using UID
        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data() as GlobalLeaderboardEntry);
          } else {
            // Check if we have Twitch info to show a local state until first save
            const storedUser = localStorage.getItem('twitch_user');
            if (storedUser) {
              try {
                const twitchUser = JSON.parse(storedUser);
                setUserProfile({
                  username: twitchUser.display_name,
                  score: 0,
                  games_played: 0,
                  date: Date.now(),
                  coins: 0,
                  brainCoins: 0,
                  is_sub: false,
                  badges: [],
                  inventory: [],
                  level: 1,
                  xp: 0
                } as any);
              } catch (e) {}
            }
          }
          
          if (!isInitialAuthCheckDone) {
            isInitialAuthCheckDone = true;
            setIsLoaded(true);
          }
        }, (err) => {
          console.error('Profile snapshot error:', err);
          if (!isInitialAuthCheckDone) {
            isInitialAuthCheckDone = true;
            setIsLoaded(true);
          }
        });
      }
    });

    const unsubLeaderboard = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const allProfiles = snapshot.docs.map(doc => doc.data() as GlobalLeaderboardEntry);
      
      // Group by username and keep the one with the highest score
      const uniqueProfilesMap = new Map<string, GlobalLeaderboardEntry>();
      
      allProfiles.forEach(profile => {
        const existing = uniqueProfilesMap.get(profile.username);
        if (!existing || profile.score > existing.score) {
          uniqueProfilesMap.set(profile.username, profile);
        }
      });
      
      const uniqueProfiles = Array.from(uniqueProfilesMap.values());
      
      // Sort by score descending
      setLeaderboard(uniqueProfiles.sort((a, b) => b.score - a.score));
    }, (err) => {
      console.error('Leaderboard error:', err);
      if (err.message?.includes('insufficient permissions')) {
        setError('Erreur de permissions sur le classement.');
      }
    });

    const unsubThemes = onSnapshot(collection(db, 'themes'), (snapshot) => {
      const data: Record<string, Theme> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data() as Theme;
      });
      setThemes(data);
    }, (err) => {
      console.error('Themes error:', err);
      if (err.message?.includes('insufficient permissions')) {
        setError('Erreur de permissions sur les thèmes.');
      } else {
        setError(err.message);
      }
    });

    const unsubShop = onSnapshot(collection(db, 'shopItems'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ShopItem);
      setShopItems(data);
    }, (err) => {
      console.error('Shop error:', err);
      if (err.message?.includes('insufficient permissions')) {
        setError('Erreur de permissions sur la boutique.');
      }
    });

    const unsubBadges = onSnapshot(collection(db, 'badges'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Badge);
      setBadges(data);
    }, (err) => {
      console.error('Badges error:', err);
    });

    const unsubChests = onSnapshot(collection(db, 'chests'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Chest);
      setChests(data);
    }, (err) => {
      console.error('Chests error:', err);
    });

    return () => {
      unsubAuth();
      unsubLeaderboard();
      unsubThemes();
      unsubShop();
      unsubBadges();
      unsubChests();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <DataContext.Provider value={{ leaderboard, themes, userProfile, shopItems, badges, chests, isLoaded, isLoading, setIsLoading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
