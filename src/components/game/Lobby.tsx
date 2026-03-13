import React from 'react';
import Logo from '../Logo';
import { Player, RoomState } from '../../types';

interface LobbyProps {
  room: RoomState;
  me: Player;
}

export default function Lobby({ room, me }: LobbyProps) {
  return (
    <div className="h-full bg-transparent text-white flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
      <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border-4 border-purple-500/30 animate-pulse overflow-hidden">
        {me.avatar ? (
          <img src={me.avatar} alt={me.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-3xl" style={{ color: me.color }}>{me.username.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <h2 className="text-2xl font-bold mb-2">Vous êtes dans le salon !</h2>
      {room.name && <h3 className="text-xl text-fuchsia-400 font-bold mb-4">{room.name}</h3>}
      {room.description && <p className="text-zinc-300 mb-4 max-w-md">{room.description}</p>}
      <p className="text-zinc-400">Regardez le stream, le quiz va bientôt commencer...</p>
    </div>
  );
}
