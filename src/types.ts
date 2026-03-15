export type Question = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number;
  theme?: string;
};

export type Player = {
      id: string;
      username: string;
      avatar?: string;
      score: number;
      color: string;
      hasAnswered: boolean;
      answerTime?: number;
      isCorrect?: boolean;
      isProtected?: boolean;
      level: number;
      streak?: number;
    };

export type RoomEffect = {
  id: string;
  type: string;
  sourceId: string;
  sourceName: string;
  targetId?: string;
  createdAt: number;
  duration: number;
};

export type RoomState = {
      id: string;
      name?: string;
      description?: string;
      hostId: string;
      status: 'lobby' | 'active' | 'finished' | 'closed';
      questions: Question[];
      currentQuestionIndex: number;
      questionStartTime: number | null;
      serverTime?: number;
      players: Record<string, Player>;
      showAnswer: boolean;
      theme?: string;
      isPublic?: boolean;
      timeLimit: number;
      activeEffects?: RoomEffect[];
    };

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  rarity: number; // Percentage of players who have it
}

export type GlobalLeaderboardEntry = {
  username: string;
  avatar?: string;
  score: number;
  games_played: number;
  date: number;
  coins: number;
  brainCoins: number;
  is_sub: boolean;
  badges: string[];
  inventory: string[];
  level: number;
  xp: number;
  processedGames?: string[];
};

export type AuctionItem = {
  id: string;
  seller: string;
  itemId: string;
  price: number;
  currency: 'coins' | 'brainCoins';
  createdAt: number;
};

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  type: 'attack' | 'defense' | 'bonus' | 'spell';
  power?: number; // 1 to 5
};

export type Chest = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  possibleItems: string[]; // IDs of ShopItems
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type Theme = {
  id: string;
  name: string;
  questions: Question[];
};

export type SavedQuiz = {
  id: string;
  name: string;
  description: string;
  theme: string;
  timeLimit: number;
  questionCount: number;
  createdAt: number;
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
