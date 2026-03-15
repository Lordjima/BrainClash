import React from 'react';
import { EyeOff, Zap, RefreshCcw, Shield, PackageOpen } from 'lucide-react';

interface InventoryProps {
  inventory: string[];
  onUseItem: (itemId: string) => void;
}

export default function Inventory({ inventory, onUseItem }: InventoryProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'fumigene': return <EyeOff className="w-5 h-5" />;
      case 'seisme': return <Zap className="w-5 h-5" />;
      case 'inversion': return <RefreshCcw className="w-5 h-5" />;
      case 'bouclier': return <Shield className="w-5 h-5" />;
      case 'gel': return <Zap className="w-5 h-5 text-blue-300" />;
      default: return <PackageOpen className="w-5 h-5" />;
    }
  };

  if (!inventory || inventory.length === 0) return null;

  return (
    <div className="flex flex-col">
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Inventaire</h3>
      <div className="grid grid-cols-2 gap-3">
        {inventory.map((itemId, index) => (
          <button
            key={`${itemId}-${index}`}
            onClick={() => onUseItem(itemId)}
            className="flex flex-col items-center justify-center p-4 bg-zinc-900/50 hover:bg-fuchsia-500/10 rounded-2xl transition-all gap-3 border-2 border-zinc-800 hover:border-fuchsia-500/50 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)] group"
            title={`Utiliser ${itemId}`}
          >
            <div className="text-zinc-400 group-hover:text-fuchsia-400 transition-colors">
              {getIcon(itemId)}
            </div>
            <span className="text-xs font-bold capitalize truncate w-full text-center text-zinc-300 group-hover:text-white transition-colors">{itemId}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
