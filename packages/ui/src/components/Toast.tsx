'use client';

import React from 'react';

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

const TONE: Record<ToastTone, { bg: string; border: string; icon: string; color: string }> = {
  success: { bg: 'rgba(185,255,90,0.15)',  border: 'rgba(185,255,90,0.4)',  icon: '✓', color: '#c8ff78' },
  info:    { bg: 'rgba(121,167,216,0.15)', border: 'rgba(121,167,216,0.4)', icon: 'ℹ', color: '#9abfdd' },
  warning: { bg: 'rgba(242,211,94,0.15)',  border: 'rgba(242,211,94,0.4)',  icon: '!', color: '#f5d96a' },
  danger:  { bg: 'rgba(233,109,109,0.15)', border: 'rgba(233,109,109,0.4)', icon: '✕', color: '#f09090' },
};

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <>
      <style>{`
        @keyframes _toast-slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        ._toast-item { animation: _toast-slide-in 0.25s ease both; }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const s = TONE[t.tone];
          return (
            <div
              key={t.id}
              className="_toast-item"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 14,
                padding: '12px 16px',
                backdropFilter: 'blur(24px)',
                pointerEvents: 'all',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 260,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 }}>{t.message}</span>
              <button
                type="button"
                onClick={() => onRemove(t.id)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 0 }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
