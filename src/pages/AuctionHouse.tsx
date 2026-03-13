import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, X, Box, Sparkles, Tag, Package, Coins, Search, Filter, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../lib/socket';
import { useData } from '../DataContext';
import { AuctionItem } from '../types';
import * as LucideIcons from 'lucide-react';

export default function AuctionHouse() {
  const { userProfile, shopItems } = useData();
  const [view, setView] = useState<'selection' | 'market' | 'shop'>('selection');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [listingItem, setListingItem] = useState<{ id: string, name: string } | null>(null);
  const [listingPrice, setListingPrice] = useState<number>(100);
  const [listingCurrency, setListingCurrency] = useState<'coins' | 'brainCoins'>('coins');

  // Loot Box State
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState('');
  const [boxType, setBoxType] = useState<'standard' | 'premium'>('standard');

  useEffect(() => {
    socket.emit('get_auction_items');
    socket.on('auction_items_list', (data) => {
      setItems(data);
    });

    socket.on('auction_list_success', () => {
      setListingItem(null);
    });

    socket.on('loot_box_result', (result) => {
      if (result.success) {
        setReward(result.item);
        setIsOpening(false);
      }
    });

    socket.on('error', (msg) => {
      setError(msg);
      setIsOpening(false);
    });

    return () => {
      socket.off('auction_items_list');
      socket.off('auction_list_success');
      socket.off('loot_box_result');
      socket.off('error');
    };
  }, []);

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Star;
    return <Icon className={size} />;
  };

  const handleListAuction = () => {
    if (!userProfile || !listingItem) return;
    socket.emit('list_auction_item', {
      username: userProfile.username,
      itemId: listingItem.id,
      price: listingPrice,
      currency: listingCurrency
    });
  };

  const handleOpenBox = (type: 'standard' | 'premium') => {
    if (!userProfile) return;
    setError('');
    setReward(null);
    setBoxType(type);
    setIsOpening(true);
    setTimeout(() => {
      socket.emit('open_loot_box', {
        username: userProfile.username,
        boxType: type
      });
    }, 2000);
  };

  const filteredItems = items.filter(item => {
    if (!item) return false;
    const shopItem = shopItems.find(si => si.id === item.itemId);
    const name = shopItem?.name || item.itemId || '';
    const seller = item.seller || '';
    const search = searchTerm || '';
    
    const nameMatch = name.toLowerCase().includes(search.toLowerCase());
    const sellerMatch = seller.toLowerCase().includes(search.toLowerCase());
    return nameMatch || sellerMatch;
  });

  return (
    <div className="h-full px-4 pb-4 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col space-y-4 py-2">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-fuchsia-500" />
            <h1 className="text-lg font-black uppercase tracking-tighter italic whitespace-nowrap">
              {view === 'selection' ? 'Marché & Boutique' : view === 'market' ? 'Hôtel des Ventes' : 'Boutique'}
            </h1>
          </div>

          {view !== 'selection' && (
            <button 
              onClick={() => setView('selection')}
              className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              ← Retour au choix
            </button>
          )}
        </div>

        {/* Main Area */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col gap-4 overflow-hidden h-full">
            {view === 'selection' ? (
              <div className="flex-1 flex items-center justify-center gap-8">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setView('market')}
                  className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-12 flex flex-col items-center gap-6 group"
                >
                  <Tag className="w-24 h-24 text-fuchsia-500" />
                  <span className="text-2xl font-black uppercase italic">Marché</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setView('shop')}
                  className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-12 flex flex-col items-center gap-6 group"
                >
                  <Box className="w-24 h-24 text-amber-500" />
                  <span className="text-2xl font-black uppercase italic">Boutique</span>
                </motion.button>
              </div>
            ) : view === 'market' ? (
              <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Rechercher un objet ou un vendeur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3 outline-none focus:border-fuchsia-500 transition-colors"
                    />
                  </div>
                  <button className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 flex items-center gap-2 font-bold hover:bg-zinc-800 transition-colors">
                    <Filter className="w-5 h-5" />
                    Filtres
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {filteredItems.length === 0 ? (
                    <div className="py-24 text-center space-y-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                      <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                        <Tag className="w-8 h-8 text-zinc-700" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-zinc-400">Aucun objet trouvé</h3>
                        <p className="text-zinc-600 max-w-xs mx-auto">Essayez une autre recherche ou soyez le premier à vendre !</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredItems.map((item) => {
                        const shopItem = shopItems.find(si => si.id === item.itemId);
                        return (
                          <motion.div 
                            key={item.id}
                            whileHover={{ y: -5 }}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 space-y-3 group"
                          >
                            <div className="aspect-square bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-fuchsia-500/50 transition-colors">
                              {shopItem ? getIcon(shopItem.icon, "w-12 h-12 text-zinc-400") : <ShoppingBag className="w-12 h-12 text-zinc-700" />}
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-black text-lg">{shopItem?.name || item.itemId}</h3>
                              <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase">
                                <User className="w-3 h-3" />
                                {item.seller}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                              <div className="flex items-center gap-2">
                                {item.currency === 'coins' ? (
                                  <div className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <div className="w-4 h-4 bg-fuchsia-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">B</div>
                                )}
                                <span className={`font-mono font-black ${item.currency === 'coins' ? 'text-amber-500' : 'text-fuchsia-400'}`}>
                                  {item.price}
                                </span>
                              </div>
                              <button 
                                onClick={() => setListingItem({ id: item.itemId, name: shopItems.find(si => si.id === item.itemId)?.name || item.itemId })}
                                className="p-2 bg-zinc-800 rounded-xl hover:bg-white hover:text-black transition-all"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] -mr-16 -mt-16" />
                    <div className="w-32 h-32 bg-zinc-950 rounded-3xl flex items-center justify-center border border-zinc-800 group-hover:border-amber-500/50 transition-colors">
                      <Box className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Coffre Standard</h3>
                      <p className="text-zinc-500 text-sm">Contient des objets communs et rares.</p>
                    </div>
                    <button 
                      onClick={() => handleOpenBox('standard')}
                      disabled={isOpening || (userProfile?.coins || 0) < 500}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-black py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                    >
                      <Coins className="w-5 h-5" />
                      OUVRIR (500)
                    </button>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[60px] -mr-16 -mt-16" />
                    <div className="w-32 h-32 bg-zinc-950 rounded-3xl flex items-center justify-center border border-zinc-800 group-hover:border-fuchsia-500/50 transition-colors">
                      <Sparkles className="w-16 h-16 text-fuchsia-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Coffre Premium</h3>
                      <p className="text-zinc-500 text-sm">Objets épiques et légendaires garantis.</p>
                    </div>
                    <button 
                      onClick={() => handleOpenBox('premium')}
                      disabled={isOpening || (userProfile?.brainCoins || 0) < 5}
                      className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                    >
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-fuchsia-600">B</div>
                      OUVRIR (5)
                    </button>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Listing Modal & Loot Box Overlays (keep as before) */}

      {/* Listing Modal */}
      <AnimatePresence>
        {listingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mettre en vente</h2>
                <button onClick={() => setListingItem(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">Objet sélectionné</div>
                    <div className="font-black">{listingItem.name}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Prix de vente</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={listingPrice}
                      onChange={(e) => setListingPrice(parseInt(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-xl font-mono font-bold outline-none focus:border-fuchsia-500 transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                      <button 
                        onClick={() => setListingCurrency('coins')}
                        className={`p-2 rounded-lg transition-all ${listingCurrency === 'coins' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setListingCurrency('brainCoins')}
                        className={`p-2 rounded-lg transition-all ${listingCurrency === 'brainCoins' ? 'bg-fuchsia-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                      >
                        <div className="w-4 h-4 bg-current rounded-full flex items-center justify-center text-[8px] font-black invert">B</div>
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleListAuction}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                  CONFIRMER LA MISE EN VENTE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loot Box Animation Overlays */}
      <AnimatePresence>
        {isOpening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          >
            <div className="text-center space-y-8">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Box className={`w-32 h-32 mx-auto ${boxType === 'standard' ? 'text-amber-500' : 'text-fuchsia-500'}`} />
              </motion.div>
              <h2 className="text-3xl font-black animate-pulse uppercase tracking-widest">Ouverture en cours...</h2>
            </div>
          </motion.div>
        )}

        {reward && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          >
            <div className="max-w-sm w-full p-8 text-center space-y-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-48 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-[40px] mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/50 relative"
              >
                <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse" />
                {getIcon(reward.icon, "w-24 h-24 text-white relative z-10")}
              </motion.div>

              <div className="space-y-2">
                <div className="text-fuchsia-400 font-black uppercase tracking-[0.3em] text-xs">Nouveau Butin !</div>
                <h2 className="text-4xl font-black tracking-tighter">{reward.name}</h2>
                <p className="text-zinc-400 font-medium">{reward.description}</p>
              </div>

              <button 
                onClick={() => setReward(null)}
                className="w-full bg-white text-black py-4 rounded-2xl font-black transition-all active:scale-95"
              >
                GÉNIAL !
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl">
          {error}
        </div>
      )}
    </div>
  );
}
