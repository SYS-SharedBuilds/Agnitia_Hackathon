# PRD — SwitchOn: Provably-Consistent Telecom Service Activation

> **One order in → every system coordinated → service live, or cleanly rolled back — and a cryptographic receipt proving which.**
> Version 2.0 · Status: Approved for build · Owner: Team (fill in) · Companion docs: ARCHITECTURE, TECHSTACK, TASKS, RULES, BRAIN, AGENTS, SKILLS

---

## 1. Problem

Activating a telecom service touches Order Management (OMS), Inventory, Network, Billing and Notifications. Hand-offs between them are manual or loosely scripted ("fallout" in telco terms). The result:

- **Delay** — tickets bounce between teams.
- **Error** — wrong port, wrong plan, billing started before service works.
- **Half-activated services** — network configured but billing failed (free service), or billing started but network failed (customer pays for nothing). This is the costliest failure and the core problem we solve.

## 2. Product Vision & Positioning

SwitchOn is a durable orchestration layer that turns one service order into a dependency-aware task graph, executes it across systems with retries, and guarantees an **all-or-nothing outcome** through saga compensation. It does not merely *claim* consistency — it **proves** it, per order and across runs.

### 2.1 What makes it different (judge-facing)

| # | Differentiator | One-line pitch | Tier |
|---|---|---|---|
| **X1** | **Baseline-vs-SwitchOn A/B Proof** | Same seeded faults, two engines: the scripted hand-off baseline leaves N broken customers; SwitchOn leaves 0. Quantified, repeatable, on stage. | Core-Wow |
| **X2** | **Consistency Certificate** | Every terminal order gets a signed, hash-chained receipt: audit trail + cross-system state digest. Verifiable offline. | Core-Wow |
| **X3** | **Tombstone (cancel-wins) compensation** | Closes the classic race where a timed-out request lands *after* its undo and creates an orphan. | Core |
| **X4** | **Continuous Reconciler** | Background auditor compares every system to orchestrator intent, detects drift, repairs or escalates. | Wow |
| **X5** | **Time-Travel Replay** | Scrub any order's timeline in the console; watch the graph replay step by step. | Wow |
| **X6** | **Rollback Preview & Blast Radius** | Hover a task to see exactly what would be undone; when a system degrades, see which in-flight orders are exposed. | Wow |
| **X7** | **Root-Cause Explainer** | Deterministic rules engine turns failures into cause → impact → recommended action (optional LLM narration, never required). | Wow |
| **X8** | **TMF622-style Product Order façade** | Accepts an industry-shaped order payload; shows we speak telco. | Wow |
| **X9** | **Property-based chaos proof** | Randomized fault schedules (Hypothesis) assert invariants hold for *all* generated schedules. | Core |

Tiers: **Core** = in the P0 build; **Core-Wow** = P0, scheduled early because of judging impact; **Wow** = P1, built after P0 is green.

### 2.2 Honest framing (builds trust)
Mocks stand in for real systems; the orchestration, failure semantics, and proofs are real. We claim **zero inconsistent end states** (verified), never "zero failures".

## 3. Goals / Non-Goals

**Goals**
1. Decompose one order into a dependency-aware task graph (parallel where safe).
2. Execute across five mock systems over REST.
3. Retry transient failures; roll back on permanent failures; never leave a half-activated service.
4. Live end-to-end operator status including compensation.
5. Metrics: activation time (p50/p95/p99) and success rate, plus retries, rollback rate, consistency rate.
6. On-demand, deterministic failure demos.
7. Prove consistency (X1, X2, X9).

**Non-Goals**
- Real telecom protocols (NETCONF, Diameter, SOAP), real payments, real SMS/email.
- Multi-tenant SSO (single operator role + API key).
- Replacing a BSS/OSS suite.

## 4. Personas

| Persona | Needs |
|---|---|
| **NOC / Provisioning Operator** | See every order, find stuck ones, act (retry/cancel/resolve), understand *why* |
| **Order Desk Agent** | Submit an order, see progress and result |
| **Ops Manager** | Activation time, success rate, system hot-spots, SLA risk |
| **Auditor / Compliance** | Verifiable evidence that no customer was left inconsistent |
| **Judge** | Understand in 60 s, see failure + rollback live, trust the engineering |

## 5. Traceability to the Problem Statement (nothing missed)

