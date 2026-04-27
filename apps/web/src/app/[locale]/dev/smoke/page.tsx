import { redirect } from 'next/navigation';
import { SmokePage } from '../../_smoke';

export default function SmokeTestPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/');
  }

  return <SmokePage />;
}
