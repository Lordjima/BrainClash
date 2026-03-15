import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  className?: string;
  contentClassName?: string;
}

export function PageLayout({ children, maxWidth = 'max-w-full', className = '', contentClassName = '' }: PageLayoutProps) {
  return (
    <div className={`bc-page-container relative overflow-y-auto custom-scrollbar ${className}`}>
      <div className={`bc-content-wrapper ${maxWidth} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
