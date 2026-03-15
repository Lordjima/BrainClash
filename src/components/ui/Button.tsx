import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  onClick?: any;
  disabled?: boolean;
  type?: any;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const baseClasses = "cursor-pointer font-black uppercase tracking-widest transition-all active:scale-95 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-accent-600 hover:bg-accent-500 text-white shadow-md shadow-accent-600/10 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none",
    secondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-2.5 text-xs",
    lg: "px-8 py-4 text-sm",
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
