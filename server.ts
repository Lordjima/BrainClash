import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
dotenv.config();

import type { Question, Player, RoomState, GlobalLeaderboardEntry, SubmittedQuestion } from '../BrainClash/src/types.ts';
import { initDB, getLeaderboard, getPendingQuestions, addSubmittedQuestion, updateSubmittedQuestionStatus, getThemesWithQuestions, addTheme, addQuestion, getUserProfile, updateUserProfile, buyItem, useItem, toggleSubStatus } from '../BrainClash/src/lib/db.ts';

let globalLeaderboard: GlobalLeaderboardEntry[] = [];
let pendingQuestions: SubmittedQuestion[] = [];

async function refreshLeaderboard(io: Server) {
  globalLeaderboard = await getLeaderboard();
  io.emit('leaderboard_update', globalLeaderboard);
}

async function updateGlobalLeaderboard(room: RoomState, io: Server) {
  const players = Object.values(room.players);
  // Sort players by score to determine rank
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  for (const p of players) {
    if (p.score > 0) {
      const rank = sortedPlayers.findIndex(sp => sp.id === p.id) + 1;
      const profile = await getUserProfile(p.username);
      const isSub = profile?.is_sub || false;
      const gamesPlayed = (profile?.games_played || 0) + 1;
      
      // Calculate coins
      let earnedCoins = 10; // Base for playing
      earnedCoins += Math.floor(p.score / 100); // Bonus based on score
      if (rank === 1) earnedCoins += 50; // Win bonus
      if (isSub) earnedCoins *= 2; // Sub bonus multiplier
      
      // Calculate badges
      const newBadges: string[] = [];
      if (gamesPlayed === 1) newBadges.push('first_game');
      if (gamesPlayed === 10) newBadges.push('veteran');
      if (gamesPlayed === 50) newBadges.push('expert');
      if (rank === 1) newBadges.push('champion');
      
      await updateUserProfile(p.username, p.avatar, p.score, earnedCoins, newBadges);
    }
  }
  await refreshLeaderboard(io);
}

const rooms = new Map<string, RoomState>();
const roomTimers = new Map<string, NodeJS.Timeout>();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function scheduleQuestionEnd(roomId: string, io: Server, timeLimitMs: number) {
  if (roomTimers.has(roomId)) {
    clearTimeout(roomTimers.get(roomId));
  }
  
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.status === 'active' && !room.showAnswer) {
      room.showAnswer = true;
      io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
      scheduleNextQuestion(roomId, io);
    }
  }, timeLimitMs);
  
  roomTimers.set(roomId, timer);
}

