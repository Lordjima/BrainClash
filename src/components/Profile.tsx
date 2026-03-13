import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, LogOut, User, Coins, Shield, EyeOff, RefreshCcw, Star, Award, Zap, Heart, TrendingUp, ShoppingBag } from 'lucide-react';
import Logo from './Logo';
import { socket } from '../lib/socket';
import type { GlobalLeaderboardEntry, ShopItem, Badge } from '../types';
import * as LucideIcons from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<GlobalLeaderboardEntry | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        socket.emit('get_profile', parsedUser.display_name);
      } catch (err) {
        console.error('Error parsing twitch_user from localStorage:', err);
        localStorage.removeItem('twitch_user');
      }
    }

    socket.on('profile_data', (data: GlobalLeaderboardEntry) => {
      setProfile(data);
    });

    socket.on('bootstrap_data', (data: { allBadges: Badge[], shopItems: ShopItem[] }) => {
      if (data.allBadges) {
        setAllBadges(data.allBadges);
      }
      if (data.shopItems) {
        setShopItems(data.shopItems);
      }
    });

    socket.emit('request_bootstrap_data');

    return () => {
      socket.off('profile_data');
      socket.off('bootstrap_data');
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('twitch_user');
    setUser(null);
    setProfile(null);
  };

  const handleBuy = (itemId: string, price: number) => {
    if (user && profile && profile.coins >= price) {
      socket.emit('buy_item', { username: user.display_name, itemId, cost: price });
    }
  };

  const handleToggleSub = () => {
    if (user) {
      socket.emit('toggle_sub', user.display_name);
    }
  };

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Star;
    return <Icon className={size} />;
  };

  return (
    <div className="h-full px-6 pb-6 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto lg:overflow-hidden custom-scrollbar py-4">
        
        {/* Left Column: Stats & Profile */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] -mr-16 -mt-16" />
            
            {user ? (
              <>
                <div className="relative inline-block mb-4">
                  <img 
                    src={user.profile_image_url} 
                    alt="" 
                    className="w-24 h-24 rounded-full border-4 border-purple-500/50 p-1"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-zinc-900">
                    LVL {profile?.level || 1}
                  </div>
                </div>

                <h2 className="text-2xl font-black mb-1 tracking-tight">{user.display_name}</h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${profile?.is_sub ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                    {profile?.is_sub ? 'Abonné Premium' : 'Joueur Standard'}
                  </span>
                  <button onClick={handleToggleSub} className="text-[10px] font-bold text-zinc-600 hover:text-white transition-colors uppercase">
                    (Simuler)
                  </button>
                </div>

                <div className="space-y-4">
                  {/* XP Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span>Expérience</span>
                      <span>{profile?.xp || 0} / {(profile?.level || 1) * 1000}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-1000" 
                        style={{ width: `${((profile?.xp || 0) % 1000) / 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3 text-left">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                      <Coins className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Coins</span>
                    </div>
                    <div className="text-xl font-black font-mono">{profile?.coins || 0}</div>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3 text-left">
                    <div className="flex items-center gap-2 text-fuchsia-400 mb-1">
                      <div className="w-4 h-4 bg-fuchsia-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">B</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">BrainCoins</span>
                    </div>
                    <div className="text-xl font-black font-mono">{profile?.brainCoins || 0}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-8 bg-zinc-800 hover:bg-red-600 text-white py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  DÉCONNEXION
                </button>
              </>
            ) : (
              <div className="py-12">
                <p className="text-zinc-500 font-bold mb-6">Connectez-vous pour voir votre progression.</p>
                <Link to="/" className="bg-white text-black px-8 py-3 rounded-2xl font-black transition-all active:scale-95">
                  RETOUR
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inventory & Shop */}
        <div className="lg:col-span-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
          {/* Badges Section */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              MES BADGES
            </h2>
            
            {allBadges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {allBadges.map(badge => {
                  const isEarned = profile?.badges?.includes(badge.id);
                  return (
                    <div 
                      key={badge.id} 
                      className={`bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center group transition-all ${
                        isEarned ? 'opacity-100' : 'opacity-40 grayscale'
                      }`}
                      title={badge.description}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center mb-3 ${
                        isEarned ? 'text-purple-400' : 'text-zinc-600'
                      }`}>
                        {getIcon(badge.icon, "w-5 h-5")}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-tight truncate w-full ${
                        isEarned ? 'text-white' : 'text-zinc-500'
                      }`}>
                        {badge.name}
                      </div>
                      <div className="text-[8px] font-bold text-zinc-600 mt-1">
                        {isEarned ? 'DÉBLOQUÉ' : 'VERROUILLÉ'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                <p className="text-zinc-600 font-bold">Aucun badge acquis pour le moment.</p>
              </div>
            )}
          </div>

          {/* Shop Section */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-fuchsia-500" />
              BOUTIQUE D'OBJETS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shopItems.map(item => {
                const price = profile?.is_sub ? Math.floor(item.price * 0.8) : item.price;
                const canAfford = (profile?.coins || 0) >= price;
                const inventoryCount = profile?.inventory.filter(id => id === item.id).length || 0;

                return (
                  <div key={item.id} className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 flex gap-4 group">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                      item.type === 'attack' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {getIcon(item.icon, "w-8 h-8")}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-sm">{item.name}</h3>
                        <div className="flex items-center gap-1 text-amber-500 font-mono text-xs font-bold">
                          <Coins className="w-3 h-3" />
                          {price}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-600 uppercase">En stock: {inventoryCount}</span>
                        <button
                          onClick={() => handleBuy(item.id, price)}
                          disabled={!canAfford}
                          className={`px-4 py-1.5 rounded-lg font-black text-[10px] transition-all ${
                            canAfford 
                              ? 'bg-white text-black hover:bg-zinc-200' 
                              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          ACHETER
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
