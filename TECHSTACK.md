# TECHSTACK — SwitchOn (v2)

Decisions are **final unless a blocking issue is proven**. Use the latest stable release of each component at project start and **pin it** (lockfiles, explicit image tags — never `latest`). Record chosen versions in `docs/versions.md` on day 1.

## 1. Decision Summary

| Layer | Choice | Rationale |
|---|---|---|
| Orchestration | **Temporal** + Python SDK (`temporalio`) | Durable execution, retries/timeouts, crash-resume, signals/queries, full history; the industry-standard saga engine |
| Temporal deployment | **`temporalio/server` + `temporalio/admin-tools`** on PostgreSQL, following the compose layout in `temporalio/samples-server` | ⚠️ `temporalio/auto-setup` is **deprecated** (no security updates). Fallback for emergencies only: `temporal server start-dev --db-filename` |
| Backend language | **Python 3.12** | One language across workflow, API, mocks |
| API + mocks | **FastAPI + Uvicorn**, Pydantic v2 | Typed contracts, OpenAPI per service |
| HTTP client | **httpx (async)**, explicit timeouts, **no internal retries** | Temporal owns retries |
| Event bus / queue | **Redis 7 Streams** (consumer groups, ack, DLQ) | Real MQ semantics, light footprint |
| Database | **PostgreSQL 16** | Separate DBs: `temporal`, `temporal_visibility`, `switchon` (schemas: `ops`, `oms`, `inventory`, `network`, `billing`, `notify`) |
| ORM / migrations | **SQLAlchemy 2 (async) + Alembic** | Standard, reversible migrations |
| Crypto (certificates) | **`cryptography`** (Ed25519) + `hashlib` SHA-256 | Hash-chained, signed receipts |
| Contracts | **OpenAPI (per service) + JSON Schema (events)** in `contracts/`; **`openapi-typescript`** generates web types | Contract-first; agents/teammates work in parallel safely |
| Frontend | **Next.js (App Router) + TypeScript (strict)** | Production-grade console |
| UI | **Tailwind + shadcn/ui** | Fast, consistent |
| Graph | **React Flow (`@xyflow/react`)** | Live DAG, replay, preview |
| Charts | **Recharts** | KPIs, histograms |
| Data | **TanStack Query + EventSource (SSE)** | Snapshot + delta |
| Metrics | **prometheus-client → Prometheus → Grafana (P1)** | Standard telemetry |
| Logging | **structlog** JSON with `order_id` | Searchable audit |
| Tracing (P2) | OpenTelemetry → Jaeger | Per-order trace |
| Testing | **pytest, pytest-asyncio, `temporalio.testing`, respx, Hypothesis, Playwright** | Time-skipping workflow tests + property-based chaos |
| Quality | **ruff, mypy (strict on core), pre-commit, ESLint/Prettier** | Gate on CI |
| Packaging | **Docker Compose**, **Makefile**, **uv** (Python), **pnpm** (web) | One-command reproducibility |

## 2. Why Temporal (vs Camunda / Airflow)

| Criterion | Temporal | Camunda | Airflow |
|---|---|---|---|
| Per-order, event-driven, long-running flows | ✅ native | ✅ | ❌ batch/schedule-oriented |
| Code-first sagas & compensation | ✅ | BPMN modeling | ❌ awkward |
| Survives worker crash mid-flow | ✅ replay | ✅ | partial |
| Signals (cancel/retry) & queries | ✅ | ✅ | ❌ |
| Laptop footprint | Light | Heavier | Heavy |
| Python dev speed | ✅ | Java-leaning | ✅ |

Roadmap note: Camunda/BPMN could provide a business-analyst view later.

## 3. Why REST mocks
Anyone can `curl` and read OpenAPI instantly; the engineering substance is orchestration, not transport. All outbound calls pass through typed `SystemClient` classes so gRPC adapters can be swapped in (roadmap).

## 4. Runtime Topology

