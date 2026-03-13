import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../lib/socket';
import { Check, X, ArrowLeft, Inbox, User } from 'lucide-react';
import { SubmittedQuestion, Theme } from '../types';
import Logo from './Logo';

export default function ReviewQuestions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SubmittedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<Record<string, Theme>>({});

  useEffect(() => {
    socket.emit('get_pending_questions');
    socket.emit('get_themes');

    socket.on('pending_questions_list', (list: SubmittedQuestion[]) => {
      setQuestions(list);
      setLoading(false);
    });

    socket.on('themes_list', (list) => {
      setThemes(list);
    });

    return () => {
      socket.off('pending_questions_list');
      socket.off('themes_list');
    };
  }, []);

  const handleReview = (id: string, action: 'approve' | 'reject', theme: string) => {
    socket.emit('review_question', { id, action, theme });
    // Optimistic update
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/create" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors border border-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo />
          <h1 className="text-3xl font-bold flex items-center gap-3 ml-4">
            <Inbox className="w-8 h-8 text-blue-500" />
            Vérification des questions
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-zinc-900 p-12 rounded-3xl border border-zinc-800 shadow-xl text-center">
            <Inbox className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Aucune question en attente</h2>
            <p className="text-zinc-400">Vos abonnés n'ont pas encore proposé de nouvelles questions.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {questions.map((q) => (
              <div key={q.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className="bg-violet-600/20 text-violet-400 px-3 py-1 rounded-full font-medium">
                      {themes[q.theme]?.name || q.theme}
                    </span>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Proposé par <strong className="text-zinc-300">{q.author}</strong>
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-4">{q.text}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border ${i === q.correctOptionIndex ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'}`}
                      >
                        {i === q.correctOptionIndex && <Check className="w-4 h-4 inline-block mr-2" />}
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 justify-center md:border-l border-zinc-800 md:pl-6">
                  <button
                    onClick={() => handleReview(q.id, 'approve', q.theme)}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReview(q.id, 'reject', q.theme)}
                    className="flex-1 md:flex-none bg-red-600/20 hover:bg-red-600/40 text-red-500 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
