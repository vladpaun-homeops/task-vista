.PHONY: dev db-up db-down prisma

dev:
	./scripts/dev.sh

COMPOSE_FILE := docker-compose.yml

db-up:
	docker compose -f $(COMPOSE_FILE) up -d db

db-down:
	docker compose -f $(COMPOSE_FILE) down

prisma:
	pnpm run prepare
