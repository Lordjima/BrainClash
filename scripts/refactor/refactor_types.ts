import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('src/types.ts');
const sourceFile = project.getSourceFileOrThrow('src/types.ts');

const roomStateAlias = sourceFile.getTypeAlias('RoomState');
if (roomStateAlias) {
  roomStateAlias.setType(`{
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
}`);
}

const playerAlias = sourceFile.getTypeAlias('Player');
if (playerAlias) {
  playerAlias.setType(`{
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
}`);
}

sourceFile.saveSync();
console.log('Fixed types.ts');
