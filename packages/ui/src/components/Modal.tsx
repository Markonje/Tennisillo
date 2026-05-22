'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { cn } from '../lib/cn';

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: number | string;
}

export function Modal({ title, children, onClose, maxWidth = 480 }: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => prev?.focus();
  }, []);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/55 backdrop-blur-[10px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'animate-modal-in w-full rounded-[24px] border border-glass-hover',
          'bg-glass-card-hover backdrop-glass shadow-[0_32px_80px_rgba(0,0,0,0.5)]',
          'p-7 outline-none',
        )}
        style={{ maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="modal-title" className="m-0 text-lg font-bold text-primary-glass">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-icon',
              'border border-glass bg-glass-subtle',
              'text-sm text-tertiary-glass hover:text-primary-glass transition-colors',
            )}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
