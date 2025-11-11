#!/bin/sh
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set; Prisma migrations cannot run." >&2
  exit 1
fi

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Starting TaskVista server..."
exec "$@"
