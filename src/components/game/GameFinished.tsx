import React from 'react';
import { Trophy } from 'lucide-react';
import { Player, RoomState } from '../../types';

interface GameFinishedProps {
  room: RoomState;
  me: Player;
  onNavigateHome: () => void;
}

export default function GameFinished({ room, me, onNavigateHome }: GameFinishedProps) {
  const sortedPlayers = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);
  const rank = sortedPlayers.findIndex(p => p.id === me.id) + 1;

  return (
    <div className="h-full bg-transparent text-white flex flex-col items-center p-6 overflow-hidden">
      <Trophy className="w-16 h-16 text-yellow-500 mb-4 mt-8" />
      <h2 className="text-3xl font-bold mb-2">Quiz Terminé !</h2>
      <p className="text-xl text-fuchsia-400 font-mono mb-2">{me.score} points</p>
      <div className="flex items-center gap-2 mb-6 text-amber-500 font-black italic">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-zinc-950">C</div>
        +{Math.floor(me.score / 5)} Coins gagnés !
      </div>
      
      <div className="bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-800 mb-8 flex items-center gap-4">
        <div className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Votre position</div>
        <div className="text-2xl font-bold text-white">#{rank}</div>
      </div>

      <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden mb-8">
        <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
          <h3 className="font-bold text-center text-zinc-300 uppercase tracking-widest text-sm">Classement Final</h3>
        </div>
        <div className="divide-y divide-zinc-800/50 max-h-[40%] overflow-y-auto">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className={`flex items-center gap-4 p-4 ${player.id === me.id ? 'bg-fuchsia-900/20' : ''}`}>
              <div className="w-8 text-center font-bold text-zinc-500">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              {player.avatar ? (
                <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full bg-zinc-800" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold" style={{ color: player.color }}>
                  {player.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 font-medium truncate" style={{ color: player.color }}>
                {player.username}
              </div>
              <div className="font-mono font-bold text-zinc-300">
                {player.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onNavigateHome} 
        className="w-full max-w-md bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-colors mt-auto"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
