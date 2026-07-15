import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../lib/supabaseServer';
import ChatWindow from './ChatWindow';

export default async function ChatPage({ params }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const matchId = params.matchId;

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b')
    .eq('id', matchId)
    .single();

  if (!match || (match.user_a !== user.id && match.user_b !== user.id)) {
    notFound();
  }

  const otherId = match.user_a === user.id ? match.user_b : match.user_a;

  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('display_name, age')
    .eq('id', otherId)
    .single();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  return (
    <>
      <div className="hud" style={{ alignItems: 'center' }}>
        <div className="brand" style={{ fontSize: 17 }}>
          {otherProfile?.display_name}, {otherProfile?.age}
        </div>
        <a href="/matches" style={{ fontSize: 12, color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>
          Back
        </a>
      </div>
      <ChatWindow
        matchId={matchId}
        currentUserId={user.id}
        initialMessages={messages || []}
      />
    </>
  );
}
