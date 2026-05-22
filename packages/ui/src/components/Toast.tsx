'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const item = cva(
  [
    'flex items-center gap-2.5 rounded-[14px] border backdrop-glass pointer-events-auto',
    'shadow-[0_10px_30px_rgba(0,0,0,0.3)] px-4 py-3 min-w-[260px] animate-slide-in',
  ],
  {
    variants: {
      tone: {
        success: 'bg-success/15 border-success/40',
        info:    'bg-blue-faint  border-[rgba(121,167,216,0.4)]',
        warning: 'bg-warning-faint border-warning/40',
        danger:  'bg-danger-faint  border-danger/40',
      },
    },
  }
);

const ICON: Record<ToastTone, string>      = { success: '✓', info: 'ℹ', warning: '!', danger: '✕' };
const ICON_CLS: Record<ToastTone, string>  = {
  success: 'text-accent-light',
  info:    'text-blue-light',
  warning: 'text-warning-light',
  danger:  'text-danger-light',
};

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={item({ tone: t.tone })}>
          <span className={cn('text-sm font-bold shrink-0', ICON_CLS[t.tone])} aria-hidden="true">
            {ICON[t.tone]}
          </span>
          <span className="text-[13px] text-primary-glass flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => onRemove(t.id)}
            className="p-0 bg-transparent border-none text-tertiary-glass hover:text-secondary-glass transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
