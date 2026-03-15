import React, { useState } from 'react';
import { Menu, Backpack, Coins, Zap } from 'lucide-react';
import { Button } from './Button';
import MenuModal from '../modals/Menu';
import InventoryModal from '../modals/Inventory';
import { useUser } from '../../context/UserContext';

export function BottomBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const { wallet } = useUser();

  return (
    <>
      <div className="h-20 bg-transparent flex items-center justify-between px-6 shrink-0">
        <Button variant="ghost" onClick={() => setIsMenuOpen(true)} className="p-3 rounded-full hover:bg-zinc-800/50">
          <Menu className="w-6 h-6" />
        </Button>

        {wallet && (
          <div className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-black font-mono text-amber-500">{wallet.coins.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-fuchsia-500" />
              <span className="text-sm font-black font-mono text-fuchsia-400">{wallet.brainCoins.toLocaleString()}</span>
            </div>
          </div>
        )}

        <Button variant="ghost" onClick={() => setIsInventoryOpen(true)} className="p-3 rounded-full hover:bg-zinc-800/50">
          <Backpack className="w-6 h-6" />
        </Button>
      </div>
      <MenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <InventoryModal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
    </>
  );
}
