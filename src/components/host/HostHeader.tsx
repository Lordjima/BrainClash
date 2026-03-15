import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { RoomState } from '../../types';
import { Button } from '../ui/Button';

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
        <Button
          as={Link}
          to={`/overlay/${room.id}`}
          target="_blank"
          variant="secondary"
          icon={<ExternalLink className="w-4 h-4" />}
        >
          Overlay OBS
        </Button>
        <Button
          onClick={onClose}
          variant="danger"
          icon={<X className="w-4 h-4" />}
        >
          Fermer le salon
        </Button>
      </div>
    </div>
  );
}
