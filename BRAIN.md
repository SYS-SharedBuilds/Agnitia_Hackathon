# BRAIN — SwitchOn Project Memory (v2)

> Single source of context. Humans and AI agents read this **first**. Update it whenever a decision changes. If this file and another doc disagree, fix the disagreement the same day (precedence: RULES > BRAIN locked decisions > ARCHITECTURE > TASKS).

## 1. Brief
SwitchOn automates telecom service activation. One order becomes a dependency-aware task graph run by a Temporal workflow across five mock systems (OMS, Inventory, Network, Billing, Notification). Transient failures are retried; permanent or unknown-outcome failures trigger saga compensation (with tombstones) so no customer is left half-activated. Operators watch everything live; every terminal order gets a signed **Consistency Certificate**; an **A/B Proof** shows what a scripted baseline leaks versus SwitchOn.

## 2. Win Condition
Judges weigh problem fit, technical depth, working demo, innovation, resilience, UX, documentation. Our edge, in order of judging impact:
1. **Proof, not claims** — A/B leak counts (X1), signed certificates (X2), property-based chaos (X9), invariant checker.
2. **Distributed-systems rigor** — tombstones for late-arrival races (X3), unknown-outcome compensation, idempotency, durable execution.
3. **Failure is the feature** — 12 scenarios incl. worker kill.
4. **Visual story** — DAG green → red → purple → slate; replay; explainer.
5. **Telco credibility** — fallout queue, TMF622-style façade, billing-last ordering.

## 3. Mental Model
- **Workflow = brain** (pure, deterministic). **Activity = hands** (I/O, idempotent, retried). **Compensation = undo + tombstone**. **Event = news** (derived). **Mock = pretend telco system** (stateful, sabotageable). **Certificate = receipt** (verifiable evidence).

## 4. Glossary
| Term | Meaning |
|---|---|
| Plan | Resolved, versioned task graph snapshotted on the order |
| Compensation | Idempotent undo of a task's effect; also writes a tombstone |
| Tombstone | Record that a forward idempotency key is cancelled; late forward requests get 409 |
| Unknown outcome | Timeout/connection loss: effect may exist ⇒ compensate |
| Half-activated | Some systems changed, others not, no rollback — **forbidden** |
| Fallout | Telco term for orders needing manual intervention (= `NEEDS_ATTENTION`) |
| Leak | Inconsistency left behind: billed-without-service, service-without-billing, orphan, stuck |
| Chaos key | `X-Chaos-Key` used to make faults deterministic per order |
| Certificate | Signed, hash-chained evidence of an order's history and audited system state |

## 5. Locked Decisions
| # | Decision | Reason |
|---|---|---|
| D1 | Temporal + Python | Durable per-order sagas |
| D2 | **`temporalio/server` + `admin-tools`** (not deprecated `auto-setup`) | Maintained, security-patched |
| D3 | REST mocks with Idempotency-Key | Demo-friendly, realistic |
| D4 | Redis Streams events/queue | Real MQ semantics, light |
| D5 | Plan passed as workflow input | Determinism, versioning |
| D6 | YAML catalog + validator | Genericity + safety rules |
| D7 | Billing starts only after verify; notify after billing; notify best-effort | Business correctness |
| D8 | Next.js + React Flow console | Judge-visible polish |
| D9 | `DEMO_MODE` compresses time only | Fast demos, no logic fork |
| D10 | Success rate excludes CANCELLED | Intent ≠ failure |
| D11 | **Tombstone compensation** | Closes late-arrival orphan race |
| D12 | **Unknown-outcome ⇒ compensate; business error ⇒ don't** | Correctness |
| D13 | **Baseline engine gets same retries + same seeded faults** | A/B credibility |
| D14 | **Ed25519-signed, hash-chained certificates** | Verifiable proof |
| D15 | **Contract-first** (`contracts/`) | Parallel work; agent safety |
| D16 | LLM only optional paraphrase, never critical path | Demo reliability |

## 6. Open Questions (fill early)
- [ ] Submission deadline & format: ___
- [ ] Team size / ownership — Workflow & saga: ___ · Mocks & chaos: ___ · API & events: ___ · Console: ___ · Proof & docs: ___
- [ ] Presentation: live on own laptop? projector resolution? Internet available? (design assumes offline)
- [ ] Hosted demo needed? Default: local + recorded video.
- [ ] Organizer's required report/slide template? Adopt it in T-92/T-94.

## 7. Invariants (checked by `scripts/invariants.py` from mock DBs, and embedded in certificates)
- **INV-1** `ACTIVE` ⇒ inventory reserved ∧ network service active ∧ billing charging active ∧ OMS completed.
- **INV-2** `ROLLED_BACK|CANCELLED` ⇒ no reservation ∧ no network service ∧ no active billing account/charges ∧ OMS not completed.
- **INV-3** `NEEDS_ATTENTION` ⇒ ≥1 `COMPENSATION_FAILED` task ∧ audit event with reason.
- **INV-4** No order has two active resource sets (idempotency).
- **INV-5** Every mock-side resource maps to an order_id (no orphans); no resource exists for a tombstoned key.
- **INV-6** Charging never started before service verified (check event order).

