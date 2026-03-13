import { Server } from 'socket.io';
import type { RoomState, Player } from '../src/types';
import { rooms, roomTimers, setGlobalLeaderboard, globalLeaderboard, pendingQuestionsCache, setPendingQuestionsCache, themesCache, setThemesCache } from './state';
import { getLeaderboard, getPendingQuestions, getThemesWithQuestions, getUserProfile, batchUpdateUserProfiles } from '../src/lib/db';

export async function refreshLeaderboard(io: Server) {
  const lb = await getLeaderboard();
  setGlobalLeaderboard(lb);
  io.emit('leaderboard_update', lb);
}

export async function getCachedPendingQuestions() {
  if (!pendingQuestionsCache) {
    setPendingQuestionsCache(await getPendingQuestions());
  }
  return pendingQuestionsCache;
}

export async function getCachedThemes() {
  if (!themesCache) {
    setThemesCache(await getThemesWithQuestions());
  }
  return themesCache;
}

export function invalidateCaches() {
  setPendingQuestionsCache(null);
  setThemesCache(null);
}

export async function updateGlobalLeaderboard(room: RoomState, io: Server) {
  const players = Object.values(room.players);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  const updates = [];
  
  for (const p of players) {
    if (p.score > 0) {
      const rank = sortedPlayers.findIndex(sp => sp.id === p.id) + 1;
      const profile = await getUserProfile(p.username);
      const isSub = profile?.is_sub || false;
      const gamesPlayed = (profile?.games_played || 0) + 1;
      
      let earnedCoins = 10;
      earnedCoins += Math.floor(p.score / 100);
      if (rank === 1) earnedCoins += 50;
      if (isSub) earnedCoins *= 2;
      
      const newBadges: string[] = [];
      if (gamesPlayed === 1) newBadges.push('first_game');
      if (gamesPlayed === 10) newBadges.push('veteran');
      if (gamesPlayed === 50) newBadges.push('expert');
      if (rank === 1) newBadges.push('champion');
      
      updates.push({
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        coinsEarned: earnedCoins,
        newBadges
      });
    }
  }
  
  if (updates.length > 0) {
    await batchUpdateUserProfiles(updates);
  }
  
  await refreshLeaderboard(io);
}

export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function scheduleQuestionEnd(roomId: string, io: Server, timeLimitMs: number) {
  if (roomTimers.has(roomId)) {
    clearTimeout(roomTimers.get(roomId));
  }
  
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (!room) return;
    
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
  }, timeLimitMs);
  
  roomTimers.set(roomId, timer);
}
