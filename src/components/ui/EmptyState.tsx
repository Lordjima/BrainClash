import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionLink?: string;
}

export function EmptyState({ icon, title, description, actionText = 'RETOUR', onAction, actionLink = '/' }: EmptyStateProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      navigate(actionLink);
    }
  };

  return (
    <div className="h-full flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="w-24 h-24 bg-zinc-900/50 rounded-[40px] flex items-center justify-center mx-auto border border-white/5 shadow-2xl">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{title}</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed">
            {description}
          </p>
        </div>
        {actionText && (
          <Button onClick={handleAction} variant="secondary" className="w-full justify-center">
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
}
