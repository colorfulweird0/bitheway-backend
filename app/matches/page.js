import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabaseServer';
import TabBar from '../components/TabBar';

export default async function MatchesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, user_a, user_b, created_at')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const otherIds = (matches || []).map((m) => (m.user_a === user.id ? m.user_b : m.user_a));

  let profilesById = {};
  if (otherIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, age')
      .in('id', otherIds);
    profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  return (
    <>
      <div className="hud">
        <div className="brand">Your matches</div>
      </div>

      <div style={{ flex: 1, padding: 16 }}>
        {(!matches || matches.length === 0) && (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            No matches yet. Head to Discover and start swiping.
          </p>
        )}

        {(matches || []).map((m) => {
          const other = profilesById[m.user_a === user.id ? m.user_b : m.user_a];
          if (!other) return null;
          return (
            <Link key={m.id} href={`/matches/${m.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 4px', borderBottom: '1px solid #EEE9F1',
              textDecoration: 'none', color: 'inherit'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--blue), var(--pink))',
                border: '2px solid var(--ink)'
              }} />
              <div>
                <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 700, fontSize: 15 }}>
                  {other.display_name}, {other.age}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Matched {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <TabBar active="matches" />
    </>
  );
}
