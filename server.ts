import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file (for local development)
dotenv.config();

import type { Question, Player, RoomState, GlobalLeaderboardEntry, SubmittedQuestion, Theme } from './src/types';
import { initDB, getLeaderboard, getPendingQuestions, addSubmittedQuestion, updateSubmittedQuestionStatus, getThemesWithQuestions, addTheme, addQuestion, getUserProfile, updateUserProfile, buyItem, useItem, toggleSubStatus, batchUpdateUserProfiles, getAllBadges, getShopItems, awardBadgeXp, getAuctionItems, openLootBox, listItemForAuction, addBrainCoins } from './src/lib/db';

let globalLeaderboard: GlobalLeaderboardEntry[] = [];
let pendingQuestionsCache: SubmittedQuestion[] | null = null;
let themesCache: Record<string, Theme> | null = null;

async function refreshLeaderboard(io: Server) {
  globalLeaderboard = await getLeaderboard();
  io.emit('leaderboard_update', globalLeaderboard);
}

async function getCachedPendingQuestions() {
  if (!pendingQuestionsCache) {
    pendingQuestionsCache = await getPendingQuestions();
  }
  return pendingQuestionsCache;
}

async function getCachedThemes() {
  if (!themesCache) {
    themesCache = await getThemesWithQuestions();
  }
  return themesCache;
}

function invalidateCaches() {
  pendingQuestionsCache = null;
  themesCache = null;
}

async function updateGlobalLeaderboard(room: RoomState, io: Server) {
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
        earnedCoins,
        newBadges
      });
    }
  }
  
  if (updates.length > 0) {
    // Need to fix the parameter name in db.ts or here. 
    // In db.ts it was coinsEarned, I used earnedCoins here.
    await batchUpdateUserProfiles(updates.map(u => ({ ...u, coinsEarned: u.earnedCoins })));
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
      const currentQ = room.questions[room.currentQuestionIndex];
      io.to(roomId).emit('answer_revealed', { 
        correctOptionIndex: currentQ.correctOptionIndex,
        players: room.players 
      });
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
        
        io.to(roomId).emit('question_started', {
          currentQuestionIndex: room.currentQuestionIndex,
          questionStartTime: room.questionStartTime,
          serverTime: Date.now()
        });
        
        const currentQ = room.questions[room.currentQuestionIndex];
        scheduleQuestionEnd(roomId, io, currentQ.timeLimit * 1000);
      } else {
        room.status = 'finished';
        updateGlobalLeaderboard(room, io);
        io.to(roomId).emit('game_finished', {
          status: room.status,
          players: room.players
        });
        roomTimers.delete(roomId);
      }
    } else {
      roomTimers.delete(roomId);
    }
  }, 5000); // 5 seconds
  
  roomTimers.set(roomId, timer);
}

