import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabaseServer';
import TabBar from '../components/TabBar';
import SignOutButton from './SignOutButton';

function levelFromPoints(points) {
  const level = Math.floor(points / 500) + 1;
  const into = points % 500;
  return { level, into, next: 500 };
}

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, age, points, streak_days')
    .eq('id', user.id)
    .single();

  const { count: matchCount } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const { count: dateCount } = await supabase
    .from('dates_logged')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const points = profile?.points ?? 0;
  const { level, into, next } = levelFromPoints(points);
  const fillSegments = Math.round((into / next) * 10);

  return (
    <>
      <div className="hud">
        <div className="brand">Your stats</div>
        <div className="points-pill"><span className="dot"></span>{points}</div>
      </div>

      <div style={{ flex: 1, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue), var(--pink))',
            border: '2px solid var(--ink)'
          }} />
          <div>
            <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 700, fontSize: 17 }}>
              {profile?.display_name}, {profile?.age}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              LEVEL {level}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          <span>PROGRESS</span>
          <span>{into} / {next}</span>
        </div>
        <div style={{ height: 10, background: '#EFEAF2', borderRadius: 6, display: 'flex', gap: 2, padding: 1, marginBottom: 20 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} style={{
              flex: 1, borderRadius: 2,
              background: i < fillSegments ? 'linear-gradient(90deg, var(--blue-deep), var(--pink-deep))' : '#EFEAF2'
            }} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard num={points} label="Total points" />
          <StatCard num={matchCount ?? 0} label="Matches" />
          <StatCard num={profile?.streak_days ?? 0} label="Day streak" />
          <StatCard num={dateCount ?? 0} label="Dates logged" />
        </div>

        <div style={{ marginTop: 24 }}>
          <SignOutButton />
        </div>
      </div>

      <TabBar active="profile" />
    </>
  );
}

function StatCard({ num, label }) {
  return (
    <div style={{ background: '#F8F6FA', borderRadius: 14, padding: 12, border: '1.5px solid var(--ink)' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 19 }}>{num}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}
