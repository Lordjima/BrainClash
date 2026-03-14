import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Wallet, Package, Search } from 'lucide-react';
import { useData } from '../DataContext';
import * as LucideIcons from 'lucide-react';
import { QuizService } from '../services/QuizService';

export default function InventoryBag() {
  const { userProfile, shopItems } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewItem, setHasNewItem] = useState(false);

  useEffect(() => {
    if (userProfile?.inventory) {
      const lastItemCount = parseInt(localStorage.getItem('last_item_count') || '0');
      if (userProfile.inventory.length > lastItemCount) {
        setHasNewItem(true);
      }
    }
  }, [userProfile?.inventory]);

  const clearNotifications = () => {
    if (userProfile?.inventory) {
      localStorage.setItem('last_item_count', userProfile.inventory.length.toString());
      setHasNewItem(false);
    }
  };

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Package;
    return <Icon className={size} />;
  };

  if (!userProfile) return null;

  // Ensure we have 16 slots (4x4)
  const slots = Array(16).fill(null);
  userProfile.inventory?.forEach((itemId, index) => {
    if (index < 16) slots[index] = itemId;
  });

  const handleUseItem = async (itemId: string) => {
    // Logic to use item could be added here
    console.log('Using item:', itemId);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Bag Icon / Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) clearNotifications();
        }}
        className="w-16 h-16 bg-zinc-900/80 backdrop-blur-xl border-2 border-white/10 rounded-2xl flex items-center justify-center shadow-2xl group transition-all hover:border-fuchsia-500/50 relative"
      >
        <ShoppingBag className={`w-8 h-8 transition-colors ${isOpen ? 'text-fuchsia-500' : 'text-zinc-400 group-hover:text-fuchsia-500'}`} />
        {hasNewItem && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-600 rounded-full border-2 border-zinc-900 flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        )}
        <div className="absolute bottom-full mb-3 right-0 px-3 py-1.5 bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl">
          Mon Inventaire
        </div>
      </motion.button>

      {/* Bag Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="absolute bottom-20 right-0 w-88 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 shadow-lg shadow-fuchsia-500/10">
                  <ShoppingBag className="w-5 h-5 text-fuchsia-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-none mb-1.5">Équipement</span>
                  <span className="text-sm font-black uppercase italic text-white leading-none tracking-tight">Inventaire Tactique</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-zinc-500 hover:text-white group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
                {slots.map((itemId, i) => {
                  const item = itemId ? shopItems.find(si => si.id === itemId) : null;
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-2xl border flex items-center justify-center transition-all relative group ${
                        item 
                          ? 'bg-zinc-900/50 border-white/10 hover:border-fuchsia-500 hover:bg-fuchsia-500/10 cursor-pointer shadow-lg' 
                          : 'bg-zinc-950/50 border-white/5 opacity-30'
                      }`}
                      onClick={() => item && handleUseItem(itemId)}
                    >
                      {item ? (
                        <>
                          <div className={`w-full h-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                            item.type === 'attack' ? 'text-red-500' : item.type === 'defense' ? 'text-blue-500' : 'text-emerald-500'
                          }`}>
                            {getIcon(item.icon, "w-8 h-8")}
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 p-4 bg-zinc-950 border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl translate-y-2 group-hover:translate-y-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                                item.type === 'attack' ? 'text-red-500 bg-current' : item.type === 'defense' ? 'text-blue-500 bg-current' : 'text-emerald-500 bg-current'
                              }`} />
                              <div className="text-[11px] font-black text-white uppercase tracking-tight">{item.name}</div>
                            </div>
                            <div className="text-[9px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tighter">{item.description}</div>
                            <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
                              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Type: {item.type}</span>
                              <span className="text-[8px] font-black text-fuchsia-500 uppercase tracking-widest italic">Prêt</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-white/5 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <LucideIcons.Coins className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-sm font-black font-mono text-amber-500 tracking-tighter">{userProfile.coins?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-900 px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
                  {userProfile.inventory?.length || 0} <span className="text-zinc-700">/ 16</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
