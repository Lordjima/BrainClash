import React from 'react';
import Logo from '../ui/Logo';
import { Player, RoomState } from '../../types';

interface LobbyProps {
  room: RoomState;
  me: Player;
}

export default function Lobby({ room, me }: LobbyProps) {
  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="absolute top-8 left-8">
        <Logo className="w-12 h-12" />
      </div>
      
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-10 shadow-2xl max-w-lg w-full flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 border-4 border-fuchsia-500/20 overflow-hidden shadow-xl shadow-fuchsia-500/10" style={{ borderColor: me.color }}>
          {me.avatar ? (
            <img src={me.avatar} alt={me.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-4xl font-black" style={{ color: me.color }}>{me.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Vous êtes prêt !</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">Bienvenue dans le salon</p>
        
        {room.name && <h3 className="text-xl font-bold text-fuchsia-400 mb-2">{room.name}</h3>}
        {room.description && <p className="text-zinc-400 mb-8 max-w-md">{room.description}</p>}
        
        <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 w-full">
          <p className="text-zinc-400 font-medium">Regardez le stream, le quiz va bientôt commencer...</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
            <span className="text-fuchsia-500 font-black uppercase tracking-widest text-[10px]">En attente du lancement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
