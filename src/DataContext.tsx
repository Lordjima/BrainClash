import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
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
  const [twitchUser, setTwitchUser] = useState(localStorage.getItem('twitch_user'));

  useEffect(() => {
    const handleTwitchUserUpdated = () => {
      setTwitchUser(localStorage.getItem('twitch_user'));
    };
    window.addEventListener('twitch_user_updated', handleTwitchUserUpdated);
    return () => window.removeEventListener('twitch_user_updated', handleTwitchUserUpdated);
  }, []);

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
        // Subscribe to profile by UID - this is the most reliable way
        if (unsubProfile) unsubProfile();
        
        const profilePath = `profiles/${user.uid}`;
        unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
          console.log('DataContext: onSnapshot triggered for UID', user.uid, docSnap.data());
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as GlobalLeaderboardEntry);
          } else {
            // If no profile by UID, check if we have a Twitch user and try to find by username
            // This handles legacy profiles or profiles created before UID-keying was enforced
            if (twitchUser) {
              try {
                const twitchUserObj = JSON.parse(twitchUser);
                const q = query(collection(db, 'profiles'), where('username', '==', twitchUserObj.display_name));
                getDocs(q).then(snapshot => {
                  if (!snapshot.empty) {
                    setUserProfile(snapshot.docs[0].data() as GlobalLeaderboardEntry);
                  } else {
                    setUserProfile(null);
                  }
                }).catch(err => {
                  handleFirestoreError(err, OperationType.GET, 'profiles (query by username)');
                });
              } catch (e) {
                console.error('Error parsing twitch_user:', e);
              }
            } else {
              setUserProfile(null);
            }
          }
          
          if (!isInitialAuthCheckDone) {
            isInitialAuthCheckDone = true;
            setIsLoaded(true);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, profilePath);
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
      handleFirestoreError(err, OperationType.LIST, 'profiles');
    });

    const unsubThemes = onSnapshot(collection(db, 'themes'), (snapshot) => {
      const data: Record<string, Theme> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data() as Theme;
      });
      setThemes(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'themes');
    });

    const unsubShop = onSnapshot(collection(db, 'shopItems'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ShopItem);
      setShopItems(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'shopItems');
    });

    const unsubBadges = onSnapshot(collection(db, 'badges'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Badge);
      setBadges(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'badges');
    });

    const unsubChests = onSnapshot(collection(db, 'chests'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Chest);
      setChests(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chests');
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
  }, [twitchUser]);

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
