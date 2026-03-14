import React from 'react';
import { Zap } from 'lucide-react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20"></div>
          <Zap className="w-7 h-7 text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" fill="currentColor" />
        </div>
      </div>
      <div className="flex flex-col -space-y-1 hidden sm:flex">
        <span className="font-display font-black text-2xl tracking-tighter text-white uppercase italic">
          Brain<span className="text-fuchsia-500">Clash</span>
        </span>
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] ml-1">Arena Royale</span>
      </div>
    </div>
  );
}
