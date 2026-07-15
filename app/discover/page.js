import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabaseServer';
import SwipeDeck from './SwipeDeck';
import TabBar from '../components/TabBar';

export default async function DiscoverPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('profiles')
    .select('points, bio')
    .eq('id', user.id)
    .single();

  if (!me?.bio) redirect('/onboarding');

  const { data: alreadySwiped } = await supabase
    .from('swipes')
    .select('target_id')
    .eq('swiper_id', user.id);

  const excludeIds = [user.id, ...(alreadySwiped || []).map((s) => s.target_id)];

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, display_name, age, bio, tags, photo_url')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(10);

  return (
    <>
      <div className="hud">
        <div className="brand">Bi <span style={{ WebkitTextStroke: '0.5px var(--ink)' }}>The</span> Way</div>
        <div className="points-pill"><span className="dot"></span>{me?.points ?? 0}</div>
      </div>
      <SwipeDeck initialCandidates={candidates || []} />
      <TabBar active="discover" />
    </>
  );
}
