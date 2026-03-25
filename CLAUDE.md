# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server (disables TLS verification for proxies)
npm run build        # Run Prisma migrations + generate client + Next.js build
npm run start        # Start production server
npm run lint         # Run Next.js linter

# Database
npm run db:migrate   # Interactive Prisma schema migration
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio GUI
```

No test suite is configured.

## Architecture

**Clinical Diet** is a single-user PWA for meal tracking and nutritional analysis. Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (production), SQLite (local dev), and Upstash Redis.

### Data Flow

- **Client → Redis (via API routes):** Daily meal state (7-day TTL) — fast read/write during the day
- **Client → PostgreSQL (via API routes):** Foods, Settings, historical sync records (permanent)
- **Auto-sync at 23:59 (configurável via `SYNC_CRON`):** QStash chama `/api/sync/background` que persiste os totais do dia do Redis para `SyncRecord` no PostgreSQL e reseta o Redis para o dia seguinte
- **Water intake:** Stored only in `localStorage` (never synced to server)

### Key Directories

- `app/api/` — REST API routes; all use Zod validation; discriminated unions for multi-action endpoints (e.g. `/api/day` handles add-meal, add-item, remove-item via `action` field)
- `components/` — Feature-level components; `DayView.tsx` is the main dashboard orchestrator
- `lib/` — `db.ts` (Prisma singleton), `redis.ts` (Upstash client + cache key helpers), `types.ts` (shared TypeScript interfaces)
- `prisma/` — Schema + migrations + `dev.db` (SQLite for local)
- `public/sw.js` — Service worker for push notifications and PWA auto-sync

### Database Models

- `Food` — Reusable food items with macronutrients (protein, fat, carbs, unit)
- `Settings` — Singleton (id=1) for daily macro targets + water notification config
- `DailySummary` — One record per date, groups sync records
- `SyncRecord` — Macro totals for a day, written at sync time

### External Services (via env vars)

| Service | Purpose | Key env vars |
|---------|---------|--------------|
| Upstash Redis | Daily meal cache + push subscriptions | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| OpenRouter / Groq (OpenAI-compatible) | AI macro estimation + meal parsing | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` |
| Upstash QStash | Serverless cron for push notifications + daily sync | `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `SYNC_CRON` |
| Web Push (VAPID) | Push notification delivery | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| Neon / PostgreSQL | Persistent storage | `DATABASE_URL` |
| `TZ_LOCAL` | Server timezone (e.g. `America/Sao_Paulo`) | Prevents midnight boundary bugs |

See `.env.example` for full setup instructions.

### Push Notification Architecture

Two-tier water reminders:
1. **App open:** In-memory interval in `PwaSetup.tsx` → posts message to service worker → shows local notification
2. **App closed (PWA):** QStash cron → `/api/push/send` → Web Push → `sw.js` push event → shows notification

### State Management

No global state library. Uses:
- `useState` / `useCallback` in components
- Upstash Redis for server-side session cache
- `localStorage` for water intake, PWA install banner, push subscription status, and notification settings

### AI Integration

All AI calls go through `AI_BASE_URL` (OpenAI-compatible). Responses that arrive wrapped in markdown code blocks are automatically extracted before JSON parsing. Estimation results are cached in Redis for 30 days to reduce API costs.

### Path Alias

`@/*` maps to the repo root (configured in `tsconfig.json`).
