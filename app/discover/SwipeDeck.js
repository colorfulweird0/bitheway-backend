'use client';

import { useState } from 'react';

export default function SwipeDeck({ initialCandidates }) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [matchInfo, setMatchInfo] = useState(null);
  const [pointsFlash, setPointsFlash] = useState(null);
  const [busy, setBusy] = useState(false);

  const current = candidates[0];

  async function swipe(direction) {
    if (!current || busy) return;
    setBusy(true);

    const res = await fetch('/api/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: current.id, direction })
    });
    const result = await res.json();

    if (result.pointsAwarded) {
      setPointsFlash(result.pointsAwarded);
      setTimeout(() => setPointsFlash(null), 1200);
    }

    if (result.matched) {
      setMatchInfo(current);
    }

    setCandidates((prev) => prev.slice(1));
    setBusy(false);
  }

  if (matchInfo) {
    return (
      <div style={{
        flex: 1, background: 'var(--ink)', color: 'white',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, textAlign: 'center'
      }}>
        <div className="brand" style={{
          fontSize: 30,
          background: 'linear-gradient(90deg, var(--blue), var(--pink))',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          marginBottom: 8
        }}>
          It's a match!
        </div>
        <p style={{ color: '#C9C4D1', fontSize: 13, marginBottom: 24 }}>
          You and {matchInfo.display_name} both swiped right
        </p>
        <button className="btn-primary" style={{ marginBottom: 10 }} onClick={() => setMatchInfo(null)}>
          Keep swiping
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
        You're all caught up. Check back soon for new profiles.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative', padding: '14px 16px 8px' }}>
      {pointsFlash && (
        <div style={{
          position: 'absolute', top: 8, right: 24, zIndex: 10,
          background: 'var(--ink)', color: 'white',
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12,
          padding: '4px 10px', borderRadius: 20
        }}>
          +{pointsFlash} pts
        </div>
      )}

      <div style={{
        borderRadius: 24, overflow: 'hidden', background: 'var(--card-bg)',
        border: '2px solid var(--ink)', height: 480
      }}>
        <div style={{
          height: '60%',
          background: 'linear-gradient(160deg, var(--blue) 0%, var(--lav) 55%, var(--pink) 100%)'
        }} />
        <div style={{ padding: '14px 16px' }}>
          <div className="brand" style={{ fontSize: 20, display: 'flex', gap: 6, alignItems: 'baseline' }}>
            {current.display_name}, {current.age}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0' }}>{current.bio}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {(current.tags || []).map((t) => (
              <span key={t} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 14, background: '#F1EDF4', color: '#544F5D' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '16px 0' }}>
        <button onClick={() => swipe('pass')} disabled={busy} style={circleBtn('white', 'var(--ink)')}>✕</button>
        <button onClick={() => swipe('super')} disabled={busy} style={circleBtn('var(--blue-deep)', 'var(--ink)', 40)}>★</button>
        <button onClick={() => swipe('like')} disabled={busy} style={circleBtn('var(--pink-deep)', 'white')}>♥</button>
      </div>
    </div>
  );
}

function circleBtn(bg, color, size = 52) {
  return {
    width: size, height: size, borderRadius: '50%',
    border: '2px solid var(--ink)', background: bg, color,
    fontSize: size > 44 ? 15 : 20, fontWeight: 700
  };
}
