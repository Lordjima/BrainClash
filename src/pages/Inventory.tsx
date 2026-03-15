import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Search, Filter, Trash2, Zap, Shield, Heart, Info, ShoppingBag, Backpack, Sparkles, ArrowLeft, Play, Star, User } from 'lucide-react';
import { useData } from '../DataContext';
import * as LucideIcons from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

import { EmptyState } from '../components/ui/EmptyState';

export default function Inventory() {
  const navigate = useNavigate();
  const { userProfile, shopItems } = useData();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getIcon = (iconName: string, size = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Package;
    return <Icon className={size} />;
  };

  if (!userProfile) {
    return (
      <PageLayout maxWidth="max-w-7xl" contentClassName="flex items-center justify-center">
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12 text-zinc-700" />}
          title="Accès Restreint"
          description="Connectez-vous pour accéder à votre équipement de combat"
          actionText="RETOUR À L'ACCUEIL"
          actionLink="/"
        />
      </PageLayout>
    );
  }

  const inventoryItems = (userProfile.inventory || []).map(id => shopItems.find(item => item.id === id)).filter(Boolean);

  const filteredItems = inventoryItems.filter(item => {
    const matchesFilter = filter === 'all' || item?.type === filter;
    const matchesSearch = item?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: inventoryItems.length,
    attacks: inventoryItems.filter(i => i?.type === 'attack').length,
    defense: inventoryItems.filter(i => i?.type === 'defense').length,
    utility: inventoryItems.filter(i => i?.type === 'utility').length,
  };

  return (
    <PageLayout>
        <PageHeader
          title="Inventaire"
          subtitle="Arsenal de combat & Équipements"
          icon={<ShoppingBag className="w-8 h-8 text-fuchsia-500" />}
          actions={
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-8 bg-zinc-900/40 backdrop-blur-2xl px-8 py-4 rounded-[24px] border border-white/5 shadow-2xl">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Capacité</span>
                  <span className="text-xl font-black font-mono leading-none">{stats.total}<span className="text-zinc-700 text-sm">/15</span></span>
                </div>
                <div className="w-px h-10 bg-white/5" />
                <div className="flex gap-6">
                  <div className="flex flex-col items-center group cursor-help">
                    <Zap className="w-4 h-4 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black">{stats.attacks}</span>
                  </div>
                  <div className="flex flex-col items-center group cursor-help">
                    <Shield className="w-4 h-4 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black">{stats.defense}</span>
                  </div>
                </div>
              </div>

              <Link 
                to="/auction-house"
                className="group relative bg-white text-black px-10 py-5 rounded-[24px] font-black text-xs transition-all flex items-center gap-3 shadow-2xl hover:shadow-white/10 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <ShoppingBag className="w-5 h-5 relative z-10 group-hover:text-white transition-colors" />
                <span className="relative z-10 group-hover:text-white transition-colors">MARCHÉ NOIR</span>
              </Link>
            </div>
          }
        />

        {/* Main Grid Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-y-auto lg:overflow-hidden custom-scrollbar">
          
          {/* Left Sidebar: Character & Filters */}
          <div className="lg:w-80 flex flex-col gap-6 shrink-0">
            {/* Character Preview Placeholder */}
            <Card className="flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-32 h-32 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center overflow-hidden mb-4 shadow-2xl relative z-10">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt={userProfile.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-16 h-16 text-zinc-800" />
                )}
              </div>
              <div className="text-center relative z-10">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">{userProfile.username}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Niveau {userProfile.level || 1}</span>
                </div>
              </div>

              <div className="w-full mt-6 grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-zinc-950/50 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Victoires</span>
                  <span className="text-sm font-black font-mono">12</span>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Ratio</span>
                  <span className="text-sm font-black font-mono">1.5</span>
                </div>
              </div>
            </Card>

            <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-6 space-y-8 flex-1">
              <div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">Recherche</h3>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-fuchsia-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Nom de l'objet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-fuchsia-500/50 transition-all focus:bg-zinc-950"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">Catégories</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {(() => {
                    const availableTypes = Array.from(new Set(shopItems.map(item => item.type)));
                    const filterOptions = [
                      { id: 'all', label: 'Tout l\'équipement', icon: Package, color: 'text-zinc-500' },
                      ...availableTypes.map(type => ({
                        id: type,
                        label: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
                        icon: type === 'attack' ? Zap : type === 'defense' ? Shield : type === 'bonus' ? Star : Heart,
                        color: type === 'attack' ? 'text-red-500' : type === 'defense' ? 'text-blue-500' : type === 'bonus' ? 'text-yellow-500' : 'text-emerald-500'
                      }))
                    ];
                    return filterOptions.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id as any)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest group ${
                          filter === cat.id 
                            ? 'bg-fuchsia-600 text-white shadow-xl shadow-fuchsia-600/20' 
                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <cat.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${filter === cat.id ? 'text-white' : cat.color}`} />
                        {cat.label}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Items Grid */}
          <div className="flex-1 bg-zinc-900/20 backdrop-blur-md border border-white/5 rounded-[48px] p-8 overflow-y-auto custom-scrollbar relative">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredItems.map((item, idx) => (
                  <Card
                    key={`${item.id}-${idx}`}
                    hoverable
                    onClick={() => setSelectedItem(item)}
                    className={`aspect-square p-5 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all relative overflow-hidden ${
                      selectedItem?.id === item.id 
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_40px_rgba(217,70,239,0.2)]' 
                        : 'border-white/5 hover:border-white/20 hover:bg-zinc-900/50'
                    }`}
                  >
                    {/* Rarity Glow */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity blur-3xl ${
                      item.type === 'attack' ? 'bg-red-500' : item.type === 'defense' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />

                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-3 ${
                      item.type === 'attack' ? 'bg-red-500/10 text-red-500' : item.type === 'defense' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {getIcon(item.icon, "w-8 h-8")}
                    </div>
                    
                    <div className="text-center relative z-10">
                      <div className="text-[11px] font-black uppercase tracking-tight line-clamp-1 group-hover:text-white transition-colors">{item.name}</div>
                      <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-60 ${
                        item.type === 'attack' ? 'text-red-500' : item.type === 'defense' ? 'text-blue-500' : 'text-emerald-500'
                      }`}>{item.type}</div>
                    </div>

                    <div className="absolute top-5 right-5 bg-zinc-900/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-xl text-[9px] font-black text-zinc-500 group-hover:text-white transition-colors">
                      x1
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                <div className="w-32 h-32 bg-zinc-900 rounded-[48px] flex items-center justify-center border border-white/5 shadow-2xl">
                  <Search className="w-12 h-12 text-zinc-800" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Arsenal Vide</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">Aucun équipement de ce type n'a été détecté dans votre inventaire tactique.</p>
                </div>
                <button 
                  onClick={() => {setFilter('all'); setSearchQuery('');}}
                  className="bg-white text-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>

          {/* Right: Item Details */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="lg:w-[400px] bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[48px] p-6 lg:p-10 flex flex-col shrink-0 shadow-2xl relative overflow-y-auto custom-scrollbar"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="flex-1 space-y-12 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] ${
                      selectedItem.type === 'attack' ? 'bg-red-500/20 text-red-500' : selectedItem.type === 'defense' ? 'bg-blue-500/20 text-blue-500' : selectedItem.type === 'emerald-500/20 text-emerald-500'
                    }`}>
                      {selectedItem.type}
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-2xl transition-colors group">
                      <LucideIcons.X className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div className="text-center space-y-8">
                    <div className={`w-48 h-48 mx-auto rounded-[56px] flex items-center justify-center shadow-2xl relative group ${
                      selectedItem.type === 'attack' ? 'bg-red-500/10 text-red-500' : selectedItem.type === 'defense' ? 'bg-blue-500/10 text-blue-500' : selectedItem.type === 'emerald-500/10 text-emerald-500'
                    }`}>
                      <div className="absolute inset-0 blur-3xl opacity-30 bg-current rounded-full animate-pulse" />
                      {getIcon(selectedItem.icon, "w-24 h-24 relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-6")}
                    </div>
                    <div>
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{selectedItem.name}</h2>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-3 h-3 ${i <= 4 ? 'text-fuchsia-500 fill-fuchsia-500' : 'text-zinc-800'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest italic">Objet Épique</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 bg-zinc-950/50 border border-white/5 rounded-[40px] space-y-5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500 opacity-50" />
                      <div className="flex items-center gap-3">
                        <Info className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Données Tactiques</span>
                      </div>
                      <p className="text-[13px] text-zinc-300 font-bold leading-relaxed uppercase tracking-tighter">
                        {selectedItem.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="p-6 bg-zinc-950/50 border border-white/5 rounded-[32px] group hover:border-amber-500/30 transition-colors">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-3">Valeur Marchande</span>
                        <div className="flex items-center gap-3">
                          <LucideIcons.Coins className="w-5 h-5 text-amber-500" />
                          <span className="text-2xl font-black font-mono tracking-tighter">{selectedItem.price}</span>
                        </div>
                      </div>
                      <div className="p-6 bg-zinc-950/50 border border-white/5 rounded-[32px] group hover:border-fuchsia-500/30 transition-colors">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-3">Utilisations</span>
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-fuchsia-500" />
                          <span className="text-2xl font-black font-mono tracking-tighter">1/1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-12 space-y-5 relative z-10">
                  <button className="w-full bg-white text-black py-6 rounded-[24px] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl hover:shadow-white/20">
                    <Play className="w-6 h-6 fill-current" />
                    ÉQUIPER L'OBJET
                  </button>
                  <button 
                    onClick={async () => {
                      if (!selectedItem) return;
                      await QuizService.removeFromInventory(selectedItem.id.toString());
                      setSelectedItem(null);
                    }}
                    className="w-full bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-500 text-zinc-600 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    DÉTRUIRE L'OBJET
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageLayout>
    );
  }