function scheduleNextQuestion(roomId: string, io: Server) {
  if (roomTimers.has(roomId)) {
    clearTimeout(roomTimers.get(roomId));
  }
  
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.status === 'active') {
      if (room.currentQuestionIndex < room.questions.length - 1) {
        room.currentQuestionIndex++;
        room.questionStartTime = Date.now();
        room.showAnswer = false;
        Object.values(room.players).forEach(p => {
          p.hasAnswered = false;
          p.answerTime = undefined;
          p.isCorrect = undefined;
        });
        
        io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
        
        const currentQ = room.questions[room.currentQuestionIndex];
        scheduleQuestionEnd(roomId, io, currentQ.timeLimit * 1000);
      } else {
        room.status = 'finished';
        io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
        roomTimers.delete(roomId);
        updateGlobalLeaderboard(room, io);
      }
    } else {
      roomTimers.delete(roomId);
    }
  }, 5000); // 5 seconds
  
  roomTimers.set(roomId, timer);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Twitch OAuth Routes
  const getRedirectUri = (req: express.Request) => {
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    return `${protocol}://${host}/auth/twitch/callback`;
  };

  app.get('/api/auth/twitch/url', (req, res) => {
    const redirectUri = req.query.redirect_uri as string || getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'user:read:email',
      state: redirectUri // Pass the redirectUri in the state parameter
    });
    res.json({ url: `https://id.twitch.tv/oauth2/authorize?${params}` });
  });

  app.get(['/auth/twitch/callback', '/auth/twitch/callback/'], async (req, res) => {
    const { code, state } = req.query;
    // Use state to get the exact redirect_uri used, fallback to reconstruct
    const redirectUri = (state as string) || getRedirectUri(req);
    
    try {
      const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.TWITCH_CLIENT_ID || '',
          client_secret: process.env.TWITCH_CLIENT_SECRET || '',
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        const userResponse = await fetch('https://api.twitch.tv/helix/users', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID || ''
          }
        });
        const userData = await userResponse.json();
        const user = userData.data[0];
        
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'TWITCH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentification réussie. Cette fenêtre va se fermer automatiquement.</p>
            </body>
          </html>
        `);
      } else {
        console.error('Twitch token error:', tokenData);
        res.send(`Erreur lors de l'authentification Twitch: ${tokenData.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Twitch auth error:', error);
      res.send('Erreur serveur.');
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // --- Community Questions ---
    socket.on('submit_question', async (questionData: Omit<SubmittedQuestion, 'id' | 'status'>) => {
      const newQuestion: SubmittedQuestion = {
        ...questionData,
        id: Math.random().toString(36).substring(2, 9),
        status: 'pending'
      };
      await addSubmittedQuestion(newQuestion);
      socket.emit('question_submitted', true);
    });

    socket.on('get_pending_questions', async () => {
      const pending = await getPendingQuestions();
      socket.emit('pending_questions_list', pending);
    });

    socket.on('get_themes', async () => {
      const themes = await getThemesWithQuestions();
      socket.emit('themes_list', themes);
    });

    socket.on('review_question', async ({ id, action, theme }: { id: string, action: 'approve' | 'reject', theme?: string }) => {
      const pending = await getPendingQuestions();
      const qIndex = pending.findIndex(q => q.id === id);
      
      if (qIndex !== -1) {
        await updateSubmittedQuestionStatus(id, action === 'approve' ? 'approved' : 'rejected');
        
        if (action === 'approve' && theme) {
          const themes = await getThemesWithQuestions();
          let targetThemeId = theme;
          
          // Check if theme exists by id or name
          const existingThemeId = Object.keys(themes).find(k => k === theme || themes[k].name.toLowerCase() === theme.toLowerCase());
          
          if (existingThemeId) {
            targetThemeId = existingThemeId;
          } else {
            // Create new theme
            targetThemeId = theme.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await addTheme(targetThemeId, theme);
            
            // Broadcast updated themes to all clients
            const updatedThemes = await getThemesWithQuestions();
            io.emit('themes_list', updatedThemes);
          }

          const newQ: Question = {
            id: pending[qIndex].id,
            text: pending[qIndex].text,
            options: pending[qIndex].options,
            correctOptionIndex: pending[qIndex].correctOptionIndex,
            timeLimit: 15 // Default, will be overridden by room settings
          };
          
          await addQuestion(newQ, targetThemeId, true);
        }
        
        const updatedPending = await getPendingQuestions();
        socket.emit('pending_questions_list', updatedPending);
      }
    });
    // ---------------------------

    socket.on('create_room', async (options?: { timeLimit?: number, theme?: string, name?: string, description?: string }) => {
      let roomId = generateRoomCode();
      while(rooms.has(roomId)) {
        roomId = generateRoomCode();
      }

      const timeLimit = options?.timeLimit || 15;
      const themeId = options?.theme || 'general';
      
      const themes = await getThemesWithQuestions();
      let themeQuestions = themes[themeId]?.questions || themes['general']?.questions || [];

      // Mélanger les questions aléatoirement (Fisher-Yates shuffle)
      for (let i = themeQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [themeQuestions[i], themeQuestions[j]] = [themeQuestions[j], themeQuestions[i]];
      }

      // Prendre la moitié des questions (au moins 1 s'il y en a)
      const numQuestions = Math.max(1, Math.ceil(themeQuestions.length / 2));
      if (themeQuestions.length > 0) {
        themeQuestions = themeQuestions.slice(0, numQuestions);
      }

      const questions = themeQuestions.map(q => ({
        ...q,
        timeLimit: timeLimit
      }));

      const newRoom: RoomState = {
        id: roomId,
        name: options?.name,
        description: options?.description,
        hostId: socket.id,
        status: 'lobby',
        questions: questions,
        currentQuestionIndex: 0,
        questionStartTime: null,
        players: {},
        showAnswer: false,
      };

      rooms.set(roomId, newRoom);
      socket.join(roomId);
      socket.emit('room_created', roomId);
    });

    socket.on('join_room', ({ roomId, username, avatar }) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room) {
        return socket.emit('error', 'Salon introuvable');
      }
      if (room.status !== 'lobby') {
        return socket.emit('error', 'Le quiz a déjà commencé');
      }

      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#33FFF0', '#FFC300', '#FF33A8'];
      const color = colors[Object.keys(room.players).length % colors.length];

      room.players[socket.id] = {
        id: socket.id,
        username,
        avatar,
        score: 0,
        color,
        hasAnswered: false
      };

      socket.join(room.id);
      socket.emit('room_joined', room.id);
      io.to(room.id).emit('room_update', { ...room, serverTime: Date.now() });
    });

    socket.on('join_observer', (roomId) => {
      const room = rooms.get(roomId.toUpperCase());
      if (room) {
        socket.join(room.id);
        socket.emit('room_update', { ...room, serverTime: Date.now() });
      }
    });

    socket.on('get_room', (roomId) => {
      const room = rooms.get(roomId.toUpperCase());
      if (room) {
        socket.emit('room_update', { ...room, serverTime: Date.now() });
      } else {
        socket.emit('error', 'Salon introuvable');
      }
    });

    socket.on('start_quiz', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.status = 'active';
        room.currentQuestionIndex = 0;
        room.questionStartTime = Date.now();
        room.showAnswer = false;
        
        // Reset answers
        Object.values(room.players).forEach(p => p.hasAnswered = false);
        
        io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
        
        const currentQ = room.questions[0];
        scheduleQuestionEnd(roomId, io, currentQ.timeLimit * 1000);
      }
    });

    socket.on('submit_answer', ({ roomId, answerIndex }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active' || room.showAnswer) return;

      const player = room.players[socket.id];
      if (!player || player.hasAnswered) return;

      player.hasAnswered = true;
      const currentQ = room.questions[room.currentQuestionIndex];
      const elapsed = Date.now() - (room.questionStartTime || Date.now());
      player.answerTime = elapsed;

      if (answerIndex === currentQ.correctOptionIndex) {
        player.isCorrect = true;
        const timeLeft = Math.max(0, currentQ.timeLimit * 1000 - elapsed);
        const speedBonus = Math.floor((timeLeft / (currentQ.timeLimit * 1000)) * 100);
        player.score += 100 + speedBonus;
      } else {
        player.isCorrect = false;
      }

      const playersList = Object.values(room.players);
      const allAnswered = playersList.length > 0 && playersList.every(p => p.hasAnswered);
      if (allAnswered) {
        room.showAnswer = true;
        scheduleNextQuestion(roomId, io);
      }

      io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
    });

    socket.on('reveal_answer', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.showAnswer = true;
        scheduleNextQuestion(roomId, io);
        io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
      }
    });

    socket.on('next_question', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        if (roomTimers.has(roomId)) {
          clearTimeout(roomTimers.get(roomId));
          roomTimers.delete(roomId);
        }
        if (room.currentQuestionIndex < room.questions.length - 1) {
          room.currentQuestionIndex++;
          room.questionStartTime = Date.now();
          room.showAnswer = false;
          Object.values(room.players).forEach(p => {
            p.hasAnswered = false;
            p.answerTime = undefined;
            p.isCorrect = undefined;
          });
          
          const currentQ = room.questions[room.currentQuestionIndex];
          scheduleQuestionEnd(roomId, io, currentQ.timeLimit * 1000);
        } else {
          room.status = 'finished';
          updateGlobalLeaderboard(room, io);
        }
        io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
      }
    });

    socket.on('restart_quiz', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.status = 'lobby';
        room.currentQuestionIndex = 0;
        room.questionStartTime = null;
        room.showAnswer = false;
        Object.values(room.players).forEach(p => {
          p.score = 0;
          p.hasAnswered = false;
        });
        io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
      }
    });

    socket.on('close_room', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        rooms.delete(roomId);
        io.to(roomId).emit('room_closed');
        io.in(roomId).socketsLeave(roomId);
      }
    });

    socket.on('get_leaderboard', () => {
      socket.emit('leaderboard_update', globalLeaderboard);
    });

    // --- Shop & Profile Events ---
    socket.on('get_profile', async (username) => {
      const profile = await getUserProfile(username);
      if (profile) {
        socket.emit('profile_data', profile);
      }
    });

    socket.on('buy_item', async ({ username, itemId, cost }) => {
      const success = await buyItem(username, itemId, cost);
      if (success) {
        const profile = await getUserProfile(username);
        socket.emit('profile_data', profile);
      } else {
        socket.emit('error', 'Fonds insuffisants ou erreur');
      }
    });

    socket.on('toggle_sub', async (username) => {
      await toggleSubStatus(username);
      const profile = await getUserProfile(username);
      socket.emit('profile_data', profile);
    });

    socket.on('use_item', async ({ roomId, username, itemId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active') return;
      
      const success = await useItem(username, itemId);
      if (success) {
        // Broadcast the item usage to the room
        io.to(roomId).emit('item_used', { username, itemId });
        
        // Update the user's profile on their client
        const profile = await getUserProfile(username);
        socket.emit('profile_data', profile);
      }
    });
    // -----------------------------

    socket.on('disconnect', () => {
      // Find rooms where this socket is a player
      rooms.forEach((room, roomId) => {
        if (room.players[socket.id]) {
          // If in lobby, remove them completely
          if (room.status === 'lobby') {
            delete room.players[socket.id];
            io.to(roomId).emit('room_update', { ...room, serverTime: Date.now() });
          }
          // If active, keep their score but maybe mark disconnected (not implemented for simplicity)
        }
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initialize Database
  await initDB();
  
  // Load initial data
  globalLeaderboard = await getLeaderboard();

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
