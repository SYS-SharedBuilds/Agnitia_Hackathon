# SKILLS — SwitchOn (v2)

**Part A** skill map · **Part B** playbooks (follow verbatim) · **Part C** reusable agent prompts.

## Part A — Skill Map

| Skill | Depth | Used for | Ramp (h) | Learn from |
|---|---|---|---|---|
| Temporal workflows/activities (Python) | **Deep** | Orchestration core | 6–8 | Temporal Python docs; saga sample |
| Determinism, replay, versioning | **Deep** | Replay safety | 2 | Temporal determinism/versioning docs |
| Saga + compensation + fencing/tombstones | **Deep** | Rollback correctness | 3 | microservices.io saga; "fencing tokens" literature |
| Idempotency design | **Deep** | Safe retries | 1 | Stripe idempotency article |
| Property-based testing (Hypothesis) | Solid | X9 | 2 | Hypothesis docs |
| Applied crypto basics (hash chains, Ed25519, canonical JSON) | Solid | X2 | 2 | `cryptography` docs |
| FastAPI + Pydantic v2 | Solid | API, mocks | 2 | FastAPI docs |
| Async Python / httpx | Solid | Activities | 2 | Python docs |
| Redis Streams | Working | Events/queue | 2 | Redis docs |
| PostgreSQL, SQLAlchemy 2 async, Alembic | Working | Read model/mocks | 3 | Official docs |
| SSE | Working | Live UI | 1 | MDN |
| Next.js, TS, Tailwind, shadcn | Working | Console | 3 | Official docs |
| React Flow | Working | DAG/replay | 2 | xyflow docs |
| OpenAPI contract-first (+ `openapi-typescript`) | Working | Parallel work | 1 | OpenAPI docs |
| Docker Compose | Solid | Reproducibility | 1 | Docker docs |
| Prometheus/Grafana | Working | Telemetry | 2 | Official docs |
| Chaos/fault-injection thinking | Solid | Demo + tests | 1 | — |
| Telecom domain (BSS/OSS, TMF622/638/641, MSISDN, ICCID, fallout) | Awareness | Credible mocks/pitch | 2 | TM Forum overviews |
| Technical writing, Mermaid | Solid | Report/diagrams | 2 | — |
| Demo craft | Solid | Winning | — | Rehearse ×3 |

## Part B — Playbooks

### PB-1 Add a mock action (forward + undo + tombstone)
1. Models in `services/mocks/<system>/schemas.py`; update `contracts/openapi/<system>.yaml` **first**.
2. Forward endpoint: idempotency lookup → **tombstone check** → effect → store response, all in one transaction; chaos hook; latency.
3. Undo endpoint: write **tombstone for the forward key**, undo effect if present; missing target = success.
4. Audit endpoint lists resources with `order_id`.
5. Tests: success, replay (`Idempotent-Replay: true`), chaos, undo twice, **late forward after undo ⇒ 409**.

### PB-2 Add an activity (+ compensation)
1. Client method in `shared/clients/<system>.py` (typed, timeout, no retries).
2. `@activity.defn`: key `{order_id}:{task_id}:{action}`; headers; map errors to taxonomy (business ⇒ `ApplicationError(non_retryable=True)`); publish `task.started/retrying/succeeded`.
3. Compensation activity with higher retry cap.
4. Register in worker; test with `ActivityEnvironment` + `respx`.

### PB-3 Add a product
1. `catalog/products/<p>.yaml` (ARCHITECTURE §4). 2. `make validate-catalog`. 3. Golden waves test + negative tests. 4. Add to scenario runner and Catalog page.

### PB-4 Add a chaos scenario
1. `scripts/scenarios/<name>.py`: chaos config(s) with explicit seed → submit → expected terminal + task states → `invariants.check`.
2. Register; expose via `POST /demo/scenarios/{name}`; add button with one-line description.

### PB-5 Write a workflow test
1. `WorkflowEnvironment.start_time_skipping()`. 2. Fake activities with scripted errors. 3. Assert final state, **reverse-order compensation**, unknown-outcome compensation, no compensation for read-only/best-effort/business-error tasks. 4. Add/refresh recorded history in `tests/histories/` and replay.

### PB-6 Property-based chaos test
1. Strategy generates: failing task index, failure type (transient/business/permanent/timeout), compensation-failure set, delays.
2. Run workflow in time-skipping env against stateful in-memory fake systems that implement the tombstone contract.
3. Assert invariants INV-1…INV-6. 4. On failure save seed to `tests/property/regressions/`.

### PB-7 Certificate work
1. Canonicalize (sorted keys, no whitespace, UTF-8). 2. `h_0 = SHA256("switchon:"+order_id)`; `h_i = SHA256(h_{i-1} || canonical(event_i))`. 3. Post-terminal audit calls build `system_state`. 4. Sign canonical body with Ed25519 (`key_id`). 5. Verify offline from exported events; **tamper test** must fail.

### PB-8 A/B proof run
1. `make reset-data`. 2. `ab_proof.py --orders 200 --seed 42`. 3. Same `chaos_key` sequence to both engines; baseline = 3× retry, no compensation. 4. Leak metrics from mock DBs. 5. Save `docs/ab-proof.json`; never hand-edit numbers.

### PB-9 Add an event type end-to-end
`shared/events.py` + `contracts/events.schema.json` → publisher → projector (idempotent) → SSE payload → generated TS type → timeline rendering.

### PB-10 Add a console view
Generated types; TanStack Query + SSE; loading/empty/error states; `stateColors.ts` only; Playwright smoke.

### PB-11 Debug a stuck/failed order
Temporal UI history → `ops.events` / `ops.tasks` → `GET /admin/chaos` on suspect mock (reset with `DELETE`) → worker logs by `order_id` → Explainer card → if `NEEDS_ATTENTION`, use retry-compensation or resolve (audited).

### PB-12 Prepare the demo
`make down && make up && make seed` → `make demo-check` → `make demo` (S1–S12) → `make invariants` PASS → `make reset-data` → warm up with S1 → open Console, Temporal UI, architecture slide → confirm backup video.

### PB-13 Write the report (`docs/REPORT.md`, 3–4 pages)
Problem → Approach → Architecture (diagrams) → Guarantees & failure semantics (tombstones, unknown outcomes) → Proof (A/B table, invariants, certificate) → Results (SLO targets vs measured) → Mock-vs-real table → Limitations & roadmap. Numbers only from `make report-data`.

## Part C — Agent Prompt Starters
- **Implement task:** "Read BRAIN, RULES, AGENTS, then TASKS entry T-xx and its contracts. Implement only T-xx following the matching playbook. Tests included. Run `make check`. Report with the AGENTS §6 template."
- **Determinism audit:** "Audit `services/orchestrator/workflows/` against RULES §1; list violations file:line with fixes."
- **Chaos sweep:** "For every system × {transient, business, permanent, timeout, compensation-failure}, run PB-4/PB-6 and report invariant results."
- **Docs consistency check:** "Compare PRD, ARCHITECTURE, TASKS, RULES, BRAIN for contradictions (metric definitions, states, scenario list, task IDs). Output a table of conflicts and proposed fixes; do not edit RULES."
