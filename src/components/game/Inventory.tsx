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
      default: return <PackageOpen className="w-5 h-5" />;
    }
  };

  if (!inventory || inventory.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-3 mt-4">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Inventaire</h3>
      <div className="grid grid-cols-2 gap-2">
        {inventory.map((itemId, index) => (
          <button
            key={`${itemId}-${index}`}
            onClick={() => onUseItem(itemId)}
            className="flex flex-col items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors gap-2 border border-zinc-700"
            title={`Utiliser ${itemId}`}
          >
            {getIcon(itemId)}
            <span className="text-xs font-medium capitalize truncate w-full text-center">{itemId}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
