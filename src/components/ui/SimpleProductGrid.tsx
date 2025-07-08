// src/components/ui/SimpleProductGrid.tsx
import React from 'react';

export interface SimpleProductGridProps {
  children: React.ReactNode;
  cols: number;
  gap?: 'small' | 'medium' | 'large';
}

export default function SimpleProductGrid({ children, cols, gap = 'medium' }: SimpleProductGridProps) {
  const gapClasses = {
    small: 'gap-4',
    medium: 'gap-6',
    large: 'gap-8'
  };

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${colClasses[cols as keyof typeof colClasses] || colClasses[3]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
}