| Service | Image / build | Port |
|---|---|---|
| `postgres` | postgres:16 | 5432 |
| `redis` | redis:7 | 6379 |
| `temporal` | temporalio/server (pinned) | 7233 |
| `temporal-setup` (one-shot) | temporalio/admin-tools (schema/namespace) | — |
| `temporal-ui` | temporalio/ui (pinned) | 8233 |
| `order-api` | ./services/order_api | 8000 |
| `worker` | ./services/orchestrator | — |
| `baseline-worker` | ./services/orchestrator (entry: `baseline`) — scripted hand-off engine for X1 | — |
| `projector` | ./services/orchestrator (entry: `projector`) | — |
| `reconciler` | ./services/orchestrator (entry: `reconciler`) | — |
| `mock-oms / inventory / network / billing / notification` | ./services/mocks (`SYSTEM=…`) | 8101–8105 |
| `web` | ./web | 3000 |
| `prometheus`, `grafana` (P1) | pinned official | 9090 / 3001 |

Memory budget: whole stack ≤ ~4 GB. Set explicit limits on postgres/temporal/redis.

## 5. Backend Libraries
`temporalio`, `fastapi`, `uvicorn[standard]`, `pydantic>=2`, `pydantic-settings`, `httpx`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `redis`, `sse-starlette`, `prometheus-client`, `structlog`, `pyyaml`, `networkx`, `cryptography`, `orjson`.
Dev: `pytest`, `pytest-asyncio`, `pytest-cov`, `respx`, `hypothesis`, `ruff`, `mypy`, `pre-commit`, `typer` (scripts CLI).

## 6. Frontend Libraries
`next`, `react`, `typescript`, `tailwindcss`, `shadcn/ui`, `@xyflow/react`, `recharts`, `@tanstack/react-query`, `zod`, `lucide-react`, `date-fns`, `openapi-typescript`. Dev: `eslint`, `prettier`, `@playwright/test`.

## 7. Repository Layout

```
switchon/
├─ docker-compose.yml  Makefile  README.md  .env.example
├─ contracts/          # openapi/*.yaml, events.schema.json, certificate.schema.json  (SOURCE OF TRUTH for interfaces)
├─ catalog/products/   # *.yaml task graphs
├─ shared/             # models, events, errors, settings, catalog loader, system clients, hashing/cert
├─ services/
│  ├─ order_api/       # FastAPI: orders, TMF façade, SSE, metrics, demo, certificates
│  ├─ orchestrator/    # workflows/, activities/, worker.py, baseline.py, projector.py, reconciler.py, explainer.py
│  └─ mocks/           # 5 systems, one codebase
├─ web/                # Next.js operator console
├─ scripts/            # scenarios/, load.py, ab_proof.py, invariants.py, verify_cert.py, report_data.py
├─ tests/              # unit/, workflow/, property/, integration/, e2e/, histories/
└─ docs/               # architecture.mmd, REPORT.md, demo-script.md, versions.md, screenshots/
```

## 8. Configuration
Env-only via pydantic-settings; `.env.example` committed with dummy values. Keys: service URLs, Temporal address/namespace, DSNs, `DEMO_MODE`, `CHAOS_SEED`, `AUTH_DISABLED`, `API_KEY`, `CERT_SIGNING_KEY_PATH` (dev key auto-generated on first boot).
`DEMO_MODE=true` compresses **time constants only** (retry intervals 1 s ×2 up to 8 s; mock latency 100–300 ms). It must never change logic paths.

## 9. CI/CD (GitHub Actions)
1. `ruff` + `mypy` + web lint/typecheck.
2. Unit + workflow (time-skipping) + **replay** + **property-based chaos**.
3. Compose integration (`make test-int`) with scenarios S1, S4, S11.
4. Playwright smoke (S1, S4).
5. Build images on tag; publish coverage + `report-data` artifact.

## 10. Hardware & Demo Assumptions
16 GB RAM laptop, Docker Desktop with ≥ 6 GB assigned. Offline-capable demo (no internet needed once images are pulled). Prepare a backup recording.
