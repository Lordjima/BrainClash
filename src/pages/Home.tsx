import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Award, 
  ChevronRight, 
  User, 
  Star, 
  Plus, 
  Info, 
  Zap, 
  TrendingUp, 
  Coins, 
  Package, 
  X, 
  Backpack,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import Logo from '../components/ui/Logo';
import { QuizService } from '../services/QuizService';
import ChestOpening from '../components/ChestOpening';
import { Chest, ShopItem } from '../types';
import { auth } from '../lib/firebase';

import { PageLayout } from '../components/ui/PageLayout';
import { Button } from '../components/ui/Button';

export default function Home() {
  const navigate = useNavigate();
  const { twitchUser, isAuthReady, user: firebaseUser } = useAuth();
  const { leaderboard, isLoaded, items: shopItems, badges: allBadges, chests } = useCatalog();
  
  const [roomCode, setRoomCode] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleDigitChange = (index: number, value: string) => {
    console.log('handleDigitChange called:', index, value);
    const char = value.toUpperCase().slice(-1);
    const newDigits = [...codeDigits];
    newDigits[index] = char;
    setCodeDigits(newDigits);
    setRoomCode(newDigits.join(''));

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    if (error) setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openingChest, setOpeningChest] = useState<Chest | null>(null);
  const [chestReward, setChestReward] = useState<ShopItem | null>(null);

  const handleBuyChest = async (chest: Chest) => {
    try {
      if (!twitchUser) throw new Error('Utilisateur non connecté');
      const wonItemId = await QuizService.buyChest(chest.id);
      const wonItem = shopItems.find(i => i.id === wonItemId);
      setChestReward(wonItem || null);
      setOpeningChest(chest);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'achat du coffre");
    }
  };

  useEffect(() => {
    // Logo loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [navigate]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthReady) return;

    if (!firebaseUser) {
      setError("Le système d'authentification n'est pas prêt. Veuillez patienter...");
      return;
    }

    const code = roomCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setError("Veuillez entrer un code de salon valide (4 caractères).");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Special case for JIMA demo room
      if (code === 'JIMA') {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const roomSnap = await getDoc(doc(db, 'rooms', 'JIMA'));
        
        if (!roomSnap.exists()) {
          // Create a default demo room if it doesn't exist
          await QuizService.createRoomWithCode('JIMA', {
            name: "Salon de Jima",
            description: "Bienvenue dans l'arène officielle de JimaG4ming !",
            themeIds: ["general"],
            timeLimit: 15,
            questions: [
              {
                index: 0,
                questionId: 'q1',
                text: "Quel est le jeu préféré de Jima ?",
                options: ["League of Legends", "Valorant", "Minecraft", "Fortnite"],
                correctOptionIndex: 1,
                timeLimit: 15,
                theme: "general"
              },
              {
                index: 1,
                questionId: 'q2',
                text: "Combien de BrainCoins coûte un badge Légendaire ?",
                options: ["10", "50", "100", "500"],
                correctOptionIndex: 2,
                timeLimit: 15,
                theme: "general"
              }
            ]
          });
        }
      }

      const username = twitchUser?.display_name || `Joueur_${firebaseUser.uid.substring(0, 5)}`;
      const avatarUrl = twitchUser?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`;

      await QuizService.joinRoom(code, username, avatarUrl);
      navigate(`/room/${code}`);
    } catch (err: any) {
      console.error('Error joining room:', err);
      setIsLoading(false);
      setError(err.message || 'Erreur lors de la connexion au salon.');
    }
  };

  const getIcon = (iconName: string, className: string = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Award;
    return <Icon className={className} />;
  };

  return (
    <PageLayout>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[999] bg-zinc-950 flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              animate={{ 
                scale: [1.5, 1.65, 1.5],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Logo />
            </motion.div>
            <div className="w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
              />
            </div>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]"
            >
              Préparation de l'arène...
            </motion.span>
          </motion.div>
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center justify-center flex-1"
          >
            {/* Decorative Background Elements removed to prevent scroll */}
            
            <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
              {/* Welcome */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12 flex flex-col items-center"
              >
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic text-center leading-[0.9]">
                  Prêt pour <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500">l'affrontement ?</span>
                </h1>
              </motion.div>

              {/* Join Form */}
              <motion.form 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                onSubmit={handleJoinRoom} 
                className="w-full space-y-12"
              >
                <motion.div
                  animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center gap-3 md:gap-5"
                >
                  {codeDigits.map((digit, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur-md opacity-0 group-focus-within:opacity-40 transition duration-500"></div>
                      <motion.input
                        ref={inputRefs[i]}
                        whileFocus={{ scale: 1.05 }}
                        type="text"
                        value={digit}
                        onPaste={(e) => {
                          const paste = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).split('');
                          if (paste.length > 0) {
                            const newDigits = [...codeDigits];
                            paste.forEach((char, idx) => {
                              if (idx < 4) newDigits[idx] = char;
                            });
                            setCodeDigits(newDigits);
                            setRoomCode(newDigits.join(''));
                            const nextIndex = Math.min(paste.length, 3);
                            inputRefs[nextIndex].current?.focus();
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-14 h-18 md:w-20 md:h-24 bg-zinc-950/90 border-2 border-white/10 rounded-2xl text-3xl md:text-4xl font-mono font-black text-center focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 outline-none transition-all text-white shadow-2xl relative z-10"
                        maxLength={1}
                      />
                    </div>
                  ))}
                </motion.div>

                  <div className="flex flex-col items-center gap-6">
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      icon={<Gamepad2 className="w-6 h-6" />}
                      showArrow
                      className="max-w-xs"
                      disabled={!isAuthReady || roomCode.length < 4}
                      loading={isLoading && !error}
                    >
                      {!isAuthReady ? 'Initialisation...' : "Rejoindre l'Arène"}
                    </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate('/create')}
                    className="w-full max-w-xs"
                  >
                    Créer un salon
                  </Button>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full"
                    >
                      <span className="text-red-500 text-[10px] font-black italic uppercase tracking-wider">
                        ⚠ {error}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openingChest && (
          <ChestOpening
            chest={openingChest}
            reward={chestReward}
            onClose={() => {
              setOpeningChest(null);
              setChestReward(null);
            }}
            allShopItems={shopItems}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
