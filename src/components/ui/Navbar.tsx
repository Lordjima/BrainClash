import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Coins, ChevronDown, Shield, PlusCircle, Inbox, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Logo from './Logo';
import { useData } from '../../DataContext';

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
        console.error('Error parsing twitch_user:', err);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TWITCH_AUTH_SUCCESS') {
        setTwitchUser(event.data.user);
        localStorage.setItem('twitch_user', JSON.stringify(event.data.user));
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTwitchLogin = () => {
    const clientId = '47anvp07hr6dfxl1ucsscnjavs5j2e';
    const redirectUri = `${window.location.origin}/auth/twitch/callback`;
    const scope = 'user:read:email';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
    
    window.open(url, 'oauth_popup', 'width=600,height=700');
  };

  const isAdmin = twitchUser?.display_name === 'JimaG4ming';

  return (
    <nav className="relative z-50 bg-zinc-950/50 backdrop-blur-md border-b border-white/5 p-4 md:px-8 shrink-0">
      <div className="w-full flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        <div className="flex items-center gap-6">
          {userProfile && (
            <div className="hidden md:flex items-center gap-6 bg-zinc-900/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/5">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-black font-mono text-amber-500">{userProfile.coins.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-fuchsia-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">B</div>
                <span className="text-sm font-black font-mono text-fuchsia-400">{userProfile.brainCoins.toLocaleString()}</span>
              </div>
            </div>
          )}

          {twitchUser ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-800/80 px-2 py-2 pr-4 rounded-full border border-white/5 transition-all group"
              >
                <div className="relative">
                  <img src={twitchUser.profile_image_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-fuchsia-500/50 transition-colors" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-zinc-950 rounded-full" />
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
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
                    className="absolute right-0 mt-3 w-64 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl py-3 overflow-hidden z-[100]"
                  >
                    <div className="px-5 py-3 border-b border-white/5 mb-2 bg-white/5">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Connecté en tant que</div>
                      <div className="font-black text-white truncate">{twitchUser.display_name}</div>
                    </div>
                    
                    <div className="px-2 space-y-1">
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <User className="w-4 h-4 group-hover:text-fuchsia-500" />
                        Mon Profil
                      </Link>
                      <Link to="/inventory" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <Package className="w-4 h-4 group-hover:text-blue-500" />
                        Mon Inventaire
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                          <Shield className="w-4 h-4 group-hover:text-amber-500" />
                          Panel Admin
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
                        <LogIn className="w-4 h-4 rotate-180" />
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={handleTwitchLogin} className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-fuchsia-600/20">
              <LogIn className="w-4 h-4" />
              Connexion Twitch
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
