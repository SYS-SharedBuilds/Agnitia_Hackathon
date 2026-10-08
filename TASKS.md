# TASKS — SwitchOn (v2)

Format: `T-xx [Pri] [Size] Title — AC (acceptance criteria) · needs: deps`.
**Size:** S ≤ 2 h · M ≈ ½ day · L ≈ 1 day (single engineer, focused). **Pri:** P0 must · P1 should · P2 stretch.
Done = AC met + `make check` green + docs/BRAIN updated if a decision changed. Dependencies are strictly backward-pointing (no task depends on a later phase).

## Tiers & Scheduling Principle
1. **Phases 0–5 = complete P0 product** (everything in the problem statement).
2. **Wow-early rule:** the highest-impact differentiators (X1 A/B proof, X2 certificate) are P0 and scheduled in Phase 5, right after core works — not left to the end.
3. **Phases 6–7 = Wow (P1)**, then hardening/docs/rehearsal. Never trade away Phase 8.

### If you have N days (guide)
| Window | Plan |
|---|---|
| 3 days | Phases 0–5 minimal UI (T-52 simplified) + T-62, T-63 + docs; skip all P1 |
| 5 days | Phases 0–5 full + T-63, T-70, T-71, T-75 + docs |
| 7+ days | Everything P0/P1; P2 only if rehearsal done |

---
## Phase 0 — Foundation
- [ ] **T-01 [P0][M] Monorepo scaffold** — layout per TECHSTACK §7, uv workspace, pnpm web, `.env.example`, Makefile targets (`up down logs check test fmt demo invariants reset-data seed kill-worker start-worker validate-catalog report-data`), pre-commit. AC: `make check` green on skeleton.
- [ ] **T-02 [P0][M] Compose base** — postgres (3 DBs), redis, `temporalio/server` + `admin-tools` setup job + UI, healthchecks, memory limits, pinned tags. AC: `make up` → Temporal UI :8233, all healthy; worker restart does not lose Temporal data. needs: T-01
- [ ] **T-03 [P0][M] Contracts first** — `contracts/openapi/*.yaml` for Order API + 5 mocks, `events.schema.json`, `certificate.schema.json`; TS type generation target. AC: contracts lint; `make gen-types` works. needs: T-01
- [ ] **T-04 [P0][M] Shared package** — Pydantic models, error taxonomy, settings, structlog, idempotency-key + canonical-JSON + hash helpers, PII masker. AC: unit tests; mypy strict. needs: T-03
- [ ] **T-05 [P0][S] CI** — GitHub Actions: lint, types, unit. AC: PR check green. needs: T-04

## Phase 1 — Mock Systems
- [ ] **T-10 [P0][L] Mock framework** — one FastAPI app by `SYSTEM`; middleware: idempotency store, **tombstone check**, latency, chaos (incl. seeded pure-function mode), logging, `/healthz`, `/metrics`, `/admin/audit/resources`. AC: unit tests for replay, tombstone-reject, every chaos mode, determinism of seeded faults. needs: T-04
- [ ] **T-11 [P0][M] Inventory mock** — reserve/release (+tombstone), stock, `OUT_OF_STOCK`. AC: reserve→release→release; late reserve after release rejected 409.
- [ ] **T-12 [P0][M] Network mock** — provision/deprovision/verify, port/VLAN/IP allocation. AC: verify fails if not provisioned; tombstone tested.
- [ ] **T-13 [P0][M] Billing mock** — create/void account, start/reverse charging. AC: charging on voided account → 409; tombstone tested.
- [ ] **T-14 [P0][S] OMS mock** — validate/complete/reopen + business validations (422 codes). AC: tests.
- [ ] **T-15 [P0][M] Notification mock** — enqueue to Redis Stream, async consumer, delivery receipt. AC: ack/redelivery tested.
- [ ] **T-16 [P0][S] Compose wiring** for 5 mocks. AC: README curl happy path for each. needs: T-11..T-15, T-02

