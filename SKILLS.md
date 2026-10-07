# SKILLS — SwitchOn

Two parts: **(A)** skills the team needs, with the minimum depth required; **(B)** repeatable playbooks ("recipes") for the most common development operations. Agents and humans follow the playbooks verbatim.

---

## Part A — Skill Map

| Skill | Needed depth | Used for | Ramp-up (hours) | Learn from |
|---|---|---|---|---|
| Temporal workflows & activities (Python) | **Deep** | Orchestration core | 6–8 | Temporal Python docs, "Saga" sample |
| Workflow determinism & replay | **Deep** | Avoiding replay bugs | 2 | Temporal "Versioning/Determinism" docs |
| Saga / compensation design | **Deep** | Rollback correctness | 2 | Microservices.io saga pattern |
| FastAPI + Pydantic v2 | Solid | API + mocks | 2 | FastAPI docs |
| Async Python (`asyncio`, `httpx`) | Solid | Activities, mocks | 2 | Python docs |
| Idempotency design | **Deep** | Safe retries | 1 | Stripe idempotency write-up |
| Redis Streams (consumer groups, ack, DLQ) | Working | Events, notify queue | 2 | Redis docs |
| PostgreSQL + SQLAlchemy 2 async + Alembic | Working | Read model, mocks | 3 | Official docs |
| SSE streaming | Working | Live UI | 1 | MDN EventSource; `sse-starlette` |
| Next.js App Router + TS + Tailwind + shadcn | Working | Console | 3 | Official docs |
| React Flow | Working | Live DAG | 2 | xyflow docs |
| Docker Compose | Solid | Single-command stack | 1 | Docker docs |
| Prometheus metrics (+ Grafana) | Working | Telemetry | 2 | prometheus-client docs |
| pytest + Temporal test env | Solid | Time-skipping tests | 2 | `temporalio.testing` |
| Chaos / fault injection thinking | Solid | Demo + tests | 1 | — |
| Telecom domain basics (BSS/OSS, TMF, SIM/MSISDN, ports) | Awareness | Credible mocks + pitch | 2 | TM Forum overview, TMF622/641 idea |
| Technical writing & diagramming (Mermaid) | Solid | Report, docs | 2 | — |
| Demo craft | Solid | Winning | — | Rehearse 3× |

**Telecom vocabulary to use consistently:** BSS (billing/CRM/order mgmt), OSS (inventory/network), MSISDN, ICCID/eSIM profile, ONT/OLT port (fiber), service order, product catalog, provisioning, activation, fallout (failed orders needing manual work).

---

## Part B — Playbooks

### PB-1: Add a new mock system action
1. Define request/response models in `services/mocks/<system>/schemas.py`.
2. Implement endpoint in `services/mocks/<system>/routes.py` with: `Idempotency-Key` handling, chaos hook (`await chaos.apply(request, action="...")`), latency simulation, DB write.
3. Implement the **undo endpoint** at the same time (idempotent; missing target = success).
4. Add unit tests: success, replay (same key → same response, `Idempotent-Replay: true`), chaos failure, undo twice.
5. Update OpenAPI examples and `docs/mocks.md`.

### PB-2: Add an activity (and its compensation)
1. Add client method in `shared/clients/<system>.py` (typed, timeout set, no retry inside).
2. Add `@activity.defn` in `services/orchestrator/activities/<system>.py`:
   - Build idempotency key `f"{order_id}:{task_id}:{action}"`.
   - Map HTTP → error taxonomy (`TransientError` / `BusinessError` → `ApplicationError(non_retryable=...)`).
   - Emit `task.started/succeeded/retrying/failed` events through `events.publish`.
3. Add the matching compensation activity (`..._undo`) with a more generous retry policy.
4. Register both in `worker.py`.
5. Test with Temporal `ActivityEnvironment` + `respx` for HTTP.

### PB-3: Add a product to the catalog
1. Create `catalog/products/<product>.yaml` following ARCHITECTURE §4.
2. Run `make validate-catalog` (checks: DAG acyclic, deps exist, every non-read-only task has compensation, system/action known).
3. Add a golden test: plan → expected topological waves.
4. Add to scenario runner product list.

### PB-4: Add a chaos scenario
1. Define in `scripts/scenarios/<name>.py`: chaos config(s) → submit order → expected terminal state → expected task states.
2. Assertions must include **invariants** (`invariants.check(order_id)`).
3. Register in `scenarios/__init__.py` and expose via `POST /demo/scenarios/{name}`.
4. Add a button in the Chaos page (name + one-line description).

### PB-5: Write a workflow test
1. Use `WorkflowEnvironment.start_time_skipping()`.
2. Replace activities with fakes that raise scripted errors (`fail_n`, `business_error`, `always_fail`).
3. Assert: final state, order of compensations (reverse), attempt counts, no compensation for read-only/best-effort tasks.
4. Add replay test from a recorded history JSON (`tests/histories/`) to catch non-determinism.

### PB-6: Add an event type end-to-end
1. Add to `shared/events.py` (enum + payload model).
2. Publish from activity/workflow publisher.
3. Handle in `projector` (idempotent upsert; dedupe on `event_id`).
4. Expose via SSE payload and TypeScript type in `web/lib/types.ts`.
5. Render in timeline component.

### PB-7: Add a console page/component
1. Types in `web/lib/types.ts` (zod-validated at boundary).
2. Data via TanStack Query (snapshot) + SSE hook (`useOrderStream`) for deltas.
3. Loading, empty, error states mandatory.
4. State colors from `web/lib/stateColors.ts` only (no ad-hoc colors).
5. Playwright smoke test for the page.

### PB-8: Debug a stuck or failed order
1. Open Temporal UI link from the order detail page → inspect history.
2. Check `ops.events` for last event and `ops.tasks` for task states.
3. Hit `GET /admin/chaos` on suspect mock; clear with `DELETE /admin/chaos`.
4. Check worker logs filtered by `order_id`.
5. If `NEEDS_ATTENTION`: use retry-compensation signal or resolve manually; record in audit log.

### PB-9: Prepare the demo
1. `make down && make up && make seed`.
2. `make demo-check` (health of all services + one smoke order).
3. Run scenarios S1→S10 once; `make invariants` must PASS.
4. Clear data (`make reset-data`), warm up by running S1 once.
5. Open: Console, Temporal UI, Grafana (optional), architecture slide.
6. Verify backup video is on the local disk.

### PB-10: Write the short report (`docs/REPORT.md`, 3–4 pages)
Sections: Problem → Approach → Architecture (diagram) → Failure handling & guarantees → Results (metrics table, invariant output) → Demo screenshots → Limitations & roadmap. Numbers come only from `make report-data` output.

---

## Part C — Agent Skill Prompts (copy-paste starters)

- **"Implement task T-xx"** → "Read BRAIN.md, RULES.md, AGENTS.md, then TASKS.md entry T-xx. Implement only that task. Follow the matching playbook in SKILLS.md. Add tests. Run `make check`. Report changed files and any decision that should be added to BRAIN.md."
- **"Review for determinism"** → "Audit `services/orchestrator/workflows/` against RULES.md §Workflow Purity. List violations with file:line and fixes."
- **"Chaos sweep"** → "Write and run PB-4 scenarios for every system × {transient, permanent, compensation-failure}. Report invariant results."
