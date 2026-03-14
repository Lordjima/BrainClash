import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Package, Zap, Shield, Heart, Info, Star, Trash2, Play, Coins } from 'lucide-react';
import { useData } from '../../DataContext';
import * as LucideIcons from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
  const { userProfile, shopItems } = useData();
  const [selectedItem, setSelectedItem] = React.useState<any>(null);

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Package;
    return <Icon className={size} />;
  };

  if (!userProfile) return null;

  const inventoryItems = (userProfile.inventory || []).map(id => shopItems.find(item => item.id === id)).filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-5xl h-[90vh] bg-zinc-900 border border-zinc-800 rounded-[40px] flex flex-col overflow-hidden relative shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center border border-fuchsia-500/20">
                  <ShoppingBag className="w-6 h-6 text-fuchsia-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Mon Inventaire</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Gérez votre arsenal tactique</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-zinc-800 rounded-2xl transition-colors group"
              >
                <X className="w-6 h-6 text-zinc-500 group-hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Items Grid */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                {inventoryItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {inventoryItems.map((item, idx) => (
                      <motion.div
                        key={`${item.id}-${idx}`}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedItem(item)}
                        className={`aspect-square rounded-3xl bg-zinc-950/50 border-2 p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group ${
                          selectedItem?.id === item.id
                            ? 'border-fuchsia-500 bg-fuchsia-500/10'
                            : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          item.type === 'attack' ? 'bg-red-500/10 text-red-500' : item.type === 'defense' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {getIcon(item.icon, "w-6 h-6")}
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-black uppercase tracking-tight text-white line-clamp-1">{item.name}</div>
                          <div className="text-[8px] font-black uppercase tracking-widest opacity-50 mt-1">{item.type}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center border border-white/5">
                      <Package className="w-10 h-10 text-zinc-800" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase italic text-white">Arsenal Vide</h3>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Visitez la boutique pour vous équiper</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Item Details Sidebar */}
              <AnimatePresence>
                {selectedItem && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="w-full md:w-80 bg-zinc-950/50 border-l border-zinc-800 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar"
                  >
                    <div className="text-center space-y-6">
                      <div className={`w-32 h-32 mx-auto rounded-[40px] flex items-center justify-center shadow-2xl relative ${
                        selectedItem.type === 'attack' ? 'bg-red-500/10 text-red-500' : selectedItem.type === 'defense' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {getIcon(selectedItem.icon, "w-16 h-16")}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedItem.name}</h3>
                        <div className="flex items-center justify-center gap-1 mt-3">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i <= 4 ? 'text-fuchsia-500 fill-fuchsia-500' : 'text-zinc-800'}`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Description</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-bold leading-relaxed uppercase tracking-tighter">
                          {selectedItem.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Valeur</span>
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="text-lg font-black font-mono text-white">{selectedItem.price}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Type</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter">{selectedItem.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 space-y-3">
                      <button className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Play className="w-4 h-4 fill-current" />
                        ÉQUIPER
                      </button>
                      <button className="w-full bg-zinc-800 text-zinc-500 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20">
                        <Trash2 className="w-4 h-4" />
                        DÉTRUIRE
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
