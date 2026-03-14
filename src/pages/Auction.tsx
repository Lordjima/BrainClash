import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Tag, Search, Filter, User, ArrowRight, X, Package, Coins } from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useData } from '../DataContext';
import { AuctionItem } from '../types';
import * as LucideIcons from 'lucide-react';
import Navbar from '../components/Navbar';
import SpaceBackground from '../components/SpaceBackground';

export default function Auction() {
  const { userProfile, shopItems } = useData();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubAuctions = onSnapshot(collection(db, 'auctions'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuctionItem));
      setItems(data);
    });
    return () => unsubAuctions();
  }, []);

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || ShoppingBag;
    return <Icon className={size} />;
  };

  const filteredItems = items.filter(item => {
    const shopItem = shopItems.find(si => si.id === item.itemId);
    const name = shopItem?.name || item.itemId || '';
    const seller = item.seller || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || seller.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white overflow-hidden relative font-display">
      <SpaceBackground />
      <Navbar />
      <div className="h-full pt-20 px-6 md:px-12 pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Hôtel des Ventes</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-fuchsia-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const shopItem = shopItems.find(si => si.id === item.itemId);
              return (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -5 }}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 space-y-3"
                >
                  <div className="aspect-square bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800">
                    {shopItem ? getIcon(shopItem.icon, "w-12 h-12 text-zinc-400") : <ShoppingBag className="w-12 h-12 text-zinc-700" />}
                  </div>
                  <h3 className="font-black text-lg">{shopItem?.name || item.itemId}</h3>
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <span className="font-mono font-black text-amber-500">{item.price}</span>
                    <button className="p-2 bg-zinc-800 rounded-xl hover:bg-white hover:text-black transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
