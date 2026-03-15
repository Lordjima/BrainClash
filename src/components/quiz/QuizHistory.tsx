import React from 'react';
import { Trash2, Play } from 'lucide-react';
import { SavedQuiz } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface QuizHistoryProps {
  savedQuizzes: SavedQuiz[];
  themes: Record<string, any>;
  onLaunch: (quiz: SavedQuiz) => void;
  onDelete: (id: string) => void;
}

export default function QuizHistory({
  savedQuizzes,
  themes,
  onLaunch,
  onDelete,
}: QuizHistoryProps) {
  return (
    <div className="space-y-4">
      {savedQuizzes.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          Aucun quiz sauvegardé pour le moment.
        </div>
      ) : (
        savedQuizzes.map(quiz => (
          <div key={quiz.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 flex flex-col gap-4 hover:border-violet-500/30 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl group-hover:text-violet-400 transition-colors">{quiz.name}</h3>
                {quiz.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{quiz.description}</p>}
              </div>
              <button 
                onClick={() => onDelete(quiz.id)}
                className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-mono">
              <Badge variant="fuchsia">
                {themes[quiz.theme]?.name || quiz.theme}
              </Badge>
              <Badge variant="zinc">
                {quiz.timeLimit}s
              </Badge>
              <span className="text-zinc-500 ml-auto">
                {new Date(quiz.createdAt).toLocaleDateString()}
              </span>
            </div>

            <Button
              onClick={() => onLaunch(quiz)}
              variant="primary"
              className="w-full"
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Relancer ce quiz
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