| Problem-statement requirement | Feature(s) | Acceptance test |
|---|---|---|
| Take in a service order and split into tasks | FR-1…FR-6, X8 | T-20, T-40; plan golden tests |
| Coordinate mock systems: inventory, network, billing, notification (+ order mgmt) | FR-7, FR-8 | Scenario S1; mock unit tests |
| Retries | FR-9 | S2; workflow tests |
| Rollback & compensation steps | FR-10, FR-11, X3 | S4, S5, S6, S11; rollback-at-every-position test |
| End-to-end status tracking for operators | FR-15…FR-18, X5, X6 | Console e2e; SSE test |
| Mock APIs for each system | FR-7; OpenAPI per mock | Contract tests |
| Metrics: activation time and success rate | FR-19…FR-21 | SQL tests; Metrics page |
| Orchestration of a sample activation | S1 | `make demo` |
| Demo of success and failure with rollback | S1–S12 | Scenario runner |
| Status dashboard | Operator Console | Playwright |
| Architecture diagram, repo, short report | T-80…T-83 | Clean-clone test |
| Suggested tech (Temporal, REST mocks, message queue, Python) | Temporal + FastAPI + Redis Streams + Python | TECHSTACK |

## 6. Functional Requirements

Priority: **P0** must ship · **P1** should · **P2** stretch.

### 6.1 Order intake
- **FR-1 (P0)** `POST /orders` accepts customer, product, plan, site/address, SIM/device, requested date. Returns `202 {order_id, workflow_id}`.
- **FR-2 (P0)** Idempotent by `client_order_ref`, safe under concurrent submissions of the same ref (DB unique constraint; loser returns the winner).
- **FR-3 (P0)** Schema validation with RFC 7807 problem responses.
- **FR-3a (P1, X8)** `POST /tmf-api/productOrderingManagement/v4/productOrder` accepts a TMF622-style payload and maps it onto the internal order; order state is exposed using TMF622-style state names.

### 6.2 Decomposition
- **FR-4 (P0)** Catalog-driven: YAML declares tasks, dependencies, system, action, retry policy, timeout, compensation, flags (`read_only`, `best_effort`).
- **FR-5 (P0)** Order → task DAG; independent tasks run in parallel; plan is **versioned and snapshotted** on the order.
- **FR-6 (P1)** ≥3 products (Fiber Broadband, 5G Postpaid, eSIM add-on) to prove genericity.

### 6.3 Mock systems
- **FR-7 (P0)** OMS, Inventory, Network, Billing, Notification REST services — stateful, idempotent, OpenAPI-documented, realistic latency.
- **FR-8 (P0)** Chaos admin API per mock: fail-N, always-fail, random-%, latency, timeout, business-error, compensation-failure, plus **deterministic seeded faults** keyed by `X-Chaos-Key`.

### 6.4 Resilience
- **FR-9 (P0)** Retry transient errors with exponential backoff + jitter; never retry business errors.
- **FR-10 (P0)** Saga compensation in reverse completion order.
- **FR-10a (P0, X3)** **Tombstone compensation**: undo of an action also records a tombstone for that idempotency key so a delayed duplicate of the forward request is rejected.
- **FR-10b (P0)** **Unknown-outcome handling**: if a forward call ends in timeout/connection loss after retries, the task is treated as *possibly applied* and its compensation runs.
- **FR-11 (P0)** Compensation is idempotent and retried; exhaustion → `NEEDS_ATTENTION` with full audit. Never silent.
- **FR-12 (P0)** Durability: killing a worker mid-order loses nothing.
- **FR-13 (P1)** Operator signals: cancel, retry compensation, resolve manually (with note).
- **FR-14 (P1)** Per-system circuit breaker + bulkhead (concurrency cap) shown live.

### 6.5 Operator visibility
- **FR-15 (P0)** Live order list via SSE; no refresh.
- **FR-16 (P0)** Order detail: live DAG with per-task state, attempts, timings, request/response payloads, errors.
- **FR-17 (P0)** Append-only event timeline.
- **FR-18 (P1)** Deep link to Temporal UI.
- **FR-18a (P1, X5)** Time-Travel Replay slider over event `seq`.
- **FR-18b (P1, X6)** Rollback Preview (hover task → compensation chain) and Blast Radius (system degraded → exposed in-flight orders).
- **FR-18c (P1, X7)** Root-Cause Explainer card on every failed order.
- **FR-18d (P1)** Fallout queue: `NEEDS_ATTENTION` orders with guided actions.

### 6.6 Metrics
- **FR-19 (P0)** Activation time = `created_at → ACTIVE`; p50/p95/p99 + trend.
- **FR-20 (P0)** Success rate, clean-rollback rate, **consistency rate** (target 100%), `NEEDS_ATTENTION` count.
- **FR-21 (P1)** Per-system latency/error rate, retries per order; Prometheus + Grafana.

### 6.7 Proof & Demo tooling
- **FR-22 (P0)** Scenario runner (S1–S12).
- **FR-23 (P0)** Load generator with failure mix and seed.
- **FR-24 (P0, X1)** **A/B Proof**: run baseline engine and SwitchOn against identical seeded faults; report leaks.
- **FR-25 (P0, X2)** **Consistency Certificate** per terminal order: hash-chained events + system-state digest, Ed25519-signed; `GET /orders/{id}/certificate`, verify endpoint, offline CLI verifier.
- **FR-26 (P1, X4)** Reconciler sweeps all systems on an interval and on demand; drift report in console.
- **FR-27 (P0, X9)** Property-based chaos test suite in CI.

