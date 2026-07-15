'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';

export default function ChatWindow({ matchId, currentUserId, initialMessages }) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setDraft('');

    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: currentUserId, body })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data]);
    }
    setSending(false);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            You matched — say hi.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '9px 13px',
                borderRadius: 16,
                fontSize: 14,
                border: '1.5px solid var(--ink)',
                background: mine ? 'linear-gradient(90deg, var(--blue), var(--pink))' : '#F8F6FA',
                color: 'var(--ink)'
              }}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: '10px 16px 18px', borderTop: '1px solid #EEE9F1' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          style={{ marginBottom: 0, flex: 1 }}
        />
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 18px' }} disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
