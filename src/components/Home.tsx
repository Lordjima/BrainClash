import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../lib/socket';
import { Play, Users, MonitorPlay, User, LogIn, Trophy, Medal } from 'lucide-react';
import { GlobalLeaderboardEntry } from '../types';
import Logo from './Logo';

export default function Home() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [twitchUser, setTwitchUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setTwitchUser(user);
      setUsername(user.display_name);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TWITCH_AUTH_SUCCESS') {
        const user = event.data.user;
        localStorage.setItem('twitch_user', JSON.stringify(user));
        setTwitchUser(user);
        setUsername(user.display_name);
      }
    };
    window.addEventListener('message', handleMessage);

    socket.emit('get_leaderboard');
    socket.on('leaderboard_update', (data: GlobalLeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    socket.on('room_created', (roomId) => {
      navigate(`/host/${roomId}`);
    });

    socket.on('room_joined', (roomId) => {
      navigate(`/room/${roomId}`);
    });

    socket.on('error', (msg) => {
      setError(msg);
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      socket.off('leaderboard_update');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('error');
    };
  }, [navigate]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode || !twitchUser) return;
    socket.emit('join_room', { 
      roomId: roomCode.toUpperCase(), 
      username: twitchUser.display_name,
      avatar: twitchUser.profile_image_url
    });
  };

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
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6">
      {/* Header / Profile */}
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
      <div className="absolute top-6 right-6">
        {twitchUser ? (
          <Link to="/profile" className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-full border border-zinc-800 transition-colors">
            <span className="font-medium text-sm">{twitchUser.display_name}</span>
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

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
        
        {/* Join Room Side */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-fuchsia-500" />
            </div>
            <h2 className="text-2xl font-bold">Rejoindre un Quiz</h2>
          </div>
          <p className="text-zinc-400 mb-8 text-sm">
            Entrez le code fourni par le streamer pour participer.
          </p>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Code du salon</label>
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all uppercase"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            {!twitchUser ? (
              <button 
                type="button"
                onClick={handleTwitchLogin} 
                className="w-full flex items-center justify-center gap-2 bg-[#9146FF] hover:bg-[#772CE8] text-white font-bold py-4 rounded-xl transition-colors mt-4"
              >
                <LogIn className="w-5 h-5" />
                Connexion Twitch
              </button>
            ) : (
              <button
                type="submit"
                disabled={!roomCode}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors mt-4"
              >
                Rejoindre
              </button>
            )}
          </form>
        </div>

        {/* Create Room Side */}
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center shrink-0">
              <MonitorPlay className="w-6 h-6 text-violet-500" />
            </div>
            <h2 className="text-2xl font-bold">Création d'un Quiz</h2>
          </div>
          <p className="text-zinc-400 mb-6 text-sm">
            Créez un salon, partagez le code à vos viewers et lancez le quiz en direct.
          </p>

          <button
            onClick={() => navigate('/create')}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto"
          >
            <Play className="w-5 h-5" />
            Créer un salon
          </button>

          <div className="mt-8 p-4 bg-transparent rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 text-center">
              Astuce : Vous pouvez configurer vos quiz, choisir vos thèmes et retrouver votre historique dans l'espace de création.
            </p>
          </div>
        </div>

      </div>

      {/* Propose Question Button */}
      <div className="max-w-4xl w-full mt-8">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-2">Vous avez une idée de question ?</h2>
          <p className="text-zinc-400 mb-6 text-sm max-w-lg">
            Proposez vos propres questions pour les prochains quiz ! Elles seront vérifiées par le streamer avant d'être ajoutées.
          </p>
          <button
            onClick={() => navigate('/submit-question')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            Proposer une question
          </button>
        </div>
      </div>

      {/* Global Leaderboard */}
      <div className="max-w-4xl w-full mt-8">
        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-2xl flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold">Classement Général</h2>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Aucun score enregistré pour le moment. Soyez le premier !
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderboard.slice(0, 9).map((entry, index) => (
                <div key={index} className="flex items-center gap-4 bg-transparent p-4 rounded-2xl border border-zinc-800">
                  <div className="w-8 flex justify-center">
                    {index === 0 ? <Medal className="w-6 h-6 text-yellow-500" /> :
                     index === 1 ? <Medal className="w-6 h-6 text-zinc-400" /> :
                     index === 2 ? <Medal className="w-6 h-6 text-amber-600" /> :
                     <span className="text-zinc-500 font-bold">#{index + 1}</span>}
                  </div>
                  {entry.avatar ? (
                    <img src={entry.avatar} alt={entry.username} className="w-10 h-10 rounded-full bg-zinc-800" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-500 font-bold">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{entry.username}</div>
                    <div className="text-sm text-zinc-400">{entry.score} pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
