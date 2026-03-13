import React from 'react';
import { motion } from 'motion/react';

interface TimerProps {
  timeLeft: number;
  timeLimit: number;
}

export default function Timer({ timeLeft, timeLimit }: TimerProps) {
  return (
    <div className="pt-6 shrink-0 w-full mx-auto">
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Temps restant</span>
          <span className={`font-mono font-bold text-lg ${timeLeft < 5000 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
            {Math.ceil(timeLeft / 1000)}s
          </span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${timeLeft < 5000 ? 'bg-red-500' : 'bg-fuchsia-500'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / (timeLimit * 1000)) * 100}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      </div>
    </div>
  );
}
