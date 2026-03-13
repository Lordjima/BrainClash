import type { RoomState, GlobalLeaderboardEntry, SubmittedQuestion, Theme } from '../src/types';

export let globalLeaderboard: GlobalLeaderboardEntry[] = [];
export let pendingQuestionsCache: SubmittedQuestion[] | null = null;
export let themesCache: Record<string, Theme> | null = null;

export const rooms = new Map<string, RoomState>();
export const roomTimers = new Map<string, NodeJS.Timeout>();

export function setGlobalLeaderboard(data: GlobalLeaderboardEntry[]) { globalLeaderboard = data; }
export function setPendingQuestionsCache(data: SubmittedQuestion[] | null) { pendingQuestionsCache = data; }
export function setThemesCache(data: Record<string, Theme> | null) { themesCache = data; }
