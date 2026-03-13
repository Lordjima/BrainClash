import React from 'react';
import { Player } from '../../types';

interface PlayerStatusProps {
  players: Player[];
}

export default function PlayerStatus({ players }: PlayerStatusProps) {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
        <span>Statut des joueurs</span>
        <span className="text-xs bg-zinc-800 px-2 py-1 rounded-md text-zinc-300">
          {players.filter(p => p.hasAnswered).length} / {players.length}
        </span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {players.map(p => (
          <div key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium border ${p.hasAnswered ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'}`}>
            {p.avatar ? (
              <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-zinc-800" style={{ color: p.color }}>
                {p.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[80px]">{p.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
