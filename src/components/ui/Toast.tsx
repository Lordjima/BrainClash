import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type: 'success' | 'error';
}

export function Toast({ message, type }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-8 left-1/2 -translate-x-1/2 z-[9999] backdrop-blur text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-2xl border ${
            type === 'error' ? 'bg-red-500/90 border-red-400' : 'bg-green-500/90 border-green-400'
          }`}
        >
          {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
