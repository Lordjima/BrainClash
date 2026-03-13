import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from './lib/socket';
import { GlobalLeaderboardEntry, Theme, ShopItem } from './types';

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
    const handleBootstrap = (data: { leaderboard: GlobalLeaderboardEntry[], themes: Record<string, Theme>, shopItems: ShopItem[] }) => {
      setLeaderboard(data.leaderboard);
      setThemes(data.themes);
      if (data.shopItems) setShopItems(data.shopItems);
      setIsLoaded(true);
    };

    const handleProfile = (profile: GlobalLeaderboardEntry) => {
      setUserProfile(profile);
    };

    socket.on('bootstrap_data', handleBootstrap);
    socket.on('profile_data', handleProfile);

    socket.on('leaderboard_update', (newLeaderboard: GlobalLeaderboardEntry[]) => {
      setLeaderboard(newLeaderboard);
    });

    // Request data
    socket.emit('request_bootstrap_data');

    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      socket.emit('get_profile', user.display_name);
    }

    return () => {
      socket.off('bootstrap_data', handleBootstrap);
      socket.off('profile_data', handleProfile);
      socket.off('leaderboard_update');
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
