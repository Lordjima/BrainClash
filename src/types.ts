// --- USER TYPES ---

export type UserAccount = {
  uid: string;
  role: 'user' | 'admin';
  status: 'active' | 'banned';
  createdAt: number;
  updatedAt: number;
};

export type TwitchConnection = {
  provider: 'twitch';
  twitchUserId: string;
  login: string;
  displayName: string;
  avatarUrl: string;
  connectedAt: number;
  updatedAt: number;
};

export type PublicProfile = {
  username: string;
  avatarUrl: string;
  level: number;
  updatedAt: number;
};

export type UserStats = {
  scoreTotal: number;
  gamesPlayed: number;
  wins: number;
  correctAnswers: number;
  wrongAnswers: number;
  xp: number;
  level: number;
  updatedAt: number;
};

export type UserWallet = {
  coins: number;
  brainCoins: number;
  updatedAt: number;
};

export type WalletTransaction = {
  type: 'game_reward' | 'shop_purchase' | 'chest_open' | 'auction_sale' | 'admin_grant' | 'purchase' | 'reward';
  currency: 'coins' | 'brainCoins';
  amount: number;
  description?: string;
  sourceType?: 'room' | 'shopItem' | 'chest' | 'auction' | 'admin';
  sourceId?: string | null;
  createdAt?: number;
  timestamp?: number;
  metadata?: any;
};

export type InventoryEntry = {
  id: string; // The entry ID in the subcollection
  itemId: string; // The ID from CatalogItem
  status: 'available' | 'used' | 'listed' | 'consumed';
  sourceType: 'shop' | 'chest' | 'reward' | 'admin';
  sourceId: string | null;
  acquiredAt: number;
  usedAt: number | null;
};

export type UserBadge = {
  badgeId: string;
  unlockedAt: number;
  source: 'achievement' | 'event' | 'admin';
};

export type GameResult = {
  roomId: string;
  score: number;
  rank: number | null;
  coinsEarned: number;
  brainCoinsEarned: number;
  xpEarned: number;
  processedAt: number;
};

// --- ROOM TYPES ---

export type Room = {
  id: string;
  hostUid: string;
  name: string;
  description: string;
  themeIds: string[];
  status: 'lobby' | 'active' | 'finished' | 'closed';
  currentQuestionIndex: number;
  questionStartTime: number | null;
  questionCount: number;
  timeLimit: number;
  showAnswer: boolean;
  createdAt: number;
  updatedAt: number;
  // UI Only / Populated from subcollections
  players: Record<string, RoomParticipant>;
  questions: RoomQuestion[];
  activeEffects?: RoomEffectDoc[];
};

export type RoomParticipant = {
  id: string; // Alias for uid
  uid: string;
  username: string;
  avatar: string; // Alias for avatarUrl
  avatarUrl: string;
  color: string;
  joinedAt: number;
  score: number;
  streak: number;
  hasAnswered: boolean;
  isCorrect: boolean | null;
  isProtected: boolean;
  answerTime?: number; // Last answer time
};

export type RoomQuestion = {
  id?: string;
  index: number;
  questionId: string | null;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number;
  theme: string | null;
  order?: number;
};

export type RoomAnswer = {
  uid: string;
  questionIndex: number;
  answerIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  pointsEarned: number;
  answeredAt: number;
};

export type RoomEffectDoc = {
  id: string;
  type: string;
  sourceId: string;
  sourceName: string;
  targetId: string | null;
  createdAt: number;
  duration: number;
};

// --- CATALOG TYPES ---

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'brainCoins';
  icon: string;
  type: 'attack' | 'defense' | 'bonus' | 'spell';
  power?: number;
  isExclusive?: boolean;
  chestOnly?: boolean;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CatalogChest = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'brainCoins';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  active: boolean;
  possibleItems?: string[]; // Added for compatibility with initialData
};

export type ChestLootEntry = {
  itemId: string;
  weight: number;
  minQty: number;
  maxQty: number;
};

export type CatalogBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  level?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'; // Added for compatibility
};

export type SavedQuiz = {
  id: string;
  name: string;
  description: string;
  themeIds: string[];
  timeLimit: number;
  questionCount: number;
  createdAt: number;
};

// --- LEGACY / COMPATIBILITY TYPES (To be phased out) ---

export type GlobalLeaderboardEntry = PublicProfile & {
  id: string;
  score: number;
  coins: number;
  brainCoins: number;
};

export type Theme = {
  id: string;
  name: string;
  questionCount?: number;
};

export type SubmittedQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  author: string;
  theme: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type AuctionItem = {
  id: string;
  seller: string;
  itemId: string;
  price: number;
  currency: 'coins' | 'brainCoins';
  createdAt: number;
};

// Re-exporting some names for backward compatibility if needed during refactor
export type Question = RoomQuestion;
export type Player = RoomParticipant;
export type RoomState = Room;
export type Badge = CatalogBadge;
export type ShopItem = CatalogItem;
export type Chest = CatalogChest;
