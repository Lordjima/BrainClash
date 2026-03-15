import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SavedQuiz, Question, Theme } from '../types';
import { useCatalog } from '../context/CatalogContext';
import QuizHistory from '../components/quiz/QuizHistory';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Play, History, Check } from 'lucide-react';

import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { themes } = useCatalog();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(15);
  const [questionCount, setQuestionCount] = useState(10);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Calculer le nombre total de questions disponibles pour les thèmes sélectionnés
  const totalAvailableQuestions = Object.entries(themes)
    .filter(([id]) => selectedThemes.includes(id))
    .reduce((acc, [_, t]) => acc + ((t as Theme).questionCount || 0), 0);

  const canLaunch = name.trim() && selectedThemes.length > 0 && totalAvailableQuestions >= questionCount;

  useEffect(() => {
    const stored = localStorage.getItem('saved_quizzes');
    if (stored) {
      try {
        setSavedQuizzes(JSON.parse(stored));
      } catch (err) {
        console.error('Error parsing saved_quizzes from localStorage:', err);
        localStorage.removeItem('saved_quizzes');
      }
    }
  }, []);

  const toggleTheme = (themeId: string) => {
    setSelectedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    );
  };

  const createRoom = async (quizData: { timeLimit: number, questionCount: number, selectedThemes: string[], name: string, description: string }) => {
    try {
      if (quizData.selectedThemes.length === 0) {
        throw new Error("Veuillez sélectionner au moins un thème.");
      }

      let allQuestions: Question[] = [];
      
      // Fetch questions for each selected theme
      for (const themeId of quizData.selectedThemes) {
        const q = query(collection(db, 'questionBank'), where('theme', '==', themeId));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          allQuestions.push({ id: d.id, ...d.data() } as Question);
        });
      }

      // Shuffle questions
      allQuestions = allQuestions.sort(() => Math.random() - 0.5);
      
      // Limit questions
      const finalQuestions = allQuestions.slice(0, quizData.questionCount);

      if (finalQuestions.length === 0) {
        throw new Error("Aucune question disponible pour les thèmes sélectionnés.");
      }
      if (finalQuestions.length < quizData.questionCount) {
        throw new Error(`Pas assez de questions pour lancer ce quiz (disponibles: ${finalQuestions.length}, demandées: ${quizData.questionCount}).`);
      }

      const code = await QuizService.createRoom({
        name: quizData.name,
        description: quizData.description,
        themeIds: quizData.selectedThemes,
        timeLimit: quizData.timeLimit,
        questions: finalQuestions
      });
      
      navigate(`/host/${code}`);
    } catch (err) {
      console.error('Error creating room:', err);
      alert(err instanceof Error ? err.message : "Une erreur est survenue lors de la création du quiz.");
    }
  };

  const handleSaveAndLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLaunch) return;

    const newQuiz: SavedQuiz = {
      id: Date.now().toString(),
      name,
      description,
      themeIds: selectedThemes,
      timeLimit,
      questionCount,
      createdAt: Date.now(),
    };

    const updatedQuizzes = [newQuiz, ...savedQuizzes];
    setSavedQuizzes(updatedQuizzes);
    localStorage.setItem('saved_quizzes', JSON.stringify(updatedQuizzes));

    createRoom({ timeLimit, questionCount, selectedThemes, name, description });
  };

  const handleLaunchSaved = (quiz: SavedQuiz) => {
    createRoom({ 
      timeLimit: quiz.timeLimit,
      questionCount: quiz.questionCount || 10,
      selectedThemes: quiz.themeIds,
      name: quiz.name,
      description: quiz.description
    });
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedQuizzes.filter(q => q.id !== id);
    setSavedQuizzes(updated);
    localStorage.setItem('saved_quizzes', JSON.stringify(updated));
  };

  return (
    <PageLayout>
      <PageHeader
        title="CRÉATION DE QUIZ"
        subtitle="Configurez votre session de jeu"
        icon={<Settings className="w-8 h-8 text-fuchsia-500" />}
        actions={
          <Button onClick={() => setIsHistoryOpen(true)} variant="secondary" className="gap-2">
            <History className="w-5 h-5 text-fuchsia-400" />
            Historique
          </Button>
        }
      />

      <form onSubmit={handleSaveAndLaunch} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Basic Info */}
        <div className="space-y-6">
          <div className="border border-zinc-800 rounded-2xl p-8 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Nom du quiz</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Le Grand Choc des Cerveaux"
                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Description (optionnelle)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dites à vos spectateurs ce qui les attend..."
                className="w-full bg-transparent border-b border-zinc-700 pb-2 text-white focus:outline-none focus:border-violet-500 transition-all resize-none h-24 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Temps par Question</label>
              <div className="grid grid-cols-4 gap-3">
                {[10, 15, 20, 30].map(time => (
                  <Button
                    key={time}
                    type="button"
                    variant={timeLimit === time ? 'primary' : 'secondary'}
                    onClick={() => setTimeLimit(time)}
                    className="py-3 font-mono"
                  >
                    {time}s
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre de questions</label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 20, 50].map(count => (
                  <Button
                    key={count}
                    type="button"
                    variant={questionCount === count ? 'primary' : 'secondary'}
                    onClick={() => setQuestionCount(count)}
                    className="py-3 font-mono"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={!canLaunch}
            className="w-full py-6 text-lg"
            size="lg"
          >
            <Play className="w-6 h-6 fill-current" />
            Lancer le Quiz
          </Button>
        </div>

        {/* Right Column: Themes List */}
        <div className="space-y-6">
          <div className="border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Thèmes ({selectedThemes.length} sélectionnés)</label>
              {selectedThemes.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setSelectedThemes([])}
                  className="text-[10px] font-bold text-fuchsia-400 hover:text-fuchsia-300 uppercase tracking-widest"
                >
                  Tout effacer
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(themes).map(([id, t]: [string, any]) => {
                const isSelected = selectedThemes.includes(id);
                return (
                  <motion.button
                    key={id} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTheme(id)}
                    className={`relative w-full flex flex-col items-start p-4 rounded-xl transition-all border ${isSelected ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                  >
                    <span className="text-sm font-bold mb-1">{t.name}</span>
                    <span className="text-[10px] text-zinc-500">{t.questionCount || 0} questions</span>
                    {isSelected && <div className="absolute top-2 right-2 bg-violet-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>}
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-zinc-400">Questions :</span>
                <span className={`font-mono ${totalAvailableQuestions < questionCount ? 'text-red-500' : 'text-emerald-500'}`}>
                  {totalAvailableQuestions} / {questionCount}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${totalAvailableQuestions < questionCount ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (totalAvailableQuestions / questionCount) * 100)}%` }}
                />
              </div>
              {totalAvailableQuestions < questionCount && (
                <p className="text-[10px] text-red-500">
                  Sélectionnez plus de thèmes pour atteindre le nombre de questions souhaité.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* History Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Historique des Quiz" maxWidth="max-w-2xl">
        <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
          <QuizHistory
            savedQuizzes={savedQuizzes}
            themes={themes}
            onLaunch={handleLaunchSaved}
            onDelete={handleDeleteSaved}
          />
        </div>
      </Modal>
    </PageLayout>
  );
}

