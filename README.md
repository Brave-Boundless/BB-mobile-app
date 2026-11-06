# Brave & Boundless — mobile app

Companion app for *Brave & Boundless* by Mark A. Nead. Turns the book's 15 rules into daily practice.

**Read [`CLAUDE.md`](./CLAUDE.md) first.** It is the build brief and the decisions log.

## Stack

Expo SDK 58 (managed) · TypeScript strict · Expo Router · NativeWind 4 · Supabase · TanStack Query · Zustand · Jest

## Layout

```
content/              Book content — source of truth. Never rewrite this copy.
  bb-rule-cards.json  The 15 Rule Cards (pp. 273–277)
  passages.json       Verbatim passages, tagged by rule / use / situation
copy/                 All UI copy. Draft until Mark approves.
src/app/              Routes (Expo Router). (tabs)/ = Today, Rules, Progress, Journal, Settings
src/content/          Typed loaders for content/
src/lib/              Supabase client, query client
src/theme/            Palette (ember/charcoal), fonts
supabase/migrations/  Schema + RLS, and the generated rules seed
scripts/              generate-rules-migration.ts
```

## Setup

```bash
npm install
cp .env.example .env   # already points at the hosted project
npm start
```

Native modules beyond Expo Go's set will need a dev build: `npx eas-cli@latest build --profile development`.

## Database

Migrations live in `supabase/migrations/`. Every table has RLS on.

Hosted project: **Brave & Boundless app** (org Boondock Walker, ref `wxhonnvhecqsbydmeelc`, `us-east-1`). Link the CLI once with `npx supabase link --project-ref wxhonnvhecqsbydmeelc`.

```bash
npm run db:start    # local Supabase (needs Docker)
npm run db:reset    # re-apply all migrations
npm run db:push     # push migrations to the linked hosted project
```

The `rules` table is generated from `content/bb-rule-cards.json`. Edit the JSON, never the table:

```bash
npm run rules:sql     # writes a new *_sync_rules.sql migration if the JSON changed
npm run rules:check   # CI: fails if the migration is stale
```

## Checks

```bash
npm run check   # typecheck + lint + tests + rules:check
```
