import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { RoomState } from '../../types';

interface HostHeaderProps {
  room: RoomState;
  onClose: () => void;
}

export default function HostHeader({ room, onClose }: HostHeaderProps) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">
            {room.name ? `Code du salon - ${room.name}` : 'Code du salon'}
          </h1>
          <div className="text-3xl font-mono font-bold text-fuchsia-400 tracking-widest">
            {room.id}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Link
          to={`/overlay/${room.id}`}
          target="_blank"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" /> Overlay OBS
        </Link>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          Fermer le salon
        </button>
      </div>
    </div>
  );
}
