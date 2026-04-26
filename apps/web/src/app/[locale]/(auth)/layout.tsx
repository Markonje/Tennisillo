import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1530 50%, #0a0e1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: '#b0ef60', letterSpacing: '-0.03em' }}>
          Tennisillo
        </span>
      </div>
      {children}
    </div>
  );
}
