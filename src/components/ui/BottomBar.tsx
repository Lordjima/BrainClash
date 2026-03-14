import React, { useState } from 'react';
import { Menu, Backpack } from 'lucide-react';
import { Button } from './Button';
import MenuModal from '../modals/Menu';
import InventoryModal from '../modals/Inventory';

export function BottomBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  return (
    <>
      <div className="h-20 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-6 shrink-0">
        <Button variant="ghost" onClick={() => setIsMenuOpen(true)} className="gap-2">
          <Menu className="w-5 h-5" />
          Menu
        </Button>
        <Button variant="ghost" onClick={() => setIsInventoryOpen(true)} className="gap-2">
          <Backpack className="w-5 h-5" />
          Inventaire
        </Button>
      </div>
      <MenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <InventoryModal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
    </>
  );
}
