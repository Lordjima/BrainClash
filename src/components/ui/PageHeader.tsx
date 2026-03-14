import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, actions, leftContent }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
      <div className="flex items-center gap-4">
        {leftContent}
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
            {icon}
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl">
          {actions}
        </div>
      )}
    </div>
  );
}
