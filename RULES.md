# RULES — SwitchOn (Non-Negotiable)

Keywords **MUST / MUST NOT / SHOULD** follow RFC 2119. A rule marked 🔴 is a hard gate: violations block merge. 🟡 = strong default; deviations need a note in the PR/BRAIN decision log.

---

## 1. Workflow Purity 🔴
Workflow code lives in `services/orchestrator/workflows/` only.

1. MUST NOT perform network, DB, file, or Redis I/O.
2. MUST NOT call `datetime.now()`, `time.time()`, `random`, `uuid4()`, or read env vars. Use `workflow.now()`, `workflow.random()`, `workflow.uuid4()` and input data.
3. MUST NOT iterate over unordered collections where order affects decisions; sort first.
4. MUST NOT import modules with side effects; use `workflow.unsafe.imports_passed_through()` only for pure imports.
5. MUST receive the resolved **plan as input**; MUST NOT load the catalog inside the workflow.
6. MUST keep workflow history bounded (no unbounded loops; use child workflows or continue-as-new if ever needed).
7. Any change to workflow logic that affects in-flight orders MUST use `workflow.patched()` / versioning, and the replay test MUST pass.

## 2. Activities & Idempotency 🔴
1. Every activity that calls a system MUST send `Idempotency-Key: {order_id}:{task_id}:{action}`.
2. Activities MUST be safe to execute more than once.
3. Every state-mutating task MUST declare a compensation in the catalog, unless explicitly `read_only: true` or `best_effort: true`.
4. Compensations MUST be idempotent: "already undone / not found" = success.
5. Every activity MUST set `start_to_close_timeout`; long ones MUST heartbeat.
6. HTTP clients MUST have explicit connect/read timeouts and MUST NOT retry internally.
7. Errors MUST be mapped to the taxonomy (`TransientError`, `BusinessError`, `PermanentSystemError`, `CompensationError`). Business errors MUST be non-retryable.

## 3. Saga Correctness 🔴
1. On any non-best-effort task failure the workflow MUST stop scheduling new tasks and begin rollback.
2. Compensation MUST run in **reverse order of completion** and only for tasks that **completed** (never for pending/failed-before-effect tasks, except where the activity contract says partial effects are possible — then the compensation MUST be safe on partial state).
3. A failed compensation MUST be retried with a higher cap, then escalate to `NEEDS_ATTENTION`. It MUST NOT be silently dropped.
4. Terminal states are exactly: `ACTIVE`, `ROLLED_BACK`, `NEEDS_ATTENTION`, `CANCELLED`. No other terminal state may exist.
5. Billing charging MUST start only after `verify_service` succeeds. Customer notification MUST NOT precede billing start. (Catalog-enforced; validator MUST reject violating products.)
6. Notification failure MUST NOT roll back a successfully activated service.

## 4. Events & State 🔴
1. Temporal is the source of truth. The read model is derived and rebuildable.
2. Events MUST carry `event_id`, `order_id`, `seq`, `ts`, `type`. Consumers MUST dedupe on `event_id`.
3. Event schema changes MUST be additive; breaking changes require a version field and a BRAIN entry.
4. The UI MUST reconcile with a state snapshot on (re)connect; it MUST NOT rely solely on deltas.
5. Poison messages go to a DLQ stream; the projector MUST NOT crash-loop.

## 5. Mocks 🟡→🔴
1. Mocks MUST be stateful and persist to Postgres (🔴: no in-memory-only state that disappears on restart).
2. Every mock MUST implement: idempotency replay, chaos hook, latency simulation, `/healthz`, `/metrics`, `/admin/chaos`.
3. Mocks MUST NOT call each other or know about orchestration.
4. Chaos MUST default to **off** at boot and be resettable via `DELETE /admin/chaos`.
5. Mock response shapes SHOULD resemble TM Forum conventions (ids, `state`, `href`) but need not be fully compliant.

