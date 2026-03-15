import React from 'react';

interface BadgeProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'amber' | 'fuchsia' | 'blue' | 'yellow' | 'zinc' | 'red' | 'green' | 'emerald';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ icon, children, variant = 'zinc', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    amber: 'bg-amber-500/10 text-amber-500',
    fuchsia: 'bg-fuchsia-500/10 text-fuchsia-500',
    blue: 'bg-blue-500/10 text-blue-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
    green: 'bg-green-500/10 text-green-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    zinc: 'bg-zinc-500/10 text-zinc-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[8px] sm:text-[10px]',
    md: 'px-3 py-1.5 text-xs',
  };

  return (
    <div className={`inline-flex items-center justify-center gap-1.5 rounded-full font-black uppercase tracking-widest ${variants[variant]} ${sizes[size]} ${className}`}>
      {icon && <span className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
