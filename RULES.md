# RULES — SwitchOn (v2, Non-Negotiable)

**MUST / MUST NOT / SHOULD** follow RFC 2119. 🔴 = hard gate (blocks merge). 🟡 = strong default (deviation requires a note in BRAIN §12).
Precedence when documents conflict: **RULES > BRAIN locked decisions > ARCHITECTURE > TASKS > others.**

## 1. Workflow Purity 🔴
Applies to `services/orchestrator/workflows/`.
1. MUST NOT perform network, DB, file, or Redis I/O.
2. MUST NOT call `datetime.now()`, `time.time()`, `random`, `uuid4()` or read env vars; use `workflow.now()/random()/uuid4()` and input data.
3. MUST NOT depend on unordered-collection iteration; sort first.
4. MUST NOT import side-effecting modules; pass-through imports only for pure modules.
5. MUST receive the resolved **plan as input**; MUST NOT load the catalog.
6. MUST keep history bounded (no unbounded loops).
7. Any behavior change affecting in-flight orders MUST use `workflow.patched()`; the replay test MUST pass.

## 2. Activities & Idempotency 🔴
1. Every system call MUST send `Idempotency-Key: {order_id}:{task_id}:{action}` and `X-Chaos-Key` (when present on the order).
2. Activities MUST be safe to execute more than once.
3. Every mutating task MUST declare a compensation (else `read_only` or `best_effort`).
4. Compensations MUST be idempotent: "already undone / not found" = success.
5. Every activity MUST set `start_to_close_timeout` (and heartbeat if > 10 s).
6. HTTP clients MUST have explicit connect/read timeouts and MUST NOT retry internally.
7. Errors MUST map to the taxonomy; business errors MUST be non-retryable.
8. Activities MUST NOT swallow exceptions or return error strings as success.

## 3. Saga Correctness 🔴
1. On any non-best-effort task failure the workflow MUST stop scheduling and roll back.
2. Compensation MUST run in **reverse completion order**, and MUST also cover **unknown-outcome** tasks (timeout/connection loss).
3. **Business errors are known-not-applied** and MUST NOT be compensated.
4. **Every compensation MUST write a tombstone** for the forward idempotency key; **every forward endpoint MUST check tombstones in the same transaction as its effect.**
5. A failed compensation MUST be retried with a higher cap, then escalate to `NEEDS_ATTENTION`; MUST NOT be dropped.
6. Terminal states are exactly `ACTIVE, ROLLED_BACK, NEEDS_ATTENTION, CANCELLED`.
7. `start_charging` MUST be downstream of a `verify` task; notification MUST be downstream of billing start; both enforced by the catalog validator.
8. Notification failure MUST NOT roll back a live service.

## 4. Events & State 🔴
1. Temporal is the source of truth; read models are derived and rebuildable.
2. Events MUST carry `event_id, order_id, seq, ts, type`; consumers MUST dedupe on `event_id`.
3. Schema changes MUST be additive; breaking changes need a version field + BRAIN entry; `contracts/` updated in the same PR.
4. The UI MUST reconcile with a snapshot on (re)connect; deltas alone are insufficient.
5. Poison messages → DLQ; the projector MUST NOT crash-loop.

## 5. Mocks 🔴
1. Mocks MUST persist state to Postgres (no in-memory-only state).
2. Each mock MUST implement idempotency replay, tombstones, chaos hook, latency simulation, `/healthz`, `/metrics`, `/admin/chaos`, `/admin/audit/resources`.
3. Mocks MUST NOT call each other or know about orchestration.
4. Chaos MUST default to **off** at boot and be resettable.
5. Seeded faults MUST be a pure function of `(seed, chaos_key, action, call_count)`; no wall-clock or global randomness.
6. Response shapes SHOULD resemble TM Forum conventions (`id`, `href`, `state`) 🟡.

## 6. Proof Integrity 🔴 (X1, X2, X9)
1. The baseline engine MUST receive the **same retry budget and the same seeded faults** as SwitchOn. No strawmen.
2. Leak metrics MUST be computed from mock databases by the invariant checker, never from orchestrator self-reports.
3. Certificates MUST use canonical JSON, SHA-256 hash chaining, and Ed25519 signatures; verification MUST work offline.
4. The invariant checker and certificate verifier MUST each have a **negative test** (corruption ⇒ FAIL).
5. Property-based tests MUST include: random failure position, random failure type, random compensation failure, random delays. Failing seeds MUST be recorded as regression tests.

