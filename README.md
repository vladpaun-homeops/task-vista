# 🧠 To-Do App (Next.js + PostgreSQL)

This repository contains a **Next.js** web UI backed by **Prisma** and **PostgreSQL**. It currently serves as a foundation project for the **Junction 2025 hackathon**.

---

## 🚀 Quickstart

1. **Install prerequisites**
   - Docker Desktop / Docker Engine (for Postgres).
   - Node.js 18.18+ (Next.js 16 requirement). With nvm: `nvm install 24 && nvm use 24`.
   - Corepack (bundled with Node.js; run `corepack enable` once if it’s disabled).
   - `make` (ships on macOS/Linux; on Windows use WSL, Git Bash, or install with `choco install make`).
2. Clone the repository and copy the environment template:
   ```bash
   git clone <your-fork-url>
   cd todoapp-nextjs-ai
   cp .env.example .env.local
   ```
3. Start everything with a single command:
   ```bash
   make dev
   ```
   Visit the app at [http://localhost:3000](http://localhost:3000).

---

## 🛠 How the Dev Workflow Works

`make dev` calls `scripts/dev.sh`, which orchestrates the full developer loop:

- Verifies you are running a compatible Node.js (18.18+).
- Uses Corepack to activate `pnpm@10.20.0`, installs Node dependencies, and builds the Prisma client.
- Brings up the Postgres container defined in `docker-compose.dev.yml`.
- Applies migrations and seeds via Prisma.
- Runs the Next.js dev server locally. Hit `Ctrl+C` to shut down the web server *and* the Postgres container.

On macOS/Linux, `make` is preinstalled. Windows users can run the same workflow from WSL or install GNU Make through tools such as [Git for Windows](https://gitforwindows.org/) or `choco install make`.

---

## 🧩 Supporting Commands

- `make db-up` / `make db-down` — manually start or stop just the Postgres container.
- `pnpm run prepare` — regenerate the Prisma client.
- `pnpm exec prisma studio` — open Prisma Studio at [http://localhost:5555](http://localhost:5555).
- `docker compose -f docker-compose.dev.yml down` — remove the Postgres container and its network.

The only Docker dependency is Postgres; Next.js runs natively on your host machine.

---

## 🔐 Environment Variables

Local configuration lives in `.env.local`. Start from `.env.example`, which provides sensible defaults:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb?schema=public
```

Next.js automatically loads `.env.local`. Restart `make dev` after changing database settings.

---

## 🧰 Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (React 19) |
| ORM | Prisma |
| Database | PostgreSQL 16 (via Docker Compose) |
| Package Manager | pnpm 10 (via Corepack) |

---

## 🧾 License

MIT License © 2025
