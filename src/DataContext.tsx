import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket, ensureSocketConnected } from './lib/socket';
import { GlobalLeaderboardEntry, Theme, ShopItem, Badge } from './types';

interface BootstrapPayload {
  leaderboard: GlobalLeaderboardEntry[];
  themes: Record<string, Theme>;
  shopItems?: ShopItem[];
  allBadges?: Badge[];
}

interface DataContextType {
  leaderboard: GlobalLeaderboardEntry[];
  themes: Record<string, Theme>;
  userProfile: GlobalLeaderboardEntry | null;
  shopItems: ShopItem[];
  isLoaded: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [themes, setThemes] = useState<Record<string, Theme>>({});
  const [userProfile, setUserProfile] = useState<GlobalLeaderboardEntry | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    ensureSocketConnected();

    const handleBootstrap = (data: BootstrapPayload) => {
      setLeaderboard(data.leaderboard || []);
      setThemes(data.themes || {});
      if (data.shopItems) setShopItems(data.shopItems);
      setIsLoaded(true);
    };

    const handleProfile = (profile: GlobalLeaderboardEntry) => {
      setUserProfile(profile);
    };

    const handleLeaderboardUpdate = (newLeaderboard: GlobalLeaderboardEntry[]) => {
      setLeaderboard(newLeaderboard || []);
    };

    socket.on('bootstrap_data', handleBootstrap);
    socket.on('profile_data', handleProfile);
    socket.on('leaderboard_update', handleLeaderboardUpdate);

    socket.emit('request_bootstrap_data');

    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.display_name) socket.emit('get_profile', user.display_name);
      } catch {
        localStorage.removeItem('twitch_user');
      }
    }

    return () => {
      socket.off('bootstrap_data', handleBootstrap);
      socket.off('profile_data', handleProfile);
      socket.off('leaderboard_update', handleLeaderboardUpdate);
    };
  }, []);

  return (
    <DataContext.Provider value={{ leaderboard, themes, userProfile, shopItems, isLoaded }}>
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
