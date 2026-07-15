'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button className="btn-ghost" onClick={handleSignOut}>
      Sign out
    </button>
  );
}
