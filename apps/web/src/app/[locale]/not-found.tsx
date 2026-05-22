import Link from 'next/link';
import { GlassCard, Button } from '@tennisillo/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-12 text-center max-w-sm">
        <div className="text-6xl mb-4">🎾</div>
        <h1 className="text-2xl font-extrabold text-primary-glass mb-2">
          Pagina non trovata
        </h1>
        <p className="text-sm text-tertiary-glass mb-6">
          La pagina che cerchi non esiste o è stata spostata.
        </p>
        <Link href="/leagues">
          <Button variant="primary">Torna alle leghe</Button>
        </Link>
      </GlassCard>
    </div>
  );
}
