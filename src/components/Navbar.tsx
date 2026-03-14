import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Heart, Star, Coins, ChevronDown, Shield, PlusCircle, Inbox, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Logo from './Logo';
import { useData } from '../DataContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { userProfile } = useData();
  const [twitchUser, setTwitchUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      try {
        setTwitchUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing twitch_user from localStorage:', err);
        localStorage.removeItem('twitch_user');
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TWITCH_AUTH_SUCCESS') {
        const user = event.data.user;
        localStorage.setItem('twitch_user', JSON.stringify(user));
        setTwitchUser(user);
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTwitchLogin = async () => {
    try {
      const clientId = '47anvp07hr6dfxl1ucsscnjavs5j2e'; // Hardcoded for now
      const redirectUri = `${window.location.origin}/auth/twitch/callback`;
      const scope = 'user:read:email';
      const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );
      
      if (!authWindow) {
        alert('Veuillez autoriser les popups pour vous connecter avec Twitch.');
      }
    } catch (err) {
      console.error('Twitch login error:', err);
      alert('Erreur lors de la connexion Twitch.');
    }
  };

  const isAdmin = twitchUser?.display_name === 'JimaG4ming';

  // Check for new notifications (mock logic for now)
  const [hasNewBadge, setHasNewBadge] = useState(false);
  
  useEffect(() => {
    if (userProfile?.badges) {
      const lastBadgeCount = parseInt(localStorage.getItem('last_badge_count') || '0');
      if (userProfile.badges.length > lastBadgeCount) {
        setHasNewBadge(true);
      }
    }
  }, [userProfile?.badges]);

  const clearNotifications = () => {
    if (userProfile?.badges) {
      localStorage.setItem('last_badge_count', userProfile.badges.length.toString());
      setHasNewBadge(false);
    }
  };

  return (
    <nav className="relative z-50 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800/50 p-8 shrink-0">
      <div className="w-full flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        {userProfile && (
          <div className="hidden md:flex items-center gap-8 bg-zinc-900/40 backdrop-blur-xl px-8 py-3 rounded-full border border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 group cursor-help">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Coins</span>
                  <span className="text-sm font-black font-mono text-amber-500 leading-none">{userProfile.coins.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-px h-6 bg-white/5" />

              <div className="flex items-center gap-2 group cursor-help">
                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 group-hover:border-fuchsia-500/50 transition-colors">
                  <div className="w-4 h-4 bg-fuchsia-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">B</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">BrainCoins</span>
                  <span className="text-sm font-black font-mono text-fuchsia-400 leading-none">{userProfile.brainCoins.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {twitchUser ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  if (!isMenuOpen) clearNotifications();
                }}
                className="flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-800/80 px-2 py-2 pr-4 rounded-full border border-white/5 transition-all relative group"
              >
                {hasNewBadge && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-fuchsia-500 rounded-full border-2 border-zinc-950 animate-pulse z-10" />
                )}
                <div className="relative">
                  {twitchUser.profile_image_url ? (
                    <img src={twitchUser.profile_image_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-fuchsia-500/50 transition-colors" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-fuchsia-600 flex items-center justify-center border-2 border-white/10">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-zinc-950 rounded-full" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-black text-white leading-none mb-1">{twitchUser.display_name}</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Joueur</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-fuchsia-500' : ''}`} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-3 overflow-hidden z-[100]"
                  >
                    <div className="px-5 py-3 border-b border-white/5 mb-2 bg-white/5">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Connecté en tant que</div>
                      <div className="font-black text-white truncate">{twitchUser.display_name}</div>
                    </div>
                    
                    <div className="px-2 space-y-2">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-fuchsia-500/10 transition-colors">
                          <User className="w-4 h-4 group-hover:text-fuchsia-500" />
                        </div>
                        Mon Profil
                      </Link>

                      <Link 
                        to="/inventory" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                          <Package className="w-4 h-4 group-hover:text-blue-500" />
                        </div>
                        Mon Inventaire
                      </Link>

                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                            <Shield className="w-4 h-4 group-hover:text-amber-500" />
                          </div>
                          Panel Admin
                        </Link>
                      )}

                      <Link 
                        to="/create" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                          <PlusCircle className="w-4 h-4 group-hover:text-blue-500" />
                        </div>
                        Créer un salon
                      </Link>

                      {isAdmin && (
                        <Link 
                          to="/review" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                            <Inbox className="w-4 h-4 group-hover:text-green-500" />
                          </div>
                          Vérifier questions
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/5 my-2 mx-4" />
                    
                    <div className="px-2">
                      <button 
                        onClick={() => {
                          localStorage.removeItem('twitch_user');
                          setTwitchUser(null);
                          setIsMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <LogIn className="w-4 h-4 rotate-180" />
                        </div>
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={handleTwitchLogin} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-full font-medium text-sm transition-colors">
              <LogIn className="w-4 h-4" />
              Connexion Twitch
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
