import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { RoomState, Player } from '../types';
import { QuizService } from '../services/QuizService';
import { motion, AnimatePresence } from 'motion/react';
import type { GlobalLeaderboardEntry } from '../types';

// Extracted Components
import WinnerAnnouncement from '../components/game/WinnerAnnouncement';
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
  const [showWinner, setShowWinner] = useState(false);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!id) return;
    const roomRef = doc(db, 'rooms', id);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const updatedRoom = doc.data() as RoomState;
        setRoom(updatedRoom);
        
        if (updatedRoom.status === 'finished') {
          setShowWinner(true);
        } else if (updatedRoom.status === 'active' && !updatedRoom.showAnswer) {
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
    if (room?.status === 'finished' && userId && id) {
      QuizService.updatePlayerProfile(id);
    }
  }, [room?.status, id, userId]);

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

  if (showWinner && room) {
    return <WinnerAnnouncement room={room} onFinished={() => {
      if (id) {
        QuizService.resetRoom(id);
        setShowWinner(false);
      }
    }} />;
  }

  if (room.status === 'lobby') {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <Lobby room={room} me={me} />
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas connecté ou n'a pas rejoint, on affiche le salon en mode spectateur
  // Si vous voulez forcer la connexion pour jouer, gardez la logique actuelle, 
  // mais ici on permet de voir le quiz sans être un joueur.
  
  const handleAnswer = async (index: number) => {
    if (!id || !userId || selectedAnswer !== null || room.showAnswer || !me) return;
    setSelectedAnswer(index);
    await QuizService.submitAnswer(id, index);
  };

  const handleUseItem = async (itemId: string) => {
    if (!id || !userId || !me) return;
    await QuizService.removeFromInventory(itemId);
    await QuizService.triggerEffect(id, itemId, me.username);
    console.log(`Using item ${itemId}`);
  };

  const currentQ = room.questions[room.currentQuestionIndex];
  const isCorrect = currentQ && me ? selectedAnswer === currentQ.correctOptionIndex : false;

  let isFastest = false;
  if (room.showAnswer && isCorrect && me) {
    const correctPlayers = (Object.values(room.players) as Player[]).filter(p => p.isCorrect && p.answerTime !== undefined);
    if (correctPlayers.length > 0) {
      const fastestPlayer = correctPlayers.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))[0];
      if (fastestPlayer.id === me.id) {
        isFastest = true;
      }
    }
  }

  const sortedPlayers = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);
  const myRank = me ? sortedPlayers.findIndex(p => p.id === me.id) + 1 : 0;

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
    <div className="h-full w-full text-white flex flex-col font-sans relative overflow-hidden box-border">
      {activeMalus && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500/90 backdrop-blur text-white px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl animate-bounce border border-red-400">
          Attaque de {activeMalus.source} !
        </div>
      )}

      <div className="h-full w-full grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-4 p-4 relative z-10 overflow-hidden box-border">
      
      {/* Left Column: Live Status */}
      <div className="hidden lg:flex flex-col gap-4 overflow-hidden h-full">
        <PlayerStatus players={sortedPlayers} />
      </div>

      {/* Center Column: Question, Answers, Timer */}
      <div className={`flex flex-col ${getMalusClass()} overflow-hidden h-full`}>
        <div className="flex flex-col flex-1 justify-between overflow-hidden h-full">
          <div className="text-center shrink-0">
            <span className="text-fuchsia-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">
              Question {room.currentQuestionIndex + 1}
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-[1.1] tracking-tighter italic drop-shadow-md">
              {currentQ?.text || 'Chargement...'}
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full overflow-hidden">
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
            <div className="max-w-md mx-auto w-full shrink-0">
              <Timer timeLeft={timeLeft} timeLimit={currentQ.timeLimit} />
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Leaderboard & Inventory */}
      <div className="hidden lg:flex flex-col gap-4 overflow-hidden h-full">
        <Leaderboard players={sortedPlayers} meId={userId || ''} myRank={myRank} />
        {me && <Inventory inventory={profile?.inventory || []} onUseItem={handleUseItem} />}
      </div>
    </div>
    </div>
  );
}
