# BRAIN — SwitchOn Project Memory

> The single source of context. Humans and AI agents read this **first**. Update it whenever a decision changes. If this file and another doc disagree, **fix the disagreement the same day**.

## 1. One-Paragraph Brief
SwitchOn automates telecom service activation. One order becomes a dependency-aware task graph executed by a Temporal workflow across five mock systems (OMS, Inventory, Network, Billing, Notification). Transient failures are retried; permanent failures trigger saga compensation in reverse order so no customer is left half-activated. Operators watch everything live in a Next.js console; metrics report activation time and success rate.

## 2. The Hackathon Win Condition
Judges score: problem fit, technical depth, working demo, resilience, UX, documentation. Our edge:

1. **Failure is the feature.** Most teams demo the happy path. We demo 6 failure modes live, including a worker crash.
2. **Provable correctness.** An *invariant checker* proves zero orphaned/half-activated resources after chaos runs. Show the number.
3. **Real engine, not a script.** Temporal durability + replay tests.
4. **Visual story.** DAG lighting up green, flipping to purple (compensating), ending slate (rolled back) — memorable in 10 seconds.
5. **Business sense.** Billing starts last; notifications are best-effort; money is never taken for a broken service.

## 3. Mental Model (memorize)

- **Workflow = brain** (pure, deterministic, no I/O).
- **Activity = hands** (does I/O, idempotent, retried).
- **Compensation = undo button** (also an activity, also idempotent, runs in reverse completion order).
- **Event = news** (published after the fact; Temporal is the truth).
- **Mock = pretend telco system** (stateful, can be sabotaged via chaos API).

## 4. Glossary

| Term | Meaning |
|---|---|
| Order | Customer request to activate a service |
| Plan | Resolved, versioned task graph for an order |
| Task | One unit of work against one system |
| Compensation | Action undoing a completed task's effect |
| Saga | Sequence of local actions + compensations for consistency |
| Half-activated | Some systems changed, others not, with no rollback — **forbidden state** |
| NEEDS_ATTENTION | Compensation failed after retries; operator must act; fully audited |
| Chaos | Injected failure on a mock system |
| Invariant | Rule that must always hold after terminal state (see §7) |

## 5. Locked Decisions (do not relitigate without evidence)

| # | Decision | Reason |
|---|---|---|
| D1 | Temporal + Python | Best fit for per-order durable sagas |
| D2 | REST mocks with Idempotency-Key | Demo-friendly, realistic |
| D3 | Redis Streams for events/queue | Real MQ semantics, light |
| D4 | Plan passed into workflow as input | Determinism, versioning |
| D5 | Catalog in YAML | Proves genericity |
| D6 | Billing charging starts only after service verified | Business correctness |
| D7 | Notification is best-effort | Must not roll back a working service |
| D8 | Next.js + React Flow console | Judge-visible polish |
| D9 | Demo-scale timers via `DEMO_MODE` | Keep demos < 10 s |
| D10 | Cancelled orders excluded from success-rate denominator | Operator intent ≠ failure |

## 6. Open Questions (resolve early, record answer here)

- [ ] Do we have a laptop + projector fallback? Record a backup video by Phase 7.
- [ ] Team size and ownership split? (fill in) — Backend/Workflow: ___ · Mocks: ___ · Frontend: ___ · Demo/Report: ___
- [ ] Hackathon submission format & deadline? (fill in)
- [ ] Is a hosted demo (VM) needed, or local-only? Default: local + recorded video.

## 7. Invariants (checked by `scripts/invariants.py`)

After **every terminal order**:
1. `ACTIVE` ⇒ inventory reserved ∧ network service active ∧ billing charging started ∧ OMS order completed.
2. `ROLLED_BACK` / `CANCELLED` ⇒ no active reservation ∧ no network service ∧ no billing account (or voided) ∧ no charges outstanding.
3. `NEEDS_ATTENTION` ⇒ at least one task in `COMPENSATION_FAILED` and an audit event explaining it.
4. No order has two active resource sets (idempotency).
5. Every mock-side resource maps to an order_id (no orphans).

Run after chaos load; print PASS/FAIL table. **This is the proof slide.**

## 8. Demo Script (3–4 minutes)

1. (20s) Problem: show half-activated customer cartoon/slide.
2. (30s) Submit order → DAG goes green → ACTIVE in ~4s. KPI cards tick.
3. (40s) Chaos: network 503 ×2 → amber retry badges → ACTIVE.
4. (60s) Chaos: billing fails after network is live → purple compensating → deprovision → release → ROLLED_BACK. Customer notified.
5. (30s) Kill worker mid-order (`make kill-worker`) → restart → order resumes.
6. (30s) Load 100 orders, 20% failures → metrics + invariant PASS.
7. (20s) Architecture slide + Temporal UI history.

Fallback: pre-recorded video + screenshots in `docs/`.

## 9. Pitch Lines
- "We don't just switch services on — we guarantee they never get stuck half on."
- "Every failure ends in a state we can prove is consistent."
- "Kill the worker. The order still finishes."

## 10. Known Traps
- Non-determinism in workflow code (random, time, uuid, dict-order assumptions, direct HTTP) → replay failures.
- Retrying business errors → wasted time, confusing UI.
- Compensating in wrong order → orphaned resources.
- Event/State drift in UI → always reconcile with `get_state` query.
- Over-polishing the UI before P0 backend invariants pass.
- Docker memory pressure → cap Postgres/Temporal, close other apps before demo.

## 11. Status Board (update daily)

| Area | Status | Notes |
|---|---|---|
| Repo + compose | ☐ | |
| Mocks | ☐ | |
| Workflow happy path | ☐ | |
| Retries | ☐ | |
| Saga rollback | ☐ | |
| Events + projector | ☐ | |
| API + SSE | ☐ | |
| Console | ☐ | |
| Metrics | ☐ | |
| Chaos + scenarios | ☐ | |
| Invariants | ☐ | |
| Docs + report | ☐ | |
| Demo rehearsal | ☐ | |

## 12. Decision Log (append-only)

| Date | Decision | Why | Who |
|---|---|---|---|
| | | | |
