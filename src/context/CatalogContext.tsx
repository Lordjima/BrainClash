import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CatalogItem, CatalogChest, CatalogBadge, Theme } from '../types';

interface CatalogContextType {
  items: CatalogItem[];
  chests: CatalogChest[];
  badges: CatalogBadge[];
  themes: Record<string, Theme>;
  leaderboard: any[]; // We'll handle this here for now
  isLoaded: boolean;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [chests, setChests] = useState<CatalogChest[]>([]);
  const [badges, setBadges] = useState<CatalogBadge[]>([]);
  const [themes, setThemes] = useState<Record<string, Theme>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'catalogItems'), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as CatalogItem)));
    });

    const unsubChests = onSnapshot(collection(db, 'catalogChests'), (snap) => {
      setChests(snap.docs.map(d => ({ id: d.id, ...d.data() } as CatalogChest)));
    });

    const unsubBadges = onSnapshot(collection(db, 'catalogBadges'), (snap) => {
      setBadges(snap.docs.map(d => ({ id: d.id, ...d.data() } as CatalogBadge)));
    });

    const unsubThemes = onSnapshot(collection(db, 'themes'), (snap) => {
      const themeMap: Record<string, Theme> = {};
      snap.docs.forEach(d => {
        themeMap[d.id] = { id: d.id, ...d.data() } as Theme;
      });
      setThemes(themeMap);
    });

    // Leaderboard (querying a flattened leaderboard collection)
    const unsubLeaderboard = onSnapshot(query(collection(db, 'leaderboard'), orderBy('score', 'desc')), (snap) => {
      setLeaderboard(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });

    setIsLoaded(true);

    return () => {
      unsubItems();
      unsubChests();
      unsubBadges();
      unsubThemes();
      unsubLeaderboard();
    };
  }, []);

  return (
    <CatalogContext.Provider value={{ items, chests, badges, themes, leaderboard, isLoaded }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
