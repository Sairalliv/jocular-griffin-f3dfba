# AGENTS.md — Study–Life Balance Scheduler

## Project Overview

A weekly planner that helps users visualize and balance their time across study, work, and life categories. Built with TanStack Start and deployed on Netlify with a managed Postgres database.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| Charts | Chart.js + react-chartjs-2 |
| Database | Netlify Database (Postgres) via Drizzle ORM |
| Deployment | Netlify |

## Directory Structure

```
src/
  routes/
    __root.tsx          — HTML shell, title, global styles
    index.tsx           — Main page: WeekGrid, Sidebar, AddModal, SchedulerPage
  lib/
    sessions.server.ts  — Server functions: getSessions, addSession, deleteSession
db/
  schema.ts             — Drizzle schema (sessions table)
  index.ts              — Drizzle client using @netlify/database neon adapter
netlify/
  database/
    migrations/         — Auto-applied Postgres migrations (drizzle-kit generated)
drizzle.config.ts       — Schema → migrations config
```

## Key Conventions

- **Server functions** live in `src/lib/*.server.ts`. Use `.inputValidator()` (not `.validator()`).
- **Database**: uses `drizzle-orm@beta` and `drizzle-kit@beta` — the `@beta` tag is required for the `@netlify/database` neon adapter.
- **Migrations**: never edit applied migrations. Run `npx drizzle-kit generate` after schema changes; Netlify applies them on deploy. Never run `drizzle-kit migrate` or `drizzle-kit push`.
- **Dynamic colors**: use inline `style` props — Tailwind v4 cannot interpolate dynamic class names.
- **Charts**: Chart.js must be registered before use; Doughnut chart is client-only (gated by `mounted` state).

## Balance Score Algorithm

Score (0–100) rewards even distribution across all 7 categories. Measures mean absolute deviation from the ideal equal-split, normalized to 0–100.

## Non-obvious Decisions

- Session blocks use absolute positioning within the time grid (simpler than CSS Grid spanning).
- Grid shows 6am–11pm (18 hours); sessions outside this range are stored but hidden from the grid view.
- `deleteSession` is optimistic: UI removes the block before the server responds.
- The `CATEGORIES` object is the single source of truth for colors — both the grid blocks and the legend pull from it.
