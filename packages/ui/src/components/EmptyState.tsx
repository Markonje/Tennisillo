import React from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon && (
        <div className="text-4xl mb-4 text-tertiary-glass">{icon}</div>
      )}
      <p className="text-base font-bold text-secondary-glass mb-1">{title}</p>
      {description && (
        <p className="text-sm text-tertiary-glass mb-4 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}
