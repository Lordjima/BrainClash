import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import { SavedQuiz } from '../../../back/types';
import { useData } from '../DataContext';
import QuizHeader from './quiz/QuizHeader';
import QuizForm from './quiz/QuizForm';
import QuizHistory from './quiz/QuizHistory';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { themes } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('general');
  const [timeLimit, setTimeLimit] = useState(15);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (Object.keys(themes).length > 0 && !themes['general']) {
      setTheme(Object.keys(themes)[0]);
    }

    const stored = localStorage.getItem('saved_quizzes');
    if (stored) {
      try {
        setSavedQuizzes(JSON.parse(stored));
      } catch (err) {
        console.error('Error parsing saved_quizzes from localStorage:', err);
        localStorage.removeItem('saved_quizzes');
      }
    }

    const handleRoomCreated = (roomId: string) => {
      navigate(`/host/${roomId}`);
    };

    socket.on('room_created', handleRoomCreated);
    return () => {
      socket.off('room_created', handleRoomCreated);
    };
  }, [navigate, themes]);

  const handleSaveAndLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newQuiz: SavedQuiz = {
      id: Date.now().toString(),
      name,
      description,
      theme,
      timeLimit,
      createdAt: Date.now(),
    };

    const updatedQuizzes = [newQuiz, ...savedQuizzes];
    setSavedQuizzes(updatedQuizzes);
    localStorage.setItem('saved_quizzes', JSON.stringify(updatedQuizzes));

    socket.emit('create_room', { timeLimit, theme, name, description });
  };

  const handleLaunchSaved = (quiz: SavedQuiz) => {
    socket.emit('create_room', { 
      timeLimit: quiz.timeLimit, 
      theme: quiz.theme,
      name: quiz.name,
      description: quiz.description
    });
  };

  const handleDeleteSaved = (id: string | number) => {
    const updated = savedQuizzes.filter(q => q.id !== id);
    setSavedQuizzes(updated);
    localStorage.setItem('saved_quizzes', JSON.stringify(updated));
  };

  return (
    <div className="h-full bg-transparent text-white p-4 overflow-hidden flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
        <QuizHeader onOpenHistory={() => setIsHistoryOpen(true)} />

        <div className="flex-1 flex flex-col justify-center min-h-0 py-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <QuizForm
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              theme={theme}
              setTheme={setTheme}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
              themes={themes}
              onSubmit={handleSaveAndLaunch}
            />
          </motion.div>
        </div>
      </div>

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
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-bottom border-zinc-800 flex items-center justify-between">
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
    </div>
  );
}
