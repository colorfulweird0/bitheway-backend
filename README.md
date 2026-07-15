# Bi The Way

A gamified dating app: swipe right, match, and go on dates to earn points and level up.

## 🚀 Go live checklist (Supabase → GitHub → Vercel)

Follow this in order — each step depends on the one before it.

**1. Supabase — database, auth, storage**
- Create a free project at supabase.com.
- SQL Editor → New query → paste in `supabase/schema.sql` → Run. This creates every
  table, RLS policy, and the points/matching functions.
- Storage → New bucket → name it exactly `photos` → toggle **Public bucket** ON → Create.
- SQL Editor → New query → paste in `supabase/storage_policies.sql` → Run.
- Authentication → Providers → confirm **Email** is enabled (it is by default).
- Authentication → URL Configuration → set **Site URL** to your future Vercel domain
  once you have it (you can come back and update this after step 3 — see note below).
- Project Settings → API → copy the **Project URL** and **anon public key**. You'll need
  both in step 3.

**2. GitHub — get the code into a repo**
```bash
cd bi-the-way
git init
git add .
git commit -m "Initial commit: Bi The Way"
```
Create a new empty repo on GitHub (no README/license, so it doesn't conflict), then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/bi-the-way.git
git branch -M main
git push -u origin main
```

**3. Vercel — deploy**
- vercel.com → Add New → Project → import the `bi-the-way` GitHub repo.
- Framework preset should auto-detect as Next.js — leave build settings default.
- Before deploying, add two Environment Variables (Project Settings → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
- Deploy.
- Once deployed, copy your live URL (e.g. `https://bi-the-way.vercel.app`), go back to
  Supabase → Authentication → URL Configuration, and set **Site URL** (and add it under
  **Redirect URLs**) to that domain. This step matters — without it, auth redirects can
  misbehave in production even though everything works fine locally.

**4. Smoke test on the live URL**
- Sign up with a real email → you should land on onboarding.
- Complete onboarding with a photo → confirm the photo actually appears (this checks the
  storage bucket + policies are correct).
- Open a second browser (or incognito) and sign up as a second test account, swipe right
  on each other from both sides, confirm you get a match and points update.
- Open the match, send a message from each account, confirm it arrives live without a
  refresh.

That last step exercises every piece of the stack — auth, database writes, storage,
RLS, and realtime — so if it all works, you're genuinely live.

## Stack
- **Frontend/backend**: Next.js 14 (App Router), deployed on Vercel
- **Database + auth**: Supabase (Postgres, row-level security, email/password auth)

## Local setup

1. **Create a Supabase project** at supabase.com (free tier is fine).
2. In the Supabase dashboard, go to **SQL Editor → New query**, paste in the contents of
   `supabase/schema.sql`, and run it. This creates all tables, RLS policies, and the
   `award_points` / `try_create_match` functions that power the point system.
3. **Create a storage bucket** for photos: Storage → New bucket → name it exactly
   `photos` → toggle **Public bucket** ON → Create.
4. Back in the SQL editor, run `supabase/storage_policies.sql` to lock down uploads so
   people can only write into their own folder.
5. In **Project Settings → API**, copy your project URL and anon public key.
6. Copy `.env.local.example` to `.env.local` and fill in those two values.
7. Install dependencies and run locally:
   ```
   npm install
   npm run dev
   ```
8. Visit `http://localhost:3000`, create an account — you'll land on the onboarding
   form (photo, age, bio, interests) before you can start swiping.

## How the points system works

- Swipe right (like): **+10 points**, awarded server-side in `app/api/swipe/route.js`
- Super like: **+15 points**
- Mutual match: **+50 points** to both people, detected by the `try_create_match`
  Postgres function so it's atomic and can't be gamed from the client
- Every award is logged in `points_ledger` so you always have an audit trail, and
  `profiles.points` is kept in sync automatically
- Levels are derived from total points (500 points per level) rather than stored,
  so the math can't drift out of sync

## What's stubbed / not built yet

- **"Date logged" points**: the `dates_logged` table and its RLS policy exist, but there's
  no UI action to log a date and call `award_points` for it yet.
- **Streaks**: `streak_days` exists on the profile but nothing increments it yet — needs a
  daily-swipe check, probably a Supabase Edge Function or a check on each swipe.
- **Discovery filtering**: current query just excludes already-swiped profiles — no
  distance, age range, or preference filtering yet.
- **Editing your profile after onboarding**: the onboarding form works for first-time setup
  and will happily re-run if you visit `/onboarding` again, but there's no "edit profile"
  entry point from the Profile tab yet.
- **Chat notifications/read receipts**: messages send and arrive live, but there's no
  unread badge, push notification, or read-state tracking yet.

## Chat

Once two people match, a `matches` row exists and either person can open the thread
from the Matches tab. Messages are stored in a `messages` table with row-level security
that only lets the two matched people read or write in that thread — nobody else can
query into it, even with a valid API key. New messages arrive live via Supabase Realtime,
so both people see the conversation update without refreshing.

Realtime is turned on for the `messages` table by the `alter publication supabase_realtime
add table messages;` line at the bottom of `schema.sql` — that's already included when you
run the schema, no extra dashboard step needed.

**If you already ran `schema.sql` in a previous session**, don't re-run the whole file —
run `supabase/migration_002_messages.sql` instead, it only adds the new chat pieces.

## Before you open this up to real users

The code above gets you a working, deployed app — but a dating app collecting real
people's photos, locations, and messages has a few things worth handling before a public
launch that aren't code problems:

- **Blocking/reporting**: there's currently no way for a user to block or report another
  user. For a real dating app this matters a lot — worth prioritizing before real strangers
  are messaging each other.
- **Age verification**: the signup form requires 18+ but doesn't verify it — it's an
  honesty check, not a gate. Worth knowing that distinction going in.
- **Privacy policy / terms of service**: you're collecting photos, bios, and messages;
  most app stores and ad/payment processors will expect a privacy policy before you can
  monetize or distribute widely.
- **Moderation**: no content moderation on bios, photos, or messages yet — something to
  plan for before opening signups publicly, even informally (e.g. a report button that
  emails you, to start).

None of this blocks a private beta with friends, but it's the gap between "deployed" and
"ready for the public app stores or a wide launch."

## Project structure

```
middleware.js                      keeps Supabase auth sessions refreshed in production
next.config.js
.gitignore
app/
  login/page.js                  sign in / sign up
  onboarding/page.js              profile setup (server) + OnboardingForm.js (client)
  discover/page.js                swipe deck (server) + SwipeDeck.js (client)
  matches/page.js                  matches list, links into each chat thread
  matches/[matchId]/page.js        chat thread (server) + ChatWindow.js (client, realtime)
  profile/page.js                  real stats (points, matches, streak, dates) + SignOutButton.js
  api/swipe/route.js               records swipe, awards points, checks for a match
  components/TabBar.js             shared bottom nav
lib/
  supabaseClient.js                browser Supabase client
  supabaseServer.js                server Supabase client (cookies-based auth)
supabase/
  schema.sql                       run this once in the Supabase SQL editor (fresh setup)
  migration_002_messages.sql       run this instead if you'd already run schema.sql pre-chat
  storage_policies.sql             run after creating the "photos" bucket
```
