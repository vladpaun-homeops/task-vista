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

db-wipe:
	docker compose -f $(COMPOSE_FILE) exec -T db psql -U postgres -d appdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
