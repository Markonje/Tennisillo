import React from 'react';
import ReactDOM from 'react-dom';
import { tokens } from '../tokens';

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
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{
        background: tokens.glass.overlayBg,
        backdropFilter: tokens.glass.overlayBlur,
        WebkitBackdropFilter: tokens.glass.overlayBlur,
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth,
          background: tokens.glass.modalBg,
          backdropFilter: tokens.glass.modalBlur,
          WebkitBackdropFilter: tokens.glass.modalBlur,
          border: tokens.glass.cardBorder,
          borderRadius: 20,
          boxShadow: tokens.glass.cardShadow,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white/90 hover:bg-white/10 transition-all cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}
