'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabaseClient';

const PRESET_TAGS = [
  'Loves karaoke', 'Dog person', 'Cat person', 'Bookworm', 'Gym rat',
  'Foodie', 'Homebody', 'Traveler', 'Gamer', 'Artsy', 'Coffee snob', 'Night owl'
];

export default function OnboardingForm({ profile }) {
  const supabase = createClient();
  const router = useRouter();

  const [age, setAge] = useState(profile?.age && profile.age !== 18 ? profile.age : '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [tags, setTags] = useState(profile?.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(profile?.photo_url || null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleTag(tag) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function addCustomTag() {
    const t = customTag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setCustomTag('');
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!age || age < 18) { setError('You need to be 18 or older.'); return; }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expired, sign in again.'); setSaving(false); return; }

    let photoUrl = profile?.photo_url || null;

    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) { setError(uploadError.message); setSaving(false); return; }

      const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(path);
      photoUrl = publicUrlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ age: Number(age), bio, tags, photo_url: photoUrl })
      .eq('id', user.id);

    if (updateError) { setError(updateError.message); setSaving(false); return; }

    setSaving(false);
    router.push('/discover');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        border: '2px solid var(--ink)', overflow: 'hidden',
        background: preview ? `center/cover no-repeat url(${preview})` : 'linear-gradient(135deg, var(--blue), var(--pink))',
        marginBottom: 10
      }} />
      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
        Profile photo
      </label>
      <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: 16, border: 'none', padding: 0 }} />

      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Age</label>
      <input type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" required />

      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Bio</label>
      <textarea rows={4} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you're into" />

      <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', margin: '4px 0 8px' }}>Interests</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {PRESET_TAGS.map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 16,
              border: '1.5px solid var(--ink)',
              background: tags.includes(tag) ? 'linear-gradient(90deg, var(--blue), var(--pink))' : 'white',
              fontWeight: 500
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          placeholder="Add your own"
          style={{ marginBottom: 0 }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
        />
        <button type="button" onClick={addCustomTag} className="btn-ghost" style={{ width: 'auto', padding: '10px 16px' }}>
          Add
        </button>
      </div>

      {error && <p style={{ color: 'var(--pink-deep)', fontSize: 13, marginBottom: 10 }}>{error}</p>}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save and start swiping'}
      </button>
    </form>
  );
}
