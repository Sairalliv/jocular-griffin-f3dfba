# Study–Life Balance Scheduler

A weekly planner that helps students and working professionals visualize and balance their time across study, work, exercise, social activities, rest, hobbies, and meals.

## Key Features

- **Interactive weekly grid** — visualize all 7 days from 6am to 11pm
- **7 activity categories** — each color-coded for quick scanning
- **Balance Score** — an algorithmic score that rewards even distribution across categories
- **Live donut chart** — real-time breakdown of scheduled hours per category
- **Persistent sessions** — backed by Netlify Database (managed Postgres), so your schedule survives across devices and sessions

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React, SSR) |
| Styling | Tailwind CSS v4 |
| Charts | Chart.js + react-chartjs-2 |
| Database | Netlify Database (Postgres) via Drizzle ORM |
| Deployment | Netlify |

## Running Locally

```bash
npm install
netlify dev
```

The app will be available at `http://localhost:8888`. A `NETLIFY_DATABASE_URL` environment variable is required — it is provisioned automatically by the Netlify platform on first deploy.
