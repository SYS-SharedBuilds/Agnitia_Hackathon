# PRD — SwitchOn: Automated Telecom Service Activation Orchestrator

> Working name: **SwitchOn**. One order in → every system coordinated → service live, or cleanly rolled back. Operators see all of it, live.

## 1. Problem

Activating a telecom service touches Order Management, Inventory, Network, Billing and Notifications. Today the hand-offs are manual or loosely scripted. Consequences:

- Delays (tickets bouncing between teams).
- Mistakes (wrong port, wrong plan, billing started before service works).
- **Half-activated services**: network is configured but billing failed (free service), or billing started but network failed (customer paying for nothing). This is the worst failure and the core problem we solve.

## 2. Vision

A durable, observable orchestration layer that turns a service order into a task graph, executes it across systems with retries, and guarantees **all-or-nothing outcomes** via compensation (saga pattern). Operators get a single pane of glass; leadership gets activation-time and success-rate metrics.

## 3. Goals / Non-Goals

**Goals**
1. Decompose one order into a dependency-aware task graph (parallel where safe).
2. Execute across 5 mock systems with REST APIs.
3. Retry transient failures; roll back on permanent failures; never leave a half-activated service.
4. Real-time end-to-end status for operators, including compensation.
5. Metrics: activation time (p50/p95/p99) and success rate, plus retries and rollback rate.
6. Reproducible failure demos on demand (chaos control).

**Non-Goals**
- Real telecom protocols (TMF/SOAP/NETCONF) — we mimic **TM Forum-style** shapes only.
- Real payments, real SMS/email delivery.
- Multi-tenant auth/SSO (single operator role; optional API key).

## 4. Personas

| Persona | Needs |
|---|---|
| **NOC / Provisioning Operator** | See every order's state, find stuck ones, retry/cancel, understand *why* it failed |
| **Order Desk Agent** | Submit an order, see ETA and result |
| **Ops Manager** | Activation time, success rate, failure hot-spots |
| **Hackathon Judge** | Understand in 60 seconds; see failure + rollback live; trust the architecture |

## 5. Scope — Functional Requirements

Priority: **P0** = must demo, **P1** = should, **P2** = stretch.

### 5.1 Order intake
- **FR-1 (P0)** `POST /orders` accepts a service order (customer, product, plan, address/site, SIM/device, requested date). Returns `order_id` + `workflow_id` immediately (async, 202).
- **FR-2 (P0)** Idempotent: same `client_order_ref` returns the existing order, never a duplicate activation.
- **FR-3 (P0)** Schema validation with clear 422 errors.

### 5.2 Decomposition
- **FR-4 (P0)** Catalog-driven: product definitions (YAML) declare tasks, dependencies, system, retry policy, timeout and compensation action.
- **FR-5 (P0)** Order → task DAG; independent tasks run in parallel (network config ‖ billing account setup).
- **FR-6 (P1)** At least 3 products (Fiber Broadband, 5G Postpaid, eSIM add-on) to prove the engine is generic, not hard-coded.

### 5.3 Mock systems (REST)
- **FR-7 (P0)** Five services: OMS, Inventory, Network, Billing, Notification — each with realistic endpoints, latency, and an **Idempotency-Key** contract.
- **FR-8 (P0)** Each mock exposes `/admin/chaos` to inject: fail-N-times, always-fail, latency, timeout, random failure %.

### 5.4 Resilience
- **FR-9 (P0)** Automatic retry with exponential backoff + jitter for transient errors; no retry for business errors (e.g., out of stock).
- **FR-10 (P0)** Saga compensation: on permanent failure, run compensations of completed steps in **reverse dependency order**.
- **FR-11 (P0)** Compensations are idempotent and retried; if a compensation ultimately fails → order enters `NEEDS_ATTENTION` (never silently lost).
- **FR-12 (P0)** Durable execution: killing the worker mid-order must not lose the order; it resumes.
- **FR-13 (P1)** Operator signals: cancel order, retry failed step, force-complete compensation.
- **FR-14 (P2)** Circuit breaker per downstream system; surfaced in the UI.

### 5.5 Operator visibility
- **FR-15 (P0)** Live order list (state, product, age, current step) via SSE/WebSocket — no manual refresh.
- **FR-16 (P0)** Order detail: DAG with per-task state (pending/running/retrying/succeeded/failed/compensating/compensated), attempt counts, timestamps, request/response payloads, error reasons.
- **FR-17 (P0)** Event timeline (append-only audit trail).
- **FR-18 (P1)** Deep link to Temporal UI for the workflow.

