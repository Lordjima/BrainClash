import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Coins, Inbox, LogIn, PlusCircle, ShoppingBag, Star, User } from 'lucide-react';
import Logo from './Logo';
import { useData } from '../DataContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { userProfile } = useData();
  const [twitchUser, setTwitchUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
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
        setIsAuthLoading(false);
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
    if (isAuthLoading) return;

    setIsAuthLoading(true);

    try {
      const redirectUri = `${window.location.origin}/auth/twitch/callback`;
      const response = await fetch(`/api/auth/twitch/url?redirect_uri=${encodeURIComponent(redirectUri)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL (${response.status})`);
      }

      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');

      if (!authWindow) {
        setIsAuthLoading(false);
        alert('Veuillez autoriser les popups pour vous connecter avec Twitch.');
      }
    } catch (err) {
      console.error('Twitch login error:', err);
      setIsAuthLoading(false);
      alert('Erreur lors de la connexion Twitch.');
    }
  };

  const isAdmin = twitchUser?.display_name === 'JimaG4ming';

  return (
    <nav className="relative z-50 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800/50 px-6 py-3 shrink-0">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo />
          </Link>

          {userProfile && (
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/50">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold font-mono">LVL {userProfile.level}</span>
                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(userProfile.xp % 1000) / 10}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold font-mono text-amber-500">{userProfile.coins}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-fuchsia-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">B</div>
                  <span className="text-xs font-bold font-mono text-fuchsia-400">{userProfile.brainCoins}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/auction-house" className="p-2 text-zinc-400 hover:text-white transition-colors" title="Hôtel des ventes">
            <ShoppingBag className="w-5 h-5" />
          </Link>

          {twitchUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 transition-colors"
              >
                {twitchUser.profile_image_url ? (
                  <img src={twitchUser.profile_image_url} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 overflow-hidden">
                  <div className="px-4 py-2 border-b border-zinc-800 mb-2">
                    <div className="font-bold text-sm truncate">{twitchUser.display_name}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Joueur de Quiz</div>
                  </div>

                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    <User className="w-4 h-4" /> Mon Profil
                  </Link>

                  <div className="border-t border-zinc-800 my-2" />
                  <div className="px-4 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Host & Admin</div>

                  <Link to="/create" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    <PlusCircle className="w-4 h-4" /> Créer un salon
                  </Link>

                  {isAdmin && (
                    <Link to="/review-questions" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                      <Inbox className="w-4 h-4" /> Vérifier questions
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      localStorage.removeItem('twitch_user');
                      setTwitchUser(null);
                      setIsMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogIn className="w-4 h-4 rotate-180" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleTwitchLogin}
              disabled={isAuthLoading}
              className="flex items-center gap-2 bg-[#9146FF] hover:bg-[#772CE8] disabled:opacity-70 disabled:cursor-not-allowed px-4 py-2 rounded-full font-medium text-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {isAuthLoading ? 'Connexion...' : 'Connexion Twitch'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
