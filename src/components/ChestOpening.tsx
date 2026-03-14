import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Sparkles, Trophy, Star, Zap, X } from 'lucide-react';
import { Chest, ShopItem } from '../types';
import * as LucideIcons from 'lucide-react';

interface ChestOpeningProps {
  chest: Chest;
  onClose: () => void;
  onReward: (item: ShopItem) => void;
  allShopItems: ShopItem[];
}

export default function ChestOpening({ chest, onClose, onReward, allShopItems }: ChestOpeningProps) {
  const [phase, setPhase] = useState<'idle' | 'opening' | 'reward'>('idle');
  const [reward, setReward] = useState<ShopItem | null>(null);

  const getIcon = (iconName: string, className: string = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Trophy;
    return <Icon className={className} />;
  };

  const handleOpen = () => {
    if (phase !== 'idle') return;
    setPhase('opening');

    // Logic for reward based on chest rarity
    setTimeout(() => {
      const possibleItems = allShopItems.filter(item => chest.possibleItems.includes(item.id.toString()));
      
      // If no items found, fallback to any item
      const itemsToPickFrom = possibleItems.length > 0 ? possibleItems : allShopItems;
      
      // Random pick
      const randomItem = itemsToPickFrom[Math.floor(Math.random() * itemsToPickFrom.length)];
      
      setReward(randomItem);
      setPhase('reward');
      onReward(randomItem);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className={`w-48 h-48 mx-auto rounded-3xl flex items-center justify-center shadow-2xl ${
                  chest.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-600 shadow-yellow-500/20' :
                  chest.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-purple-500/20' :
                  chest.rarity === 'rare' ? 'bg-gradient-to-br from-blue-500 to-indigo-700 shadow-blue-500/20' :
                  'bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-zinc-500/20'
                }`}
              >
                {getIcon(chest.icon, "w-24 h-24 text-white")}
              </motion.div>
              <div className="absolute -inset-4 bg-white/10 blur-3xl rounded-full -z-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter uppercase">{chest.name}</h2>
              <p className="text-zinc-500 font-medium">{chest.description}</p>
            </div>

            <button
              onClick={handleOpen}
              className="px-12 py-4 bg-white text-black font-black text-xl rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              OUVRIR LE COFFRE
            </button>
          </motion.div>
        )}

        {phase === 'opening' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-12"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className={`w-48 h-48 rounded-3xl flex items-center justify-center shadow-2xl ${
                  chest.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-600' :
                  chest.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-700' :
                  chest.rarity === 'rare' ? 'bg-gradient-to-br from-blue-500 to-indigo-700' :
                  'bg-gradient-to-br from-zinc-700 to-zinc-900'
                }`}
              >
                {getIcon(chest.icon, "w-24 h-24 text-white")}
              </motion.div>
              
              {/* Particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                  className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
            <h2 className="text-3xl font-black tracking-widest animate-pulse">OUVERTURE EN COURS...</h2>
          </motion.div>
        )}

        {phase === 'reward' && reward && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8 max-w-md w-full p-8"
          >
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative"
            >
              <div className="absolute -inset-24 bg-purple-600/20 blur-[100px] rounded-full -z-10 animate-pulse" />
              <div className="w-64 h-64 mx-auto bg-zinc-900 border-4 border-purple-500 rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                <div className="p-6 bg-purple-500/10 rounded-3xl">
                  {getIcon(reward.icon, "w-24 h-24 text-purple-500")}
                </div>
                <div className="px-4 py-1 bg-purple-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                  {reward.type}
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-zinc-500 font-black uppercase tracking-widest text-sm">VOUS AVEZ OBTENU</h3>
                <h2 className="text-5xl font-black tracking-tighter text-white">{reward.name}</h2>
                <p className="text-zinc-400 mt-4 text-lg">{reward.description}</p>
              </motion.div>
            </div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={onClose}
              className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-2xl transition-all shadow-2xl active:scale-95"
            >
              CONTINUER
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
