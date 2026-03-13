import { useState, useEffect, useCallback } from 'react';

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number; // in seconds
};

export type Player = {
  username: string;
  score: number;
  color: string;
};

export type QuizState = {
  channel: string;
  status: 'setup' | 'idle' | 'active' | 'finished';
  questions: Question[];
  currentQuestionIndex: number;
  questionStartTime: number | null;
  leaderboard: Record<string, Player>;
  answeredUsers: Record<string, boolean>; // Users who answered the current question
  showAnswer: boolean;
};

const STORAGE_KEY = 'brainclash_state';

export const defaultQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Quel est le jeu le plus vendu de tous les temps ?',
    options: ['Minecraft', 'Tetris', 'GTA V', 'Wii Sports'],
    correctOptionIndex: 0,
    timeLimit: 15,
  },
  {
    id: 'q2',
    text: 'En quelle année Twitch a-t-il été racheté par Amazon ?',
    options: ['2012', '2014', '2016', '2018'],
    correctOptionIndex: 1,
    timeLimit: 15,
  },
  {
    id: 'q3',
    text: 'Quel personnage de Nintendo est rose et aspire ses ennemis ?',
    options: ['Yoshi', 'Rondoudou', 'Kirby', 'Toad'],
    correctOptionIndex: 2,
    timeLimit: 10,
  },
];

export const defaultState: QuizState = {
  channel: '',
  status: 'setup',
  questions: defaultQuestions,
  currentQuestionIndex: 0,
  questionStartTime: null,
  leaderboard: {},
  answeredUsers: {},
  showAnswer: false,
};

export function useQuizState() {
  const [state, setState] = useState<QuizState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultState;
    } catch (e) {
      return defaultState;
    }
  });

  const updateState = useCallback((newState: Partial<QuizState> | ((prev: QuizState) => Partial<QuizState>)) => {
    setState((prev) => {
      const updated = typeof newState === 'function' ? { ...prev, ...newState(prev) } : { ...prev, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse storage update');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { state, updateState };
}
