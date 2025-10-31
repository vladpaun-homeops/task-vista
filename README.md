# 🧠 To-Do App (Next.js + FastAPI + PostgreSQL)

This repository contains a simple **To-Do web application** built with **Next.js** and **Prisma ORM**, connected to a **PostgreSQL** database and a placeholder **FastAPI ML service**.  
It is developed as a foundation project for the **Junction 2025 hackathon**.

---

## 🚀 Development Setup

### Requirements
- **Docker** and **Docker Compose** must be installed.

### Run the development environment

Start the entire stack:
```bash
docker compose up
```

Run in detached mode (background):
```bash
docker compose up -d
```

Stop and remove all containers:
```bash
docker compose down
```

---

## 🐳 Docker Compose Overview

Running `docker compose up` orchestrates a **three-service development stack**, defined in `docker-compose.yml`.  
Each service runs in its own isolated container but shares a common network for internal communication (`db`, `ml`, and `web`).

### 1. Database Service (`db`)
- Uses the official **PostgreSQL 16** image.  
- Initializes a database named `appdb` with credentials (`postgres` / `postgres`).  
- Persists data in a **named Docker volume** `pgdata`, ensuring data survives container restarts.  
- Includes a **health check** (`pg_isready`) that ensures the database is ready before dependent services start.

### 2. Machine Learning Service (`ml`)
- Built from the local `./ml` directory using `Dockerfile.ml`.  
- Runs a placeholder process (`tail -f /dev/null`), ready to host a **FastAPI ML API**.  
- Exposes **port 8000** on the host (`http://localhost:8000`).  
- Mounts the `ml` directory as a bind volume for live code editing.

### 3. Web Service (`web`)
- Built from the root context using `Dockerfile.web`.  
- Hosts the **Next.js frontend** and **Prisma ORM** backend logic.  
- Depends on:
  - `db` being healthy  
  - `ml` being started  
- Executes the following startup sequence:
  1. Enables **pnpm** via Corepack  
  2. Installs dependencies  
  3. Runs `prisma generate`, `migrate deploy`, and `db seed`  
  4. Starts the Next.js dev server on port **3000**  
- Exposes:
  - **Port 3000** → Next.js app (`http://localhost:3000`)  
  - **Port 5555** → Prisma Studio (`http://localhost:5555`)  
- Mounts the entire project directory into `/app` for hot reloads.

### 4. Volumes
- `pgdata` → Named Docker volume storing PostgreSQL data at `/var/lib/postgresql/data`.

---

## 🧩 Prisma Studio

Prisma Studio is a web-based interface for viewing and modifying your database.

To open Prisma Studio, run:
```bash
docker compose exec web pnpm exec prisma studio
```
Then visit: [http://localhost:5555](http://localhost:5555)

---

## ☁️ Deployment

The simplest way to deploy this app is through **Vercel**, the official platform by the creators of Next.js.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

---

## 🧰 Stack Summary

| Component | Technology |
|------------|-------------|
| Frontend | Next.js 15 (React) |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| ML API | FastAPI (placeholder) |
| Package Manager | pnpm |
| Containerization | Docker Compose |

---

## 🧾 License

MIT License © 2025
