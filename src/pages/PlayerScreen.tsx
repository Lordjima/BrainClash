import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { RoomState, Player } from '../types';
import { QuizService } from '../services/QuizService';
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
  const [profile, setProfile] = useState<GlobalLeaderboardEntry | null>(null);
  const [activeMalus, setActiveMalus] = useState<{ type: string, source: string } | null>(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!id) return;
    const roomRef = doc(db, 'rooms', id);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const updatedRoom = doc.data() as RoomState;
        setRoom(updatedRoom);
        
        if (updatedRoom.status === 'active' && !updatedRoom.showAnswer) {
          const me = userId ? updatedRoom.players[userId] : null;
          if (me && !me.hasAnswered) {
            setSelectedAnswer(null);
          }
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [id, userId, navigate]);

  useEffect(() => {
    if (!room || room.status !== 'active' || !room.questionStartTime || room.showAnswer) return;

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) return;
    const timeLimitMs = currentQ.timeLimit * 1000;
    const startTime = room.questionStartTime;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [room?.status, room?.questionStartTime, room?.showAnswer, room?.currentQuestionIndex]);

  useEffect(() => {
    if (!room || !userId) return;

    // Check for active effects targeting this player or everyone
    const now = Date.now();
    const currentEffect = room.activeEffects?.find(effect => {
      // Don't apply effect to the source
      if (effect.sourceId === userId) return false;
      // Check if effect is still active
      if (now - effect.createdAt > effect.duration) return false;
      // Check if it targets everyone or specifically this user
      return !effect.targetId || effect.targetId === userId;
    });

    if (currentEffect) {
      setActiveMalus({ type: currentEffect.type, source: currentEffect.sourceName });
      
      // Auto-clear effect after duration
      const timeRemaining = currentEffect.duration - (now - currentEffect.createdAt);
      const timeout = setTimeout(() => {
        setActiveMalus(null);
      }, timeRemaining);
      
      return () => clearTimeout(timeout);
    } else {
      setActiveMalus(null);
    }
  }, [room?.activeEffects, userId]);

  if (!room) {
    return <div className="h-full bg-transparent text-white flex items-center justify-center">Connexion...</div>;
  }

  const me = userId ? room.players[userId] : null;

  if (room.status === 'lobby') {
    return <Lobby room={room} me={me!} />;
  }
  if (!me) {
    return (
      <div className="h-full bg-transparent text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl mb-4">Vous n'êtes pas dans ce salon.</p>
        <button onClick={() => navigate('/')} className="bg-purple-600 px-6 py-3 rounded-xl font-bold">Retour à l'accueil</button>
      </div>
    );
  }

  const handleAnswer = async (index: number) => {
    if (!id || !userId || selectedAnswer !== null || room.showAnswer) return;
    setSelectedAnswer(index);
    await QuizService.submitAnswer(id, index);
  };

  const handleUseItem = async (itemId: string) => {
    if (!id || !userId) return;
    await QuizService.removeFromInventory(itemId);
    await QuizService.triggerEffect(id, itemId, me.username);
    console.log(`Using item ${itemId}`);
  };

  const currentQ = room.questions[room.currentQuestionIndex];
  const isCorrect = currentQ ? selectedAnswer === currentQ.correctOptionIndex : false;

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 flex flex-col gap-8 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-fuchsia-600/5 blur-[100px] rounded-full pointer-events-none" />

      {activeMalus && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500/90 backdrop-blur text-white px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl animate-bounce border border-red-400">
          Attaque de {activeMalus.source} !
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-zinc-800/50 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 font-bold overflow-hidden border-2" style={{ borderColor: me.color }}>
            {me.avatar ? (
              <img src={me.avatar} alt={me.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              me.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight">{me.username}</span>
            <span className="text-xs text-fuchsia-500 font-bold uppercase tracking-widest">Rang #{myRank}</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-mono text-white font-black text-4xl leading-none">{me.score}</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Points</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Left Column: Live Status */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <PlayerStatus players={sortedPlayers} />
        </div>

        {/* Center Column: Question, Answers, Timer */}
        <div className={`lg:col-span-6 flex flex-col gap-6 ${getMalusClass()}`}>
          <div className="flex flex-col flex-1">
            <div className="mb-12 text-center">
              <span className="text-fuchsia-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">
                Question {room.currentQuestionIndex + 1}
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter italic drop-shadow-md">
                {currentQ?.text || 'Chargement...'}
              </h2>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
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
              <div className="mt-12 max-w-md mx-auto w-full">
                <Timer timeLeft={timeLeft} timeLimit={currentQ.timeLimit} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leaderboard & Inventory */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Leaderboard players={sortedPlayers} meId={userId || ''} myRank={myRank} />
          <Inventory inventory={profile?.inventory || []} onUseItem={handleUseItem} />
        </div>
      </div>
    </div>
  );
}
