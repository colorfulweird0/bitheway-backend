import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { targetId, direction } = await request.json();

  if (!targetId || !['like', 'pass', 'super'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid swipe payload' }, { status: 400 });
  }

  const { error: swipeError } = await supabase
    .from('swipes')
    .insert({ swiper_id: user.id, target_id: targetId, direction });

  if (swipeError) {
    return NextResponse.json({ error: swipeError.message }, { status: 400 });
  }

  let matched = false;
  let pointsAwarded = 0;

  if (direction === 'like' || direction === 'super') {
    pointsAwarded = direction === 'super' ? 15 : 10;
    await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_amount: pointsAwarded,
      p_reason: 'swipe_right'
    });

    const { data: matchResult } = await supabase.rpc('try_create_match', {
      p_swiper: user.id,
      p_target: targetId
    });
    matched = !!matchResult;
    if (matched) pointsAwarded += 50;
  }

  return NextResponse.json({ matched, pointsAwarded });
}
