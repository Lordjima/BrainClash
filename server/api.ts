import express from 'express';
import { 
  getLeaderboard, getPendingQuestions, addSubmittedQuestion, updateSubmittedQuestionStatus, 
  getThemesWithQuestions, addTheme, addQuestion, getUserProfile, updateUserProfile, 
  buyItem, useItem, toggleSubStatus, getAllBadges, getShopItems, awardBadgeXp, 
  getAuctionItems, openLootBox, listItemForAuction, addBrainCoins 
} from '../src/lib/db';
import { globalLeaderboard, pendingQuestionsCache, themesCache } from './state';
import { invalidateCaches, getCachedPendingQuestions, getCachedThemes } from './game';

export const apiRouter = express.Router();
console.log("API Router is loaded");

apiRouter.get('/auth/twitch/url', (req, res) => {
  const redirectUri = req.query.redirect_uri as string;
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user:read:email",
    state: redirectUri
  });
  res.json({ url: `https://id.twitch.tv/oauth2/authorize?${params}` });
});

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
