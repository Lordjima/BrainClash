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

  if (!room) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Connexion...</div>;
  }

  const me = userId ? room.players[userId] : null;
  if (!me) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6 text-center">
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
    // Add logic to trigger effect in the room
    console.log(`Using item ${itemId}`);
  };

  const currentQ = room.questions[room.currentQuestionIndex];
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

      <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full overflow-y-auto lg:overflow-hidden custom-scrollbar justify-center items-center">
        
        {/* Left Column: Live Status */}
        <div className="lg:w-1/4 order-2 lg:order-1 flex flex-col gap-4 w-full lg:h-full justify-center">
          <PlayerStatus players={sortedPlayers} />
        </div>

        {/* Center Column: Question, Answers, Timer */}
        <div className="lg:w-2/4 order-1 lg:order-2 flex flex-col w-full lg:h-full justify-center py-8">
          <div className="mb-12 text-center shrink-0">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-block"
            >
              <span className="text-fuchsia-400 font-black uppercase tracking-[0.4em] text-[10px] mb-4 block bg-fuchsia-500/5 px-4 py-1 rounded-full border border-fuchsia-500/10">
                Question {room.currentQuestionIndex + 1}
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
              {currentQ.text}
            </h2>
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
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
            <div className="mt-12 shrink-0">
              <Timer timeLeft={timeLeft} timeLimit={currentQ.timeLimit} />
            </div>
          )}
        </div>

        {/* Right Column: Temporary Leaderboard & Inventory */}
        <div className="lg:w-1/4 order-3 lg:order-3 flex flex-col gap-4 pb-8 lg:pb-0 w-full lg:h-full justify-center">
          <Leaderboard players={sortedPlayers} meId={userId || ''} myRank={myRank} />
          <Inventory inventory={profile?.inventory || []} onUseItem={handleUseItem} />
        </div>
      </div>
    </div>
  );
}
