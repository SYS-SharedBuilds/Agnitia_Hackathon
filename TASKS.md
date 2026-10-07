# TASKS — SwitchOn

Format: `T-xx [P0|P1|P2] Title — Acceptance criteria (AC)`. Check the box only when **AC is met and `make check` passes**.
Dependencies are listed as `needs:`. Phases are sequential; tasks inside a phase can parallelize across team members.

Time guidance assumes a short hackathon window; scale phases proportionally. **Phases 0–5 = a complete, winning P0 product.** Phases 6–8 add polish and proof.

---

## Phase 0 — Foundation

- [ ] **T-01 [P0] Monorepo scaffold** — Layout per TECHSTACK §7, `uv` workspace, `pnpm` web, `.env.example`, `Makefile` (`up down logs check test fmt`), pre-commit (ruff/mypy). AC: `make check` runs green on empty repo.
- [ ] **T-02 [P0] Docker Compose base** — postgres, redis, temporal, temporal-ui with healthchecks. needs: T-01. AC: `make up` → Temporal UI at :8233, all healthy.
- [ ] **T-03 [P0] Shared package** — pydantic models (Order, Task, Plan, Event), error taxonomy, settings, structlog config, idempotency-key helper. needs: T-01. AC: unit tests pass; mypy strict clean.
- [ ] **T-04 [P0] CI pipeline** — GitHub Actions: lint, types, unit tests. AC: PR check passes.

## Phase 1 — Mock Systems

- [ ] **T-10 [P0] Mock framework** — single FastAPI app parameterized by `SYSTEM`; middleware for idempotency store, latency, chaos, request logging, `/healthz`, `/metrics`. needs: T-03. AC: unit tests for replay + chaos modes.
- [ ] **T-11 [P0] Inventory mock** — reserve/release; stock table; `OUT_OF_STOCK` business error. AC: reserve→release→release (idempotent) tested.
- [ ] **T-12 [P0] Network mock** — provision/deprovision/verify; port/VLAN/IP allocation; stateful. AC: verify fails if not provisioned.
- [ ] **T-13 [P0] Billing mock** — create/void account; start/reverse charging. AC: cannot start charging on voided account (409).
- [ ] **T-14 [P0] OMS mock** — validate/complete/reopen. AC: validation rules (address, plan, SIM) return 422 business errors.
- [ ] **T-15 [P0] Notification mock** — enqueue to Redis Stream, async consumer sends "SMS/email", delivery receipt. AC: message visible in `notify.messages`; consumer ack tested.
- [ ] **T-16 [P0] Chaos admin API** — `PUT/GET/DELETE /admin/chaos` with modes + match filters + `fail_on_compensation`. AC: all modes unit-tested.
- [ ] **T-17 [P0] Mock compose services** — five containers wired to Postgres schemas. needs: T-11..T-16. AC: curl each happy path from README.

## Phase 2 — Orchestration Core

- [ ] **T-20 [P0] Catalog loader + validator** — YAML → `Plan`; DAG acyclicity, dependency existence, compensation presence rule. AC: `make validate-catalog`; golden wave test.
- [ ] **T-21 [P0] System clients** — typed httpx clients for 5 systems with timeouts and error mapping. needs: T-17. AC: respx tests for 2xx/4xx/5xx/timeout mapping.
- [ ] **T-22 [P0] Activities (forward)** — one per task action, idempotency keys, events emitted. needs: T-21. AC: ActivityEnvironment tests.
- [ ] **T-23 [P0] Activities (compensation)** — undo for every non-read-only task. AC: idempotent-undo tests.
- [ ] **T-24 [P0] Workflow: happy path** — wave scheduling with parallel branches. needs: T-20, T-22. AC: time-skipping test: ACTIVE; network ‖ billing ran concurrently.
- [ ] **T-25 [P0] Retry policies** — per-task from catalog; non-retryable business errors. AC: tests for transient→success, business→fast fail.
- [ ] **T-26 [P0] Workflow: saga rollback** — reverse completion order; `ROLLED_BACK`. AC: tests for failure at every task position (parameterized) → invariant satisfied.
- [ ] **T-27 [P0] Compensation failure path** — retries, `NEEDS_ATTENTION`. AC: test with `fail_on_compensation`.
- [ ] **T-28 [P0] Best-effort tasks** — notification failure doesn't roll back. AC: test.
- [ ] **T-29 [P0] Worker entrypoint** — task queues, graceful shutdown, metrics. AC: runs in compose; order completes via curl to Temporal client script.
- [ ] **T-30 [P1] Signals** — `cancel_order`, `retry_failed_compensation`, `resolve_manually`; query `get_state`. AC: tests per signal.
- [ ] **T-31 [P0] Replay test** — recorded history replays without non-determinism errors. AC: in CI.

## Phase 3 — API, Events, Read Model

