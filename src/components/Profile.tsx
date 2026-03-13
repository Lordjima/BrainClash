import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, LogOut, User, Coins, Shield, EyeOff, RefreshCcw, Star, Award, Zap, Heart, TrendingUp, ShoppingBag } from 'lucide-react';
import Logo from './Logo';
import { socket } from '../lib/socket';
import { useData } from '../DataContext';
import type { GlobalLeaderboardEntry, ShopItem, Badge } from '../types';
import * as LucideIcons from 'lucide-react';

export default function Profile() {
  const { leaderboard, shopItems: allShopItems, userProfile } = useData();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<GlobalLeaderboardEntry | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [showPayPal, setShowPayPal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(5);

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

    socket.on('bootstrap_data', (data: { allBadges: Badge[] }) => {
      if (data.allBadges) {
        setAllBadges(data.allBadges);
      }
    });


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

  const handleToggleSub = () => {
    if (user) {
      socket.emit('toggle_sub', user.display_name);
    }
  };

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Star;
    return <Icon className={size} />;
  };

  const handlePurchaseSuccess = () => {
    if (user) {
      socket.emit('add_brain_coins', { username: user.display_name, amount: purchaseAmount });
      setShowPayPal(false);
      alert(`Félicitations ! Vous avez reçu ${purchaseAmount} BrainCoins.`);
    }
  };

  return (
    <div className="h-full px-6 pb-6 bg-transparent overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
        
        {/* Left Column: Stats & Profile */}
        <div className="lg:col-span-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden">
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
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3 text-left relative group">
                    <div className="flex items-center gap-2 text-fuchsia-400 mb-1">
                      <div className="w-4 h-4 bg-fuchsia-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">B</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">BrainCoins</span>
                    </div>
                    <div className="text-xl font-black font-mono">{profile?.brainCoins || 0}</div>
                    <button 
                      onClick={() => setShowPayPal(true)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-fuchsia-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-fuchsia-600/50"
                      title="Acheter des BrainCoins"
                    >
                      <LucideIcons.Plus className="w-4 h-4 text-white" />
                    </button>
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

        {/* Right Column: Badges & Inventory */}
        <div className="lg:col-span-8 flex flex-col gap-8">
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

          {/* Inventory Section */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <LucideIcons.Package className="w-5 h-5 text-blue-500" />
              MON INVENTAIRE
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile?.inventory && profile.inventory.length > 0 ? (
                profile.inventory.map((itemId, idx) => {
                  const item = allShopItems.find(si => si.id === itemId);
                  return (
                    <div key={`${itemId}-${idx}`} className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center group transition-all">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        item?.type === 'attack' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {item ? getIcon(item.icon, "w-6 h-6") : <LucideIcons.Package className="w-6 h-6" />}
                      </div>
                      <div className="text-[10px] font-black text-white uppercase truncate w-full">{item?.name || itemId}</div>
                      <div className="text-[8px] font-bold text-zinc-600 mt-1 uppercase">{item?.type || 'Objet'}</div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                  <p className="text-zinc-600 font-bold">Votre inventaire est vide.</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link 
                to="/auction-house" 
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                ALLER AU MARCHÉ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PayPal Modal */}
      {showPayPal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/10 blur-[60px] -mr-16 -mt-16" />
            
            <div className="flex items-center justify-between relative">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Acheter des BrainCoins</h2>
              <button onClick={() => setShowPayPal(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                <LucideIcons.X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 relative">
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 text-center space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Taux de conversion</div>
                <div className="text-3xl font-black text-white">1 <span className="text-fuchsia-500">B</span> = 1.00 €</div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Quantité</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20, 50, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setPurchaseAmount(amount)}
                      className={`py-3 rounded-xl font-black transition-all ${
                        purchaseAmount === amount 
                          ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' 
                          : 'bg-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {amount} B
                    </button>
                  ))}
                  <div className="bg-zinc-800 rounded-xl flex items-center px-3">
                    <input 
                      type="number" 
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-transparent text-center font-black outline-none text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                <div className="text-sm font-bold text-zinc-400">Total à payer</div>
                <div className="text-2xl font-black text-blue-400">{purchaseAmount.toFixed(2)} €</div>
              </div>

              {/* Mock PayPal Button */}
              <button 
                onClick={handlePurchaseSuccess}
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
              >
                <div className="flex items-center font-serif italic font-bold text-xl">
                  <span className="text-white">Pay</span>
                  <span className="text-[#009cde]">Pal</span>
                </div>
              </button>
              
              <p className="text-[10px] text-zinc-600 text-center font-medium">
                Paiement sécurisé via PayPal. Les BrainCoins seront ajoutés instantanément à votre compte.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
