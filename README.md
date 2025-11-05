# 🧠 To-Do App (Next.js + FastAPI + PostgreSQL)

This repository contains a **Next.js** web UI backed by **Prisma** and **PostgreSQL**, plus a small **FastAPI** microservice that tags to-do items. It currently serves as a foundation project for the **Junction 2025 hackathon**.

---

## 🚀 Quickstart

1. **Install prerequisites**
   - Docker Desktop / Docker Engine (for Postgres).
   - Node.js 18.18+ (Next.js 16 requirement). With nvm: `nvm install 24 && nvm use 24`.
   - Corepack (bundled with Node.js; run `corepack enable` once if it’s disabled).
   - Python 3.11 (for FastAPI). On macOS/Linux it’s usually `python3`; Windows users can install via the Microsoft Store or `pyenv`.
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
   Visit the app at [http://localhost:3000](http://localhost:3000). The FastAPI service is available at [http://localhost:8000/health](http://localhost:8000/health).

---

## 🛠 How the Dev Workflow Works

`make dev` calls `scripts/dev.sh`, which orchestrates the full developer loop:

- Verifies you are running a compatible Node.js (18.18+).
- Uses Corepack to activate `pnpm@10.20.0`, installs Node dependencies, and builds the Prisma client.
- Brings up the Postgres container defined in `compose.yml`.
- Applies migrations and seeds via Prisma.
- Creates/updates a project-local virtualenv at `.venv/` and installs FastAPI dependencies from `ml/requirements.txt`.
- Runs the FastAPI server (`uvicorn`) and the Next.js dev server side-by-side. Hit `Ctrl+C` to shut down the web/ML servers *and* the Postgres container.

On macOS/Linux, `make` is preinstalled. Windows users can run the same workflow from WSL or install GNU Make through tools such as [Git for Windows](https://gitforwindows.org/) or `choco install make`.

---

## 🧩 Supporting Commands

- `make db-up` / `make db-down` — manually start or stop just the Postgres container.
- `pnpm run prepare` — regenerate the Prisma client.
- `pnpm exec prisma studio` — open Prisma Studio at [http://localhost:5555](http://localhost:5555).
- `docker compose down` — remove the Postgres container and its network.

The only Docker dependency left is Postgres; both Next.js and FastAPI run natively on your host machine.

---

## 🔐 Environment Variables

Local configuration lives in `.env.local`. Start from `.env.example`, which provides sensible defaults:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb?schema=public
ML_URL=http://localhost:8000
```

Next.js automatically loads `.env.local`. Restart `make dev` after changing database settings.

---

## 🧰 Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (React 19) |
| ORM | Prisma |
| Database | PostgreSQL 16 (via Docker Compose) |
| ML API | FastAPI (Python 3.11) |
| Package Manager | pnpm 10 (via Corepack) |

---

## 📌 Outstanding Work

- Tasks page filter handler still reads `searchParams` synchronously; Next 16 treats it as a promise, so accessing `searchParams.tag` directly throws (`searchParams` must be awaited/`React.use()`-ed). Update the route handler to unwrap before use.
- Re-run end-to-end testing on the filters once the above is addressed.

---

## 🧾 License

MIT License © 2025
