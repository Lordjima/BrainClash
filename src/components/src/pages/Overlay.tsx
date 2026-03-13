import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../../../lib/socket';
import { RoomState, Player } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import Logo from '../../Logo';

export default function Overlay() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [nextQuestionTimeLeft, setNextQuestionTimeLeft] = useState(10000);
  const [itemNotification, setItemNotification] = useState<{ username: string, itemId: string } | null>(null);

  useEffect(() => {
    socket.emit('join_observer', id);

    socket.on('room_update', (updatedRoom: RoomState) => {
      if (updatedRoom.serverTime) {
        setTimeOffset(Date.now() - updatedRoom.serverTime);
      }
      setRoom(updatedRoom);
      if (!updatedRoom.showAnswer) {
        setNextQuestionTimeLeft(10000);
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
      setNextQuestionTimeLeft(10000);
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
      setNextQuestionTimeLeft(10000);
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
      setNextQuestionTimeLeft(5000); // Match server's 5s delay
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
    });

    socket.on('room_closed', () => {
      setRoom(null);
    });

    socket.on('item_used', ({ username, itemId }) => {
      setItemNotification({ username, itemId });
      setTimeout(() => setItemNotification(null), 4000);
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
      socket.off('room_closed');
      socket.off('item_used');
    };
  }, [id]);

  useEffect(() => {
    let timer: any;
    if (room?.status === 'active' && !room.showAnswer && room.questionStartTime) {
      const currentQ = room.questions[room.currentQuestionIndex];
      timer = setInterval(() => {
        const now = Date.now() - timeOffset;
        const elapsed = now - room.questionStartTime!;
        const remaining = Math.max(0, currentQ.timeLimit * 1000 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 50);
    } else if (room?.showAnswer) {
      setTimeLeft(0);
      timer = setInterval(() => {
        setNextQuestionTimeLeft((prev) => Math.max(0, prev - 50));
      }, 50);
    } else if (room?.status === 'active') {
      const currentQ = room.questions[room.currentQuestionIndex];
      setTimeLeft(currentQ?.timeLimit * 1000 || 0);
    }

    return () => clearInterval(timer);
  }, [room?.status, room?.showAnswer, room?.questionStartTime, room?.currentQuestionIndex, room?.questions, timeOffset]);

  useEffect(() => {
    if (room?.showAnswer) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#9146FF', '#00FF00', '#FF00FF']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#9146FF', '#00FF00', '#FF00FF']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [room?.showAnswer]);

  if (!room) return <div className="w-screen h-screen bg-transparent" />;

  const sortedLeaderboard = (Object.values(room.players) as Player[])
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (room.status === 'lobby') {
    return (
      <div className="w-screen h-screen bg-transparent p-8 flex flex-col items-center justify-center">
        <div className="bg-zinc-950/90 backdrop-blur-xl border-2 border-fuchsia-500/30 rounded-3xl p-12 shadow-2xl text-center max-w-2xl w-full">
          <div className="flex justify-center mb-8">
            <Logo className="scale-150" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Rejoignez le Quiz !</h1>
          {room.name && <h2 className="text-2xl font-bold text-fuchsia-400 mb-2">{room.name}</h2>}
          {room.description && <p className="text-zinc-300 mb-6">{room.description}</p>}
          <p className="text-xl text-zinc-300 mb-8">
            Allez sur <span className="font-bold text-fuchsia-400">{window.location.origin}</span>
          </p>
          <div className="bg-zinc-900 rounded-2xl p-6 inline-block mb-8 border border-zinc-800">
            <p className="text-sm text-zinc-500 uppercase tracking-widest mb-2 font-bold">Code du salon</p>
            <p className="text-6xl font-mono font-bold text-white tracking-widest">{room.id}</p>
          </div>
          <p className="text-zinc-400">
            {Object.keys(room.players).length} joueur(s) dans le salon
          </p>
        </div>
      </div>
    );
  }

  if (room.status === 'finished') {
    return <div className="w-screen h-screen bg-transparent" />;
  }

  const currentQ = room.questions[room.currentQuestionIndex];
  if (!currentQ) {
    return <div className="w-screen h-screen bg-transparent" />;
  }

  const progressPercentage = (timeLeft / (currentQ.timeLimit * 1000)) * 100;

  let fastestPlayer: Player | null = null;
  if (room.showAnswer) {
    const correctPlayers = (Object.values(room.players) as Player[]).filter(p => p.isCorrect && p.answerTime !== undefined);
    if (correctPlayers.length > 0) {
      fastestPlayer = correctPlayers.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))[0];
    }
  }

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden font-sans text-white p-8 flex flex-col justify-end">
      
      {/* Item Notification */}
      <AnimatePresence>
        {itemNotification && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            className="absolute top-8 left-8 bg-zinc-950/90 border border-fuchsia-500/50 text-white font-bold px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.3)] flex items-center gap-4 z-50 backdrop-blur-md"
          >
            <span className="text-2xl">🎁</span>
            <div className="flex flex-col">
              <span className="text-sm text-zinc-400 uppercase tracking-widest">Objet utilisé</span>
              <span className="text-lg"><span className="text-fuchsia-400">{itemNotification.username}</span> a utilisé <span className="capitalize text-yellow-400">{itemNotification.itemId}</span> !</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fastest Player Banner */}
      <AnimatePresence>
        {room.showAnswer && fastestPlayer && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-zinc-950 font-bold px-8 py-4 rounded-full shadow-[0_0_40px_rgba(234,179,8,0.4)] flex items-center gap-4 z-50"
          >
            <span className="text-2xl">⚡ Le plus rapide</span>
            {fastestPlayer.avatar ? (
              <img src={fastestPlayer.avatar} alt={fastestPlayer.username} className="w-10 h-10 rounded-full border-2 border-zinc-950" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-950/20" />
            )}
            <span className="text-xl">{fastestPlayer.username}</span>
            <span className="font-mono bg-zinc-950 text-yellow-500 px-3 py-1 rounded-full text-sm">
              {(fastestPlayer.answerTime! / 1000).toFixed(2)}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right Leaderboard */}
      <div className="absolute top-8 right-8 w-80">
        <AnimatePresence>
          {sortedLeaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 shadow-2xl"
            >
              <h3 className="text-fuchsia-400 font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                Top 5
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {sortedLeaderboard.map((player, i) => (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center bg-zinc-900/50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono text-xs w-3">{i + 1}.</span>
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.username} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-800" />
                        )}
                        <span className="font-bold text-sm truncate max-w-[120px]" style={{ color: player.color }}>
                          {player.username}
                        </span>
                      </div>
                      <span className="font-mono text-fuchsia-400 font-bold text-sm">
                        {player.score}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Question Area (Bottom) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={room.currentQuestionIndex}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="w-full max-w-4xl mx-auto mb-8"
        >
          <div className="bg-zinc-950/90 backdrop-blur-xl border-2 border-fuchsia-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-zinc-800">
              <motion.div 
                className="h-full bg-gradient-to-r from-fuchsia-600 to-violet-500"
                style={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>

            <div className="flex justify-between items-end mb-6 mt-2">
              <span className="text-fuchsia-400 font-bold uppercase tracking-widest text-sm">
                Question {room.currentQuestionIndex + 1}
              </span>
              <span className="font-mono text-2xl font-bold text-zinc-300">
                {room.showAnswer ? (
                  <span className="text-sm text-zinc-500 font-sans font-normal">
                    Prochaine question dans {Math.ceil(nextQuestionTimeLeft / 1000)}s
                  </span>
                ) : (
                  `${Math.ceil(timeLeft / 1000)}s`
                )}
              </span>
            </div>

            <h2 className="text-4xl font-extrabold mb-8 leading-tight text-white drop-shadow-lg">
              {currentQ.text}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {currentQ.options.map((opt, i) => {
                const isCorrect = i === currentQ.correctOptionIndex;
                const showAsCorrect = room.showAnswer && isCorrect;
                const showAsWrong = room.showAnswer && !isCorrect;

                return (
                  <motion.div
                    key={i}
                    layout
                    className={`p-5 rounded-2xl border-2 text-xl font-bold flex items-center gap-4 transition-all duration-500 ${
                      showAsCorrect
                        ? 'bg-green-500/20 border-green-500 text-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                        : showAsWrong
                        ? 'bg-zinc-900/50 border-zinc-800/50 text-zinc-600 opacity-50'
                        : 'bg-zinc-900/80 border-zinc-700 text-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-lg ${
                      showAsCorrect ? 'bg-green-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {i + 1}
                    </div>
                    {opt}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

