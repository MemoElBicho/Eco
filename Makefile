.PHONY: up down migrate tunnel mock-whatsapp test-ai test-webhooks

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose run --rm backend alembic upgrade head

migrate-new:
	docker compose run --rm backend alembic revision --autogenerate -m "$(name)"

shell:
	docker compose run --rm backend python

tunnel:
	ngrok http 8000

mock-whatsapp:
	docker compose up -d mock-whatsapp

test-ai:
	docker compose run --rm backend python -m tests.harness_ai

test-webhooks:
	docker compose run --rm backend python -m tests.harness_webhooks

test-all:
	docker compose run --rm backend pytest tests/

seed:
	docker compose run --rm backend python seed_data.py