## 6. API Design 🟡
1. All public endpoints typed with Pydantic; errors use RFC 7807-style problem JSON `{type,title,status,detail,order_id?}`.
2. `POST /orders` MUST be async (202) and idempotent by `client_order_ref`.
3. Operator/admin routes MUST require `X-API-Key` (configurable; can be disabled only with `AUTH_DISABLED=true` in dev).
4. Pagination on all list endpoints; no unbounded queries.
5. Never leak stack traces to clients.

## 7. Data & Privacy 🔴
1. No real personal data anywhere. Fixtures MUST be synthetic.
2. MSISDN/ICCID in logs and events MUST be masked (`98XXXXXX10`).
3. Secrets only via env; `.env` is git-ignored; `.env.example` has dummy values.
4. DB migrations via Alembic only; no manual schema edits; migrations MUST be reversible where practical.

## 8. Observability 🟡
1. Every log line MUST include `order_id` when one exists; JSON format.
2. Every outbound call records latency and outcome (`system_calls` table + Prometheus histogram).
3. Metric names: `switchon_<noun>_<unit>`; label cardinality MUST be bounded (never label by `order_id`).
4. Activation time MUST be computed exactly as defined in ARCHITECTURE §11 — no alternate definitions in UI or report.

## 9. Testing 🔴
1. `make check` MUST pass before any task is marked done.
2. New workflow behavior MUST have a time-skipping test; rollback MUST be tested at **every** task position.
3. The replay test MUST pass in CI.
4. Tests MUST NOT use real sleeps for orchestration timing; use the time-skipping environment.
5. Tests MUST NOT be deleted or weakened to pass; fix the cause.
6. The invariant checker MUST have a negative test (corrupted data → FAIL).

## 10. Frontend 🟡
1. TypeScript `strict`; no `any`; zod-validate API/SSE payloads.
2. Task/order state colors come from one module (`web/lib/stateColors.ts`).
3. Every data view MUST implement loading, empty, and error states.
4. The console MUST remain usable at 1280×720 (projector resolution) and legible at distance: min 14px body, high contrast.
5. No blocking spinners > 300 ms without skeletons.
6. Accessibility basics: labels, focus states, color + icon/text for state (not color alone).

## 11. Dependencies & Config 🟡
1. New dependency → add to TECHSTACK.md in the same PR with a one-line reason.
2. Lockfiles committed; Docker images pinned to tags (no `latest`).
3. Config via env with typed settings; no magic constants in code (retry/timeouts live in catalog or settings).
4. `DEMO_MODE` only compresses time constants; it MUST NOT change logic paths.

## 12. Git & Process 🟡
1. Conventional Commits; reference `T-xx`.
2. Small PRs (< ~400 changed lines excluding generated/lock files).
3. `main` is always demoable. Broken `main` is fixed or reverted within 15 minutes.
4. After **feature freeze (T-91)** only bug fixes with a linked failing test.
5. Decisions that change behavior MUST be appended to BRAIN §12 the same day.

## 13. Demo Safety 🔴
1. `make demo` MUST be deterministic: scenarios use fixed seeds and explicit chaos configs.
2. A backup recording MUST exist before presenting.
3. Before presenting: `make reset-data`, `make demo-check`, `make invariants` all PASS.
4. Never debug live on stage; switch to the recording and continue narrating.

## 14. Honesty in Claims 🔴
1. Report numbers MUST come from `make report-data` output, not estimates.
2. Slides/report MUST state clearly what is mocked and what is real.
3. Don't claim "zero failures" — claim "zero **inconsistent** end states" (what the invariant checker proves).

---

### Merge Checklist (copy into PR template)
- [ ] `make check` green · [ ] workflow tests + replay green (if orchestrator touched)
- [ ] Idempotency + compensation confirmed for new/changed actions
- [ ] Events/schema changes additive and documented
- [ ] TECHSTACK/BRAIN/TASKS updated as needed
- [ ] No secrets, no real PII, no `latest` tags
- [ ] Demo still works: `make demo` S1 + S4
