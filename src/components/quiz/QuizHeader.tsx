import React from 'react';
import { History, Settings } from 'lucide-react';

interface QuizHeaderProps {
  onOpenHistory: () => void;
}

export default function QuizHeader({ onOpenHistory }: QuizHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
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
