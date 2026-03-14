import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RoomState, Player } from '../types';
import { QuizService } from '../services/QuizService';
import { useData } from '../DataContext';
import HostHeader from '../components/host/HostHeader';
import HostGameArea from '../components/host/HostGameArea';
import HostPlayerList from '../components/host/HostPlayerList';
import { PageLayout } from '../components/ui/PageLayout';

export default function HostDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setIsLoading } = useData();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    if (!id) return;
    const roomRef = doc(db, 'rooms', id);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoom(doc.data() as RoomState);
      }
    });
    return () => unsubscribe();
  }, [id]);

  const handleReveal = React.useCallback(async () => {
    if (!id) return;
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, { showAnswer: true });
  }, [id]);

  // Auto-next question after 5 seconds
  useEffect(() => {
    if (!room || !room.showAnswer || !id) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [room, id]);

  useEffect(() => {
    if (!room || room.status !== 'active' || room.showAnswer) return;

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) return;
    
    const timeLimitMs = currentQ.timeLimit * 1000;
    const elapsed = Date.now() - room.questionStartTime;
    const players: Player[] = Object.values(room.players);
    const allAnswered = players.length > 0 && players.every(p => p.hasAnswered);

    if (elapsed >= timeLimitMs || allAnswered) {
      handleReveal();
    }
  }, [room, handleReveal]);

  if (!room) {
    return <div className="h-full bg-transparent text-white flex items-center justify-center">Chargement...</div>;
  }

  const handleStart = async () => {
    if (!id) return;
    setIsLoading(true);
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, { 
        status: 'active',
        questionStartTime: Date.now()
    });
    setIsLoading(false);
  };

  const handleNext = async () => {
    if (!id) return;
    setIsLoading(true);
    await QuizService.nextQuestion(id);
    setIsLoading(false);
  };

  const handleRestart = async () => {
    if (!id) return;
    await QuizService.resetRoom(id);
  };

  const handleClose = async () => {
    if (!id) return;
    setIsLoading(true);
    await QuizService.finishGame(id);
    setIsLoading(false);
    navigate('/');
  };


  const playersList = Object.values(room.players) as Player[];
  const sortedLeaderboard = [...playersList].sort((a, b) => b.score - a.score);
  const currentQ = room.questions[room.currentQuestionIndex];
  const answersCount = playersList.filter(p => p.hasAnswered).length;

  return (
    <PageLayout maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <HostHeader room={room} onClose={handleClose} />
          <div className="flex-1">
            <HostGameArea
              room={room}
              onStartGame={handleStart}
              onNextQuestion={handleNext}
              onRevealAnswer={handleReveal}
              onRestartGame={handleRestart}
            />
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <HostPlayerList room={room} />
        </div>
      </div>
    </PageLayout>
  );
}
