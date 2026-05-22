import type { ReactNode } from 'react';
import { LogoMark } from '@tennisillo/ui';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-2.5">
        <LogoMark size={30} />
        <span className="text-2xl font-black text-accent-light tracking-tight">Tennisillo</span>
      </div>
      {children}
    </div>
  );
}
