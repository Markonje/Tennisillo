'use client';

import React from 'react';
import ReactDOM from 'react-dom';

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: number;
}

export function Modal({ title, children, onClose, maxWidth = 480 }: ModalProps) {
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const content = (
    <>
      <style>{`
        @keyframes _modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        ._modal-card { animation: _modal-in 0.22s ease both; }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="_modal-card"
          style={{
            background: 'linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 24,
            backdropFilter: 'blur(36px) saturate(150%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            padding: '28px 32px',
            width: '100%',
            maxWidth,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{title}</h3>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}