## 7. Data & Privacy 🔴
1. Synthetic data only. No real personal data anywhere.
2. MSISDN/ICCID/email masked in logs, events, stored payloads (`98XXXXXX10`).
3. Secrets only via env; `.env` ignored; signing keys never committed.
4. Schema changes only via Alembic; reversible where practical.

## 8. API Design 🟡
1. Pydantic-typed endpoints; errors are RFC 7807 problem JSON; no stack traces to clients.
2. `POST /orders` is async (202) and idempotent by `client_order_ref` (race-safe).
3. Operator/admin routes require `X-API-Key` (disable only via `AUTH_DISABLED=true` in dev).
4. All list endpoints paginated.
5. `contracts/` is the source of truth; implementations MUST conform, generated TS types MUST NOT be hand-edited.

## 9. Observability 🟡
1. JSON logs always include `order_id` when one exists.
2. Every outbound call records latency/outcome (`ops.system_calls` + Prometheus histogram).
3. Metric names `switchon_<noun>_<unit>`; never label by `order_id`.
4. Metrics MUST be computed exactly as ARCHITECTURE §15 — no alternate definitions in UI/report.

## 10. Testing 🔴
1. `make check` MUST pass before a task is done.
2. Workflow behavior tested with time-skipping; rollback tested at **every task position** and for **every failure type**.
3. Replay test MUST pass in CI.
4. No real sleeps for orchestration timing in tests.
5. Tests MUST NOT be deleted or weakened to pass; fix the cause. Flaky test = bug.
6. Scenarios S1, S4, S11 run in CI integration.

## 11. Frontend 🟡
1. TS `strict`; no `any`; zod-validate API/SSE payloads.
2. State colors from `web/lib/stateColors.ts` only; state also shown by icon + text.
3. Every view has loading, empty, error states.
4. Legible at 1280×720 projector size; body ≥ 14 px; high contrast.
5. Honor `prefers-reduced-motion`; animations never hide state.

## 12. Dependencies, Config, Process 🟡
1. New dependency ⇒ TECHSTACK.md updated in the same PR with a reason.
2. Lockfiles committed; images pinned (no `latest`); **never use `temporalio/auto-setup`** (deprecated).
3. Config via typed env settings; no magic constants (retry/timeouts in catalog or settings).
4. `DEMO_MODE` compresses time constants only; MUST NOT alter logic paths 🔴.
5. Conventional Commits referencing `T-xx`; PRs ≤ ~400 changed lines (excl. generated/lock).
6. `main` always demoable; broken `main` fixed/reverted within 15 min.
7. After feature freeze (T-91): bugfixes only, each with a failing test first.
8. Behavior-changing decisions appended to BRAIN §12 same day.

## 13. Demo Safety 🔴
1. `make demo` deterministic (fixed seeds, explicit chaos configs).
2. Backup recording MUST exist before presenting.
3. Pre-flight: `make reset-data && make demo-check && make invariants` all PASS.
4. Never debug live; switch to the recording and keep narrating.
5. All demo data is reset-able in one command.

## 14. Honesty in Claims 🔴
1. Report/slide numbers come only from `make report-data` output.
2. State plainly what is mocked and what is real.
3. Claim "zero **inconsistent end states**", never "zero failures".
4. Describe the baseline accurately ("scripted hand-offs with 3× retry, no compensation"); do not imply it represents any specific vendor.
5. SLO targets are reported as measured actuals vs targets.

## Merge Checklist (PR template)
- [ ] `make check` green · [ ] workflow + replay + property tests green (if orchestrator touched)
- [ ] Idempotency, **tombstone**, and compensation confirmed for new/changed actions
- [ ] `contracts/` and generated types updated; events additive
- [ ] TECHSTACK/BRAIN/TASKS updated if needed
- [ ] No secrets/PII/`latest` tags · [ ] `make demo` S1 + S4 + S11 still pass
