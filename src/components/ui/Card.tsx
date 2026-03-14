import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false, ...props }: CardProps) {
  const baseClasses = "bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 shadow-xl";
  const hoverClasses = hoverable ? "transition-all hover:border-fuchsia-500/30 group" : "";
  
  return (
    <motion.div 
      whileHover={hoverable ? { y: -5 } : undefined}
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
