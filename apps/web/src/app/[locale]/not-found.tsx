import Link from 'next/link';
import { GlassCard, Button } from '@tennisillo/ui';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2818 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <GlassCard style={{ padding: '40px 48px', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎾</div>
        <h1 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Pagina non trovata
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
          La pagina che cerchi non esiste o è stata spostata.
        </p>
        <Link href="/dashboard">
          <Button variant="primary">Torna alla Dashboard</Button>
        </Link>
      </GlassCard>
    </div>
  );
}
