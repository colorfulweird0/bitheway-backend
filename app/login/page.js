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
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || 'New member' } }
      });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }

      if (!data.session) {
        setLoading(false);
        setConfirmationSent(true);
        return;
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

      {confirmationSent ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 20
