import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { RoomState, Player } from '../types';
import { Play, Users, CheckCircle, FastForward, ExternalLink, RotateCcw, Home } from 'lucide-react';
import Logo from './Logo';

export default function HostDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    socket.emit('get_room', id);

    socket.on('room_update', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
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

    socket.on('game_started', ({ status, currentQuestionIndex, questionStartTime }) => {
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
    });

    socket.on('question_started', ({ currentQuestionIndex, questionStartTime }) => {
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
    };
  }, [id]);

  if (!room) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Chargement...</div>;
  }

  const handleStart = () => socket.emit('start_quiz', id);
  const handleReveal = () => socket.emit('reveal_answer', id);
  const handleNext = () => socket.emit('next_question', id);
  const handleRestart = () => socket.emit('restart_quiz', id);
  const handleClose = () => {
    socket.emit('close_room', id);
    navigate('/');
  };

  const playersList = Object.values(room.players) as Player[];
  const sortedLeaderboard = [...playersList].sort((a, b) => b.score - a.score);
  const currentQ = room.questions[room.currentQuestionIndex];
  const answersCount = playersList.filter(p => p.hasAnswered).length;

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">
                  {room.name ? `Code du salon - ${room.name}` : 'Code du salon'}
                </h1>
                <div className="text-4xl font-mono font-bold text-fuchsia-400 tracking-widest">
                  {room.id}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/overlay/${room.id}`}
                target="_blank"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Overlay OBS
              </Link>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                Fermer le salon
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 min-h-[400px] flex flex-col">
            {room.status === 'lobby' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Users className="w-16 h-16 text-zinc-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">En attente des joueurs...</h2>
                <p className="text-zinc-400 mb-8">
                  {playersList.length} joueur(s) connecté(s)
                </p>
                <button
                  onClick={handleStart}
                  disabled={playersList.length === 0}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" /> Lancer le Quiz
                </button>
              </div>
            ) : room.status === 'finished' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-fuchsia-600/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-fuchsia-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Quiz Terminé !</h2>
                <p className="text-zinc-400 mb-8">Le gagnant est {sortedLeaderboard[0]?.username || 'personne'} !</p>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleRestart}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" /> Relancer le quiz
                  </button>
                  <button
                    onClick={handleClose}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Home className="w-5 h-5" /> Retour au menu
                  </button>
                </div>
              </div>
            ) : !currentQ ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold mb-2">Aucune question trouvée</h2>
                <p className="text-zinc-400 mb-8">Ce thème ne contient aucune question.</p>
                <button
                  onClick={handleClose}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Home className="w-5 h-5" /> Retour au menu
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium text-fuchsia-400 bg-fuchsia-400/10 px-3 py-1 rounded-full">
                    Question {room.currentQuestionIndex + 1} / {room.questions.length}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {answersCount} / {playersList.length} réponses
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold mb-8">{currentQ.text}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {currentQ.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${
                        room.showAnswer && i === currentQ.correctOptionIndex
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : room.showAnswer
                          ? 'bg-transparent border-zinc-800 text-zinc-600'
                          : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      <span className="font-mono text-zinc-500 mr-3">{i + 1}.</span>
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex gap-4">
                  {!room.showAnswer ? (
                    <button
                      onClick={handleReveal}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" /> Révéler la réponse
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <FastForward className="w-5 h-5" /> Passer manuellement (Auto dans 10s)
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col h-[calc(100vh-3rem)]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Joueurs ({playersList.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {sortedLeaderboard.length === 0 ? (
              <p className="text-zinc-500 text-center mt-10 text-sm">Aucun joueur.</p>
            ) : (
              sortedLeaderboard.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between bg-transparent p-3 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono text-sm w-4">{index + 1}.</span>
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.username} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800" />
                    )}
                    <span className="font-medium" style={{ color: player.color }}>
                      {player.username}
                    </span>
                    {room.status === 'active' && !room.showAnswer && player.hasAnswered && (
                      <div className="w-2 h-2 rounded-full bg-green-500" title="A répondu" />
                    )}
                  </div>
                  <span className="font-mono text-purple-400 font-bold">
                    {player.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
