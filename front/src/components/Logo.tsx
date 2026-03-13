import React from 'react';
import { Zap } from 'lucide-react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
        <Zap className="w-6 h-6 text-white" fill="currentColor" />
      </div>
      <span className="font-display font-bold text-2xl tracking-tight text-white">
        Brain<span className="text-violet-400">Clash</span>
      </span>
    </div>
  );
}