async function startServer() {
  console.log('Starting server...');
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

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
      if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
        console.error('Missing Twitch credentials in environment variables');
        return res.status(500).send('Configuration Twitch manquante (Client ID ou Secret).');
      }

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

  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    // Send initial data to avoid multiple requests from client
    try {
      const [leaderboard, themes, allBadges, shopItems] = await Promise.all([
        getLeaderboard(),
        getCachedThemes(),
        getAllBadges(),
        getShopItems()
      ]);
      socket.emit('bootstrap_data', { leaderboard, themes, allBadges, shopItems });
    } catch (err) {
      console.error('Error sending bootstrap data:', err);
    }

    socket.on('request_bootstrap_data', async () => {
      try {
        console.log('📡 Sending bootstrap data to client...');
        const [leaderboard, themes, allBadges, shopItems] = await Promise.all([
          getLeaderboard(),
          getCachedThemes(),
          getAllBadges(),
          getShopItems()
        ]);
        socket.emit('bootstrap_data', { leaderboard, themes, allBadges, shopItems });
      } catch (err) {
        console.error('Error sending requested bootstrap data:', err);
      }
    });

    // --- Community Questions ---
    socket.on('submit_question', async (questionData: Omit<SubmittedQuestion, 'id' | 'status'>) => {
      const newQuestion: SubmittedQuestion = {
        ...questionData,
        id: Math.random().toString(36).substring(2, 9),
        status: 'pending'
      };
      await addSubmittedQuestion(newQuestion);
      invalidateCaches();
      socket.emit('question_submitted', true);
    });

    socket.on('get_pending_questions', async () => {
      const pending = await getCachedPendingQuestions();
      socket.emit('pending_questions_list', pending);
    });

    socket.on('get_themes', async () => {
      const themes = await getCachedThemes();
      socket.emit('themes_list', themes);
    });

    socket.on('review_question', async ({ id, action, theme, username }: { id: string, action: 'approve' | 'reject', theme?: string, username: string }) => {
      if (username !== 'JimaG4ming') {
        return socket.emit('error', 'Seul JimaG4ming peut valider les questions.');
      }
      
      const pending = await getCachedPendingQuestions();
      const qIndex = pending.findIndex(q => q.id === id);
      
      if (qIndex !== -1) {
        await updateSubmittedQuestionStatus(id, action === 'approve' ? 'approved' : 'rejected');
        
        if (action === 'approve' && theme) {
          const themes = await getCachedThemes();
          let targetThemeId: string | number = theme;
          
          // Check if theme exists by id or name
          const existingThemeId = Object.keys(themes).find(k => k === theme || themes[k].name.toLowerCase() === theme.toLowerCase());
          
          if (existingThemeId) {
            targetThemeId = existingThemeId;
          } else {
            // Create new theme
            targetThemeId = await addTheme(theme) || theme;
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
        
        invalidateCaches();
        const updatedPending = await getCachedPendingQuestions();
        socket.emit('pending_questions_list', updatedPending);
        
        const updatedThemes = await getCachedThemes();
        io.emit('themes_list', updatedThemes);
      }
    });

    socket.on('bulk_add_questions', async ({ themeId, questions }: { themeId: string, questions: Omit<Question, 'id'>[] }) => {
      for (const q of questions) {
        const newQ: Question = {
          ...q,
          id: Math.random().toString(36).substring(2, 9)
        };
        await addQuestion(newQ, themeId, true);
      }
      invalidateCaches();
      const updatedThemes = await getCachedThemes();
      io.emit('themes_list', updatedThemes);
    });
    // ---------------------------

    socket.on('create_room', async (options?: { timeLimit?: number, theme?: string, name?: string, description?: string }) => {
      let roomId = generateRoomCode();
      while(rooms.has(roomId)) {
        roomId = generateRoomCode();
      }

      const timeLimit = options?.timeLimit || 15;
      const themeId = options?.theme || 'general';
      
      const themes = await getCachedThemes();
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

    socket.on('join_room', async ({ roomId, username, avatar }) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room) {
        return socket.emit('error', 'Salon introuvable');
      }
      if (room.status !== 'lobby') {
        return socket.emit('error', 'Le quiz a déjà commencé');
      }

      const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#33FFF0', '#FFC300', '#FF33A8'];
      const color = colors[Object.keys(room.players).length % colors.length];

      const profile = await getUserProfile(username);

      room.players[socket.id] = {
        id: socket.id,
        username,
        avatar,
        score: 0,
        color,
        hasAnswered: false,
        isProtected: false,
        level: profile?.level || 1,
      };

      socket.join(room.id.toString());
      socket.emit('room_joined', room.id);
      
      // Full update for the joining player
      socket.emit('room_update', { ...room, serverTime: Date.now() });
      
      // Granular update for others
      socket.to(room.id.toString()).emit('player_joined', room.players[socket.id]);
    });

    socket.on('join_observer', (roomId) => {
      const room = rooms.get(roomId.toUpperCase());
      if (room) {
        socket.join(room.id.toString());
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
        if (room.questions.length === 0) {
          return socket.emit('error', 'Aucune question disponible pour ce thème.');
        }
        room.status = 'active';
        room.currentQuestionIndex = 0;
        room.questionStartTime = Date.now();
        room.showAnswer = false;
        
        // Reset answers
        Object.values(room.players).forEach(p => p.hasAnswered = false);
        
        io.to(roomId).emit('game_started', {
          status: room.status,
          currentQuestionIndex: room.currentQuestionIndex,
          questionStartTime: room.questionStartTime,
          serverTime: Date.now()
        });
        
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

      // Notify others that this player has answered (without sending full state)
      io.to(roomId).emit('player_answered', { 
        playerId: socket.id, 
        hasAnswered: true,
        // Only send score/isCorrect if answer is revealed or if it's the player themselves
      });

      const playersList = Object.values(room.players);
      const allAnswered = playersList.length > 0 && playersList.every(p => p.hasAnswered);
      if (allAnswered) {
        room.showAnswer = true;
        scheduleNextQuestion(roomId, io);
        io.to(roomId).emit('answer_revealed', { 
          correctOptionIndex: currentQ.correctOptionIndex,
          players: room.players 
        });
      }
    });

    socket.on('reveal_answer', (roomId) => {
      const room = rooms.get(roomId);
      if (room && room.hostId === socket.id) {
        room.showAnswer = true;
        const currentQ = room.questions[room.currentQuestionIndex];
        io.to(roomId).emit('answer_revealed', { 
          correctOptionIndex: currentQ.correctOptionIndex,
          players: room.players 
        });
        scheduleNextQuestion(roomId, io);
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
          io.to(roomId).emit('question_started', {
            currentQuestionIndex: room.currentQuestionIndex,
            questionStartTime: room.questionStartTime,
            serverTime: Date.now()
          });
          scheduleQuestionEnd(roomId, io, currentQ.timeLimit * 1000);
        } else {
          room.status = 'finished';
          updateGlobalLeaderboard(room, io);
          io.to(roomId).emit('game_finished', {
            status: room.status,
            players: room.players
          });
        }
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
          p.isProtected = false;
        });
        io.to(roomId).emit('room_restarted', {
          status: room.status,
          players: room.players
        });
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
      socket.emit('profile_data', profile);
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
        if (itemId === 'bouclier') {
          if (room.players[socket.id]) {
            room.players[socket.id].isProtected = true;
            socket.emit('item_used_success', { itemId, message: 'Bouclier activé !' });
          }
        } else {
          // Attack logic: send to each player individually to check for shields
          Object.entries(room.players).forEach(([playerId, player]) => {
            if (playerId === socket.id) return; // Don't attack self
            
            if (player.isProtected) {
              // Shield blocks the attack
              player.isProtected = false;
              io.to(playerId).emit('item_blocked', { attacker: username, itemId });
            } else {
              // Attack hits
              io.to(playerId).emit('item_effect', { 
                attacker: username, 
                itemId,
                effect: itemId 
              });
            }
          });
          socket.emit('item_used_success', { itemId, message: `${itemId} utilisé !` });
        }
        
        const profile = await getUserProfile(username);
        socket.emit('profile_data', profile);
      } else {
        socket.emit('error', 'Erreur lors de l\'utilisation de l\'objet');
      }
    });

    socket.on('award_badge_xp', async ({ username, badgeId, xp }) => {
      await awardBadgeXp(username, badgeId, xp);
      const profile = await getUserProfile(username);
      socket.emit('profile_data', profile);
    });

    socket.on('open_loot_box', async ({ username, boxType }) => {
      const result = await openLootBox(username, boxType);
      if (result.success) {
        const profile = await getUserProfile(username);
        socket.emit('profile_data', profile);
        socket.emit('loot_box_result', result);
      } else {
        socket.emit('error', result.message || 'Erreur lors de l\'ouverture du coffre');
      }
    });

    socket.on('list_auction_item', async ({ username, itemId, price, currency }) => {
      const success = await listItemForAuction(username, itemId, price, currency);
      if (success) {
        const profile = await getUserProfile(username);
        socket.emit('profile_data', profile);
        const auctions = await getAuctionItems();
        io.emit('auction_items_list', auctions);
        socket.emit('auction_list_success');
      } else {
        socket.emit('error', 'Erreur lors de la mise en vente');
      }
    });

    socket.on('add_brain_coins', async ({ username, amount }) => {
      const success = await addBrainCoins(username, amount);
      if (success) {
        const profile = await getUserProfile(username);
        socket.emit('profile_data', profile);
      } else {
        socket.emit('error', 'Erreur lors de l\'ajout des BrainCoins');
      }
    });

    socket.on('get_auction_items', async () => {
      const auctions = await getAuctionItems();
      socket.emit('auction_items_list', auctions);
    });

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
    const { createServer: createViteServer } = await import('vite');
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

  const PORT = process.env.PORT || 3000;
  httpServer.listen(Number(PORT), "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize Database after server is listening
    try {
      await initDB();
      // Load initial data
      globalLeaderboard = await getLeaderboard();
      console.log('✅ Initial data loaded');
    } catch (err) {
      console.error('❌ Error during post-startup initialization:', err);
    }
  });
}

startServer();
