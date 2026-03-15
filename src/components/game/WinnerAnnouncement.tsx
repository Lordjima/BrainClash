import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Crown } from 'lucide-react';
import { Player, RoomState } from '../../types';

interface WinnerAnnouncementProps {
  room: RoomState;
  onFinished: () => void;
}

export default function WinnerAnnouncement({ room, onFinished }: WinnerAnnouncementProps) {
  const sortedPlayers = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  useEffect(() => {
    const timer = setTimeout(onFinished, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen w-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10 }}
      >
        <Crown className="w-24 h-24 text-yellow-500 mb-6" />
      </motion.div>
      
      <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">
        Le Gagnant est...
      </h1>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-6xl font-black text-fuchsia-500 uppercase italic tracking-tighter mb-8"
      >
        {winner?.username || 'Inconnu'}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-2xl font-mono text-zinc-400"
      >
        Avec {winner?.score || 0} points !
      </motion.div>
    </motion.div>
  );
}