## 8. Demo Script (target ≈ 4 min; each beat has a fallback)
1. **(20 s) Problem** — "Billed for nothing" slide.
2. **(30 s) Happy path** — submit order; DAG parallel branches; ACTIVE in seconds; open certificate → Verify ✔.
3. **(40 s) Retries** — network 503 ×2 → amber badges → ACTIVE.
4. **(60 s) Rollback** — billing fails *after* network is live → purple compensating → slate → explainer card → customer notified. Use Rollback Preview on hover first.
5. **(30 s) Late-arrival race (S11)** — one sentence on tombstones; show 409 in timeline.
6. **(30 s) Kill the worker** — `make kill-worker` → restart → resumes.
7. **(60 s) A/B Proof** — 200 seeded orders: baseline leak table vs SwitchOn zeros; invariant PASS.
8. **(20 s) Tamper demo** — mutate an event → Verify ✘ → restore.
9. **(10 s) Architecture slide + Temporal history.**
Fallback for any beat: pre-recorded clip; keep narrating.

## 9. Pitch Lines
- "We don't just switch services on — we guarantee they never get stuck half on, and we can prove it."
- "Same faults. Two engines. The baseline leaves *N* broken customers; SwitchOn leaves zero."
- "Kill the worker. The order still finishes."
- "Every order ends with a receipt you can verify offline."

## 10. Known Traps
- Non-determinism in workflow code → replay failures.
- Using deprecated `temporalio/auto-setup`.
- Retrying business errors; compensating business errors (never applied).
- Forgetting tombstones ⇒ orphan under timeouts.
- Compensation order wrong; compensating only *succeeded* tasks and missing unknown-outcome ones.
- A/B strawman (unequal retries) — destroys credibility.
- Certificates over-claiming; say what they attest.
- UI/state drift — always reconcile with snapshot.
- Polishing UI before P0 invariants pass.
- Docker memory pressure on demo day.

## 11. Rejection-Risk Register
| Risk | Likelihood | Impact | Control |
|---|---|---|---|
| Demo crashes on stage | M | Severe | Deterministic scenarios, reset script, backup video |
| "It's just mocks/scripts" critique | M | High | Real engine, RTM, mock-vs-real table, honest scope |
| "Baseline is a strawman" critique | M | High | D13, documented method, same seeds |
| Cannot explain design | L | Severe | Q&A drill ×3 |
| Missing deliverable | L | Severe | RTM + deliverables checklist (T-90…T-95) |
| Overbuilt, underfinished | M | High | Tiers, cut line, wow-early rule |

## 12. Status Board (update daily)
| Area | Status | Notes |
|---|---|---|
| Repo, compose, contracts | ☑ | 13 containers running healthy in compose |
| Mocks (+tombstones, chaos) | ☑ | 5 mocks with deterministic chaos + tombstones (409 TOMBSTONED) |
| Workflow happy path | ☑ | Wave-based pure Temporal workflow, time-skipping tests PASS |
| Retries | ☑ | Transient 503 retries, exponential backoff, business error fast-fail |
| Saga rollback (+unknown outcome) | ☑ | Reverse order compensation + tombstone cancel-wins |
| Events + projector | ☑ | Redis Streams publisher + PostgreSQL read-model projector |
| API + SSE | ☑ | FastAPI gateway, idempotency, SSE stream |
| Console core | ☑ | Next.js 14 production build, responsive operator dashboard :3000 |
| Metrics | ☑ | Real SQL aggregations for p50/p95 latency and consistency rates |
| Scenarios S1–S12 | ☑ | All 12/12 demo scenarios verified and PASS table printed |
| Invariants | ☑ | INV-1..INV-6 checked directly against live mock audit resources |
| Baseline + A/B | ☑ | Baseline engine demonstrates leaks (33.3%); SwitchOn 0 leaks (100.0%) |
| Certificates | ☑ | Ed25519 signature + SHA256 event hash chain + offline verifier + tamper test |
| Property tests | ☑ | Unit and property tests verified |
| Wow features | ☑ | Explainer, reconciler, multiple products |
| Docs + report | ☑ | Docs, architecture, and report data aligned |
| Rehearsal ×3 | ☐ | Rehearsal demo script ready |

## 13. Decision Log (append-only)
| Date | Decision | Why | Who |
|---|---|---|---|
| 2026-10-08 | Added cryptography>=42.0.0 to dependencies | Required by Ed25519 certificate signing in order-api | Agent |
| 2026-10-08 | Use Temporal server start-dev with persistent db | Resolves compose template postgres dialect restriction cleanly | Agent |
| 2026-10-08 | Invariant checker queries ops.orders where engine='temporal' | Preserves invariant audit distinction from intentional baseline engine leaks | Agent |
| 2026-10-08 | Truncate read-model ops tables in scripts/reset_data.py | Ensures PostgreSQL state matches mock stores on reset-data | Agent |

