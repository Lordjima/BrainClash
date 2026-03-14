import React from 'react';
import Logo from '../ui/Logo';
import { Player, RoomState } from '../../types';

interface LobbyProps {
  room: RoomState;
  me: Player;
}

export default function Lobby({ room, me }: LobbyProps) {
  return (
    <div className="relative bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 rounded-[2rem] p-10 shadow-2xl max-w-lg w-full flex flex-col items-center overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative w-28 h-28 rounded-3xl flex items-center justify-center mb-8 border-4 border-zinc-800/50 overflow-hidden shadow-2xl" style={{ borderColor: me.color }}>
        {me.avatar ? (
          <img src={me.avatar} alt={me.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-5xl font-black" style={{ color: me.color }}>{me.username.charAt(0).toUpperCase()}</span>
        )}
      </div>
      
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">Vous êtes prêt !</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Bienvenue dans le salon</p>
      </div>
      
      {room.name && <h3 className="text-xl font-bold text-fuchsia-400 mb-2">{room.name}</h3>}
      {room.description && <p className="text-zinc-400 mb-8 max-w-md text-sm leading-relaxed">{room.description}</p>}
      
      <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800/50 w-full flex flex-col items-center">
        <p className="text-zinc-400 font-medium text-sm">Regardez le stream, le quiz va bientôt commencer...</p>
        <div className="mt-5 flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
          <span className="text-fuchsia-400 font-black uppercase tracking-widest text-[10px]">En attente du lancement</span>
        </div>
      </div>
    </div>
  );
}
