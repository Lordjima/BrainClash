import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  ShoppingBag, 
  Store, 
  Trophy, 
  ChevronRight,
  Coins,
  Zap,
  Star,
  TrendingUp,
  X,
  Menu as MenuIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

export default function Menu() {
  const menuItems = [
    {
      title: "Badges",
      icon: Award,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      link: "/profile",
      desc: "Vos exploits"
    },
    {
      title: "Enchères",
      icon: ShoppingBag,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      link: "/auction",
      desc: "Marché rare"
    },
    {
      title: "Boutique",
      icon: Store,
      color: "text-fuchsia-500",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
      link: "/boutique",
      desc: "Objets & Bonus"
    }
  ];

  const rankings = [
    { title: "Points", icon: TrendingUp, color: "text-blue-500", key: "score" },
    { title: "Coins", icon: Coins, color: "text-amber-500", key: "coins" },
    { title: "BrainCoins", icon: Zap, color: "text-fuchsia-500", key: "brainCoins" },
    { title: "Niveau", icon: Star, color: "text-yellow-500", key: "level" }
  ];

  return (
    <PageLayout maxWidth="max-w-4xl">
      <PageHeader
        title="Menu Principal"
        subtitle="Arena Royale Navigation"
        icon={<MenuIcon className="w-8 h-8 text-fuchsia-500" />}
        actions={
          <Link to="/" className="w-14 h-14 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95 shadow-2xl">
            <X className="w-7 h-7 text-zinc-500" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {menuItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              to={item.link}
              className={`group block p-8 rounded-[40px] border-2 ${item.border} ${item.bg} hover:scale-[1.02] transition-all relative overflow-hidden shadow-xl`}
            >
              <div className="relative z-10">
                <item.icon className={`w-12 h-12 ${item.color} mb-6`} />
                <h3 className="text-2xl font-black uppercase italic text-white">{item.title}</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">{item.desc}</p>
              </div>
              <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-800/50 group-hover:text-white group-hover:translate-x-2 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-black uppercase italic text-white">Classements</h2>
          <div className="flex-1 h-px bg-zinc-800/50" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rankings.map((rank, i) => (
            <motion.div
              key={rank.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link 
                to="/leaderboard"
                className="group block p-8 rounded-[32px] bg-zinc-900/40 backdrop-blur-md border border-zinc-800 hover:border-fuchsia-500/30 transition-all text-center shadow-lg"
              >
                <rank.icon className={`w-10 h-10 ${rank.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{rank.title}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
