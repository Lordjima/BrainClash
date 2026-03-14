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
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Menu() {
  const menuItems = [
    {
      title: "Badges",
      icon: Award,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      link: "/profile", // Badges are in profile
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
    <div className="h-screen bg-zinc-950 text-white p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/5 blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] -ml-64 -mb-64 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Menu Principal</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Arena Royale Navigation</p>
          </div>
          <Link to="/" className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link 
                to={item.link}
                className={`group block p-6 rounded-[32px] border-2 ${item.border} ${item.bg} hover:scale-[1.02] transition-all relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <item.icon className={`w-10 h-10 ${item.color} mb-4`} />
                  <h3 className="text-xl font-black uppercase italic">{item.title}</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{item.desc}</p>
                </div>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-800 group-hover:text-white group-hover:translate-x-2 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-black uppercase italic">Classements</h2>
            <div className="flex-1 h-px bg-zinc-900" />
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
                  to="/leaderboard" // Assuming a general leaderboard page exists or will handle these
                  className="group block p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-center"
                >
                  <rank.icon className={`w-8 h-8 ${rank.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                  <div className="text-xs font-black uppercase tracking-widest">{rank.title}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
