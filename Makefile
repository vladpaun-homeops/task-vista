.PHONY: dev db-up db-down prisma

dev:
	./scripts/dev.sh

db-up:
	docker compose up -d db

db-down:
	docker compose down

prisma:
	pnpm run prepare
