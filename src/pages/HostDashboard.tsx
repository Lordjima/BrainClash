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

  if (!room) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Chargement...</div>;
  }

  const handleStart = async () => {
    if (!id) return;
    setIsLoading(true);
    await QuizService.updateRoomStatus(id, 'active');
    await QuizService.nextQuestion(id);
    setIsLoading(false);
  };

  const handleReveal = async () => {
    if (!id) return;
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, { showAnswer: true });
  };

  const handleNext = async () => {
    if (!id) return;
    setIsLoading(true);
    await QuizService.nextQuestion(id);
    setIsLoading(false);
  };

  const handleRestart = async () => {
    if (!id) return;
    await QuizService.updateRoomStatus(id, 'lobby');
  };

  const handleClose = async () => {
    if (!id) return;
    setIsLoading(true);
    await QuizService.updateRoomStatus(id, 'finished');
    setIsLoading(false);
    navigate('/');
  };


  const playersList = Object.values(room.players) as Player[];
  const sortedLeaderboard = [...playersList].sort((a, b) => b.score - a.score);
  const currentQ = room.questions[room.currentQuestionIndex];
  const answersCount = playersList.filter(p => p.hasAnswered).length;

  return (
    <div className="h-full bg-transparent text-white p-4 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <HostHeader room={room} onClose={handleClose} />
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <HostGameArea
              room={room}
              onStartGame={handleStart}
              onNextQuestion={handleNext}
              onRevealAnswer={handleReveal}
              onRestartGame={handleRestart}
            />
          </div>
        </div>
        <div className="lg:col-span-1 h-full overflow-hidden flex flex-col">
          <HostPlayerList room={room} />
        </div>
      </div>
    </div>
  );
}
