import React from 'react';
import { Play, SkipForward, RotateCcw } from 'lucide-react';
import { RoomState, Question } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface HostGameAreaProps {
  room: RoomState;
  onStartGame: () => void;
  onNextQuestion: () => void;
  onRevealAnswer: () => void;
  onRestartGame: () => void;
}

export default function HostGameArea({
  room,
  onStartGame,
  onNextQuestion,
  onRevealAnswer,
  onRestartGame,
}: HostGameAreaProps) {
  const currentQuestion = room.questions[room.currentQuestionIndex];

  if (room.status === 'lobby') {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-fuchsia-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Prêt à commencer ?</h2>
          <p className="text-zinc-400 mb-8">
            Attendez que tous les joueurs soient connectés avant de lancer le quiz.
          </p>
          <Button
            onClick={onStartGame}
            disabled={Object.keys(room.players).length === 0}
            variant="primary"
            className="w-full py-4 text-lg"
          >
            Lancer le quiz
          </Button>
        </div>
      </div>
    );
  }

  if (room.status === 'finished') {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Quiz terminé !</h2>
          <p className="text-zinc-400 mb-8">
            Tous les joueurs ont terminé. Vous pouvez relancer une partie avec les mêmes joueurs.
          </p>
          <Button
            onClick={onRestartGame}
            variant="primary"
            className="w-full py-4 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
          >
            Relancer une partie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="fuchsia">
              Question {room.currentQuestionIndex + 1} / {room.questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">En cours</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 leading-tight">
          {currentQuestion?.text}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {currentQuestion?.options?.map((option, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                room.showAnswer && idx === currentQuestion.correctOptionIndex
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : room.showAnswer
                  ? 'bg-zinc-800/20 border-zinc-800 text-zinc-600'
                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        {!room.showAnswer ? (
          <Button
            onClick={onRevealAnswer}
            variant="primary"
            className="px-8 py-4 text-lg"
          >
            Révéler la réponse
          </Button>
        ) : (
          <Button
            onClick={onNextQuestion}
            variant="secondary"
            className="px-8 py-4 text-lg"
            icon={<SkipForward className="w-5 h-5" />}
          >
            {room.currentQuestionIndex === room.questions.length - 1 ? 'Terminer le quiz' : 'Question suivante'}
          </Button>
        )}
      </div>
    </div>
  );
}
