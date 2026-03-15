import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Player } from '../types';
import { useRoom } from '../context/RoomContext';
import { QuizService } from '../services/QuizService';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import HostHeader from '../components/host/HostHeader';
import HostGameArea from '../components/host/HostGameArea';
import HostPlayerList from '../components/host/HostPlayerList';
import { PageLayout } from '../components/ui/PageLayout';

export default function HostDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { room, loading } = useRoom();

  useEffect(() => {
    if (!id) return;
    // Room data is now managed by RoomContext
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

  useEffect(() => {
    if (room?.status === 'finished' && id) {
      // Rewards are handled by players themselves
    }
  }, [room?.status, id]);

  if (loading || !room) {
    return <div className="h-full bg-transparent text-white flex items-center justify-center">Chargement...</div>;
  }

  const handleStart = async () => {
    if (!id) return;
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, { 
        status: 'active',
        questionStartTime: Date.now()
    });
  };

  const handleNext = async () => {
    if (!id) return;
    await QuizService.nextQuestion(id);
  };

  const handleRestart = async () => {
    if (!id) return;
    await QuizService.resetRoom(id);
  };

  const handleClose = async () => {
    if (!id) return;
    await QuizService.closeRoom(id);
    navigate('/');
  };


  const playersList = Object.values(room.players) as Player[];
  const sortedLeaderboard = [...playersList].sort((a, b) => b.score - a.score);
  const currentQ = room.questions[room.currentQuestionIndex];
  const answersCount = playersList.filter(p => p.hasAnswered).length;

  return (
    <PageLayout maxWidth="max-w-full" contentClassName="overflow-y-auto custom-scrollbar">
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
