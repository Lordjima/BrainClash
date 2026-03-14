import React from 'react';
import { Info, Zap, TrendingUp, Coins, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Rules() {
  return (
    <PageLayout maxWidth="max-w-7xl">
      <PageHeader
        title="RÈGLES DU JEU"
        subtitle="Tout ce que tu dois savoir pour dominer l'arène."
        icon={<Info className="w-8 h-8 text-purple-500" />}
      />

      <Card className="p-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Points</h3>
                <p className="text-zinc-400 text-[10px]">Rapide + Juste = 1000 pts max</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">XP</h3>
                <p className="text-zinc-400 text-[10px]">Parties = Niveau + Badges</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Monnaie</h3>
                <p className="text-zinc-400 text-[10px]">Coins (Jeu) + BrainCoins (Rare)</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Coffres</h3>
                <p className="text-zinc-400 text-[10px]">Objets aléatoires à revendre</p>
              </div>
            </div>
          </div>

          <Link to="/">
            <Button className="w-full mt-8 py-4 text-lg" variant="primary" size="lg">
              J'AI COMPRIS !
            </Button>
          </Link>
        </div>
      </Card>
    </PageLayout>
  );
}
