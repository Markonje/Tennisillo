import React from 'react';
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

const TONE_STYLE: Record<ToastTone, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(185,255,90,0.15)', border: 'rgba(185,255,90,0.4)', icon: '✓' },
  info:    { bg: 'rgba(121,167,216,0.15)', border: 'rgba(121,167,216,0.4)', icon: 'ℹ' },
  warning: { bg: 'rgba(242,211,94,0.15)', border: 'rgba(242,211,94,0.4)', icon: '⚠' },
  danger:  { bg: 'rgba(233,109,109,0.15)', border: 'rgba(233,109,109,0.4)', icon: '✕' },
};

const TONE_TEXT: Record<ToastTone, string> = {
  success: '#C8FF78',
  info:    '#9ABFDD',
  warning: '#F5D96A',
  danger:  '#F09090',
};

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <>
      <style>{`
        @keyframes _toast-slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        ._toast-item { animation: _toast-slide-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map((t) => {
          const s = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                '_toast-item pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl',
              )}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
              }}
            >
              <span
                className="shrink-0 mt-0.5 text-sm font-bold w-5 h-5 flex items-center justify-center rounded-full"
                style={{ color: TONE_TEXT[t.tone] }}
              >
                {s.icon}
              </span>
              <p className="flex-1 text-sm text-white/90">{t.message}</p>
              <button
                type="button"
                onClick={() => onRemove(t.id)}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5 cursor-pointer"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
