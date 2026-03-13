import React from 'react';
import { History } from 'lucide-react';

interface QuizHeaderProps {
  onOpenHistory: () => void;
}

export default function QuizHeader({ onOpenHistory }: QuizHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">CRÉER UN QUIZ</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenHistory}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 border border-zinc-700 shadow-lg hover:scale-105 active:scale-95"
        >
          <History className="w-5 h-5 text-fuchsia-400" />
          Historique
        </button>
      </div>
    </div>
  );
}
