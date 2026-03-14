import React from 'react';

interface BadgeProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'amber' | 'fuchsia' | 'blue' | 'yellow' | 'zinc';
  className?: string;
}

export function Badge({ icon, children, variant = 'zinc', className = '' }: BadgeProps) {
  const variants = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-500',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    zinc: 'bg-zinc-800 border-zinc-700 text-zinc-300',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${variants[variant]} ${className}`}>
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span className="font-mono font-black">{children}</span>
    </div>
  );
}
