# Brave & Boundless — Mobile App Build Brief

This file is the project brief for Claude Code. Read it fully before touching code. Keep it at the repo root as `CLAUDE.md` and update the **Decisions log** as the build progresses.

## 1. What we are building

A mobile app (iOS + Android) that helps a reader of *Brave & Boundless* by Mark A. Nead turn the book's 15 rules into daily practice. The app is a companion to the book, not a replacement for it. Its voice is the author's: direct, no fluff, a little profane, earned through real failure.

**Phase 1 (this build):** solo use. Daily drill, progress tracking, inspiration from the book.
**Phase 2 (later, design for it now):** connect users who share the same struggle into small support groups.

Tagline / brand line: **ONLY THE BRAVE BECOME BOUNDLESS**. Motifs: fire, mountain, transformation.

## 2. Source of truth for content

- `content/bb-rule-cards.json` — the 15 rules, each with six fields taken verbatim from the book's *Boundless Rule Cards* (pp. 273–277, Oct 19 2026 manuscript). **Never rewrite this copy.** It matches what readers see in print.
- The book's structure: 4 parts, 15 chapters, one rule per chapter.
  - Part I FIRE (Origin & First Breaks): rules 1–4
  - Part II FORGE (Skills & Systems): rules 5–8
  - Part III FOUNDATION (Core Pillars): rules 9–12
  - Part IV FIELD (Impact & Legacy): rules 13–15
