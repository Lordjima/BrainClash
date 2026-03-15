import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { motion, AnimatePresence } from 'motion/react';
import type { GlobalLeaderboardEntry, Player } from '../types';
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

  const userId = firebaseUser?.uid;
  const me = userId && room ? room.players[userId] : null;

  // Reset local state quand la question change
  useEffect(() => {
    setSelectedAnswer(null);
  }, [room?.currentQuestionIndex]);

  // Timer local
  useEffect(() => {
    if (!room || room.status !== 'active' || !room.questionStartTime || room.showAnswer) return;
    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, currentQ.timeLimit * 1000 - (Date.now() - room.questionStartTime!));
      setTimeLeft(remaining);
    }, 100);
    return () => clearInterval(interval);
  }, [room?.status, room?.questionStartTime, room?.showAnswer, room?.currentQuestionIndex]);

  if (loading) return <div className="h-full flex items-center justify-center text-white">Chargement...</div>;
  if (!room) return <div className="h-full flex items-center justify-center text-white">Salon introuvable</div>;

  if (room.status === 'lobby') return <div className="h-full w-full flex items-center justify-center p-4"><Lobby room={room} me={me} /></div>;
  if (room.status === 'finished') return <WinnerAnnouncement room={room} onFinished={() => {}} />;

  const currentQ = room.questions[room.currentQuestionIndex];
  
  // Protection critique : si la room est active mais pas de question, on attend
  if (room.status === 'active' && !currentQ) {
    return <div className="h-full flex items-center justify-center text-white">Préparation de la question...</div>;
  }

  const handleAnswer = async (index: number) => {
    if (!id || !userId || !me || room.showAnswer || (me.hasAnswered && me.lastAnsweredQuestionIndex === room.currentQuestionIndex)) return;
    setSelectedAnswer(index);
    await QuizService.submitAnswer(id, room.currentQuestionIndex, index);
  };

  let isFastest = false;
  if (room.showAnswer && me?.isCorrect && me) {
    const correctPlayers = (Object.values(room.players) as Player[]).filter(p => p.isCorrect && p.answerTime !== undefined);
    if (correctPlayers.length > 0) {
      const fastestPlayer = correctPlayers.sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))[0];
      if (fastestPlayer.id === me.id) {
        isFastest = true;
      }
    }
  }

  return (
    <PageLayout>
      <div className="h-full w-full p-4">
        <h2 className="text-2xl font-black text-white mb-4">{currentQ.text}</h2>
        <QuestionDisplay 
          question={currentQ}
          selectedAnswer={selectedAnswer}
          showAnswer={room.showAnswer}
          onAnswer={handleAnswer}
          isCorrect={me?.isCorrect}
          isFastest={isFastest}
        />
        {room.status === 'active' && !room.showAnswer && (
          <Timer timeLeft={timeLeft} timeLimit={currentQ.timeLimit} />
        )}
      </div>
    </PageLayout>
  );
}
