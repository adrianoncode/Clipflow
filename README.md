# Clipflow

Content-repurposing SaaS: video or text in, platform-specific drafts (TikTok, Instagram Reels, YouTube Shorts, LinkedIn) out.

## Stack

- Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS
- Supabase (Auth + Postgres + Storage), local dev via Supabase CLI
- pnpm
- shadcn/ui (hand-written components under `components/ui/`)
- Zod for runtime validation
- AES-256-GCM for BYOK AI-key encryption

## Prerequisites

- Node.js `>=20.11 <21` (see `.nvmrc`)
- pnpm `9.x`
- Docker (required by Supabase CLI for local Postgres/Studio)

## Quickstart

```bash
# 1. Install deps
pnpm install

# 2. Boot local Supabase (Postgres + Studio + Inbucket mailer)
pnpm db:start

# 3. Copy env, fill in the values printed by db:start
cp .env.example .env.local
#   - NEXT_PUBLIC_SUPABASE_ANON_KEY  → from `supabase status`
#   - SUPABASE_SERVICE_ROLE_KEY      → from `supabase status`
#   - ENCRYPTION_KEY                 → `openssl rand -hex 32`

# 4. Apply migrations and generate DB types
pnpm db:migrate
pnpm db:types

# 5. Start the dev server
pnpm dev
```

Local URLs:

- App: <http://localhost:3000>
- Supabase Studio: <http://localhost:54323>
- Inbucket (local mail catcher for magic links): <http://localhost:54324>

## Scripts

| Script              | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Next dev server                                 |
| `pnpm build`        | Production build                                |
| `pnpm lint`         | ESLint                                          |
| `pnpm typecheck`    | `tsc --noEmit`                                  |
| `pnpm format`       | Prettier write                                  |
| `pnpm db:start`     | Boot local Supabase stack                       |
| `pnpm db:stop`      | Stop local Supabase stack                       |
| `pnpm db:reset`     | Wipe and replay all migrations (destructive)    |
| `pnpm db:migrate`   | Apply pending migrations                        |
| `pnpm db:types`     | Regenerate `lib/supabase/types.ts`              |

## Project structure

See the [Milestone 1 plan](./docs/milestones.md) — or just browse `app/`, `components/`, `lib/`, `supabase/`.
