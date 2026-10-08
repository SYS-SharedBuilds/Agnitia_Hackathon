.PHONY: help up down logs check test test-wf test-int validate-catalog demo invariants kill-worker start-worker seed reset-data web-dev fmt lint types ab-proof verify-cert report-data gen-types

help:
	@echo "SwitchOn Developer Commands:"
	@echo "  make up               Start full stack with Docker Compose"
	@echo "  make down             Stop all containers"
	@echo "  make logs [s=worker]  Tail logs (e.g. make logs s=worker)"
	@echo "  make check            Run ruff, mypy, and unit tests"
	@echo "  make fmt              Format with ruff"
	@echo "  make lint             Lint with ruff"
	@echo "  make types            Type check with mypy"
	@echo "  make test             Run all unit and component tests"
	@echo "  make test-wf          Run Temporal workflow tests"
	@echo "  make validate-catalog Validate all product YAML task graphs"
	@echo "  make demo             Execute S1..S12 demo scenarios"
	@echo "  make invariants       Run cross-system consistency checker"
	@echo "  make ab-proof         Run A/B proof harness (Baseline vs SwitchOn)"
	@echo "  make verify-cert      Verify consistency certificate"
	@echo "  make kill-worker      Simulate crash of orchestrator worker"
	@echo "  make start-worker     Restart orchestrator worker"
	@echo "  make seed             Seed database with sample catalog/orders"
	@echo "  make reset-data       Reset mock databases and read model"
	@echo "  make report-data      Generate official evaluation report data"
	@echo "  make gen-types        Generate TypeScript types from OpenAPI"
	@echo "  make web-dev          Start Next.js frontend dev server"

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f $(s)

fmt:
	python3 -m ruff format .

lint:
	python3 -m ruff check .

types:
	python3 -m mypy shared services/orchestrator services/order_api services/mocks scripts

check: lint types test

test:
	python3 -m pytest tests/unit -v

test-wf:
	python3 -m pytest tests/workflow -v

test-int:
	python3 -m pytest tests/integration -v

validate-catalog:
	python3 scripts/validate_catalog.py

demo:
	python3 scripts/scenarios/runner.py

invariants:
	python3 scripts/invariants.py

ab-proof:
	python3 scripts/ab_proof.py --orders 20 --seed 42

verify-cert:
	python3 scripts/verify_cert.py --id $(id)

report-data:
	python3 scripts/report_data.py

gen-types:
	cd web && npx openapi-typescript ../contracts/openapi/order_api.yaml -o lib/schema.d.ts || true

kill-worker:
	docker compose stop worker

start-worker:
	docker compose start worker

seed:
	python3 scripts/seed.py

reset-data:
	python3 scripts/reset_data.py

web-dev:
	cd web && npm run dev
