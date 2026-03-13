import React from 'react';
import { Trash2, Play } from 'lucide-react';
import { SavedQuiz } from '../../types';

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
              <span className="bg-violet-500/10 text-violet-400 px-3 py-1.5 rounded-lg border border-violet-500/20">
                {themes[quiz.theme]?.name || quiz.theme}
              </span>
              <span className="bg-zinc-700/50 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-600/50">
                {quiz.timeLimit}s
              </span>
              <span className="text-zinc-500 ml-auto">
                {new Date(quiz.createdAt).toLocaleDateString()}
              </span>
            </div>

            <button
              onClick={() => onLaunch(quiz)}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Relancer ce quiz
            </button>
          </div>
        ))
      )}
    </div>
  );
}
