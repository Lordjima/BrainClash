import React from 'react';
import { Users, Trophy } from 'lucide-react';
import { RoomState } from '../../types';

interface HostPlayerListProps {
  room: RoomState;
}

export default function HostPlayerList({ room }: HostPlayerListProps) {
  const playersArray = Object.values(room.players);
  const sortedPlayers = [...playersArray].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col h-full">
      <div className="p-4 border-bottom border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-fuchsia-400" />
          <h2 className="font-bold">Joueurs</h2>
        </div>
        <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-400">
          {playersArray.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">Aucun joueur connecté</p>
          </div>
        ) : (
          sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                    alt={player.username}
                    className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700"
                    referrerPolicy="no-referrer"
                  />
                  {player.hasAnswered && room.status === 'active' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{player.username}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {player.score} pts
                  </div>
                </div>
              </div>
              {idx < 3 && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                  idx === 1 ? 'bg-zinc-400/20 text-zinc-300' :
                  'bg-orange-500/20 text-orange-500'
                }`}>
                  #{idx + 1}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
