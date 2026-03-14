import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  className?: string;
}

export function PageLayout({ children, maxWidth = 'max-w-7xl', className = '' }: PageLayoutProps) {
  return (
    <div className={`bc-page-container relative ${className}`}>
      <div className={`bc-content-wrapper ${maxWidth}`}>
        {children}
      </div>
    </div>
  );
}
