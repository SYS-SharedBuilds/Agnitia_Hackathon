  # SwitchOn — Automated Telecom Service Activation Orchestrator

[![Temporal](https://img.shields.io/badge/Orchestrator-Temporal%20Python%20SDK-black?style=flat&logo=temporal)](https://temporal.io/)
[![FastAPI](https://img.shields.io/badge/Gateway-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Operator%20Console-Next.js%2014-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Storage-PostgreSQL%2016-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Event%20Streaming-Redis%20Streams-DC382D?style=flat&logo=redis)](https://redis.io/)
[![Cryptography](https://img.shields.io/badge/Proof-Ed25519%20%2B%20SHA--256-blueviolet?style=flat)](contracts/certificate.schema.json)

> **"We don't just switch services on — we guarantee they never get stuck half on, and we can prove it."**

SwitchOn is a production-grade, distributed telecom service activation orchestrator built for high-scale, zero-leak multi-subsystem provisioning. In telecom networks, a single order spans multiple downstream systems: Order Management (OMS), Resource Inventory (SIM/eSIM), Core Network Slices (HLR/HSS), and Real-time Rating/Billing (OCS). 

When downstream steps fail or experience transient network timeouts, standard naive orchestration engines leave customer profiles orphan-locked, partially provisioned, or mistakenly billed. **SwitchOn eliminates half-activated states with mathematical and cryptographic proof.**

---

## ⚡ Key Highlights & Innovations

- **Durable Saga Orchestration**: Pure, deterministic Temporal Python workflows coordinate concurrent wave-based execution across 5 telecom microservices.
- **Tombstoned Compensations (X3 Race Prevention)**: Forward endpoints check cancellation tombstones. If a rollback arrives before a delayed forward attempt, late-arriving requests are definitively rejected (`HTTP 409 TOMBSTONED`), preventing ghost resource allocation.
- **Unknown-Outcome Compensation**: Network timeouts, socket resets, or HTTP 504s trigger defensive compensations, guaranteeing no state is silently leaked under uncertainty.
- **Cryptographic Consistency Certificates (X2)**: Every terminal order receives an **Ed25519-signed**, hash-chained audit certificate with SHA-256 event chaining for offline, tamper-evident verification.
- **A/B Proof Engine (X1)**: Built-in side-by-side benchmark subjecting both SwitchOn and an identical-retry baseline engine to identical seeded chaos faults. **SwitchOn maintains 100.0% consistency (0 leaks)**, while the baseline leaks ~33.3% of orders.
- **NOC Operator Console & Subscriber Portal**: Real-time Next.js console with interactive React Flow DAGs, reverse saga playback, live SSE telemetry, automated fallout triage, and a subscriber self-service portal.

---

## 🏗️ System Architecture

```
                                      ┌──────────────────────────────────────────────┐
                                      │           OPERATOR / SUBSCRIBER UI           │
                                      │  Next.js 14 Console (Port 3000) & Realtime   │
                                      └──────────────────────┬───────────────────────┘
                                                             │ REST / SSE
                                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                             ORDER API GATEWAY (Port 8000)                          │
│        FastAPI Control Plane · Idempotency Key Gate · TMF622 Façade · Read Model   │
└──────────────┬──────────────────────────────────────────────────────▲──────────────┘
               │                                                      │
               │ Start Workflow / Signal                              │ SQL Read Model
               ▼                                                      │
┌─────────────────────────────────────────┐         ┌─────────────────┴──────────────┐
│       TEMPORAL CLUSTER (Port 7233)      │         │     POSTGRESQL (Port 5432)     │
│   Durable Execution · Activity Queues   │         │    Orders · Audit Trail · Read │
└──────────────┬──────────────────────────┘         └─────────────────▲──────────────┘
               │                                                      │
               │ Activity Task Dispatch                               │ Projection
               ▼                                                      │
┌─────────────────────────────────────────┐         ┌─────────────────┴──────────────┐
│      SWITCHON ORCHESTRATOR WORKER       │────────▶│      REDIS STREAMS (Port 6379) │
│ Pure Workflows · Compensations · Engine │ Events  │  Event Log · Event Sourcing    │
└──────────────┬──────────────────────────┘         └────────────────────────────────┘
               │
               ▼ Forward Activities & Compensations (with Idempotency-Key & Tombstones)
┌────────────────────────────────────────────────────────────────────────────────────┐
│                               DOWNSTREAM SUBSYSTEMS                                │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│   │   OMS:8101   │   │  INVENTORY   │   │ NETWORK:8103 │   │   BILLING:8104    │   │
│   │ Order Mgmt   │   │   SIM:8102   │   │  HLR/HSS 5G  │   │  OCS Real-time    │   │
│   └──────────────┘   └──────────────┘   └──────────────┘   └───────────────────┘   │
│                                ┌───────────────────┐                               │
│                                │ NOTIFICATION:8105 │                               │
│                                │   SMS & Email     │                               │
│                                └───────────────────┘                               │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Mock vs. Real Architecture Matrix

| Subsystem / Layer | Implementation | Purpose & Real-World Equivalence |
|---|---|---|
| **Temporal Engine** | **Real** (`temporalio` server) | Durable task orchestration, deterministic timers, worker crash recovery. |
| **Orchestration Worker** | **Real** (Python 3.12 + Temporal SDK) | Pure deterministic DAG execution, concurrent branch dispatch, compensation cascades. |
| **Event Sourcing & Bus** | **Real** (Redis Streams + Consumer Groups) | Reliable event-driven fanout and decoupling of read projections. |
| **API & Read Model** | **Real** (FastAPI + PostgreSQL 16) | High-performance JSON API, transactional state projection, live SSE streaming. |
| **Security & Proof** | **Real** (Ed25519 + SHA-256) | Offline certificate verification, Merkle history chaining, tamper detection. |
| **Subsystems (5 Services)**| **Realistic Stateful Mocks** | OMS, SIM, HLR, OCS, and Notification with deterministic chaos, latency, and tombstone tracking. |

---

## 🚀 Quickstart

### Prerequisites
- Docker & Docker Compose (v2+)
- Python 3.12+ (or `uv`)
- Node.js 18+ (for frontend development)

### 1. Launch the Stack
```bash
make up
```
This spins up all 13 services: Temporal, Temporal UI, PostgreSQL, Redis, Order API, Orchestrator Worker, Next.js Frontend, and all 5 downstream mocks.

### 2. Validate Product Catalog DAGs
```bash
make validate-catalog
```
Ensures all YAML product workflows (Mobile 5G, Fiber 500, Enterprise SIP) obey strict ACID rules: valid dependencies, linear compensations, and billing-last ordering.

### 3. Run Automated Scenarios (S1..S12)
```bash
make demo
```
Executes the comprehensive suite of 12 real-world telecom failure and resilience scenarios, outputting a live PASS/FAIL matrix.

### 4. Verify Zero Half-Activated State Invariants
```bash
make invariants
```
Directly queries all downstream mock databases to verify **INV-1 through INV-6**: zero orphaned locks, no unbilled services, and zero phantom charging.

---

## 🧪 Scenarios Covered (S1..S12)

| Scenario | Title | Fault Injected | Expected & Observed Result |
|---|---|---|---|
| **S1** | **Happy Path** | None | Concurrent branches execute in parallel; full activation under 2s; Ed25519 certificate issued. |
| **S2** | **Transient Retries** | Network Gateway 503 | Temporal exponential retry policy handles transient error without duplicating steps. |
| **S3** | **Business Rejection** | Inventory Quota 409 | Non-retryable error triggers immediate fail-fast and zero-leak rollback. |
| **S4** | **Provisioning Failure** | OCS Rating 500 | Automatic reverse saga executes; all prior systems compensated in reverse topological order. |
| **S5** | **Post-Verification Failure** | Loopback probe fails | Late-stage network deprovisioning, billing voided, customer notified. |
| **S6** | **Compensation Failure** | Network compensation 504 | Exhausted rollback escalates order to `NEEDS_ATTENTION`; captured in Fallout Queue. |
| **S7** | **Crash Recovery** | Worker killed mid-flight | Worker killed (`make kill-worker`); upon restart, workflow resumes seamlessly from Temporal history. |
| **S8** | **Idempotent Submission** | Duplicate `Idempotency-Key` | Second request immediately returns existing order without re-triggering workflow. |
| **S9** | **Operator Cancellation** | Mid-flight cancel signal | Workflow halted gracefully at wave boundary; acquired locks cleanly released. |
| **S10** | **Chaos Load Test** | Random jitter & errors | 50 concurrent orders processed; all terminal states satisfy invariants INV-1..INV-6. |
| **S11** | **Late Forward Request** | Out-of-order forward race | Compensation writes a tombstone first; late forward call receives `409 TOMBSTONED`. |
| **S12** | **A/B Benchmark Proof** | 20 seeded chaos orders | SwitchOn achieves **100% consistency (0 leaks)**; Baseline leaks **33.3%** of orders. |

---

## 📊 Live Verification CLI Commands

```bash
# Execute end-to-end demo suite
make demo

# Cross-system invariant verification (INV-1 to INV-6)
make invariants

# Run scientific A/B comparison against scripted baseline
make ab-proof

# Verify consistency certificate cryptographically offline
python3 scripts/verify_cert.py --id <order_id>

# Test tamper detection on an altered certificate
python3 scripts/verify_cert.py --id <order_id> --tamper

# Simulate orchestrator worker kill & recovery
make kill-worker
# (watch workflow pause cleanly)
make start-worker
# (watch workflow resume automatically)
```

---

## 🌐 Web Console & Subsystem Endpoints

| Service | Port | Endpoint / Purpose |
|---|---|---|
| **NOC Operator Console** | `3000` | [http://localhost:3000](http://localhost:3000) — Main operations & saga dashboard |
| **Subscriber Registrar** | `3000` | [http://localhost:3000/registrar](http://localhost:3000/registrar) — Customer self-service portal |
| **Fallout Queue & RCA** | `3000` | [http://localhost:3000/fallout](http://localhost:3000/fallout) — Automated saga fallout triage & RCA |
| **Telemetry & Metrics** | `3000` | [http://localhost:3000/metrics](http://localhost:3000/metrics) — Percentiles, Prometheus, CSV exports |
| **Order API Gateway** | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) — OpenAPI Swagger documentation |
| **Prometheus Telemetry**| `8000` | [http://localhost:8000/metrics/](http://localhost:8000/metrics/) — Real-time metrics scraper endpoint |
| **Temporal Web UI** | `8233` | [http://localhost:8233](http://localhost:8233) — Durable workflow execution graphs |
| **OMS Subsystem** | `8101` | Order Management Service mock |
| **Inventory Subsystem** | `8102` | SIM / eSIM Provisioner mock |
| **Network Subsystem** | `8103` | HLR / HSS 5G Core Gateway mock |
| **Billing Subsystem** | `8104` | OCS Real-Time Rating & Charging mock |
| **Notification System** | `8105` | SMS / Email Notification mock |

---

## 🔒 The Invariant Guarantee (INV-1..INV-6)

Our automated invariant suite (`make invariants`) asserts the following conditions directly against mock system state:

1. **INV-1 (Terminal Active)**: An order marked `ACTIVE` must have: inventory reserved, network service active, billing charging active, and OMS completed.
2. **INV-2 (Clean Rollback)**: An order marked `ROLLED_BACK` or `CANCELLED` must have zero active reservations, zero network slices, zero billing accounts, and OMS uncompleted.
3. **INV-3 (Fallout Governance)**: An order marked `NEEDS_ATTENTION` must possess at least one failed compensation and an audit log detailing root cause.
4. **INV-4 (No Multi-Lease)**: No subscriber or order has multiple conflicting active resource sets.
5. **INV-5 (Zero Orphans & Tombstones)**: Every mock resource links to a known order; no resource exists for any tombstoned idempotency key.
6. **INV-6 (Strict Precedence)**: Billing charging is never initiated before network service verification is completed.

---

## 🛠️ Project Structure

```
├── contracts/                  # OpenAPI specs & JSON Schemas (Source of Truth)
│   ├── openapi/                # Order API & 5 downstream mock schemas
│   ├── certificate.schema.json # Cryptographic proof certificate schema
│   └── events.schema.json      # Event-driven architecture schemas
├── shared/                     # Shared models, settings, crypto, catalog loader
├── services/
│   ├── order_api/              # FastAPI gateway, SSE streams, TMF façade
│   ├── orchestrator/           # Pure Temporal workflows, activities & worker
│   └── mocks/                  # 5 mock systems with stateful chaos & tombstones
├── catalog/products/           # Declarative YAML product task graphs
├── web/                        # Next.js 14 console & subscriber portal
│   ├── app/                    # Routes: /, /orders, /fallout, /metrics, /registrar, /proof
│   └── components/             # React Flow DAG canvas, charts, interactive elements
├── scripts/                    # Scenarios (S1..S12), invariants, A/B proof, verify_cert
└── tests/                      # Unit, workflow time-skipping, property, and integration tests
```

---

## 📄 License

Developed for the Agnitia National Telecom Hackathon. All rights reserved.
