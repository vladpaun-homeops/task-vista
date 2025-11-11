#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COREPACK_HOME="${ROOT_DIR}/.corepack"
PNPM_VERSION="pnpm@10.20.0"
CLEANED_UP=0
DB_STARTED=0

info() {
  printf "\033[1;34m[dev]\033[0m %s\n" "$*"
}

fail() {
  printf "\033[1;31m[dev]\033[0m %s\n" "$*" >&2
  exit 1
}

ensure_prisma_output_writable() {
  local prisma_dir="${ROOT_DIR}/src/generated/prisma"
  local prisma_file="${prisma_dir}/client.ts"
  if [[ -e "${prisma_dir}" ]] && [[ ! -w "${prisma_dir}" ]]; then
    if command -v sudo >/dev/null 2>&1; then
      info "Fixing permissions on ${prisma_dir} (requires sudo)..."
      sudo chown -R "$(id -u):$(id -g)" "${prisma_dir}"
    else
      fail "Prisma output directory ${prisma_dir} is not writable (likely created inside Docker). Run: chown -R $(id -u):$(id -g) ${prisma_dir}"
    fi
  fi
  if [[ -e "${prisma_file}" ]] && [[ ! -w "${prisma_file}" ]]; then
    if command -v sudo >/dev/null 2>&1; then
      info "Fixing permissions on ${prisma_file} (requires sudo)..."
      sudo chown "$(id -u):$(id -g)" "${prisma_file}"
    else
      fail "Prisma client file ${prisma_file} is not writable (likely created inside Docker). Run: chown $(id -u):$(id -g) ${prisma_file}"
    fi
  fi
}

cleanup() {
  local exit_code=$?
  if [[ "${CLEANED_UP}" -eq 1 ]]; then
    return
  fi
  CLEANED_UP=1
  trap - EXIT
  if [[ -n "${WEB_PID:-}" ]] && ps -p "${WEB_PID}" >/dev/null 2>&1; then
    kill "${WEB_PID}" >/dev/null 2>&1 || true
  fi
  if [[ "${DB_STARTED}" -eq 1 ]]; then
    info "Stopping Postgres container..."
    docker compose down >/dev/null 2>&1 || true
  fi
  exit "${exit_code}"
}

trap cleanup EXIT

handle_signal() {
  info "Signal received, shutting down..."
  exit 0
}

trap handle_signal INT TERM

cd "${ROOT_DIR}"

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is required for the Postgres container. Install Docker Desktop or Docker Engine."
fi

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js is required. Install it (e.g., via nvm) and rerun."
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "${NODE_MAJOR}" -lt 18 ]]; then
  fail "Detected Node.js $(node -v); Next.js 16 needs Node 18.18 or newer. Switch to a modern version (e.g., nvm use 24)."
fi

if ! command -v corepack >/dev/null 2>&1; then
  fail "corepack is required (ships with Node.js 16.13+). Install Node.js 20.x or enable corepack."
fi

mkdir -p "${COREPACK_HOME}"
export COREPACK_HOME

info "Ensuring ${PNPM_VERSION} is available..."
corepack enable
corepack prepare "${PNPM_VERSION}" --activate

info "Installing JavaScript dependencies..."
pnpm install
ensure_prisma_output_writable
info "Generating Prisma client..."
pnpm run prepare

info "Starting Postgres via Docker Compose..."
docker compose up -d db
DB_STARTED=1

info "Running database migrations and seed..."
pnpm run db:migrate
if ! pnpm run db:seed; then
  info "Prisma seed failed (often harmless the first time if data already exists). Review the output above if this is unexpected."
fi

info "Launching Next.js dev server..."
pnpm exec next dev --turbopack --hostname 0.0.0.0 --port 3000 &
WEB_PID=$!

info "Dev environment running. Press Ctrl+C to stop."
wait "${WEB_PID}"
