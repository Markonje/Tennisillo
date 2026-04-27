import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

interface Props {
  params: { locale: string };
}

export default async function HomePage({ params: { locale } }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/login`);
  }
}