### 5.6 Metrics
- **FR-19 (P0)** Activation time = `order.received` → `service.live` (or terminal failure). Show p50/p95/p99, trend.
- **FR-20 (P0)** Success rate = `ACTIVE / terminal orders`; also show clean-rollback rate and `NEEDS_ATTENTION` count.
- **FR-21 (P1)** Per-system latency and failure rate; retry counts; Prometheus `/metrics` endpoint + Grafana dashboard.

### 5.7 Demo tooling
- **FR-22 (P0)** Scenario runner: one-click scenarios (see §8).
- **FR-23 (P0)** Load generator: submit N orders with configurable failure mix.

## 6. Non-Functional Requirements

| Area | Target |
|---|---|
| Happy-path activation (mock latency ~100–300 ms/step) | **< 5 s** end-to-end |
| Throughput | **≥ 50 concurrent orders** on a laptop without errors |
| Durability | Zero lost orders on worker/API crash |
| Consistency | **0 half-activated services** across 1,000 chaos-run orders (automated test) |
| UI freshness | Event → UI in **< 1 s** |
| Observability | Every step has a trace/correlation id = `order_id` |
| Startup | `make up` brings entire stack up; `make demo` runs scenarios |
| Quality | ≥ 80% coverage on orchestrator; CI green |

## 7. Order State Model

`RECEIVED → VALIDATED → IN_PROGRESS → ACTIVE` (success)
`IN_PROGRESS → ROLLING_BACK → ROLLED_BACK` (clean failure)
`ROLLING_BACK → NEEDS_ATTENTION` (compensation failed)
`* → CANCELLED` (operator signal)

Task states: `PENDING, RUNNING, RETRYING, SUCCEEDED, FAILED, SKIPPED, COMPENSATING, COMPENSATED, COMPENSATION_FAILED`.

## 8. Demo Scenarios (acceptance for the judges' demo)

| # | Scenario | Expected outcome |
|---|---|---|
| S1 | Happy path | ACTIVE, ~3–5 s, notification sent |
| S2 | Network returns 503 twice, then OK | Retries visible, ACTIVE |
| S3 | Inventory out of stock | Fails fast, no retries, ROLLED_BACK, customer notified |
| S4 | Network config permanently fails | Inventory released, billing account voided, ROLLED_BACK |
| S5 | Billing activation fails **after** network is live | Network deprovisioned + inventory released |
| S6 | A compensation call fails | Compensation retried; if exhausted → NEEDS_ATTENTION; operator resolves |
| S7 | Kill worker mid-order | Order resumes and completes after worker restarts |
| S8 | Duplicate submission | Single activation, same order returned |
| S9 | Operator cancels mid-flight | Clean rollback to CANCELLED |
| S10 | Load: 100 orders, 20% failures | Metrics update live; invariant check passes (no half-activated) |

## 9. Success Metrics (for the pitch)

- Activation time reduced from manual baseline (assume hours) → seconds (measured).
- 100% of failures end in a **consistent** state (ACTIVE / ROLLED_BACK / NEEDS_ATTENTION-with-audit).
- Invariant checker proves zero orphaned resources after chaos run.

## 10. Deliverables Mapping

| Hackathon deliverable | Where |
|---|---|
| Orchestration of sample activation | S1 + Temporal workflow |
| Success & failure demo w/ rollback | S2–S6 via scenario runner |
| Status dashboard | Next.js operator console |
| Architecture diagram | `docs/architecture.mmd` + PNG (see ARCHITECTURE.md) |
| Code repository | Monorepo, `make up` |
| Short report | `docs/REPORT.md` (3–4 pages) |

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Temporal learning curve | Start with 2-activity workflow in Phase 1; use time-skipping tests |
| Demo failure on stage | Pre-seeded scenarios, recorded fallback video, `make demo` deterministic |
| Scope creep on UI | DAG + timeline + KPIs only; polish after P0 complete |
| Non-determinism bugs in workflow code | RULES.md workflow-purity rules + replay tests in CI |

## 12. Out of Scope Later (roadmap slide)

Real TMF Open APIs, multi-region workers, tenant isolation, ML-based failure prediction, SLA-driven auto-escalation.
