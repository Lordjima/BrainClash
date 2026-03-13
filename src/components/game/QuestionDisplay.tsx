import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Question } from '../../types';

interface QuestionDisplayProps {
  question: Question;
  selectedAnswer: number | null;
  showAnswer: boolean;
  onAnswer: (index: number) => void;
  isCorrect: boolean;
  isFastest: boolean;
}

export default function QuestionDisplay({
  question,
  selectedAnswer,
  showAnswer,
  onAnswer,
  isCorrect,
  isFastest
}: QuestionDisplayProps) {
  return (
    <div className="flex-1 flex flex-col justify-center w-full mx-auto">
      <AnimatePresence mode="wait">
        {!showAnswer && selectedAnswer === null && (
          <motion.div
            key="answering"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid grid-cols-1 gap-3"
          >
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                className="bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-fuchsia-500 transition-all p-3 rounded-xl text-base font-bold text-left flex items-center gap-4 active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-mono text-zinc-400 shrink-0">
                  {i + 1}
                </div>
                {opt}
              </button>
            ))}
          </motion.div>
        )}

        {!showAnswer && selectedAnswer !== null && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Réponse enregistrée !</h3>
            <p className="text-zinc-400 text-sm">Regardez le stream en attendant les autres...</p>
          </motion.div>
        )}

        {showAnswer && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            {selectedAnswer === null ? (
              <>
                <XCircle className="w-20 h-20 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-zinc-400">Temps écoulé !</h3>
                <p className="text-zinc-400 text-sm">La bonne réponse était : <strong className="text-white">{question.options[question.correctOptionIndex]}</strong></p>
              </>
            ) : isCorrect ? (
              <>
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-green-400">Bonne réponse !</h3>
                {isFastest ? (
                  <p className="text-yellow-500 font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">⚡</span> Vous avez été le plus rapide !
                  </p>
                ) : (
                  <p className="text-zinc-400">Bien joué !</p>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-red-400">Mauvaise réponse...</h3>
                <p className="text-zinc-400 text-sm">La bonne réponse était : <strong className="text-white">{question.options[question.correctOptionIndex]}</strong></p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