## Phase 2 — Orchestration Core
- [ ] **T-20 [P0][M] Catalog loader + validator** — rules in ARCHITECTURE §4; plan resolution (waves + policies + snapshot). AC: `make validate-catalog`; golden wave tests; negative tests for each rejection rule. needs: T-04
- [ ] **T-21 [P0][M] System clients** — typed httpx clients; error mapping; headers (`Idempotency-Key`, `X-Chaos-Key`). AC: respx tests for 2xx/4xx/5xx/timeout. needs: T-16, T-04
- [ ] **T-22 [P0][L] Forward activities + event publishing** — per ARCHITECTURE §7; attempt-aware retrying events. AC: ActivityEnvironment tests. needs: T-21
- [ ] **T-23 [P0][M] Compensation activities** — undo + tombstone for every mutating action. AC: idempotent-undo tests.
- [ ] **T-24 [P0][L] Workflow: happy path** — wave scheduling, parallel branches, per-system task queues. AC: time-skipping test ACTIVE; branches concurrent. needs: T-20, T-22
- [ ] **T-25 [P0][M] Retry policies** from catalog; non-retryable business errors. AC: tests transient→success; business→fast-fail.
- [ ] **T-26 [P0][L] Saga rollback** — reverse completion order + **unknown-outcome** tasks. AC: parameterized test: failure at **every task position × every failure type** ⇒ consistent end state. needs: T-23, T-24
- [ ] **T-27 [P0][M] Compensation failure path** → retries → `NEEDS_ATTENTION`. AC: test with `fail_on_compensation`.
- [ ] **T-28 [P0][S] Best-effort tasks** don't roll back. AC: test.
- [ ] **T-29 [P0][M] Worker entrypoint** — queues, graceful shutdown, Prometheus. AC: order completes via client script in compose.
- [ ] **T-30 [P1][M] Signals & query** — cancel, retry_compensation, resolve_manually; `get_state`. AC: tests per signal; audit events.
- [ ] **T-31 [P0][S] Replay test** — recorded history replays clean; in CI.

## Phase 3 — API, Events, Read Model
- [ ] **T-40 [P0][M] Order API: submit** — validation, race-safe idempotency, plan snapshot, start workflow (`REJECT_DUPLICATE`), `RECEIVED` sweeper if Temporal is unavailable. AC: S8 incl. concurrent duplicates. needs: T-20, T-29
- [ ] **T-41 [P0][S] Event publisher** — Redis Streams, seq/event_id. AC: ordering test.
- [ ] **T-42 [P0][M] Projector** — dedupe, upsert `ops.*`, DLQ. AC: duplicate/out-of-order delivery tests; restart resumes.
- [ ] **T-43 [P0][M] Read endpoints** — list/detail/events (`upto_seq`)/catalog; pagination. AC: OpenAPI conformance test.
- [ ] **T-44 [P0][M] SSE** — snapshot then deltas, heartbeat, `Last-Event-ID`. AC: integration test.
- [ ] **T-45 [P1][S] Operator action endpoints** → signals. AC: audited.
- [ ] **T-46 [P0][M] Metrics API** — definitions per ARCHITECTURE §15. AC: SQL tests on seeded data.
- [ ] **T-47 [P1][M] Prometheus + Grafana** provisioned dashboard.

## Phase 4 — Operator Console (P0 core)
- [ ] **T-50 [P0][M] Web scaffold** — Next.js, Tailwind, shadcn, layout, generated API types, SSE hook, `stateColors.ts`. AC: builds; 1280×720 OK.
- [ ] **T-51 [P0][M] Overview** — KPIs + live table + trends. AC: live without refresh.
- [ ] **T-52 [P0][L] Order detail** — live React Flow DAG, attempts badges, timeline, payload drawer. AC: S4 visibly green→red→purple→slate.
- [ ] **T-53 [P0][S] New-order form.** AC: validation errors displayed.
- [ ] **T-54 [P0][M] Chaos panel** — per-system chaos toggles/reset via mock admin APIs (proxied by Order API). AC: toggling chaos changes next-call behavior. needs: T-16, T-50
- [ ] **T-55 [P0][S] Metrics page.**

## Phase 5 — Scenarios, Proof (P0 "Core-Wow")
- [ ] **T-60 [P0][L] Scenario runner S1–S12** — CLI + `POST /demo/scenarios/{name}`; each asserts terminal state + invariants. AC: `make demo` prints PASS table. needs: T-40, T-46
- [ ] **T-61 [P0][M] Load generator** — N orders, concurrency, failure mix, seed. AC: 100 orders at ≥ 50 concurrent, zero worker errors.
- [ ] **T-62 [P0][L] Invariant checker** — reads mock DBs directly; INV-1…INV-6 + leak metrics; **negative test**. AC: PASS after load; corrupted data ⇒ FAIL.
- [ ] **T-63 [P0][S] Worker-kill demo** (`kill-worker`/`start-worker`) — S7. AC: completes after restart ≤ 15 s.
- [ ] **T-64 [P0][L] Baseline engine** — sequential scripted pipeline, 3× retry, no compensation; selectable via `engine=baseline`. AC: demonstrably leaks under S4/S5 seeds.
- [ ] **T-65 [P0][M] A/B proof harness (X1)** — `ab_proof.py` + `POST /demo/ab-proof` + JSON. AC: identical fault schedule verified by test; table printed.
- [ ] **T-66 [P0][L] Consistency Certificate (X2)** — hash chain, state digest, Ed25519 seal, endpoints, offline verifier, **tamper test**. AC: verify PASS; mutate one event ⇒ FAIL.
- [ ] **T-67 [P0][M] Property-based chaos suite (X9)** — Hypothesis over failure position/type/compensation faults/delays against Temporal test env. AC: ≥ 1,000 generated schedules, invariants hold; failing seeds auto-saved.
- [ ] **T-68 [P0][S] S11 late-arrival race** scenario + test. AC: tombstone rejects late forward.
- [ ] **T-69 [P0][M] Console: Scenarios & Proof pages** — scenario launcher (S1–S12), load-generator form, A/B table (X1), certificate panel + Verify + tamper demo (X2). AC: every scenario launchable and its result visible live. needs: T-60, T-61, T-65, T-66, T-54

