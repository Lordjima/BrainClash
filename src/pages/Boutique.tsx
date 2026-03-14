import React, { useState } from 'react';
import { Store, Sparkles, Coins } from 'lucide-react';
import { useData } from '../DataContext';
import * as LucideIcons from 'lucide-react';
import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';

export default function Boutique() {
  const { shopItems, chests, userProfile } = useData();
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Store;
    return <Icon className={size} />;
  };

  const handleBuy = async (itemId: string, price: number, type: 'item' | 'chest') => {
    try {
      setBuying(itemId);
      setError(null);
      setSuccess(null);
      // Assuming QuizService handles both
      await QuizService.buyItem(itemId, price);
      setSuccess(`Vous avez acheté ${itemId} !`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'achat');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBuying(null);
    }
  };

  return (
    <PageLayout maxWidth="max-w-7xl">
      <Toast message={error} type="error" />
      <Toast message={success} type="success" />

      <PageHeader
        title="Boutique"
        subtitle="Équipez-vous pour la victoire"
        actions={
          <>
            <Badge variant="amber" icon={<Coins />}>
              {userProfile?.coins || 0}
            </Badge>
            <Badge variant="fuchsia" icon={<Sparkles />}>
              {userProfile?.brainCoins || 0}
            </Badge>
          </>
        }
      />
      
      <div className="space-y-12">
        {/* Coffres */}
        <section>
          <h2 className="text-xl font-black uppercase italic text-white mb-6">Coffres Disponibles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {chests.map((chest) => (
              <Card key={chest.id} hoverable className="p-4 flex flex-col gap-3">
                <div className="aspect-square bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
                  {getIcon(chest.icon, "w-10 h-10 text-amber-500")}
                </div>
                <h3 className="font-black text-sm text-white">{chest.name}</h3>
                <Button size="sm" onClick={() => handleBuy(chest.id, chest.price, 'chest')} disabled={buying === chest.id} className="bg-amber-600 hover:bg-amber-500">
                  {chest.price} <Coins className="w-3 h-3 ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Items */}
        <section>
          <h2 className="text-xl font-black uppercase italic text-white mb-6">Objets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {shopItems.map((item) => (
              <Card key={item.id} hoverable className="p-4 flex flex-col gap-3">
                <div className="aspect-square bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
                  {getIcon(item.icon, "w-10 h-10 text-zinc-400")}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-black text-sm text-white">{item.name}</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">{item.description}</p>
                </div>
                <Button size="sm" onClick={() => handleBuy(item.id, item.price, 'item')} disabled={buying === item.id} className="bg-fuchsia-600 hover:bg-fuchsia-500">
                  {item.price} <Sparkles className="w-3 h-3 ml-1" />
                </Button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
