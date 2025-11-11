# TaskVista

[![Release](https://img.shields.io/badge/release-v1.0.0-7C3AED.svg)](#releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?logo=prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10.20.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Docker](https://img.shields.io/badge/Docker-Alpine-0db7ed?logo=docker&logoColor=white)](Dockerfile.prod)
[![License: MIT](https://img.shields.io/badge/license-MIT-0A0A0A)](LICENSE)

> Demo sessions are sandboxed: **10 tasks**, **5 tags**, **50 task edits**, **10 tag edits** per visitor.

TaskVista is a polished, production-ready to‑do experience showcasing the modern Next.js stack: RSC, server actions, Prisma transactions, drag-and-drop calendars, and live reporting dashboards.

---

## ✨ Highlights

- **Dashboard** – backlog vs. overdue, activity snapshot, quick inline editing.
- **Tasks** – filters, bulk actions, optimistic updates, session quotas.
- **Tags** – color-coded labels with creation/edit throttling.
- **Calendar** – drag-and-drop scheduling.
- **Activity & Reports** – chronological audit feed and metric breakdowns.
- **Welcome Modal** – session-aware onboarding with portfolio context.

---

## 🧱 Architecture

| Layer       | Technology                                     |
|-------------|-------------------------------------------------|
| UI          | Next.js App Router (React Server Components)    |
| Styling     | Tailwind CSS 4 + custom component library       |
| State       | Server Actions + optimistic client updates      |
| Data        | Prisma 6 + PostgreSQL 16                        |
| Tooling     | pnpm 10 (Corepack), ESLint 9, TypeScript 5.9    |
| Container   | Docker multi-stage (Alpine, standalone output)  |

Sessions are cookie-based, seeded on first load, and their task/tag quotas are enforced atomically in Prisma transactions.

---

## 🚀 Quickstart

1. **Install prerequisites**
   - Node.js ≥ 18.18 (Node 20 recommended)
   - Docker Desktop / Engine
   - GNU Make + Corepack (`corepack enable`)

2. **Bootstrap**
   ```bash
   git clone https://github.com/vladpaun-homeops/taskvista.git
   cd taskvista
   cp .env.example .env.local
   make dev
   ```

3. Visit <http://localhost:3000>. `make dev` installs deps, runs migrations, seeds demo data, and launches Next.js + Postgres.

Stop the dev environment with `Ctrl+C`.

---

## 🔐 Environment & Secrets

`DATABASE_URL` is the only required variable:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb?schema=public
```

Use your managed Postgres DSN in production. Prisma and Next.js read it automatically when the app starts.

---

## 🧪 Development Commands

| Task                     | Command                                  |
|--------------------------|------------------------------------------|
| Full dev loop            | `make dev`                               |
| Start/stop Postgres      | `make db-up` / `make db-down`            |
| Reset schema             | `make db-wipe`                           |
| Regenerate Prisma client | `pnpm run prepare`                       |
| Prisma Studio            | `pnpm exec prisma studio`                |
| Lint / Typecheck         | `pnpm lint` / `pnpm tsc --noEmit`        |

---

## 🐳 Docker & Deployment

`Dockerfile.prod` builds a standalone Next.js image (~400 MB) using three stages (deps → builder → runner).

```bash
docker build -f Dockerfile.prod \
  -t ghcr.io/vladpaun-homeops/task-vista:main .

echo "$GHCR_PAT" | docker login ghcr.io -u vladpaun --password-stdin
docker push ghcr.io/vladpaun-homeops/task-vista:main

docker run -d --name taskvista \
  -e DATABASE_URL=postgresql://user:pass@db:5432/app?schema=public \
  -p 3000:3000 \
  ghcr.io/vladpaun-homeops/task-vista:main
```

The runtime image copies `.next/standalone`, `.next/static`, `prisma/`, and the pruned production `node_modules`. On startup the container now runs `npx prisma migrate deploy` (and fails fast if `DATABASE_URL` is missing) before launching `node server.js`, so migrations stay current without extra infrastructure hooks.

---

## 🗄️ Database Utilities

- Dev Postgres is defined in `docker-compose.dev.yml` (ports to `localhost:5432`).
- `make db-wipe` drops and recreates the `public` schema for nightly resets.
- Prisma migrations live under `prisma/migrations/`; seeds occur per session in server actions.

---

## 🧭 Roadmap

- Display remaining task/tag quotas in the UI.
- CI pipeline for lint/typecheck/Docker push.
- Integration tests for calendar drag-and-drop.
- Dark-theme polish for the welcome modal and tags grid.

---

## 📜 License

MIT License © 2025 [Vlad Paun](LICENSE)
