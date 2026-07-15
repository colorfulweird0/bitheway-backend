import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabaseServer';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, age, bio, tags, photo_url')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ padding: '32px 20px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="brand" style={{ fontSize: 22, marginBottom: 4 }}>Set up your profile</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          This is what people see when you show up in their deck.
        </p>
      </div>
      <OnboardingForm profile={profile} />
    </div>
  );
}
