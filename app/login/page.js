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
