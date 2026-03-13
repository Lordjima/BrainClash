import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Trophy, Award, ChevronRight, User, Star, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../lib/socket';
import { useData } from '../DataContext';
import { Badge as BadgeType } from '../types';
import * as LucideIcons from 'lucide-react';
import Logo from '../components/Logo';

export default function Home() {
  const navigate = useNavigate();
  const { leaderboard, isLoaded, userProfile, shopItems } = useData();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [twitchUser, setTwitchUser] = useState<any>(null);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Logo loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      try {
        setTwitchUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing twitch_user from localStorage:', err);
        localStorage.removeItem('twitch_user');
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TWITCH_AUTH_SUCCESS') {
        const user = event.data.user;
        localStorage.setItem('twitch_user', JSON.stringify(user));
        setTwitchUser(user);
      }
    };
    window.addEventListener('message', handleMessage);

    socket.on('room_joined', (roomId) => {
      navigate(`/room/${roomId}`);
    });

    socket.on('error', (msg) => {
      setError(msg);
    });

    socket.on('bootstrap_data', (data) => {
      if (data.allBadges) {
        setAllBadges(data.allBadges);
      }
    });

    socket.emit('request_bootstrap_data');

    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
      socket.off('room_joined');
      socket.off('error');
      socket.off('bootstrap_data');
    };
  }, [navigate]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twitchUser) {
      alert('Veuillez vous connecter avec Twitch pour jouer.');
      return;
    }
    if (roomCode.trim()) {
      socket.emit('join_room', {
        roomId: roomCode.trim().toUpperCase(),
        username: twitchUser.display_name,
        avatar: twitchUser.profile_image_url
      });
    }
  };

  const getIcon = (iconName: string, className: string = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Award;
    return <Icon className={className} />;
  };

  return (
    <div className="h-full bg-transparent overflow-hidden relative font-display flex flex-col">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Logo />
            </motion.div>
            <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              />
            </div>
            <p className="text-zinc-500 font-black tracking-[0.3em] text-xs uppercase animate-pulse">
              Initialisation des neurones...
            </p>
          </motion.div>
        ) : (
            <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 p-3 md:p-4 flex flex-col min-h-0"
          >
            {/* Main Content Card - Fits exactly without scroll */}
            <div className="flex-1 w-full max-w-7xl mx-auto bg-zinc-900/40 border border-zinc-800/50 rounded-[24px] md:rounded-[40px] relative overflow-hidden shadow-2xl backdrop-blur-sm flex flex-col items-center justify-center p-3 md:p-4">
              
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-pink-600/10 blur-[100px] -ml-32 -mb-32 pointer-events-none" />
              
              {/* Top Left: Shop Button */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-4 z-20">
                <button 
                  onClick={() => navigate('/auction-house?tab=shop')}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-zinc-950/50 border-2 border-amber-500/50 flex flex-col items-center justify-center hover:bg-zinc-800 transition-all group hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  title="Boutique"
                >
                  <LucideIcons.ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-amber-500 group-hover:text-amber-400 transition-colors" />
                  <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-tighter mt-1">Boutique</span>
                </button>
              </div>

              {/* Top Right: Action Buttons */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-20">
                <button 
                  onClick={() => setShowLeaderboard(true)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-700 transition-all group hover:scale-110 active:scale-95"
                  title="Classement"
                >
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                </button>
                <Link 
                  to="/submit-question"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-700 transition-all group hover:scale-110 active:scale-95"
                  title="Proposer une question"
                >
                  <LucideIcons.Plus className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                </Link>
                <button 
                  onClick={() => setShowRules(true)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center hover:bg-zinc-700 transition-all group hover:scale-110 active:scale-95"
                  title="Règles"
                >
                  <LucideIcons.Info className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
                </button>
              </div>
              
              <div className="relative z-10 text-center space-y-3 md:space-y-6 w-full max-w-4xl flex flex-col items-center">
                {/* Phrase instead of Logos */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="py-4 md:py-8"
                >
                  <h2 className="text-xl md:text-3xl lg:text-4xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-white uppercase italic">
                    ENTREZ LE CODE POUR REJOINDRE L'ARÈNE
                  </h2>
                </motion.div>

                {/* Join Form */}
                <motion.form 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onSubmit={handleJoinRoom} 
                  className="space-y-3 md:space-y-4 w-full max-w-xs md:max-w-sm mx-auto"
                >
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl blur-md opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="CODE"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full bg-zinc-950/90 border-[3px] border-zinc-800 rounded-2xl px-4 py-3 md:py-4 text-xl md:text-3xl lg:text-4xl font-mono font-black tracking-[0.4em] text-center focus:border-purple-500 outline-none transition-all placeholder:text-zinc-900"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="relative w-full group overflow-hidden rounded-2xl p-[2px] transition-transform active:scale-95 shadow-2xl shadow-purple-500/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                    <div className="relative bg-zinc-950 group-hover:bg-transparent transition-colors py-3 md:py-4 rounded-[0.9rem] flex items-center justify-center gap-3">
                      <span className="text-sm md:text-lg lg:text-xl font-black tracking-tighter group-hover:text-white transition-colors">
                        REJOINDRE L'ARÈNE
                      </span>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </button>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-[9px] md:text-[10px] font-black italic uppercase tracking-wider"
                    >
                      ⚠ {error}
                    </motion.p>
                  )}
                </motion.form>

                {/* Bottom Links */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center gap-4 md:gap-8"
                >
                  <Link to="/create" className="group flex flex-col items-center gap-1.5">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-yellow-500/50 transition-colors">
                      <Star className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-yellow-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[6px] md:text-[7px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white">Héberger</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-4 md:p-6 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <LucideIcons.X className="w-6 h-6" />
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-3">
                    <LucideIcons.Info className="w-8 h-8 text-purple-500" />
                    RÈGLES DU JEU
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium">Tout ce que tu dois savoir pour dominer l'arène.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <LucideIcons.Zap className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Calcul des Points</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Les points sont basés sur la rapidité et la justesse. Une réponse correcte donne jusqu'à <span className="text-white font-bold">1000 points</span>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <LucideIcons.TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Expérience (XP)</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Chaque partie terminée te rapporte de l'XP. Gagne des niveaux pour débloquer des badges exclusifs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <LucideIcons.Coins className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Coins & BrainCoins</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Les <span className="text-amber-500 font-bold">Coins</span> s'obtiennent en jouant. Les <span className="text-fuchsia-500 font-bold">BrainCoins</span> sont rares.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <LucideIcons.Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Système de Coffres</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Ouvre des coffres pour obtenir des objets aléatoires. Tu peux les utiliser en jeu ou les revendre !
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowRules(false)}
                  className="w-full bg-white text-black py-4 rounded-xl font-black text-lg transition-all active:scale-95"
                >
                  J'AI COMPRIS !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[32px] p-4 md:p-6 relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="absolute top-8 right-8 p-2 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <LucideIcons.X className="w-8 h-8" />
              </button>

              <h2 className="text-2xl font-black tracking-tighter mb-4 flex items-center gap-4">
                <Trophy className="w-10 h-10 text-yellow-500" />
                HALL OF FAME
              </h2>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.username}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800 group hover:border-purple-500/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-zinc-300 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-zinc-800 text-zinc-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {entry.avatar ? (
                      <img src={entry.avatar} alt="" className="w-10 h-10 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-zinc-600" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="font-black text-lg">{entry.username}</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Niveau {entry.level || 1}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-white">{entry.score.toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Points</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WoW Style Inventory Bag Modal */}
      <AnimatePresence>
        {showBag && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.5, x: 200, y: 200, opacity: 0 }}
              animate={{ scale: 1, x: 0, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, x: 200, y: 200, opacity: 0 }}
              className="pointer-events-auto w-full max-w-md bg-[#2a241e] border-[6px] border-[#4a3c2c] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
              style={{
                backgroundImage: 'radial-gradient(circle at center, #3a3126 0%, #2a241e 100%)'
              }}
            >
              {/* Bag Header */}
              <div className="bg-[#1a1612] px-4 py-2 border-b-2 border-[#4a3c2c] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LucideIcons.Backpack className="w-4 h-4 text-[#c4a484]" />
                  <h3 className="text-[#c4a484] font-black text-xs uppercase tracking-widest">Sac de voyage</h3>
                </div>
                <button onClick={() => setShowBag(false)} className="text-[#4a3c2c] hover:text-[#c4a484] transition-colors">
                  <LucideIcons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Bag Grid */}
              <div className="p-4 grid grid-cols-4 gap-2 bg-[#1a1612]/30">
                {Array.from({ length: 16 }).map((_, i) => {
                  const itemId = userProfile?.inventory?.[i];
                  const item = itemId ? shopItems.find(si => si.id === itemId) : null;
                  
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square rounded border-2 border-[#4a3c2c] bg-black/40 flex items-center justify-center relative group cursor-pointer hover:border-[#c4a484]/50 transition-colors ${item ? 'shadow-inner' : ''}`}
                    >
                      {item ? (
                        <>
                          <div className={`w-full h-full flex items-center justify-center ${
                            item.type === 'attack' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {getIcon(item.icon, "w-8 h-8")}
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/90 border border-[#4a3c2c] p-2 rounded text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                            <div className="font-black text-[#c4a484] uppercase mb-1">{item.name}</div>
                            <div className="text-zinc-400 leading-tight">{item.description}</div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#1a1612]/20" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bag Footer: Money */}
              <div className="bg-[#1a1612] p-4 border-t-2 border-[#4a3c2c] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-500 font-mono font-bold text-sm">{userProfile?.coins || 0}</span>
                    <div className="w-4 h-4 bg-amber-500 rounded-full border border-amber-700 shadow-sm" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-fuchsia-400 font-mono font-bold text-sm">{userProfile?.brainCoins || 0}</span>
                    <div className="w-4 h-4 bg-fuchsia-500 rounded-full border border-fuchsia-700 shadow-sm flex items-center justify-center text-[8px] font-black text-white">B</div>
                  </div>
                </div>
                <div className="text-[10px] font-black text-[#4a3c2c] uppercase tracking-tighter">16 / 16 Slots</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
