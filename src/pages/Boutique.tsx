import React from 'react';
import { motion } from 'motion/react';
import { Store, Sparkles, Box, Coins, Package } from 'lucide-react';
import { useData } from '../DataContext';
import Navbar from '../components/Navbar';
import SpaceBackground from '../components/SpaceBackground';
import * as LucideIcons from 'lucide-react';

export default function Boutique() {
  const { shopItems, userProfile } = useData();

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Store;
    return <Icon className={size} />;
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden relative font-display">
      <SpaceBackground />
      <Navbar />
      <div className="h-full pt-20 px-6 md:px-12 pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Boutique</h1>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {shopItems.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -5 }}
                className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 space-y-3"
              >
                <div className="aspect-square bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800">
                  {getIcon(item.icon, "w-12 h-12 text-zinc-400")}
                </div>
                <h3 className="font-black text-lg">{item.name}</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase">{item.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-mono font-black text-amber-500">{item.price}</span>
                  </div>
                  <button className="px-4 py-2 bg-fuchsia-600 rounded-xl font-black text-xs uppercase hover:bg-fuchsia-500 transition-all">
                    Acheter
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
