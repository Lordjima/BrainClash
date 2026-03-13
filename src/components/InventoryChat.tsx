import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Tag, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../DataContext';
import * as LucideIcons from 'lucide-react';

export default function InventoryChat({ onSell }: { onSell: (itemId: string, name: string) => void }) {
  const { userProfile, shopItems } = useData();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (iconName: string, size = "w-5 h-5") => {
    const Icon = (LucideIcons as any)[iconName] || Package;
    return <Icon className={size} />;
  };

  if (!userProfile) return null;

  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-[100] w-80 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div 
        className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">
            Inventaire
          </h2>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {userProfile.inventory && userProfile.inventory.length > 0 ? (
                userProfile.inventory.map((itemId, idx) => {
                  const item = shopItems.find(si => si.id === itemId);
                  return (
                    <div 
                      key={`${itemId}-${idx}`}
                      className="bg-zinc-800/50 rounded-2xl p-3 flex items-center gap-3 border border-zinc-700/50"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item?.type === 'attack' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {item ? getIcon(item.icon) : <Package className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate text-zinc-200">{item?.name || itemId}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{item?.type || 'Objet'}</div>
                      </div>
                      <button 
                        onClick={() => onSell(itemId, item?.name || itemId)}
                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-lg transition-all"
                        title="Vendre"
                      >
                        <Tag className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-zinc-600 text-xs italic">
                  Votre inventaire est vide...
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                {userProfile.inventory?.length || 0} objets au total
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
