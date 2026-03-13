import React from 'react';
import { Settings, Play, History } from 'lucide-react';

interface QuizFormProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  timeLimit: number;
  setTimeLimit: (time: number) => void;
  themes: Record<string, any>;
  onSubmit: (e: React.FormEvent) => void;
  onOpenHistory: () => void;
}

export default function QuizForm({
  name,
  setName,
  description,
  setDescription,
  theme,
  setTheme,
  timeLimit,
  setTimeLimit,
  themes,
  onSubmit,
  onOpenHistory,
}: QuizFormProps) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-md p-4 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 blur-[80px] rounded-full group-hover:bg-violet-600/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">CONFIGURATION DU QUIZ</h2>
            <p className="text-zinc-500 text-[10px]">Préparez votre prochaine session de jeu</p>
          </div>
        </div>
        <button
          onClick={onOpenHistory}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2 border border-zinc-700 shadow-lg hover:scale-105 active:scale-95 text-xs"
        >
          <History className="w-4 h-4 text-fuchsia-400" />
          Historique
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 relative">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nom du quiz</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Le Grand Choc des Cerveaux"
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-zinc-600"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Description (optionnelle)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dites à vos spectateurs ce qui les attend..."
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none h-16 placeholder:text-zinc-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Thème</label>
            <div className="relative">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full appearance-none bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all cursor-pointer"
              >
                {Object.entries(themes).map(([id, t]: [string, any]) => (
                  <option key={id} value={id} className="bg-zinc-900 text-white">
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Temps / Question</label>
            <div className="grid grid-cols-4 gap-2 h-[40px]">
              {[10, 15, 20, 30].map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setTimeLimit(time)}
                  className={`rounded-lg font-bold font-mono text-[10px] transition-all ${timeLimit === time ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/20' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:border-violet-500/30'}`}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-1 shadow-xl shadow-violet-600/20 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-sm"
        >
          <Play className="w-5 h-5 fill-current" />
          Lancer le Quiz
        </button>
      </form>
    </div>
  );
}