## Phase 6 — Wow Features (P1)
- [ ] **T-70 [P1][M] Time-Travel Replay (X5)** — slider over `seq` using `events?upto_seq`.
- [ ] **T-71 [P1][M] Rollback Preview & Blast Radius (X6)** — endpoints + hover UI.
- [ ] **T-72 [P1][M] Root-Cause Explainer (X7)** — rules table, stored explanation, UI card; (P2: optional LLM paraphrase behind flag).
- [ ] **T-73 [P1][M] Reconciler (X4)** — sweep, drift table, safe auto-repair, console view. AC: inject orphan → detected and compensated.
- [ ] **T-74 [P1][M] TMF622-style façade (X8)** — mapping + state names; contract test.
- [ ] **T-75 [P1][M] Circuit breaker + bulkhead** per system; shown live (FR-14).
- [ ] **T-76 [P1][S] More products** (5G Postpaid, eSIM add-on) + Catalog page.
- [ ] **T-77 [P1][S] Fallout queue UI** with guided actions (needs T-45).

## Phase 7 — Hardening
- [ ] **T-80 [P1][S] API-key auth + CORS allowlist.**
- [ ] **T-81 [P1][S] Timeout audit** — every call/activity bounded.
- [ ] **T-82 [P1][M] Coverage ≥ 80%; 5× flake run.**
- [ ] **T-83 [P1][M] Playwright e2e** — S1, S4, S11.
- [ ] **T-84 [P2][M] OpenTelemetry + Jaeger.**
- [ ] **T-85 [P1][S] Load/perf run** — record p50/p95/p99, throughput, recovery time → `report-data`.

## Phase 8 — Deliverables & Rehearsal
- [ ] **T-90 [P0][S] Architecture diagrams** — context, DAG, saga sequence, tombstone race; exported PNG/SVG.
- [ ] **T-91 [P0][S] README** — 5-min quickstart, screenshots, scenario table, troubleshooting, **mock-vs-real table**.
- [ ] **T-92 [P0][M] Short report** (`docs/REPORT.md`, 3–4 pages) from `make report-data` numbers only.
- [ ] **T-93 [P0][M] Demo script + backup video** (two takes) per BRAIN §8.
- [ ] **T-94 [P1][M] Slide deck (8–10 slides).**
- [ ] **T-95 [P0][S] Clean-clone test** on a fresh machine/VM: clone → `make up` → `make demo` passes.
- [ ] **T-96 [P0][M] Dress rehearsal ×3**, timed, with Q&A drill.
- [ ] **T-97 [P0][S] Freeze** — tag `v1.0`; bugfixes only.

### Judge Q&A Drill (rehearse answers)
1. Why Temporal over Airflow/Camunda? 2. What if a compensation fails? 3. How do you prevent double activation? 4. What if a request times out but still lands later? *(tombstones)* 5. What if Redis dies? 6. How do you change workflow code for in-flight orders? 7. How would this scale to 1M orders/day? 8. How exactly is activation time measured? 9. What is mocked vs real? 10. Is your baseline fair? 11. What does the certificate actually prove — and not prove?

## Critical Path
T-01 → T-03 → T-04 → T-10 → T-11..16 → T-21 → T-22/23 → T-24 → T-26 → T-40 → T-41/42 → T-44 → T-52 → T-60 → T-62 → T-64 → T-65 → T-66 → T-67 → T-90..93 → T-95 → T-96.

## Cut Line (in this order, if time is short)
T-84 → T-75 → T-76 → T-94 → T-83 → T-74 → T-71 → T-77 → T-72 → T-70 → T-73.
**Never cut:** T-26, T-27, T-52, T-60, T-62, T-63, T-64, T-65, T-66, T-67, T-68, T-92, T-93, T-95, T-96.
