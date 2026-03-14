import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SavedQuiz, Question, Theme } from '../types';
import { useData } from '../DataContext';
import QuizHistory from '../components/quiz/QuizHistory';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Play, History, Check } from 'lucide-react';

import { QuizService } from '../services/QuizService';
import { PageLayout } from '../components/ui/PageLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { themes } = useData();
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
    .reduce((acc, [_, t]: [string, any]) => acc + (t.questions?.length || 0), 0);

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
      let allQuestions: Question[] = [];
      
      // Fetch questions for each selected theme
      for (const themeId of quizData.selectedThemes) {
        const themeDoc = await getDoc(doc(db, 'themes', themeId));
        if (themeDoc.exists()) {
          const themeData = themeDoc.data() as Theme;
          if (themeData.questions) {
            allQuestions = [...allQuestions, ...themeData.questions];
          }
        }
      }

      // Shuffle questions
      allQuestions = allQuestions.sort(() => Math.random() - 0.5);
      
      // Limit questions
      const finalQuestions = allQuestions.slice(0, quizData.questionCount);

      const code = await QuizService.createRoom({
        name: quizData.name,
        description: quizData.description,
        theme: quizData.selectedThemes.join(', '),
        timeLimit: quizData.timeLimit,
        questions: finalQuestions.length > 0 ? finalQuestions : []
      });
      
      navigate(`/host/${code}`);
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  const handleSaveAndLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLaunch) return;

    const newQuiz: SavedQuiz = {
      id: Date.now().toString(),
      name,
      description,
      theme: selectedThemes[0], // For backward compatibility in history
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
      selectedThemes: [quiz.theme],
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
    <PageLayout maxWidth="max-w-7xl">
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
                  <button
                    key={time}
                    type="button"
                    onClick={() => setTimeLimit(time)}
                    className={`py-3 rounded-xl font-black font-mono transition-all ${timeLimit === time ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-transparent text-zinc-500 border border-zinc-700 hover:border-violet-500/30'}`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre de questions</label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 20, 50].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-3 rounded-xl font-black font-mono transition-all ${questionCount === count ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-transparent text-zinc-500 border border-zinc-700 hover:border-violet-500/30'}`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
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

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(themes).map(([id, t]: [string, any]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTheme(id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${
                    selectedThemes.includes(id)
                      ? 'bg-violet-600/10 border-violet-500 text-white'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="text-[10px] text-zinc-500">{t.questions?.length || 0} questions</span>
                  </div>
                  {selectedThemes.includes(id) && <Check className="w-4 h-4 text-violet-400" />}
                </button>
              ))}
            </div>
            <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total questions sélectionnées :</span>
                <span className={`font-bold ${totalAvailableQuestions < questionCount ? 'text-red-500' : 'text-emerald-500'}`}>
                  {totalAvailableQuestions} / {questionCount}
                </span>
              </div>
              {totalAvailableQuestions < questionCount && (
                <p className="text-[10px] text-red-500 mt-2">
                  Sélectionnez plus de thèmes pour atteindre le nombre de questions souhaité.
                </p>
              )}
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
      </form>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80%]"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Historique des Quiz</h2>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <QuizHistory
                  savedQuizzes={savedQuizzes}
                  themes={themes}
                  onLaunch={handleLaunchSaved}
                  onDelete={handleDeleteSaved}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

