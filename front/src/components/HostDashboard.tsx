import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { RoomState, Player } from '../../../back/types';
import HostHeader from './host/HostHeader';
import HostGameArea from './host/HostGameArea';
import HostPlayerList from './host/HostPlayerList';

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
