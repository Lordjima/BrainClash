import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Tag, Search, Filter, User, ArrowRight, X, Package, Coins, Gavel } from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { AuctionItem } from '../types';
import * as LucideIcons from 'lucide-react';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Auction() {
  const { wallet } = useUser();
  const { items: shopItems } = useCatalog();
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
    <PageLayout>
      <PageHeader
        title="Hôtel des Ventes"
        subtitle="Le marché noir des cerveaux"
        icon={<Gavel className="w-8 h-8 text-amber-500" />}
        actions={
          <Badge variant="amber" icon={<Coins />}>
            {wallet?.coins || 0}
          </Badge>
        }
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-fuchsia-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher un objet ou un vendeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-14 pr-6 py-4 outline-none focus:border-fuchsia-500/50 transition-all text-white font-medium placeholder:text-zinc-700"
            />
          </div>
        </div>
        <Button variant="secondary" className="p-4">
          <Filter className="w-6 h-6 text-zinc-400" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const shopItem = shopItems.find(si => si.id === item.itemId);
          return (
            <Card key={item.id} hoverable className="flex flex-col gap-4 group">
              <div className="aspect-square bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-fuchsia-500/20 transition-colors relative overflow-hidden">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl ${
                  shopItem?.type === 'attack' ? 'bg-red-500' : 
                  shopItem?.type === 'defense' ? 'bg-blue-500' : 
                  shopItem?.type === 'bonus' ? 'bg-green-500' : 
                  shopItem?.type === 'spell' ? 'bg-yellow-500' : 'bg-fuchsia-600'
                }`} />
                {shopItem ? getIcon(shopItem.icon, `w-16 h-16 relative z-10 transition-all duration-500 group-hover:scale-110 ${
                  shopItem.type === 'attack' ? 'text-red-500' : 
                  shopItem.type === 'defense' ? 'text-blue-500' : 
                  shopItem.type === 'bonus' ? 'text-green-500' : 
                  shopItem.type === 'spell' ? 'text-yellow-500' : 'text-zinc-400 group-hover:text-fuchsia-400'
                }`) : <ShoppingBag className="w-16 h-16 text-zinc-700" />}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl text-white tracking-tight">{shopItem?.name || item.itemId}</h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                    <User className="w-3 h-3 text-zinc-500" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter truncate max-w-[60px]">{item.seller}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      shopItem?.type === 'attack' ? 'red' : 
                      shopItem?.type === 'defense' ? 'blue' : 
                      shopItem?.type === 'bonus' ? 'green' : 
                      shopItem?.type === 'spell' ? 'yellow' : 'zinc'
                    }
                    size="sm"
                  >
                    {shopItem?.type || 'Inconnu'}
                  </Badge>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">Objet de collection rare</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="font-mono font-black text-lg text-amber-500">{item.price}</span>
                </div>
                <Button variant="primary" size="sm" className="gap-2">
                  Enchérir
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}
