export type Question = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number;
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
};

export type RoomStatus = "lobby" | "active" | "finished";

export type RoomState = {
  id: string;
  name?: string;
  description?: string;
  hostId: string;
  status: RoomStatus;
  questions: Question[];
  currentQuestionIndex: number;
  questionStartTime: number | null;
  serverTime?: number;
  players: Record<string, Player>;
  showAnswer: boolean;
};

export type GlobalLeaderboardEntry = {
  username: string;
  avatar?: string;
  score: number;
  games_played: number;
  date: number;
  coins: number;
  is_sub: boolean;
  badges: string[];
  inventory: string[];
};

export type ShopItemType = "attack" | "defense" | "bonus";

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  type: ShopItemType;
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
  createdAt: number;
};

export type SubmittedQuestionStatus = "pending" | "approved" | "rejected";

export type SubmittedQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  author: string;
  theme: string;
  status: SubmittedQuestionStatus;
};