## 7. Non-Functional Requirements & SLOs

Targets are measured and reported; never promised beyond measurement (RULES §14).

| Area | Target |
|---|---|
| Happy-path activation (mock latency 100–300 ms/step, `DEMO_MODE`) | p95 **< 6 s** |
| Concurrency | ≥ **50** concurrent orders on a 16 GB laptop, zero worker errors |
| Consistency | **100%** consistent terminal states across ≥ **1,000** chaos orders (property + load tests) |
| Durability | Order resumes ≤ **15 s** after worker restart; zero lost orders |
| UI freshness | Event → console p95 **< 1 s** |
| Observability | Every log/event/call carries `order_id` |
| Startup | `make up` (≤ 3 min cold) · `make demo` deterministic |
| Quality | ≥ 80% coverage on orchestrator + shared; CI green; replay test green |

## 8. State Model

Order: `RECEIVED → VALIDATED → IN_PROGRESS → ACTIVE`; `IN_PROGRESS → ROLLING_BACK → ROLLED_BACK | NEEDS_ATTENTION`; `* → CANCELLED` (via operator signal, passes through rollback). Terminal: `ACTIVE, ROLLED_BACK, NEEDS_ATTENTION, CANCELLED`.

Task: `PENDING, RUNNING, RETRYING, SUCCEEDED, FAILED, SKIPPED, COMPENSATING, COMPENSATED, COMPENSATION_FAILED`.

TMF622-style mapping (façade): `RECEIVED→acknowledged · IN_PROGRESS/ROLLING_BACK→inProgress · ACTIVE→completed · ROLLED_BACK/NEEDS_ATTENTION→failed · CANCELLED→cancelled`. *(Verify names against the TM Forum spec before submission.)*

## 9. Demo Scenarios

| # | Scenario | Expected outcome |
|---|---|---|
| S1 | Happy path | ACTIVE; certificate issued |
| S2 | Network 503 ×2 then OK | Retries visible → ACTIVE |
| S3 | Inventory out of stock (business error) | Fails fast, no retries, ROLLED_BACK, customer told |
| S4 | Network permanently fails | Inventory released, billing account voided → ROLLED_BACK |
| S5 | Billing activation fails **after** network live | Network deprovisioned, inventory released → ROLLED_BACK |
| S6 | A compensation fails | Retried; exhausted → NEEDS_ATTENTION; operator resolves |
| S7 | Kill worker mid-order | Resumes and completes |
| S8 | Duplicate submission (incl. concurrent) | One activation, same order |
| S9 | Operator cancels mid-flight | Clean rollback → CANCELLED |
| S10 | Load: 100 orders, 20% faults | Metrics live; invariants PASS |
| S11 | **Late-arriving forward request** after compensation (timeout race) | Tombstone rejects it; no orphan |
| S12 | **A/B Proof**: 200 seeded orders, baseline vs SwitchOn | Baseline leaks; SwitchOn 0; certificates verify |

## 10. Success Metrics (for the pitch)

- Orders reaching a consistent terminal state: **100%** (invariant checker + certificates).
- Baseline vs SwitchOn leak counts from S12 (`billed_without_service`, `service_without_billing`, `orphaned_resources`) — numbers from `make report-data` only.
- Activation time vs the naive sequential baseline (parallel branches should win).
- Worker-kill recovery time.

## 11. Judging-Rubric Proofing

| Likely criterion | How we answer it |
|---|---|
| Problem fit | RTM in §5, every line mapped |
| Technical depth | Saga + tombstones + unknown-outcome + idempotency + durable execution |
| Working demo | Deterministic `make demo`, backup video |
| Innovation | X1–X9 |
| Scalability | Stateless services, per-system task queues, partitionable read model |
| UX | Live DAG, replay, explainer, 1280×720-legible |
| Documentation | 8 specs + report + diagrams |
| Reliability proof | Certificates, A/B, property tests |
| Honesty | Mock-vs-real table in report |

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Scope creep from differentiators | Tiering; cut line in TASKS; P0 first |
| Temporal learning curve | Phase 2 starts with a 2-activity workflow; time-skipping tests |
| Non-determinism bugs | RULES §1, replay test in CI |
| Stage failure | Deterministic scenarios, reset script, backup video, "never debug live" rule |
| A/B seen as rigged | Baseline gets same seeded faults and a fair 3× retry; method documented |
| Docker resource pressure | Memory caps, ≤ 4 GB budget, close other apps |
| Temporal image drift | Use `temporalio/server` + `admin-tools` (auto-setup is deprecated); pin tags |

## 13. Roadmap (closing slide)
Real TMF Open API adapters (TMF641/638), gRPC adapters, multi-region workers, tenant isolation, SLA-driven auto-escalation, ML failure prediction, BPMN view for business analysts.
