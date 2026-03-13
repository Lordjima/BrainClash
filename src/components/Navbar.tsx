import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';
import Logo from './Logo';
import { socket } from '../lib/socket';

export default function Navbar() {
  const navigate = useNavigate();
  const [twitchUser, setTwitchUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      setTwitchUser(JSON.parse(storedUser));
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TWITCH_AUTH_SUCCESS') {
        const user = event.data.user;
        localStorage.setItem('twitch_user', JSON.stringify(user));
        setTwitchUser(user);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleTwitchLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/twitch/callback`;
      const response = await fetch(`/api/auth/twitch/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        <div className="flex items-center gap-4">
          {twitchUser ? (
            <Link to="/profile" className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-800 transition-colors">
              <span className="font-medium text-sm hidden sm:block">{twitchUser.display_name}</span>
              {twitchUser.profile_image_url ? (
                <img src={twitchUser.profile_image_url} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </Link>
          ) : (
            <button onClick={handleTwitchLogin} className="flex items-center gap-2 bg-[#9146FF] hover:bg-[#772CE8] px-4 py-2 rounded-full font-medium text-sm transition-colors">
              <LogIn className="w-4 h-4" />
              Connexion Twitch
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
