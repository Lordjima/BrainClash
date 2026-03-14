import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Coins, 
  Zap, 
  Star, 
  TrendingUp, 
  ChevronLeft,
  Search,
  Medal,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../DataContext';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

type RankingType = 'score' | 'coins' | 'brainCoins' | 'level';

export default function Leaderboard() {
  const { leaderboard } = useData();
  const [activeTab, setActiveTab] = useState<RankingType>('score');
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'score', label: 'Points', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'coins', label: 'Coins', icon: Coins, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'brainCoins', label: 'BrainCoins', icon: Zap, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
    { id: 'level', label: 'Niveau', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
  ];

  const sortedData = [...leaderboard]
    .sort((a, b) => (b[activeTab] || 0) - (a[activeTab] || 0))
    .filter(user => user.username.toLowerCase().includes(search.toLowerCase()));

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-zinc-300';
    if (index === 2) return 'text-amber-600';
    return 'text-zinc-500';
  };

  return (
    <PageLayout maxWidth="max-w-4xl">
      <PageHeader
        title="Classements"
        subtitle="Les légendes de l'arène"
        icon={<Trophy className="w-8 h-8 text-yellow-500" />}
        leftContent={
          <Link to="/menu" className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        }
        actions={
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="RECHERCHER UN JOUEUR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3 text-xs font-bold focus:border-fuchsia-500 outline-none w-full md:w-64 transition-all"
            />
          </div>
        }
      />

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as RankingType)}
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
              activeTab === tab.id 
                ? `border-zinc-700 ${tab.bg} scale-[1.02]` 
                : 'border-zinc-900 bg-zinc-900/50 hover:border-zinc-800'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : 'text-zinc-500'}`} />
            <span className={`text-xs font-black uppercase italic ${activeTab === tab.id ? 'text-white' : 'text-zinc-500'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          <div className="w-12">Rang</div>
          <div className="flex-1">Joueur</div>
          <div className="w-32 text-right">Valeur</div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {sortedData.map((user, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              key={`${user.username}-${index}`}
              className="p-6 flex items-center hover:bg-zinc-800/30 transition-colors group"
            >
              <div className={`w-12 font-mono font-black text-lg ${getRankColor(index)}`}>
                {index + 1}
              </div>
              <div className="flex-1 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center relative">
                  <User className="w-5 h-5 text-zinc-500" />
                  {index < 3 && (
                    <Medal className={`absolute -top-2 -right-2 w-5 h-5 ${getRankColor(index)}`} />
                  )}
                </div>
                <div>
                  <div className="font-black uppercase italic text-sm group-hover:text-fuchsia-400 transition-colors">
                    {user.username}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    Membre de l'arène
                  </div>
                </div>
              </div>
              <div className="w-32 text-right">
                <div className="text-lg font-mono font-black text-white">
                  {user[activeTab]?.toLocaleString() || 0}
                </div>
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                  {activeTab}
                </div>
              </div>
            </motion.div>
          ))}

          {sortedData.length === 0 && (
            <div className="p-20 text-center">
              <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Aucun joueur trouvé</p>
            </div>
          )}
        </div>
      </Card>
    </PageLayout>
  );
}