- `content/passages.json` — daily inspiration passages from the chapters, tagged by rule and situation. (Mark will supply this file; until it exists, stub the feed with the card's `why_it_matters` and `mantra` fields and do not invent book quotes.)

Each rule card has these fields and the app must use all six:

| Field | What it is | How the app uses it |
|---|---|---|
| `why_it_matters` | One-line thesis | Shown at the top of the rule screen |
| `drills.five_minute` | Lowest-effort action | Day 1 of a rule, and the fallback "I only have five minutes" option |
| `drills.uncomfortable` | The stretch action | Day 2 of a rule; weekly challenge |
| `drills.daily` | The habit to repeat | Day 3 onward; the recurring check-in |
| `scorecard` | The metric the author tracks | Defines what Progress shows for this rule |
| `mantra` | One-liner | Push notification copy and streak-celebration copy |

## 3. Core experience

### Onboarding — "The Daily Drill" (45-day spine)
- 15 rules × 3 days each = 45 days. Order is linear, rule 1 → 15, following the book.
- Day pattern per rule: Day 1 = `five_minute`, Day 2 = `uncomfortable`, Day 3 = `daily`.
- Each morning: one push notification (the rule's `mantra`) opening to a single screen with that day's drill. One tap: **Did it** / **Dodged it**.
- Each evening: a one-line report-back prompt ("What did it cost you?" / "What did you learn?"). Optional, 1–3 sentences, saved to the journal.
- Milestones at Day 12 (end of FIRE), 24 (end of FORGE), 36 (end of FOUNDATION), 45 (end of FIELD). Milestone screens use the part name and a short message; no badges, no confetti.
- After Day 45: the user picks which rules to keep running as recurring `daily` drills. The app also surfaces the rules they dodged most ("dodge pattern") and offers to restart on those.

### Screens (phase 1)
1. **Today** — the drill, the two-tap response, evening prompt. This is the home screen.
2. **Rules** — the 15 cards in four part groupings. Tapping a card shows all six fields and the user's history on that rule.
3. **Progress** — streak, current day of 45, a 15-cell "rule map" colored by completion rate, and each rule's `scorecard` as a simple count/ratio.
4. **Journal** — reverse-chronological report-backs, filterable by rule.
5. **Settings** — notification time, account, data export, delete account.

### Tone rules for all UI copy
- Short. Imperative. No exclamation points. No "You've got this!"
- Use the book's words where they exist (`mantra`, `why_it_matters`). Write new copy in the same register.
- "Dodged it" is the honest option; never shame the user for choosing it. Log it and move on.

## 4. Technical decisions

- **Framework:** React Native with Expo (managed workflow). One codebase, OTA updates, EAS for builds.
- **Language:** TypeScript, strict mode.
- **Backend:** Supabase — auth (email + Apple + Google), Postgres, row-level security on from the first migration. Phase 2 community features will live here too, so model users and progress server-side from day one, not local-only.
- **State:** Zustand for client state; TanStack Query for server state.
- **Notifications:** Expo Notifications, local scheduling for the daily push (works offline, no server cron needed in phase 1).
- **Navigation:** Expo Router.
- **Styling:** NativeWind (Tailwind for RN). Dark theme first — ember/charcoal palette with a single warm accent. Brand typeface is Brandon Grotesque (licensed; Mark will supply font files). Fall back to a geometric sans until then.
- **Testing:** Jest + React Native Testing Library for logic; Maestro for a smoke flow (onboard → complete Day 1 → see Progress).

### Data model (initial)
```
users            id, created_at, display_name, tz, notify_at
rules            id (1-15), part, title, chapter, why, drill_5min, drill_uncomfortable, drill_daily, scorecard, mantra
drill_days       id, user_id, day_number (1-45+), rule_id, tier (five_minute|uncomfortable|daily), scheduled_for, status (pending|done|dodged), responded_at
journal_entries  id, user_id, drill_day_id, body, created_at
rule_stats       (view) user_id, rule_id, done_count, dodged_count, current_streak
```
Seed `rules` from `content/bb-rule-cards.json` via a migration script; the JSON stays the editable source.

### Non-negotiables
- Works offline for Today + Journal; syncs when back online.
- Account deletion and data export must exist before any public TestFlight build.
- No analytics SDK in phase 1 beyond Expo's crash reporting. Revisit before launch.
- Accessibility: Dynamic Type, VoiceOver labels on the two drill buttons, contrast ≥ 4.5:1.

## 5. How to work in this repo

1. Start every session by reading this file and `content/bb-rule-cards.json`.
2. Build in this order, one PR each, and stop for Mark's review after each:
   1. Scaffold (Expo + TS + Router + NativeWind), Supabase project, migrations, seed script.
   2. Today screen with the 45-day scheduler and local notifications.
   3. Rules screen.
   4. Progress screen.
   5. Journal + Settings (incl. export/delete).
   6. Day-45 wrap-up and dodge-pattern restart.
3. Before writing a screen, write the copy for it in a `copy/` file and get it approved. Copy is product here.
4. When something in this brief conflicts with reality (an API changed, a library is dead), say so plainly and propose the fix. Do not work around it silently.
5. Keep a running **Decisions log** below. Date each entry.

## 6. Open questions (ask Mark before assuming)
- Linear 45-day spine only, or also let users jump to a rule they're struggling with? (Default: linear only in phase 1.)
- Free vs paid: the June concept had a paid tier for AI coaching after Day 45. Out of scope for phase 1; keep the data model from blocking it.
- Phase 2 matching: by shared rule struggle, groups of 5–8, moderated. Not building yet, but no decision here should make it harder.

## 7. Decisions log
- 2026-11-05 — Rule Cards from the Oct 19 2026 manuscript are the content source of truth; the June "Daily Drill" field drills are superseded by the card drills.
- 2026-11-05 — Phase 1 is solo use only. Community is phase 2.
- 2026-11-06 — Step 1 scaffold. Expo SDK 58 (RN 0.88, React 19.3), TypeScript strict, Expo Router with `src/app/`. Tabs use `expo-router/js-tabs` (the bare `Tabs` export is deprecated in SDK 58) so the tab bar can carry the brand palette and font.
- 2026-11-06 — NativeWind **4.2.7** (latest stable) + Tailwind CSS 3.4. NativeWind 5 is still a release candidate (needs Tailwind 4); revisit when it ships stable. `expo-doctor` passes 20/20.
- 2026-11-06 — Palette lives in `src/theme/palette.js` (charcoal 950–700, bone text, ash secondary, one accent: ember). Every text/background pair is asserted ≥ 4.5:1 in a test.
- 2026-11-06 — Font stand-in is **Jost** (free geometric sans, via `@expo-google-fonts/jost`) until Brandon Grotesque files arrive. Swap point: `src/theme/fonts.ts` + `tailwind.config.js`.
- 2026-11-06 — Data model as briefed, with these additions: `updated_at` on user rows and client-supplied UUIDs (for offline-first sync, last-write-wins in phase 1); `public.users` is created by a trigger on `auth.users` signup and every user table cascades from `auth.users`, so account deletion removes all data; `drill_days` is unique on `(user_id, day_number, rule_id)` so post-Day-45 users can run several rules as dailies on the same day; `rule_stats` is a `security_invoker` view so RLS applies. `current_streak` = consecutive `done` for that rule counting back from the latest answered drill; a `dodged` breaks it, `pending` is ignored.
- 2026-11-06 — `rules` is seeded by a generated migration (`npm run rules:sql`), not `seed.sql`, because `seed.sql` only runs locally and production needs the cards. A copy change makes a new `*_sync_rules.sql` (upsert); CI fails if the JSON and latest rules migration drift.
- 2026-11-06 — `content/passages.json` supplied by Mark and committed. Passages flagged `explicit` stay out of push notifications (tested: every rule has at least one push-safe morning passage).
- 2026-11-06 — App bundle id / package: `com.braveandboundless.app`; URL scheme `braveandboundless`. Needs Mark's confirmation before the first EAS build.
- 2026-11-06 — Placeholder tab screens only. No reader-facing copy written; `copy/navigation.ts` is **draft** (tab names from this brief) pending Mark's approval.
- 2026-11-06 — Supabase client reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase now issues "publishable" keys in place of the legacy anon key). Hosted project not created yet; awaiting Mark's go-ahead (billing/org choice). Google + Apple providers are stubbed in `supabase/config.toml`, disabled until credentials exist.
