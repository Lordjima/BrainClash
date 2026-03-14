import React from 'react';
import { Player } from '../../types';

interface LeaderboardProps {
  players: Player[];
  meId: string;
  myRank: number;
}

export default function Leaderboard({ players, meId, myRank }: LeaderboardProps) {
  const topPlayers = players.slice(0, 3);
  const isMeInTop3 = myRank <= 3;
  const me = players.find(p => p.id === meId);

  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Classement</h3>
      <div className="flex flex-col gap-3">
        {topPlayers.map((p, i) => (
          <div key={p.id} className={`flex items-center justify-between rounded-2xl p-3 border-2 ${p.id === meId ? 'bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.1)]' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div className="flex items-center gap-4">
              <span className={`font-black text-lg w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>{i + 1}</span>
              <span className="font-bold text-base truncate max-w-[120px]" style={{ color: p.color }}>{p.username}</span>
            </div>
            <span className="font-mono text-sm font-black text-fuchsia-400">{p.score}</span>
          </div>
        ))}
        {!isMeInTop3 && me && (
          <>
            <div className="text-center text-zinc-600 font-black tracking-widest py-1">...</div>
            <div className="flex items-center justify-between bg-fuchsia-500/10 border-2 border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.1)] rounded-2xl p-3">
              <div className="flex items-center gap-4">
                <span className="text-fuchsia-500 font-black text-lg w-6 text-center">{myRank}</span>
                <span className="font-bold text-base text-white truncate max-w-[120px]">{me.username}</span>
              </div>
              <span className="font-mono text-sm font-black text-fuchsia-400">{me.score}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
