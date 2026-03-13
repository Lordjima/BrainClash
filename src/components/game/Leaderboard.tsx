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
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Classement Provisoire</h3>
      <div className="space-y-2">
        {topPlayers.map((p, i) => (
          <div key={p.id} className={`flex items-center justify-between rounded-xl p-2 px-3 ${p.id === meId ? 'bg-fuchsia-900/20 border border-fuchsia-500/20' : 'bg-zinc-800/30'}`}>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-bold text-xs w-4">{i + 1}</span>
              <span className="font-medium text-sm truncate max-w-[100px]" style={{ color: p.color }}>{p.username}</span>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-300">{p.score} pts</span>
          </div>
        ))}
        {!isMeInTop3 && me && (
          <>
            <div className="text-center text-zinc-600 text-xs py-1">...</div>
            <div className="flex items-center justify-between bg-fuchsia-900/20 border border-fuchsia-500/20 rounded-xl p-2 px-3">
              <div className="flex items-center gap-3">
                <span className="text-fuchsia-400 font-bold text-xs w-4">{myRank}</span>
                <span className="font-medium text-sm text-fuchsia-100 truncate max-w-[100px]">{me.username}</span>
              </div>
              <span className="font-mono text-xs font-bold text-fuchsia-300">{me.score} pts</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
