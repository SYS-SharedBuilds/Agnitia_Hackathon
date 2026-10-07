# TECHSTACK — SwitchOn

Decisions are **final unless a blocking issue is found**. Versions: use latest stable at project start and **pin in lockfiles** (`uv.lock`, `pnpm-lock.yaml`, image digests/tags in compose).

## 1. Decision Summary

| Layer | Choice | Why (judge-facing) |
|---|---|---|
| Orchestration engine | **Temporal** (Python SDK `temporalio`) | Durable execution, built-in retries/timeouts, crash-resume, signals/queries, full audit history. Industry standard for sagas. |
| Language (backend) | **Python 3.12** | One language for workflow, mocks, API; fastest to build. |
| API / mocks | **FastAPI + Uvicorn**, Pydantic v2 | Typed contracts, auto OpenAPI per mock system. |
| HTTP client | **httpx (async)** | Timeouts, retries disabled at client level (Temporal owns retries). |
| Message queue / event bus | **Redis 7 Streams** (consumer groups) | Lightweight real MQ semantics (ack, redelivery). Carries status events + notification jobs. |
| Database | **PostgreSQL 16** (schema per mock system + `ops` schema for read model) | Reliable, SQL for metrics. |
| ORM / migrations | **SQLAlchemy 2.0 (async) + Alembic** | Standard. |
| Frontend | **Next.js (App Router) + TypeScript** | Production-grade operator console. |
| UI kit | **Tailwind CSS + shadcn/ui** | Fast, clean, consistent. |
| DAG visualization | **React Flow (`@xyflow/react`)** | Live task graph with state colors. |
| Charts | **Recharts** | KPIs, latency, trends. |
| Data fetching | **TanStack Query + native EventSource (SSE)** | Snapshot + live deltas. |
| Metrics | **prometheus-client** → Prometheus → Grafana (P1) | Standard telemetry; `/metrics` on every service. |
| Logging | **structlog** (JSON), `order_id` correlation | Searchable audit. |
| Tracing (P2) | OpenTelemetry → Jaeger | Cross-service trace per order. |
| Packaging | **Docker Compose** (single command) | Judges can run it. |
| Task runner | **Makefile** + **uv** (Python), **pnpm** (web) | Reproducible dev UX. |

## 2. Why Temporal over Camunda / Airflow

| Criterion | Temporal | Camunda | Airflow |
|---|---|---|---|
| Event-driven, per-order long-running flows | ✅ native | ✅ | ❌ batch/DAG-schedule oriented |
| Code-first sagas & compensation | ✅ natural | BPMN modeling | ❌ awkward |
| Survives worker crash mid-flow | ✅ replay | ✅ | partial |
| Signals (cancel/retry) & queries | ✅ | ✅ | ❌ |
| Setup weight on a laptop | Light (auto-setup image) | Heavier (Zeebe/Operate) | Heavy |
| Dev speed in Python | ✅ | Java-leaning | ✅ |

**Decision: Temporal.** (Mention Camunda/BPMN as a future "business-modeler view" in the roadmap.)

## 3. Why REST (not gRPC) for mocks
Hackathon audience can curl and read OpenAPI instantly; the orchestration — not transport — is the point. Interface layer is abstracted behind `SystemClient` classes so gRPC could be swapped in (roadmap note).

## 4. Runtime Topology (Compose services)

| Service | Image / Build | Port |
|---|---|---|
| `postgres` | postgres:16 | 5432 |
| `redis` | redis:7 | 6379 |
| `temporal` | temporalio/auto-setup | 7233 |
| `temporal-ui` | temporalio/ui | 8233 |
| `order-api` | build ./services/order_api | 8000 |
| `worker` | build ./services/orchestrator | — |
| `projector` | build ./services/orchestrator (entry: projector) | — |
| `mock-oms` | build ./services/mocks | 8101 |
| `mock-inventory` | same image, `SYSTEM=inventory` | 8102 |
| `mock-network` | same image, `SYSTEM=network` | 8103 |
| `mock-billing` | same image, `SYSTEM=billing` | 8104 |
| `mock-notification` | same image, `SYSTEM=notification` | 8105 |
| `web` | build ./web | 3000 |
| `prometheus`, `grafana` (P1) | official | 9090 / 3001 |

## 5. Backend Libraries

- `temporalio`, `fastapi`, `uvicorn[standard]`, `pydantic>=2`, `pydantic-settings`
- `httpx`, `tenacity` (only for non-Temporal helper code, e.g., startup waits)
- `sqlalchemy[asyncio]`, `asyncpg`, `alembic`
- `redis` (asyncio), `sse-starlette`
- `prometheus-client`, `structlog`
- `pyyaml` (catalog), `networkx` (DAG validation / topological order)
- Dev: `pytest`, `pytest-asyncio`, `respx`, `hypothesis`, `ruff`, `mypy`, `pre-commit`, `locust` (or custom async load script)

## 6. Frontend Libraries
`next`, `react`, `typescript`, `tailwindcss`, `shadcn/ui`, `@xyflow/react`, `recharts`, `@tanstack/react-query`, `zod`, `lucide-react`, `date-fns`. Dev: `eslint`, `prettier`, `playwright`.

## 7. Repository Layout

```
switchon/
├─ docker-compose.yml
├─ Makefile
├─ README.md
├─ docs/            # architecture.mmd, REPORT.md, demo-script.md, screenshots
├─ catalog/         # products/*.yaml (task graph definitions)
├─ shared/          # python pkg: models, events, errors, catalog loader
├─ services/
│  ├─ order_api/    # FastAPI gateway + SSE + metrics API
│  ├─ orchestrator/ # Temporal workflows, activities, worker, projector
│  └─ mocks/        # one codebase, 5 systems via SYSTEM env
├─ web/             # Next.js operator console
├─ scripts/         # scenario runner, load generator, invariant checker
└─ tests/           # unit, workflow, integration, e2e
```

## 8. Environments & Config
- All config via env vars (pydantic-settings); `.env.example` committed, real `.env` ignored.
- Mock base URLs, chaos defaults, retry policy overrides, Temporal address/namespace, Redis/Postgres DSNs.
- **Demo-scale timing**: retry intervals compressed (1s initial, ×2, max 8s) via `DEMO_MODE=true`; production-like defaults documented in report.

## 9. CI/CD
GitHub Actions: `ruff` + `mypy` → unit → Temporal time-skipping workflow tests + replay test → Compose integration smoke (`make test-int`) → web lint/build. Docker images built on tag.

## 10. Hardware Assumption
Laptop with 16 GB RAM, Docker Desktop. Whole stack must fit ≤ ~4 GB.
