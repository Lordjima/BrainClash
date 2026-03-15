import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, Database, Zap, Trophy, Package, BookOpen } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Theme, CatalogItem, CatalogBadge, CatalogChest, Question } from '../types';
import { SeedService } from '../services/SeedService';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { UserService } from '../services/UserService';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'themes' | 'items' | 'badges' | 'chests'>('themes');
  const { twitchUser, user: firebaseUser, isAdmin } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitializeAdmin = async () => {
    if (!firebaseUser || !twitchUser) return;
    try {
      await UserService.syncUser(twitchUser);
      alert('Profil Admin synchronisé !');
      window.location.reload();
    } catch (err: any) {
      console.error('Error initializing admin:', err);
      setError('Erreur lors de l\'initialisation : ' + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <PageLayout maxWidth="max-w-7xl" contentClassName="flex items-center justify-center">
        <EmptyState
          icon={<Shield className="w-12 h-12 text-red-500" />}
          title="Accès Refusé"
          description="Seul l'administrateur peut accéder à cette page."
          actionText="RETOUR À L'ACCUEIL"
          actionLink="/"
        />
      </PageLayout>
    );
  }

  const handleSeed = async () => {
    setIsSeeding(true);
    setError(null);
    try {
      await SeedService.seedAll();
      alert('Base de données initialisée avec succès !');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('insufficient permissions')) {
        setError('Permissions insuffisantes dans Firestore. Avez-vous initialisé votre profil admin ?');
      } else {
        setError('Erreur lors de l\'initialisation : ' + err.message);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <PageLayout maxWidth="max-w-full" contentClassName="overflow-y-auto custom-scrollbar">
      <PageHeader
        title="Panel Admin"
        subtitle="Gestion du contenu de BrainClash"
        icon={<Shield className="w-8 h-8 text-accent-500" />}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={handleInitializeAdmin}
              variant="secondary"
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Initialiser mon Profil Admin
            </Button>
            <Button 
              onClick={handleSeed}
              disabled={isSeeding}
              variant="secondary"
              className="gap-2"
            >
              <Database className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Initialisation...' : 'Réinitialiser Dataset'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3">
          <Shield className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'themes'} onClick={() => setActiveTab('themes')} icon={<BookOpen className="w-4 h-4" />} label="Thèmes & Questions" />
          <TabButton active={activeTab === 'items'} onClick={() => setActiveTab('items')} icon={<Zap className="w-4 h-4" />} label="Sorts & Objets" />
          <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} icon={<Trophy className="w-4 h-4" />} label="Badges" />
          <TabButton active={activeTab === 'chests'} onClick={() => setActiveTab('chests')} icon={<Package className="w-4 h-4" />} label="Coffres" />
        </div>

        {/* Content */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
          {activeTab === 'themes' && <ThemeManager />}
          {activeTab === 'items' && <ItemManager />}
          {activeTab === 'badges' && <BadgeManager />}
          {activeTab === 'chests' && <ChestManager />}
        </div>
    </PageLayout>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
        active ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/20' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Managers ---

function ThemeManager() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [newThemeName, setNewThemeName] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'themes'), (snapshot) => {
      setThemes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Theme)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'themes');
    });
    return () => unsub();
  }, []);

  const handleAddTheme = async () => {
    if (!newThemeName.trim()) return;
    const id = newThemeName.toLowerCase().replace(/\s+/g, '_');
    const path = `themes/${id}`;
    try {
      await setDoc(doc(db, 'themes', id), { name: newThemeName, questionCount: 0 });
      setNewThemeName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Ajouter un thème</h3>
        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Nom du nouveau thème..." 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500"
            value={newThemeName}
            onChange={e => setNewThemeName(e.target.value)}
          />
          <Button onClick={handleAddTheme} variant="primary" className="w-full">
            <Plus className="w-4 h-4" /> Ajouter le thème
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Thèmes existants</h3>
        {themes.map(theme => (
          <div key={theme.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="font-bold">{theme.name}</div>
              <div className="text-xs text-zinc-500">{theme.questionCount || 0} questions</div>
            </div>
            <button onClick={async () => { await deleteDoc(doc(db, 'themes', theme.id.toString())); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemManager() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<CatalogItem>>({ type: 'spell', power: 1 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'catalogItems'), (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CatalogItem)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'catalogItems');
    });
    return () => unsub();
  }, []);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return;
    const id = 'item_' + Date.now();
    const path = `catalogItems/${id}`;
    try {
      await setDoc(doc(db, 'catalogItems', id), { ...newItem, id, active: true, createdAt: Date.now(), updatedAt: Date.now() });
      setNewItem({ type: 'spell', power: 1 });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Ajouter un objet</h3>
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" placeholder="Nom de l'objet" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})}
          />
          <input 
            type="number" placeholder="Prix" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseInt(e.target.value)})}
          />
          <select 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})}
          >
            <option value="spell">Sort (Attaque)</option>
            <option value="defense">Défense</option>
            <option value="bonus">Bonus</option>
          </select>
          <input 
            type="text" placeholder="Description" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})}
          />
          <Button onClick={handleAddItem} variant="primary" className="w-full">
            Ajouter l'objet
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Objets existants</h3>
        {items.map(item => (
          <div key={item.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-accent-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold">{item.name}</div>
                <div className="text-xs text-zinc-500">{item.price} Coins • {item.type}</div>
              </div>
            </div>
            <button onClick={async () => { await deleteDoc(doc(db, 'catalogItems', item.id.toString())); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BadgeManager() {
  const [badges, setBadges] = useState<CatalogBadge[]>([]);
  const [newBadge, setNewBadge] = useState<Partial<CatalogBadge>>({ });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'catalogBadges'), (snapshot) => {
      setBadges(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CatalogBadge)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'catalogBadges');
    });
    return () => unsub();
  }, []);

  const handleAddBadge = async () => {
    if (!newBadge.name) return;
    const id = 'badge_' + Date.now();
    const path = `catalogBadges/${id}`;
    try {
      await setDoc(doc(db, 'catalogBadges', id), { ...newBadge, id, icon: 'Award' });
      setNewBadge({ });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Ajouter un badge</h3>
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" placeholder="Nom du badge" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newBadge.name || ''} onChange={e => setNewBadge({...newBadge, name: e.target.value})}
          />
          <input 
            type="text" placeholder="Description" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newBadge.description || ''} onChange={e => setNewBadge({...newBadge, description: e.target.value})}
          />
          <Button onClick={handleAddBadge} variant="primary" className="w-full">
            Ajouter le badge
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Badges existants</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map(badge => (
            <div key={badge.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center relative group">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="font-bold text-sm">{badge.name}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{badge.description}</div>
              <button 
                onClick={async () => { await deleteDoc(doc(db, 'badges', badge.id.toString())); }}
                className="absolute top-2 right-2 p-1 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChestManager() {
  const [chests, setChests] = useState<CatalogChest[]>([]);
  const [newChest, setNewChest] = useState<Partial<CatalogChest>>({ rarity: 'common', possibleItems: [] });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'catalogChests'), (snapshot) => {
      setChests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CatalogChest)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'catalogChests');
    });
    return () => unsub();
  }, []);

  const handleAddChest = async () => {
    if (!newChest.name || !newChest.price) return;
    const id = 'chest_' + Date.now();
    const path = `catalogChests/${id}`;
    try {
      await setDoc(doc(db, 'catalogChests', id), { ...newChest, id, icon: 'Package', active: true });
      setNewChest({ rarity: 'common', possibleItems: [] });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Ajouter un coffre</h3>
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" placeholder="Nom du coffre" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newChest.name || ''} onChange={e => setNewChest({...newChest, name: e.target.value})}
          />
          <input 
            type="number" placeholder="Prix" 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newChest.price || ''} onChange={e => setNewChest({...newChest, price: parseInt(e.target.value)})}
          />
          <select 
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
            value={newChest.rarity} onChange={e => setNewChest({...newChest, rarity: e.target.value as any})}
          >
            <option value="common">Commun</option>
            <option value="rare">Rare</option>
            <option value="epic">Épique</option>
            <option value="legendary">Légendaire</option>
          </select>
          <Button onClick={handleAddChest} variant="primary" className="w-full">
            Ajouter le coffre
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Coffres existants</h3>
        <div className="grid grid-cols-1 gap-4">
          {chests.map(chest => (
            <div key={chest.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                chest.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                chest.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                chest.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                <Package className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{chest.name}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-black">{chest.rarity} • {chest.price} Coins</div>
              </div>
              <button 
                onClick={async () => { await deleteDoc(doc(db, 'chests', chest.id.toString())); }}
                className="p-2 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
