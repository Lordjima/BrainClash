import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { RoomState, Player } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import type { GlobalLeaderboardEntry } from '../types';

// Extracted Components
import QuestionDisplay from '../components/game/QuestionDisplay';
import Timer from '../components/game/Timer';
import Leaderboard from '../components/game/Leaderboard';
import Inventory from '../components/game/Inventory';
import PlayerStatus from '../components/game/PlayerStatus';
import Lobby from '../components/game/Lobby';
import GameFinished from '../components/game/GameFinished';

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
      try {
        const parsedUser = JSON.parse(storedUser);
        socket.emit('get_profile', parsedUser.display_name);
      } catch (err) {
        console.error('Error parsing twitch_user from localStorage:', err);
        localStorage.removeItem('twitch_user');
      }
    }

    socket.on('profile_data', (data: GlobalLeaderboardEntry) => {
      setProfile(data);
    });

    socket.on('item_effect', ({ attacker, itemId, effect }) => {
      setActiveMalus({ type: effect, source: attacker });
      setTimeout(() => setActiveMalus(null), 5000);
    });

    socket.on('item_blocked', ({ attacker, itemId }) => {
      alert(`Bouclier activé ! Vous avez paré l'attaque (${itemId}) de ${attacker}.`);
    });

    socket.on('item_used_success', ({ itemId, message }) => {
      console.log(message);
    });

    return () => {
      socket.off('profile_data');
      socket.off('item_effect');
      socket.off('item_blocked');
      socket.off('item_used_success');
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
      
      if (updatedRoom.status === 'active' && !updatedRoom.showAnswer) {
        const me = updatedRoom.players[socket.id];
        if (me && !me.hasAnswered) {
          setSelectedAnswer(null);
        }
      }
    });

    socket.on('player_joined', (player: Player) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: { ...prev.players, [player.id]: player }
        };
      });
    });

    socket.on('player_answered', ({ playerId, hasAnswered }) => {
      setRoom(prev => {
        if (!prev) return null;
        const player = prev.players[playerId];
        if (!player) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [playerId]: { ...player, hasAnswered }
          }
        };
      });
    });

    socket.on('game_started', ({ status, currentQuestionIndex, questionStartTime, serverTime }) => {
      if (serverTime) setTimeOffset(Date.now() - serverTime);
      setRoom(prev => {
        if (!prev) return null;
        const newPlayers = { ...prev.players };
        Object.keys(newPlayers).forEach(id => {
          newPlayers[id] = { ...newPlayers[id], hasAnswered: false, score: 0 };
        });
        return {
          ...prev,
          status,
          currentQuestionIndex,
          questionStartTime,
          showAnswer: false,
          players: newPlayers
        };
      });
      setSelectedAnswer(null);
    });

    socket.on('question_started', ({ currentQuestionIndex, questionStartTime, serverTime }) => {
      if (serverTime) setTimeOffset(Date.now() - serverTime);
      setRoom(prev => {
        if (!prev) return null;
        const newPlayers = { ...prev.players };
        Object.keys(newPlayers).forEach(id => {
          newPlayers[id] = { ...newPlayers[id], hasAnswered: false, isCorrect: undefined, answerTime: undefined };
        });
        return {
          ...prev,
          currentQuestionIndex,
          questionStartTime,
          showAnswer: false,
          players: newPlayers
        };
      });
      setSelectedAnswer(null);
    });

    socket.on('answer_revealed', ({ correctOptionIndex, players }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          showAnswer: true,
          players: players
        };
      });
    });

    socket.on('game_finished', ({ status, players }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status,
          players
        };
      });
    });

    socket.on('room_restarted', ({ status, players }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status,
          currentQuestionIndex: 0,
          questionStartTime: null,
          showAnswer: false,
          players
        };
      });
      setSelectedAnswer(null);
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
      socket.off('player_joined');
      socket.off('player_answered');
      socket.off('game_started');
      socket.off('question_started');
      socket.off('answer_revealed');
      socket.off('game_finished');
      socket.off('room_restarted');
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
    return <Lobby room={room} me={me} />;
  }

  if (room.status === 'finished') {
    return <GameFinished room={room} me={me} onNavigateHome={() => navigate('/')} />;
  }

  const currentQ = room.questions[room.currentQuestionIndex];
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4">
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

  return (
    <div className={`h-full bg-transparent text-white p-2 flex flex-col overflow-hidden ${getMalusClass()}`}>
      {activeMalus && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-xl shadow-2xl animate-bounce">
          Attaque de {activeMalus.source} !
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-4 p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shrink-0 max-w-7xl mx-auto w-full">
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

      <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto w-full overflow-y-auto lg:overflow-hidden custom-scrollbar">
        
        {/* Left Column: Live Status */}
        <div className="lg:w-1/4 order-2 lg:order-1 flex flex-col gap-4 overflow-hidden">
          <PlayerStatus players={sortedPlayers} />
        </div>

        {/* Center Column: Question, Answers, Timer */}
        <div className="lg:w-2/4 order-1 lg:order-2 flex flex-col overflow-hidden">
          <div className="mb-4 text-center shrink-0">
            <span className="text-fuchsia-400 font-bold uppercase tracking-widest text-xs mb-2 block">
              Question {room.currentQuestionIndex + 1}
            </span>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {currentQ.text}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <QuestionDisplay 
              question={currentQ}
              selectedAnswer={selectedAnswer}
              showAnswer={room.showAnswer}
              onAnswer={handleAnswer}
              isCorrect={isCorrect}
              isFastest={isFastest}
            />
          </div>

          {room.status === 'active' && !room.showAnswer && (
            <div className="mt-4 shrink-0">
              <Timer timeLeft={timeLeft} timeLimit={currentQ.timeLimit} />
            </div>
          )}
        </div>

        {/* Right Column: Temporary Leaderboard & Inventory */}
        <div className="lg:w-1/4 order-3 lg:order-3 flex flex-col gap-4 pb-8 lg:pb-0 overflow-hidden">
          <Leaderboard players={sortedPlayers} meId={socket.id} myRank={myRank} />
          <Inventory inventory={profile?.inventory || []} onUseItem={handleUseItem} />
        </div>

      </div>
    </div>
  );
}
