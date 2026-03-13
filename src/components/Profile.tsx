import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, LogOut, User, Coins, Shield, EyeOff, RefreshCcw, Star, Award, Zap } from 'lucide-react';
import Logo from './Logo';
import { socket } from '../lib/socket';
import type { GlobalLeaderboardEntry, ShopItem } from '../types';

const SHOP_ITEMS: ShopItem[] = [
  { id: 'fumigene', name: 'Fumigène', description: 'Floute l\'écran des adversaires pendant 5s', price: 50, icon: 'EyeOff', type: 'attack' },
  { id: 'seisme', name: 'Séisme', description: 'Fait trembler l\'écran des adversaires', price: 75, icon: 'Zap', type: 'attack' },
  { id: 'inversion', name: 'Inversion', description: 'Met l\'écran des adversaires à l\'envers', price: 100, icon: 'RefreshCcw', type: 'attack' },
  { id: 'bouclier', name: 'Bouclier', description: 'Protège contre la prochaine attaque', price: 50, icon: 'Shield', type: 'defense' }
];

const BADGES_INFO: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
  'first_game': { label: 'Nouveau Joueur', icon: <Star className="w-5 h-5" />, color: 'text-yellow-400 bg-yellow-400/10' },
  'veteran': { label: 'Vétéran (10 parties)', icon: <Award className="w-5 h-5" />, color: 'text-blue-400 bg-blue-400/10' },
  'expert': { label: 'Expert (50 parties)', icon: <Award className="w-5 h-5" />, color: 'text-purple-400 bg-purple-400/10' },
  'champion': { label: 'Champion (1ère victoire)', icon: <TrophyIcon className="w-5 h-5" />, color: 'text-fuchsia-400 bg-fuchsia-400/10' }
};

function TrophyIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 3.31 2.69 6 6 6s6-2.69 6-6V2Z" />
    </svg>
  );
}

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<GlobalLeaderboardEntry | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      socket.emit('get_profile', parsedUser.display_name);
    }

    socket.on('profile_data', (data: GlobalLeaderboardEntry) => {
      setProfile(data);
    });

    return () => {
      socket.off('profile_data');
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'EyeOff': return <EyeOff className="w-6 h-6" />;
      case 'Zap': return <Zap className="w-6 h-6" />;
      case 'RefreshCcw': return <RefreshCcw className="w-6 h-6" />;
      case 'Shield': return <Shield className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center py-12 px-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Info */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl text-center flex flex-col items-center h-fit">
          <div className="flex justify-center items-center w-full mb-8">
            <h2 className="text-2xl font-bold">Mon Profil</h2>
          </div>

          {user ? (
            <>
              {user.profile_image_url ? (
                <img 
                  src={user.profile_image_url} 
                  alt={user.display_name} 
                  className="w-32 h-32 rounded-full border-4 border-fuchsia-500 mb-4"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                  <User className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              
              <h3 className="text-3xl font-bold mb-1">{user.display_name}</h3>
              
              {profile && (
                <div className="flex items-center gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile.is_sub ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50' : 'bg-zinc-800 text-zinc-400'}`}>
                    {profile.is_sub ? 'Abonné (Sub)' : 'Non-Abonné'}
                  </span>
                  <button onClick={handleToggleSub} className="text-xs underline text-zinc-500 hover:text-white">
                    (Simuler)
                  </button>
                </div>
              )}

              {profile && (
                <div className="w-full bg-zinc-950 rounded-2xl p-4 mb-6 border border-zinc-800">
                  <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-2xl">
                    <Coins className="w-6 h-6" />
                    {profile.coins} Points
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Les Subs gagnent 2x plus de points !</p>
                </div>
              )}

              {profile && profile.badges && profile.badges.length > 0 && (
                <div className="w-full mb-6">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 text-left">Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map(badgeId => {
                      const b = BADGES_INFO[badgeId];
                      if (!b) return null;
                      return (
                        <div key={badgeId} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${b.color}`} title={b.label}>
                          {b.icon}
                          {b.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto"
              >
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </button>
            </>
          ) : (
            <div className="py-12">
              <p className="text-zinc-400 mb-6">Vous n'êtes pas connecté.</p>
              <Link to="/" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-block">
                Retour à l'accueil
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Shop */}
        {user && profile && (
          <div className="md:col-span-2 bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-fuchsia-500/20 rounded-xl">
                <Coins className="w-8 h-8 text-fuchsia-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Boutique</h2>
                <p className="text-zinc-400">Achetez des objets pour pimenter vos parties !</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SHOP_ITEMS.map(item => {
                const price = profile.is_sub ? Math.floor(item.price * 0.8) : item.price;
                const canAfford = profile.coins >= price;
                const inventoryCount = profile.inventory.filter(id => id === item.id).length;

                return (
                  <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${item.type === 'attack' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {getIcon(item.icon)}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                          <Coins className="w-4 h-4" />
                          {price}
                        </div>
                        {profile.is_sub && (
                          <span className="text-[10px] text-fuchsia-400 font-bold mt-1 line-through opacity-50">{item.price}</span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                    <p className="text-sm text-zinc-400 mb-6 flex-1">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Possédé: <span className="text-white">{inventoryCount}</span>
                      </span>
                      <button
                        onClick={() => handleBuy(item.id, price)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                          canAfford 
                            ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' 
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        Acheter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
