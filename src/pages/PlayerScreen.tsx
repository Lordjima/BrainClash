import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { motion, AnimatePresence } from 'motion/react';
import type { GlobalLeaderboardEntry } from '../types';
import * as LucideIcons from 'lucide-react';

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
  const { user: firebaseUser } = useAuth();
  const { profile, inventory } = useUser();
  const { room, loading } = useRoom();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeMalus, setActiveMalus] = useState<{ type: string, source: string } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const userId = firebaseUser?.uid;

  useEffect(() => {
    if (!room) return;
    
    if (room.status === 'finished') {
      setShowWinner(true);
    } else if (room.status === 'lobby') {
      // Reset local state when room goes back to lobby
      setShowWinner(false);
      setShowResults(false);
      setSelectedAnswer(null);
    } else if (room.status === 'closed') {
      navigate('/');
    } else if (room.status === 'active' && !room.showAnswer) {
      const me = userId ? room.players[userId] : null;
      if (me && !me.hasAnswered) {
        setSelectedAnswer(null);
      }
    }
  }, [room, userId, navigate]);

  useEffect(() => {
    if (room?.status === 'finished' && userId && id) {
      QuizService.processRewards(id);
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

    const now = Date.now();
    
    // Check if I have an active shield
    const myShield = room.activeEffects?.find(effect => 
      effect.sourceId === userId && 
      effect.type === 'bouclier' && 
      (now - effect.createdAt < effect.duration)
    );

    // Check for active effects targeting this player or everyone
    const currentEffect = room.activeEffects?.find(effect => {
      // Don't apply effect to the source
      if (effect.sourceId === userId) return false;
      // Check if effect is still active
      if (now - effect.createdAt > effect.duration) return false;
      // If I have a shield, I'm immune to attacks (except if the shield itself is the effect, but shields are only for source)
      if (myShield) return false;
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

  useEffect(() => {
    if (showWinner) {
      const timer = setTimeout(() => {
        setShowWinner(false);
        setShowResults(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWinner]);

  if (loading || !room) {
    return <div className="h-full bg-transparent text-white flex items-center justify-center">Connexion...</div>;
  }

  const me = userId ? room.players[userId] : null;

  if (showWinner && room) {
    return <WinnerAnnouncement room={room} onFinished={() => {}} />;
  }

  if (showResults && room && me) {
    return (
      <GameFinished 
        room={room} 
        me={me} 
        onNavigateHome={() => navigate('/')} 
      />
    );
  }

  if (room.status === 'lobby') {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <Lobby room={room} me={me} />
      </div>
    );
  }
  
  const handleAnswer = async (index: number) => {
    if (!id || !userId || selectedAnswer !== null || room.showAnswer || !me) return;
    
    // Check for 'gel' effect
    if (activeMalus?.type === 'gel') {
      console.log('Cannot answer: GELLED');
      return;
    }

    setSelectedAnswer(index);
    await QuizService.submitAnswer(id, room.currentQuestionIndex, index);
  };

  const handleUseItem = async (itemId: string) => {
    if (!id || !userId || !me) return;
    
    // Map item IDs to durations if needed
    let duration = 10000;
    if (itemId === 'gel') duration = 5000;
    if (itemId === 'seisme') duration = 8000;
    if (itemId === 'bouclier') duration = 15000;

    await QuizService.removeFromInventory(itemId);
    await QuizService.triggerEffect(id, itemId, me.username, duration);
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

  // Check if I have an active shield for UI
  const hasShield = room.activeEffects?.some(effect => 
    effect.sourceId === userId && 
    effect.type === 'bouclier' && 
    (Date.now() - effect.createdAt < effect.duration)
  );

  const getMalusClass = () => {
    if (!activeMalus) return '';
    switch (activeMalus.type) {
      case 'fumigene': return 'blur-md transition-all duration-1000';
      case 'seisme': return 'animate-shake';
      case 'inversion': return 'rotate-180 transition-transform duration-1000';
      case 'gel': return 'grayscale brightness-50 pointer-events-none';
      default: return '';
    }
  };

  return (
    <PageLayout>
      {activeMalus && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500/90 backdrop-blur text-white px-8 py-6 rounded-3xl font-black text-2xl shadow-2xl animate-bounce border border-red-400 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.3em] opacity-70">Attaque de {activeMalus.source}</span>
          <span className="uppercase italic tracking-tighter">{activeMalus.type === 'gel' ? 'VOUS ÊTES GELÉ !' : 'MALUS ACTIF !'}</span>
        </div>
      )}

      {hasShield && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] bg-blue-500/90 backdrop-blur text-white px-4 py-2 rounded-full font-black text-xs shadow-xl border border-blue-400 flex items-center gap-2 animate-pulse">
          <LucideIcons.Shield className="w-4 h-4" />
          BOUCLIER ACTIF
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
          {/* Mobile Inventory */}
          <div className="lg:hidden mb-4 shrink-0">
            {me && <Inventory inventory={inventory} onUseItem={handleUseItem} />}
          </div>

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
        {me && <Inventory inventory={inventory} onUseItem={handleUseItem} />}
      </div>
      </div>
    </PageLayout>
  );
}
