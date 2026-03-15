import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Gavel, 
  Store, 
  Trophy, 
  ChevronRight,
  LayoutGrid,
  User,
  Info
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuModal({ isOpen, onClose }: MenuModalProps) {
  const menuItems = [
    {
      title: "Boutique",
      icon: Store,
      color: "text-fuchsia-500",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
      link: "/boutique",
      desc: "Objets & Bonus"
    },
    {
      title: "Enchères",
      icon: Gavel,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      link: "/auction",
      desc: "Marché rare"
    },
    {
      title: "Profil",
      icon: User,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      link: "/profile",
      desc: "Vos statistiques"
    },
    {
      title: "Classement",
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      link: "/leaderboard",
      desc: "Top joueurs"
    },
    {
      title: "Règles",
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      link: "/rules",
      desc: "Tout savoir"
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" className="p-8 md:p-12 rounded-[40px]">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-fuchsia-600/10 rounded-2xl flex items-center justify-center border border-fuchsia-600/20">
            <LayoutGrid className="w-6 h-6 text-fuchsia-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Menu Principal</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">Arena Royale Navigation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {menuItems.map((item, i) => (
          <div
            key={item.title}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
          >
            <Link 
              to={item.link}
              onClick={onClose}
              className={`group block p-8 rounded-[40px] border-2 ${item.border} ${item.bg} hover:scale-[1.02] transition-all relative overflow-hidden shadow-xl`}
            >
              <div className="relative z-10">
                <item.icon className={`w-12 h-12 ${item.color} mb-6`} />
                <h3 className="text-2xl font-black uppercase italic text-white">{item.title}</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">{item.desc}</p>
              </div>
              <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-800/50 group-hover:text-white group-hover:translate-x-2 transition-all" />
            </Link>
          </div>
        ))}
      </div>
    </Modal>
  );
}
