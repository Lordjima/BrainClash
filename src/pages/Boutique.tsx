import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Zap, Coins, CreditCard, Star, Gavel, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { WalletService } from '../services/WalletService';
import * as LucideIcons from 'lucide-react';
import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function Boutique() {
  const navigate = useNavigate();
  const { twitchUser, user: firebaseUser } = useAuth();
  const { wallet } = useUser();
  const { items: shopItems, chests } = useCatalog();
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(5);

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Store;
    return <Icon className={size} />;
  };

  const handleBuy = async (itemId: string, price: number, type: 'item' | 'chest') => {
    try {
      setBuying(itemId);
      setError(null);
      setSuccess(null);
      
      if (type === 'chest') {
        const wonItemId = await QuizService.buyChest(itemId);
        const wonItem = shopItems.find(i => i.id === wonItemId);
        setSuccess(`Coffre ouvert ! Vous avez obtenu : ${wonItem?.name || wonItemId}`);
      } else {
        await QuizService.buyItem(itemId);
        const item = shopItems.find(i => i.id === itemId);
        setSuccess(`Achat réussi : ${item?.name || itemId}`);
      }
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'achat');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBuying(null);
    }
  };

  const handleBuyBrainCoins = () => {
    setShowPayPal(true);
  };

  const handlePurchaseSuccess = async () => {
    if (firebaseUser) {
      try {
        await WalletService.updateBalance(
          firebaseUser.uid,
          purchaseAmount,
          'brainCoins',
          'shop_purchase',
          'Achat de BrainCoins via PayPal'
        );
        setShowPayPal(false);
        setSuccess(`Félicitations ! Vous avez reçu ${purchaseAmount} BrainCoins.`);
        setTimeout(() => setSuccess(null), 5000);
      } catch (error) {
        console.error('Error updating balance:', error);
        setError('Une erreur est survenue lors de l\'achat.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  return (
    <PageLayout>
      <Toast message={error} type="error" />
      <Toast message={success} type="success" />

      <PageHeader
        title="Boutique"
        subtitle="Équipez-vous pour la victoire"
        icon={<Store className="w-8 h-8 text-fuchsia-500" />}
        actions={
          twitchUser ? (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/auction')}
                className="border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white gap-2"
              >
                <Gavel className="w-4 h-4" />
                <span className="hidden sm:inline">Hôtel des Ventes</span>
              </Button>
            </div>
          ) : (
            <div className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Connectez-vous pour voir vos points</div>
          )
        }
      />
      
      <div className="space-y-16">
        {/* Buy BrainCoins Section */}
        <section className="bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20 p-8 rounded-[2rem] border border-fuchsia-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-3 text-fuchsia-400">
                <CreditCard className="w-8 h-8" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Banque de BrainCoins</h2>
              </div>
              <p className="text-zinc-400 font-medium">
                Obtenez des BrainCoins pour débloquer du contenu exclusif, des coffres légendaires et des objets surpuissants.
              </p>
              {wallet && (
                <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2 text-fuchsia-400">
                    <Zap className="w-5 h-5" />
                    <span className="text-xl font-black">{wallet.brainCoins || 0}</span>
                  </div>
                  <div className="w-px h-8 bg-zinc-800" />
                  <div className="flex items-center gap-2 text-amber-500">
                    <Coins className="w-5 h-5" />
                    <span className="text-xl font-black">{wallet.coins || 0}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
              {[
                { amount: 10, price: "1.00€", label: "Pack Découverte" },
                { amount: 50, price: "5.00€", label: "Pack Avantage", popular: true },
                { amount: 100, price: "10.00€", label: "Pack Légende" }
              ].map((pack) => (
                <Card key={pack.amount} className={`p-6 flex flex-col items-center gap-4 relative ${pack.popular ? 'border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.1)]' : ''}`}>
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fuchsia-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Populaire
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-fuchsia-400">
                    <Zap className="w-5 h-5" />
                    <span className="text-2xl font-black">{pack.amount}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-zinc-500 uppercase">{pack.label}</div>
                    <div className="text-lg font-black text-white">{pack.price}</div>
                  </div>
                  <Button size="sm" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500" onClick={() => {
                    setPurchaseAmount(pack.amount);
                    setShowPayPal(true);
                  }}>
                    Acheter
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coffres */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">Coffres de Butin</h2>
            <div className="h-px flex-1 bg-zinc-800 mx-8 hidden md:block"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {chests.map((chest) => (
              <Card key={chest.id} hoverable className="p-6 flex flex-col gap-4 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${
                  chest.rarity === 'legendary' ? 'bg-amber-500' : 
                  chest.rarity === 'epic' ? 'bg-fuchsia-500' : 
                  chest.rarity === 'rare' ? 'bg-blue-500' : 'bg-zinc-500'
                }`}></div>
                
                <div className="aspect-square bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-colors relative z-10">
                  {getIcon(chest.icon, `w-16 h-16 ${
                    chest.rarity === 'legendary' ? 'text-amber-500' : 
                    chest.rarity === 'epic' ? 'text-fuchsia-500' : 
                    chest.rarity === 'rare' ? 'text-blue-500' : 'text-zinc-500'
                  }`)}
                </div>
                
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg text-white tracking-tight">{chest.name}</h3>
                    <Badge 
                      variant={
                        chest.rarity === 'legendary' ? 'amber' : 
                        chest.rarity === 'epic' ? 'fuchsia' : 
                        chest.rarity === 'rare' ? 'blue' : 'zinc'
                      }
                      size="sm"
                    >
                      {chest.rarity}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">{chest.description}</p>
                  
                  <div className="pt-2 flex flex-wrap gap-1">
                    {chest.possibleItems.slice(0, 3).map(itemId => {
                      const item = shopItems.find(i => i.id === itemId);
                      return (
                        <div key={itemId} className="bg-zinc-900 px-2 py-1 rounded text-[9px] font-bold text-zinc-400 border border-zinc-800">
                          {item?.name || itemId}
                        </div>
                      );
                    })}
                    {chest.possibleItems.length > 3 && (
                      <div className="bg-zinc-900 px-2 py-1 rounded text-[9px] font-bold text-zinc-500 border border-zinc-800">
                        +{chest.possibleItems.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={() => handleBuy(chest.id, chest.price, 'chest')} 
                  disabled={buying === chest.id} 
                  className={`w-full h-12 text-base font-black ${
                    chest.currency === 'brainCoins' ? "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-500/20" : "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20"
                  }`}
                >
                  {chest.price} {chest.currency === 'brainCoins' ? <Zap className="w-4 h-4 ml-2" /> : <Coins className="w-4 h-4 ml-2" />}
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Items */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">Équipement & Sorts</h2>
            <div className="h-px flex-1 bg-zinc-800 mx-8 hidden md:block"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {shopItems.filter(item => !item.chestOnly).map((item) => (
              <Card key={item.id} hoverable className="p-4 flex flex-col gap-4 relative group">
                {item.isExclusive && (
                  <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white p-1.5 rounded-lg shadow-lg rotate-12">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}
                
                <div className={`aspect-square bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-fuchsia-500/30 transition-colors relative overflow-hidden`}>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl ${
                    item.type === 'attack' ? 'bg-red-500' : 
                    item.type === 'defense' ? 'bg-blue-500' : 
                    item.type === 'bonus' ? 'bg-green-500' : 
                    item.type === 'spell' ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`} />
                  {getIcon(item.icon, `w-10 h-10 relative z-10 ${
                    item.type === 'attack' ? 'text-red-500' : 
                    item.type === 'defense' ? 'text-blue-500' : 
                    item.type === 'bonus' ? 'text-green-500' : 
                    item.type === 'spell' ? 'text-yellow-500' : 
                    item.isExclusive ? 'text-fuchsia-400' : 'text-zinc-400'
                  }`)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-black text-sm tracking-tight truncate ${item.isExclusive ? 'text-fuchsia-400' : 'text-white'}`}>
                      {item.name}
                    </h3>
                    <Badge 
                      variant={
                        item.type === 'attack' ? 'red' : 
                        item.type === 'defense' ? 'blue' : 
                        item.type === 'bonus' ? 'green' : 
                        item.type === 'spell' ? 'yellow' : 'zinc'
                      }
                      size="sm"
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase leading-tight line-clamp-2">{item.description}</p>
                </div>

                <Button 
                  size="sm" 
                  onClick={() => handleBuy(item.id, item.price, 'item')} 
                  disabled={buying === item.id} 
                  className={`w-full ${item.currency === 'brainCoins' ? "bg-fuchsia-600 hover:bg-fuchsia-500" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
                >
                  {item.price} {item.currency === 'brainCoins' ? <Zap className="w-3 h-3 ml-1" /> : <Coins className="w-3 h-3 ml-1" />}
                </Button>
              </Card>
            ))}
          </div>
          <div className="mt-6 p-4 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800 text-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Certains objets légendaires ne sont disponibles que dans les coffres !
            </p>
          </div>
        </section>
      </div>

      {/* PayPal Modal */}
      <Modal isOpen={showPayPal} onClose={() => setShowPayPal(false)} title="Acheter des BrainCoins" maxWidth="max-w-md">
        <div className="space-y-6 relative">
          <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 text-center space-y-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Taux de conversion</div>
            <div className="text-3xl font-black text-white">1 <span className="text-fuchsia-500">B</span> = 1.00 €</div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Quantité</label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => setPurchaseAmount(amount)}
                  className={`py-3 rounded-xl font-black transition-all ${
                    purchaseAmount === amount 
                      ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' 
                      : 'bg-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {amount} B
                </button>
              ))}
              <div className="bg-zinc-800 rounded-xl flex items-center px-3">
                <input 
                  type="number" 
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-transparent text-center font-black outline-none text-white"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-between">
            <div className="text-sm font-bold text-zinc-400">Total à payer</div>
            <div className="text-2xl font-black text-blue-400">{purchaseAmount.toFixed(2)} €</div>
          </div>

          {/* Mock PayPal Button */}
          <button 
            onClick={handlePurchaseSuccess}
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
          >
            <div className="flex items-center font-serif italic font-bold text-xl">
              <span className="text-white">Pay</span>
              <span className="text-[#009cde]">Pal</span>
            </div>
          </button>
          
          <p className="text-[10px] text-zinc-600 text-center font-medium">
            Paiement sécurisé via PayPal. Les BrainCoins seront ajoutés instantanément à votre compte.
          </p>
        </div>
      </Modal>
    </PageLayout>
  );
}
