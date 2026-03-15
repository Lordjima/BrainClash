import React from 'react';
import { RoomParticipant } from '../../types';

interface PlayerStatusProps {
  players: RoomParticipant[];
}

export default function PlayerStatus({ players }: PlayerStatusProps) {
  return (
    <div className="flex flex-col flex-1">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
        <span>Statut des joueurs</span>
        <span className="text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded-full">
          {players.filter(p => p.hasAnswered).length} / {players.length}
        </span>
      </h3>
      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
        {players.map(p => (
          <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-bold border-2 transition-all ${p.hasAnswered ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
            {p.avatar ? (
              <img src={p.avatar} alt={p.username} className="w-6 h-6 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-800 text-[10px]" style={{ color: p.color }}>
                {p.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate flex-1">{p.username}</span>
            {p.hasAnswered && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
