'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          display_name: displayName || 'New member',
          age: 18
        });
        if (profileError) { setError(profileError.message); setLoading(false); return; }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
    }

    setLoading(false);
    router.push(mode === 'signup' ? '/onboarding' : '/discover');
    router.refresh();
  }

  return (
    <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="brand" style={{ fontSize: 28, marginBottom: 4 }}>
          Bi <span style={{ WebkitTextStroke: '0.5px var(--ink)' }}>The</span> Way
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Swipe, match, and level up.</div>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p style={{ color: 'var(--pink-deep)', fontSize: 13, marginBottom: 10 }}>{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginBottom: 12 }}>
          {loading ? 'One sec…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button
        className="btn-ghost"
        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </div>
  );
}
