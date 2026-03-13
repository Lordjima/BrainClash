import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../lib/socket';
import { Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { Theme } from '../types';
import Logo from './Logo';

export default function SubmitQuestion() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [theme, setTheme] = useState('general');
  const [customTheme, setCustomTheme] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [themes, setThemes] = useState<Record<string, Theme>>({});

  useEffect(() => {
    socket.emit('get_themes');
    socket.on('themes_list', (list) => {
      setThemes(list);
      if (Object.keys(list).length > 0 && !list['general']) {
        setTheme(Object.keys(list)[0]);
      }
    });
    return () => {
      socket.off('themes_list');
    };
  }, []);

  const twitchUser = localStorage.getItem('twitch_user') 
    ? JSON.parse(localStorage.getItem('twitch_user')!) 
    : null;

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twitchUser) {
      alert('Vous devez être connecté pour soumettre une question.');
      return;
    }

    if (!text.trim() || options.some(opt => !opt.trim())) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    if (theme === 'custom' && !customTheme.trim()) {
      alert('Veuillez préciser le nom de votre thème.');
      return;
    }

    socket.emit('submit_question', {
      text,
      options,
      correctOptionIndex,
      theme: theme === 'custom' ? customTheme.trim() : theme,
      author: twitchUser.display_name
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setText('');
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
      setTheme('general');
      setCustomTheme('');
    }, 3000);
  };

  if (!twitchUser) {
    return (
      <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Connexion requise</h2>
        <p className="text-zinc-400 mb-8">Vous devez être connecté avec Twitch pour proposer une question.</p>
        <Link to="/" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Proposer une question</h1>
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Question envoyée !</h2>
              <p className="text-zinc-400">Merci pour votre contribution. Elle sera examinée par le streamer.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Thème</label>
                <div className="relative mb-3">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                  >
                    {Object.entries(themes).map(([id, t]: [string, any]) => (
                      <option key={id} value={id} className="bg-zinc-900">{t.name}</option>
                    ))}
                    <option value="custom" className="bg-zinc-900 font-bold text-fuchsia-400">Autre (proposer un thème)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>

                {theme === 'custom' && (
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Nom de votre thème..."
                    className="w-full bg-zinc-800 border border-fuchsia-500 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Votre question</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Quelle est la capitale de..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all resize-none h-24"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-4">Réponses (cochez la bonne réponse)</label>
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={correctOptionIndex === i}
                        onChange={() => setCorrectOptionIndex(i)}
                        className="w-5 h-5 text-purple-600 bg-zinc-800 border-zinc-700 focus:ring-purple-500 focus:ring-offset-zinc-900"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        placeholder={`Réponse ${i + 1}`}
                        className={`flex-1 bg-zinc-800 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${correctOptionIndex === i ? 'border-purple-500' : 'border-zinc-700'}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-8"
              >
                <Send className="w-5 h-5" />
                Soumettre la question
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
