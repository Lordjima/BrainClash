export type Question = {
  id: string | number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number;
};

export type Player = {
      id: string | number;
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

export type RoomState = {
      id: string | number;
      name?: string;
      description?: string;
      hostId: string;
      status: 'lobby' | 'active' | 'finished';
      questions: Question[];
      currentQuestionIndex: number;
      questionStartTime: number | null;
      serverTime?: number;
      players: Record<string, Player>;
      showAnswer: boolean;
      theme?: string;
      isPublic?: boolean;
    };

export interface Badge {
  id: string | number;
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
  inventory: (string | number)[];
  level: number;
  xp: number;
};

export type AuctionItem = {
  id: string | number;
  seller: string;
  itemId: string;
  price: number;
  currency: 'coins' | 'brainCoins';
  createdAt: number;
};

export type ShopItem = {
  id: string | number;
  name: string;
  description: string;
  price: number;
  icon: string;
  type: 'attack' | 'defense' | 'bonus';
};

export type Theme = {
  id: string | number;
  name: string;
  questions: Question[];
};

export type SavedQuiz = {
  id: string | number;
  name: string;
  description: string;
  theme: string;
  timeLimit: number;
  createdAt: number;
};

export type SubmittedQuestion = {
  id: string | number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  author: string;
  theme: string;
  status: 'pending' | 'approved' | 'rejected';
};
