import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../lib/socket';
import { Play, Settings, Save, History, ArrowLeft, Trash2 } from 'lucide-react';
import { SavedQuiz, Theme } from '../types';
import Logo from './Logo';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('general');
  const [timeLimit, setTimeLimit] = useState(15);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [themes, setThemes] = useState<Record<string, Theme>>({});

  useEffect(() => {
    socket.emit('get_themes');
    socket.on('themes_list', (list) => {
      setThemes(list);
      if (Object.keys(list).length > 0 && !list['general']) {
        setTheme(Object.keys(list)[0]);
      }
    });

    const stored = localStorage.getItem('saved_quizzes');
    if (stored) {
      setSavedQuizzes(JSON.parse(stored));
    }

    const handleRoomCreated = (roomId: string) => {
      navigate(`/host/${roomId}`);
    };

    socket.on('room_created', handleRoomCreated);
    return () => {
      socket.off('room_created', handleRoomCreated);
    };
  }, [navigate]);

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

  const handleDeleteSaved = (id: string) => {
    const updated = savedQuizzes.filter(q => q.id !== id);
    setSavedQuizzes(updated);
    localStorage.setItem('saved_quizzes', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors border border-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Logo />
            <h1 className="text-3xl font-bold ml-4">Créer un Quiz</h1>
          </div>
          <button
            onClick={() => navigate('/review-questions')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
          >
            Vérifier les questions abonnés
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Form */}
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center shrink-0">
                <Settings className="w-6 h-6 text-violet-500" />
              </div>
              <h2 className="text-2xl font-bold">Nouveau Quiz</h2>
            </div>

            <form onSubmit={handleSaveAndLaunch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Nom du quiz</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Grand Quiz du Dimanche"
                  className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Description (optionnelle)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Petite description pour vos viewers..."
                  className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Thème du quiz</label>
                <div className="relative">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  >
                    {Object.entries(themes).map(([id, t]: [string, any]) => (
                      <option key={id} value={id} className="bg-zinc-900 text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Temps par question</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setTimeLimit(time)}
                      className={`py-2 rounded-xl font-bold font-mono text-sm transition-colors ${timeLimit === time ? 'bg-violet-600 text-white' : 'bg-transparent text-zinc-400 border border-zinc-800 hover:border-violet-500/50'}`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-8"
              >
                <Save className="w-5 h-5" />
                Sauvegarder et Lancer
              </button>
            </form>
          </div>

          {/* History */}
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center shrink-0">
                <History className="w-6 h-6 text-fuchsia-500" />
              </div>
              <h2 className="text-2xl font-bold">Historique</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {savedQuizzes.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  Aucun quiz sauvegardé pour le moment.
                </div>
              ) : (
                savedQuizzes.map(quiz => (
                  <div key={quiz.id} className="bg-transparent border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{quiz.name}</h3>
                        {quiz.description && <p className="text-sm text-zinc-400 mt-1">{quiz.description}</p>}
                      </div>
                      <button 
                        onClick={() => handleDeleteSaved(quiz.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                      <span className="bg-zinc-800 px-2 py-1 rounded-md">{themes[quiz.theme]?.name || quiz.theme}</span>
                      <span className="bg-zinc-800 px-2 py-1 rounded-md">{quiz.timeLimit}s</span>
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => handleLaunchSaved(quiz)}
                      className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Relancer ce quiz
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
