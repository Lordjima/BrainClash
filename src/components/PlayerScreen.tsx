import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { RoomState, Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Trophy, Shield, EyeOff, RefreshCcw, Zap, PackageOpen } from 'lucide-react';
import Logo from './Logo';
import type { GlobalLeaderboardEntry } from '../types';

export default function PlayerScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [profile, setProfile] = useState<GlobalLeaderboardEntry | null>(null);
  const [activeMalus, setActiveMalus] = useState<{ type: string, source: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      socket.emit('get_profile', parsedUser.display_name);
    }

    socket.on('profile_data', (data: GlobalLeaderboardEntry) => {
      setProfile(data);
    });

    socket.on('item_used', ({ username, itemId }) => {
      const storedUser = localStorage.getItem('twitch_user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      
      // If someone else used an item, apply malus if it's an attack
      if (parsedUser && username !== parsedUser.display_name && ['fumigene', 'seisme', 'inversion'].includes(itemId)) {
        setProfile(prev => {
          if (prev && prev.inventory.includes('bouclier')) {
            socket.emit('use_item', { roomId: id, username: prev.username, itemId: 'bouclier' });
            return prev; // Shield consumed, no malus
          }
          setActiveMalus({ type: itemId, source: username });
          setTimeout(() => setActiveMalus(null), 5000); // Malus lasts 5 seconds
          return prev;
        });
      }
    });

    return () => {
      socket.off('profile_data');
      socket.off('item_used');
    };
  }, [id]);

  useEffect(() => {
    if (!room || room.status !== 'active' || !room.questionStartTime || room.showAnswer) return;

    const currentQ = room.questions[room.currentQuestionIndex];
    const timeLimitMs = currentQ.timeLimit * 1000;
    const startTime = room.questionStartTime;

    const interval = setInterval(() => {
      const now = Date.now() - timeOffset;
      const elapsed = now - startTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [room?.status, room?.questionStartTime, room?.showAnswer, room?.currentQuestionIndex, timeOffset]);

  useEffect(() => {
    socket.emit('get_room', id);

    socket.on('room_update', (updatedRoom: RoomState) => {
      if (updatedRoom.serverTime) {
        setTimeOffset(Date.now() - updatedRoom.serverTime);
      }
      setRoom(updatedRoom);
      
      // Reset local selection when moving to a new question
      if (updatedRoom.status === 'active' && !updatedRoom.showAnswer) {
        const me = updatedRoom.players[socket.id];
        if (me && !me.hasAnswered) {
          setSelectedAnswer(null);
        }
      }
    });

    socket.on('error', (msg) => {
      alert(msg);
      navigate('/');
    });

    socket.on('room_closed', () => {
      alert('Le streamer a fermé le salon.');
      navigate('/');
    });

    return () => {
      socket.off('room_update');
      socket.off('error');
      socket.off('room_closed');
    };
  }, [id, navigate]);

  if (!room) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Connexion...</div>;
  }

  const me = room.players[socket.id];
  if (!me) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl mb-4">Vous n'êtes pas dans ce salon.</p>
        <button onClick={() => navigate('/')} className="bg-purple-600 px-6 py-3 rounded-xl font-bold">Retour à l'accueil</button>
      </div>
    );
  }

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || room.showAnswer) return;
    setSelectedAnswer(index);
    socket.emit('submit_answer', { roomId: room.id, answerIndex: index });
  };

  if (room.status === 'lobby') {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border-4 border-purple-500/30 animate-pulse overflow-hidden">
          {me.avatar ? (
            <img src={me.avatar} alt={me.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-3xl" style={{ color: me.color }}>{me.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">Vous êtes dans le salon !</h2>
        {room.name && <h3 className="text-xl text-fuchsia-400 font-bold mb-4">{room.name}</h3>}
        {room.description && <p className="text-zinc-300 mb-4 max-w-md">{room.description}</p>}
        <p className="text-zinc-400">Regardez le stream, le quiz va bientôt commencer...</p>
      </div>
    );
  }

  if (room.status === 'finished') {
    const sortedPlayers = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);
    const rank = sortedPlayers.findIndex(p => p.id === me.id) + 1;
    
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center p-6">
        <Trophy className="w-16 h-16 text-yellow-500 mb-4 mt-8" />
        <h2 className="text-3xl font-bold mb-2">Quiz Terminé !</h2>
        <p className="text-xl text-fuchsia-400 font-mono mb-6">{me.score} points</p>
        
        <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 mb-8 flex items-center gap-4">
          <div className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Votre position</div>
          <div className="text-2xl font-bold text-white">#{rank}</div>
        </div>

        <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden mb-8">
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
            <h3 className="font-bold text-center text-zinc-300 uppercase tracking-widest text-sm">Classement Final</h3>
          </div>
          <div className="divide-y divide-zinc-800/50 max-h-[40vh] overflow-y-auto">
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className={`flex items-center gap-4 p-4 ${player.id === me.id ? 'bg-fuchsia-900/20' : ''}`}>
                <div className="w-8 text-center font-bold text-zinc-500">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                {player.avatar ? (
                  <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full bg-zinc-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold" style={{ color: player.color }}>
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 font-medium truncate" style={{ color: player.color }}>
                  {player.username}
                </div>
                <div className="font-mono font-bold text-zinc-300">
                  {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => navigate('/')} 
          className="w-full max-w-md bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-colors mt-auto"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const currentQ = room.questions[room.currentQuestionIndex];
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Aucune question trouvée</h2>
        <p className="text-zinc-400 mb-8">Ce thème ne contient aucune question.</p>
        <button 
          onClick={() => navigate('/')} 
          className="w-full max-w-md bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQ.correctOptionIndex;

  let isFastest = false;
  if (room.showAnswer && isCorrect) {
    const correctPlayers = (Object.values(room.players) as Player[]).filter(p => p.isCorrect && p.answerTime !== undefined);
    if (correctPlayers.length > 0) {
      const fastestPlayer = correctPlayers.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))[0];
      if (fastestPlayer.id === me.id) {
        isFastest = true;
      }
    }
  }

  const sortedPlayers = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);
  const myRank = sortedPlayers.findIndex(p => p.id === me.id) + 1;
  const topPlayers = sortedPlayers.slice(0, 3);
  const isMeInTop3 = myRank <= 3;

  const getMalusClass = () => {
    if (!activeMalus) return '';
    switch (activeMalus.type) {
      case 'fumigene': return 'blur-md transition-all duration-1000';
      case 'seisme': return 'animate-shake';
      case 'inversion': return 'rotate-180 transition-transform duration-1000';
      default: return '';
    }
  };

  const handleUseItem = (itemId: string) => {
    if (profile && profile.inventory.includes(itemId)) {
      socket.emit('use_item', { roomId: id, username: me.username, itemId });
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'fumigene': return <EyeOff className="w-5 h-5" />;
      case 'seisme': return <Zap className="w-5 h-5" />;
      case 'inversion': return <RefreshCcw className="w-5 h-5" />;
      case 'bouclier': return <Shield className="w-5 h-5" />;
      default: return <PackageOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen bg-transparent text-white p-4 flex flex-col ${getMalusClass()}`}>
      {activeMalus && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-xl shadow-2xl animate-bounce">
          Attaque de {activeMalus.source} !
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-6 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 shrink-0 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 font-bold overflow-hidden shrink-0" style={{ color: me.color }}>
            {me.avatar ? (
              <img src={me.avatar} alt={me.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              me.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{me.username}</span>
            <span className="text-xs text-zinc-400 font-medium">Rang #{myRank}</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-mono text-fuchsia-400 font-bold text-xl leading-none">{me.score}</span>
          <span className="text-[10px] text-fuchsia-500/70 font-bold uppercase tracking-wider mt-1">Points</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Live Status (Desktop) / Order 2 (Mobile) */}
        <div className="lg:w-1/4 order-2 lg:order-1 flex flex-col gap-4">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Statut des joueurs</span>
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded-md text-zinc-300">
                {sortedPlayers.filter(p => p.hasAnswered).length} / {sortedPlayers.length}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {sortedPlayers.map(p => (
                <div key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium border ${p.hasAnswered ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'}`}>
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center bg-zinc-800" style={{ color: p.color }}>
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate max-w-[80px]">{p.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Question, Answers, Timer (Desktop) / Order 1 (Mobile) */}
        <div className="lg:w-2/4 order-1 lg:order-2 flex flex-col">
          <div className="mb-6 text-center shrink-0">
            <span className="text-fuchsia-400 font-bold uppercase tracking-widest text-xs mb-2 block">
              Question {room.currentQuestionIndex + 1}
            </span>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {currentQ.text}
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-center w-full mx-auto">
            <AnimatePresence mode="wait">
              {!room.showAnswer && selectedAnswer === null && (
                <motion.div
                  key="answering"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="grid grid-cols-1 gap-3"
                >
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-fuchsia-500 transition-all p-4 rounded-2xl text-lg font-bold text-left flex items-center gap-4 active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-mono text-zinc-400 shrink-0">
                        {i + 1}
                      </div>
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}

              {!room.showAnswer && selectedAnswer !== null && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Réponse enregistrée !</h3>
                  <p className="text-zinc-400 text-sm">Regardez le stream en attendant les autres...</p>
                </motion.div>
              )}

              {room.showAnswer && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  {selectedAnswer === null ? (
                    <>
                      <XCircle className="w-20 h-20 text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-zinc-400">Temps écoulé !</h3>
                      <p className="text-zinc-400 text-sm">La bonne réponse était : <strong className="text-white">{currentQ.options[currentQ.correctOptionIndex]}</strong></p>
                    </>
                  ) : isCorrect ? (
                    <>
                      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-green-400">Bonne réponse !</h3>
                      {isFastest ? (
                        <p className="text-yellow-500 font-bold flex items-center justify-center gap-2">
                          <span className="text-xl">⚡</span> Vous avez été le plus rapide !
                        </p>
                      ) : (
                        <p className="text-zinc-400">Bien joué !</p>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2 text-red-400">Mauvaise réponse...</h3>
                      <p className="text-zinc-400 text-sm">La bonne réponse était : <strong className="text-white">{currentQ.options[currentQ.correctOptionIndex]}</strong></p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Progress Bar */}
          {room.status === 'active' && !room.showAnswer && (
            <div className="pt-6 shrink-0 w-full mx-auto">
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Temps restant</span>
                  <span className={`font-mono font-bold text-lg ${timeLeft < 5000 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
                    {Math.ceil(timeLeft / 1000)}s
                  </span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${timeLeft < 5000 ? 'bg-red-500' : 'bg-fuchsia-500'}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / (currentQ.timeLimit * 1000)) * 100}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Temporary Leaderboard (Desktop) / Order 3 (Mobile) */}
        <div className="lg:w-1/4 order-3 lg:order-3 flex flex-col gap-4 pb-8 lg:pb-0">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Classement Provisoire</h3>
            <div className="space-y-2">
              {topPlayers.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between rounded-xl p-2 px-3 ${p.id === me.id ? 'bg-fuchsia-900/20 border border-fuchsia-500/20' : 'bg-zinc-800/30'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold text-xs w-4">{i + 1}</span>
                    <span className="font-medium text-sm truncate max-w-[100px]" style={{ color: p.color }}>{p.username}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-300">{p.score} pts</span>
                </div>
              ))}
              {!isMeInTop3 && (
                <>
                  <div className="text-center text-zinc-600 text-xs py-1">...</div>
                  <div className="flex items-center justify-between bg-fuchsia-900/20 border border-fuchsia-500/20 rounded-xl p-2 px-3">
                    <div className="flex items-center gap-3">
                      <span className="text-fuchsia-400 font-bold text-xs w-4">{myRank}</span>
                      <span className="font-medium text-sm text-fuchsia-100 truncate max-w-[100px]">{me.username}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-fuchsia-300">{me.score} pts</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Inventory */}
          {profile && profile.inventory && profile.inventory.length > 0 && (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 mt-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Inventaire</h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.inventory.map((itemId, index) => (
                  <button
                    key={`${itemId}-${index}`}
                    onClick={() => handleUseItem(itemId)}
                    className="flex flex-col items-center justify-center p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors gap-2 border border-zinc-700"
                    title={`Utiliser ${itemId}`}
                  >
                    {getIcon(itemId)}
                    <span className="text-xs font-medium capitalize truncate w-full text-center">{itemId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
