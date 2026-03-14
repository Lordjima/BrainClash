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
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';

import { useData } from '../DataContext';
import Logo from '../components/ui/Logo';
import { QuizService } from '../services/QuizService';
import ChestOpening from '../components/ChestOpening';
import { Chest, ShopItem } from '../types';
import { auth } from '../lib/firebase';

export default function Home() {
  const navigate = useNavigate();
  const { leaderboard, isLoaded, userProfile, shopItems, badges: allBadges, chests } = useData();
  
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
  const [twitchUser, setTwitchUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openingChest, setOpeningChest] = useState<Chest | null>(null);

  useEffect(() => {
    // Logo loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const storedUser = localStorage.getItem('twitch_user');
    if (storedUser) {
      try {
        setTwitchUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing twitch_user from localStorage:', err);
        localStorage.removeItem('twitch_user');
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TWITCH_AUTH_SUCCESS') {
        const user = event.data.user;
        localStorage.setItem('twitch_user', JSON.stringify(user));
        setTwitchUser(user);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twitchUser) {
      alert('Veuillez vous connecter avec Twitch pour jouer.');
      return;
    }
    
    const code = roomCode.trim().toUpperCase();
    if (code) {
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
              theme: "general",
              timeLimit: 15,
              questions: [
                {
                  id: 'q1',
                  text: "Quel est le jeu préféré de Jima ?",
                  options: ["League of Legends", "Valorant", "Minecraft", "Fortnite"],
                  correctOptionIndex: 1,
                  timeLimit: 15,
                  theme: "general"
                },
                {
                  id: 'q2',
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

        await QuizService.joinRoom(code, twitchUser.display_name, twitchUser.profile_image_url);
        navigate(`/room/${code}`);
      } catch (err: any) {
        console.error('Error joining room:', err);
        setError(err.message === 'Room not found' 
          ? "Ce salon n'existe pas. Essayez 'JIMA' pour le salon démo !" 
          : err.message || 'Erreur lors de la connexion au salon.');
      }
    }
  };

  const getIcon = (iconName: string, className: string = "w-6 h-6") => {
    const Icon = (LucideIcons as any)[iconName] || Award;
    return <Icon className={className} />;
  };

  return (
    <div className="bc-page-container">
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
            className="bc-content-wrapper flex flex-col items-center justify-center flex-1"
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
                  <button
                    type="submit"
                    className="relative w-full max-w-xs group overflow-hidden rounded-2xl p-[2px] transition-all active:scale-95 shadow-[0_0_30px_rgba(217,70,239,0.15)] hover:shadow-[0_0_50px_rgba(217,70,239,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 animate-gradient-x"></div>
                    <div className="relative bg-zinc-950 group-hover:bg-transparent transition-all py-4 rounded-[0.9rem] flex items-center justify-center gap-3">
                      <Gamepad2 className="w-6 h-6 text-fuchsia-500 group-hover:text-white transition-colors" />
                      <span className="text-lg font-black tracking-tighter group-hover:text-white transition-colors uppercase italic">
                        Rejoindre l'Arène
                      </span>
                      <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/create')}
                    className="w-full max-w-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white py-4 rounded-2xl font-black text-lg transition-all active:scale-95 uppercase italic"
                  >
                    Créer un salon
                  </button>

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
            onClose={() => setOpeningChest(null)}
            onReward={async (item) => {
              try {
                if (!twitchUser) throw new Error('Utilisateur non connecté');
                await QuizService.buyChest(openingChest.id.toString());
                await QuizService.addToInventory(item.id.toString());
              } catch (err: any) {
                alert(err.message || "Erreur lors de l'achat du coffre");
                setOpeningChest(null);
              }
            }}
            allShopItems={shopItems}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