- [ ] **T-40 [P0] Order API: submit** — validation, idempotent by `client_order_ref`, plan resolution, start workflow (`REJECT_DUPLICATE`). AC: duplicate submit → same order (S8).
- [ ] **T-41 [P0] Event publisher** — Redis Stream publish with seq + event_id. AC: ordering test.
- [ ] **T-42 [P0] Projector** — consume, dedupe, upsert `ops.*`, DLQ for poison. AC: duplicate event delivery test; crash/restart resumes from group offset.
- [ ] **T-43 [P0] Read endpoints** — list/detail/events/catalog with filters + pagination. AC: OpenAPI documented.
- [ ] **T-44 [P0] SSE streams** — snapshot then deltas, heartbeat, reconnect with `Last-Event-ID`. AC: integration test receives live events.
- [ ] **T-45 [P1] Operator action endpoints** — cancel / retry-compensation / resolve → signals. AC: audited in `ops.events`.
- [ ] **T-46 [P0] Metrics API** — summary + timeseries (activation p50/p95/p99, success rate, rollback rate, in-flight). AC: SQL tested against seeded data.
- [ ] **T-47 [P1] Prometheus metrics** — counters/histograms from worker + API; Prometheus + Grafana provisioned dashboard. AC: dashboard loads in compose.

## Phase 4 — Operator Console

- [ ] **T-50 [P0] Web scaffold** — Next.js, Tailwind, shadcn, layout/nav, API client, SSE hook, state colors. AC: builds; dark/light OK.
- [ ] **T-51 [P0] Overview page** — KPI cards + live orders table + trend mini-charts. AC: updates live without refresh.
- [ ] **T-52 [P0] Order detail** — React Flow DAG with live states, attempts badges, timeline, payload drawer. AC: S4 visibly flips green→red→purple→slate.
- [ ] **T-53 [P0] New order form** — product, customer, site; submits and navigates to detail. AC: validation errors displayed.
- [ ] **T-54 [P1] Operator actions UI** — cancel / retry compensation / resolve with confirm dialogs. AC: works against T-45.
- [ ] **T-55 [P0] Chaos & Scenarios page** — per-system chaos panel, scenario buttons, load generator form. needs: T-60. AC: S1–S10 launchable.
- [ ] **T-56 [P0] Metrics page** — latency histogram, success trend, per-system error rates. AC: matches API.
- [ ] **T-57 [P1] Catalog page** — render product DAGs from API.
- [ ] **T-58 [P1] Empty/loading/error states + Temporal deep links.** AC: no unhandled states in Playwright run.

## Phase 5 — Scenarios, Load & Proof

- [ ] **T-60 [P0] Scenario runner** — S1–S10 per SKILLS PB-4, CLI + API. AC: `make demo` runs all, prints PASS table.
- [ ] **T-61 [P0] Load generator** — N orders, configurable failure mix, concurrency. AC: 100 orders at ≥ 50 concurrent without worker errors.
- [ ] **T-62 [P0] Invariant checker** — rules in BRAIN §7 across all mock DBs. AC: `make invariants` PASS after load; intentionally corrupt data → FAIL (proves checker works).
- [ ] **T-63 [P0] Worker-kill resilience demo** — `make kill-worker` / `make start-worker`; scenario S7. AC: order completes after restart.

## Phase 6 — Hardening

- [ ] **T-70 [P1] Structured logs w/ order_id correlation across services.**
- [ ] **T-71 [P1] API key auth on operator/admin routes + CORS allowlist.**
- [ ] **T-72 [P1] Rate-limit & timeouts audit** — every outbound call has timeout; every activity has `start_to_close`.
- [ ] **T-73 [P2] Circuit breaker per system** — state shown in console.
- [ ] **T-74 [P2] OpenTelemetry traces → Jaeger.**
- [ ] **T-75 [P1] Coverage ≥ 80% on orchestrator; flake check (run suite 5×).**
- [ ] **T-76 [P1] Playwright e2e: S1, S4 flows.**

## Phase 7 — Documentation & Deliverables

- [ ] **T-80 [P0] Architecture diagram** — export `docs/architecture.mmd` → PNG/SVG (+ DAG diagram + saga sequence diagram).
- [ ] **T-81 [P0] README** — 5-minute quickstart, screenshots, scenario table, troubleshooting.
- [ ] **T-82 [P0] Short report** — `docs/REPORT.md` per SKILLS PB-10 with real metrics from `make report-data`.
- [ ] **T-83 [P0] Demo script + backup video** — per BRAIN §8; record two takes.
- [ ] **T-84 [P1] Slide deck (8–10 slides)** — Problem, Solution, Architecture, Failure handling, Live demo, Results, Roadmap.
- [ ] **T-85 [P0] Clean-clone test** — fresh machine/VM: clone → `make up` → `make demo` works.

## Phase 8 — Rehearsal

- [ ] **T-90 [P0] Full dress rehearsal ×3** — timed, with Q&A drill (see below).
- [ ] **T-91 [P0] Freeze** — tag `v1.0`, no feature changes; bugfix only.

### Judge Q&A Drill
1. Why Temporal over Airflow/Camunda? 2. What if compensation fails? 3. How do you guarantee no double-activation? 4. What happens if Redis dies? 5. How do you handle workflow code changes for in-flight orders (versioning)? 6. How would this scale to 1M orders/day? 7. How is activation time measured? 8. What's mocked vs real?

---

## Definition of Done (every task)
Code + tests + `make check` green + docs/BRAIN updated if a decision changed + no TODO without a ticket id.

## Critical Path
T-01 → T-03 → T-10 → T-11..16 → T-21 → T-22/23 → T-24 → T-26 → T-40 → T-41/42 → T-44 → T-52 → T-60 → T-62 → T-80..83.

## Cut Line (if time is short)
Cut in this order: T-74, T-73, T-47, T-57, T-76, T-30 (keep cancel only), T-84. **Never cut:** T-26, T-27, T-52, T-60, T-62, T-63, T-82, T-83.
