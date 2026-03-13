import { Server, Socket } from 'socket.io';
import { rooms, roomTimers } from './state';
import { generateRoomCode, scheduleQuestionEnd, updateGlobalLeaderboard, getCachedThemes } from './game';
import type { Player } from '../src/types';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create_room', async ({ hostName, theme, isPublic, customQuestions }) => {
      const roomId = generateRoomCode();
      
      let questions = [];
      
      if (customQuestions && customQuestions.length > 0) {
        questions = customQuestions;
      } else {
        const themes = await getCachedThemes();
        const selectedTheme = themes[theme];
        if (selectedTheme && selectedTheme.questions.length > 0) {
          questions = [...selectedTheme.questions].sort(() => 0.5 - Math.random()).slice(0, 10);
        } else {
          socket.emit('error', { message: 'Thème invalide ou sans questions' });
          return;
        }
      }

      rooms.set(roomId, {
        id: roomId,
        hostId: socket.id,
        players: {},
        status: 'lobby',
        showAnswer: false,
        currentQuestionIndex: 0,
        questionStartTime: null,
        questions,
        theme,
        isPublic: !!isPublic
      });

      socket.join(roomId);
      socket.emit('room_created', roomId);
      io.emit('public_rooms_update', getPublicRooms());
    });

    socket.on('join_room', ({ roomId, player }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Salon introuvable' });
        return;
      }

      if (room.status !== 'lobby') {
        socket.emit('error', { message: 'La partie a déjà commencé' });
        return;
      }

      room.players[socket.id] = {
        ...player,
        id: socket.id,
        score: 0,
        hasAnswered: false,
        streak: 0
      };

      socket.join(roomId);
      io.to(roomId).emit('room_update', room);
      io.emit('public_rooms_update', getPublicRooms());
    });

    socket.on('start_game', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.status = 'active';
        room.showAnswer = false;
        room.questionStartTime = Date.now();
        io.to(roomId).emit('room_update', room);
        
        const q = room.questions[room.currentQuestionIndex];
        const timeMs = (q.timeLimit || 15) * 1000;
        scheduleQuestionEnd(roomId, io, timeMs);
        io.emit('public_rooms_update', getPublicRooms());
      }
    });

    socket.on('submit_answer', ({ roomId, answerIndex }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active' || room.showAnswer) return;

      const player = room.players[socket.id];
      if (!player || player.hasAnswered) return;

      const question = room.questions[room.currentQuestionIndex];
      const isCorrect = answerIndex === question.correctOptionIndex;
      
      player.hasAnswered = true;

      if (isCorrect) {
        const timeLimitMs = (question.timeLimit || 15) * 1000;
        const timeElapsed = Date.now() - (room.questionStartTime || Date.now());
        const timeBonus = Math.max(0, Math.floor((1 - timeElapsed / timeLimitMs) * 50));
        
        player.streak = (player.streak || 0) + 1;
        const streakBonus = Math.min(player.streak * 10, 50);
        
        player.score += 100 + timeBonus + streakBonus;
      } else {
        player.streak = 0;
      }

      io.to(roomId).emit('room_update', room);

      const allAnswered = Object.values(room.players).every(p => p.hasAnswered);
      if (allAnswered) {
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId));
        }
        
        room.showAnswer = true;
        io.to(roomId).emit('room_update', room);
        
        const nextTimer = setTimeout(() => {
          const r = rooms.get(roomId);
          if (!r) return;
          
          r.currentQuestionIndex++;
          
          if (r.currentQuestionIndex >= r.questions.length) {
            r.status = 'finished';
            io.to(roomId).emit('room_update', r);
            updateGlobalLeaderboard(r, io);
          } else {
            r.status = 'active';
            r.showAnswer = false;
            r.questionStartTime = Date.now();
            
            Object.values(r.players).forEach(p => {
              p.hasAnswered = false;
            });
            
            io.to(roomId).emit('room_update', r);
            
            const q = r.questions[r.currentQuestionIndex];
            const timeMs = (q.timeLimit || 15) * 1000;
            scheduleQuestionEnd(roomId, io, timeMs);
          }
        }, 5000);
        
        roomTimers.set(roomId, nextTimer);
      }
    });

    socket.on('next_question', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id && room.showAnswer) {
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId));
        }
        
        room.currentQuestionIndex++;
        
        if (room.currentQuestionIndex >= room.questions.length) {
          room.status = 'finished';
          io.to(roomId).emit('room_update', room);
          updateGlobalLeaderboard(room, io);
        } else {
          room.status = 'active';
          room.showAnswer = false;
          room.questionStartTime = Date.now();
          
          Object.values(room.players).forEach(p => {
            p.hasAnswered = false;
          });
          
          io.to(roomId).emit('room_update', room);
          
          const q = room.questions[room.currentQuestionIndex];
          const timeMs = (q.timeLimit || 15) * 1000;
          scheduleQuestionEnd(roomId, io, timeMs);
        }
      }
    });

    socket.on('end_game', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId));
        }
        room.status = 'finished';
        io.to(roomId).emit('room_update', room);
        updateGlobalLeaderboard(room, io);
      }
    });

    socket.on('kick_player', ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        delete room.players[playerId];
        io.to(roomId).emit('room_update', room);
        io.to(playerId).emit('kicked');
      }
    });

    socket.on('chat_message', ({ roomId, message, username }) => {
      io.to(roomId).emit('chat_message', { username, message, timestamp: Date.now() });
    });

    socket.on('use_item', ({ roomId, itemId, targetId, username }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      io.to(roomId).emit('item_used', { itemId, targetId, sourceUsername: username });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      for (const [roomId, room] of rooms.entries()) {
        if (room.hostId === socket.id) {
          if (roomTimers.has(roomId)) {
            clearTimeout(roomTimers.get(roomId));
            roomTimers.delete(roomId);
          }
          rooms.delete(roomId);
          io.to(roomId).emit('error', { message: "L'hôte a quitté la partie" });
          io.emit('public_rooms_update', getPublicRooms());
        } else if (room.players[socket.id]) {
          delete room.players[socket.id];
          io.to(roomId).emit('room_update', room);
          io.emit('public_rooms_update', getPublicRooms());
        }
      }
    });
  });

  function getPublicRooms() {
    const publicRooms: any[] = [];
    for (const [id, room] of rooms.entries()) {
      if (room.isPublic && room.status === 'lobby') {
        publicRooms.push({
          id,
          theme: room.theme,
          playerCount: Object.keys(room.players).length
        });
      }
    }
    return publicRooms;
  }
}
