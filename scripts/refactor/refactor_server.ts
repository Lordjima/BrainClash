import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';

const project = new Project();
project.addSourceFileAtPath('server.ts');
const sourceFile = project.getSourceFileOrThrow('server.ts');

const text = sourceFile.getFullText();

// 1. state.ts
const stateText = `import type { RoomState, GlobalLeaderboardEntry, SubmittedQuestion, Theme } from '../src/types';

export let globalLeaderboard: GlobalLeaderboardEntry[] = [];
export let pendingQuestionsCache: SubmittedQuestion[] | null = null;
export let themesCache: Record<string, Theme> | null = null;

export const rooms = new Map<string, RoomState>();
export const roomTimers = new Map<string, NodeJS.Timeout>();

export function setGlobalLeaderboard(data: GlobalLeaderboardEntry[]) { globalLeaderboard = data; }
export function setPendingQuestionsCache(data: SubmittedQuestion[] | null) { pendingQuestionsCache = data; }
export function setThemesCache(data: Record<string, Theme> | null) { themesCache = data; }
`;

// 2. game.ts
const gameText = `import { Server } from 'socket.io';
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
    
    room.status = 'showing_answer';
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
        r.status = 'playing';
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
`;

// 3. socket.ts
const socketText = `import { Server, Socket } from 'socket.io';
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
        status: 'waiting',
        currentQuestionIndex: 0,
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

      if (room.status !== 'waiting') {
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
        room.status = 'playing';
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
      if (!room || room.status !== 'playing') return;

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
        
        room.status = 'showing_answer';
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
            r.status = 'playing';
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
      if (room && room.hostId === socket.id && room.status === 'showing_answer') {
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId));
        }
        
        room.currentQuestionIndex++;
        
        if (room.currentQuestionIndex >= room.questions.length) {
          room.status = 'finished';
          io.to(roomId).emit('room_update', room);
          updateGlobalLeaderboard(room, io);
        } else {
          room.status = 'playing';
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
          io.to(roomId).emit('error', { message: 'L\\'hôte a quitté la partie' });
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
      if (room.isPublic && room.status === 'waiting') {
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
`;

// 4. api.ts
const apiText = `import express from 'express';
import { 
  getLeaderboard, getPendingQuestions, addSubmittedQuestion, updateSubmittedQuestionStatus, 
  getThemesWithQuestions, addTheme, addQuestion, getUserProfile, updateUserProfile, 
  buyItem, useItem, toggleSubStatus, getAllBadges, getShopItems, awardBadgeXp, 
  getAuctionItems, openLootBox, listItemForAuction, addBrainCoins 
} from '../src/lib/db';
import { globalLeaderboard, pendingQuestionsCache, themesCache } from './state';
import { invalidateCaches, getCachedPendingQuestions, getCachedThemes } from './game';

export const apiRouter = express.Router();

apiRouter.get('/leaderboard', async (req, res) => {
  if (globalLeaderboard.length === 0) {
    const lb = await getLeaderboard();
    res.json(lb);
  } else {
    res.json(globalLeaderboard);
  }
});

apiRouter.get('/profile/:username', async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.username);
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

apiRouter.post('/profile/:username', async (req, res) => {
  try {
    await updateUserProfile(req.params.username, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

apiRouter.get('/shop', async (req, res) => {
  const items = await getShopItems();
  res.json(items);
});

apiRouter.post('/buy', async (req, res) => {
  const { username, itemId, cost } = req.body;
  const success = await buyItem(username, itemId, cost);
  res.json({ success });
});

apiRouter.post('/use', async (req, res) => {
  const { username, itemId } = req.body;
  const success = await useItem(username, itemId);
  res.json({ success });
});

apiRouter.post('/sub', async (req, res) => {
  const { username } = req.body;
  const success = await toggleSubStatus(username);
  res.json({ success });
});

apiRouter.get('/questions/pending', async (req, res) => {
  const questions = await getCachedPendingQuestions();
  res.json(questions);
});

apiRouter.post('/questions/submit', async (req, res) => {
  await addSubmittedQuestion(req.body);
  invalidateCaches();
  res.json({ success: true });
});

apiRouter.post('/questions/:id/status', async (req, res) => {
  const { status } = req.body;
  await updateSubmittedQuestionStatus(req.params.id, status);
  invalidateCaches();
  res.json({ success: true });
});

apiRouter.get('/themes', async (req, res) => {
  const themes = await getCachedThemes();
  res.json(themes);
});

apiRouter.get('/badges', async (req, res) => {
  const badges = await getAllBadges();
  res.json(badges);
});

apiRouter.get('/auctions', async (req, res) => {
  const auctions = await getAuctionItems();
  res.json(auctions);
});

apiRouter.post('/auctions/list', async (req, res) => {
  const { username, itemId, price, currency } = req.body;
  const success = await listItemForAuction(username, itemId, price, currency);
  res.json({ success });
});

apiRouter.post('/lootbox', async (req, res) => {
  const { username, type } = req.body;
  const result = await openLootBox(username, type);
  res.json(result);
});

apiRouter.post('/braincoins', async (req, res) => {
  const { username, amount } = req.body;
  const success = await addBrainCoins(username, amount);
  res.json({ success });
});
`;

// 5. index.ts
const indexText = `import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import { initDB } from '../src/lib/db';
import { apiRouter } from './api';
import { setupSocketHandlers } from './socket';
import { refreshLeaderboard } from './game';

dotenv.config();

async function startServer() {
  await initDB();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // API Routes
  app.use('/api', apiRouter);

  // Socket.IO
  setupSocketHandlers(io);

  // Initial load
  await refreshLeaderboard(io);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server/state.ts', stateText);
fs.writeFileSync('server/game.ts', gameText);
fs.writeFileSync('server/socket.ts', socketText);
fs.writeFileSync('server/api.ts', apiText);
fs.writeFileSync('server/index.ts', indexText);

// Delete the old server.ts
fs.unlinkSync('server.ts');

console.log('Server refactored successfully.');
