# SwitchOn — Evaluation & Project Report

## 1. Problem Statement

In telecommunications service fulfillment, order activation spans multiple heterogeneous systems:
- **Order Management (OMS)**
- **Resource Inventory** (SIM card allocation, optical port reservation)
- **Network Provisioning** (HLR/HSS subscriber profiles, OLT/ONU fiber configuration)
- **Billing & Rating** (Account creation, tariff plan assignment)
- **Notification Gateways** (SMS / Email customer activation alerts)

Traditional orchestrators and naive script-based workflows suffer from severe reliability vulnerabilities:
1. **Half-Activated Zombie States**: A network timeout or crash leaves resources allocated in inventory or billing while the customer order fails.
2. **Retry Storms & Double Provisioning**: Retrying non-idempotent endpoints upon timeout causes duplicate accounts or charges.
3. **Rollback Race Conditions**: When forward requests arrive *after* compensation has already run (due to network delays), resources re-leak permanently.
4. **Lack of Cryptographic Auditability**: Post-incident reconciliation cannot verify whether state transitions actually completed without tampering.

SwitchOn guarantees:
- **Zero Half-Activated State**: Any failure yields a fully completed activation (`ACTIVE`) or a cleanly reversed state (`ROLLED_BACK`).
- If compensation itself cannot proceed after maximum retries, the order transitions safely to `NEEDS_ATTENTION` for human triage.

---

## 2. Solution Overview

**SwitchOn** is a durable, dependency-aware telecom service activation orchestrator. It decomposes telecom service orders into directed acyclic graphs (DAGs) and executes them durably using Temporal workflows.

### Key Architectural Guarantees:
- **Temporal Durable Execution**: Workflows run deterministically; if worker processes crash mid-flight, workflows resume from the exact event history with zero duplicate activity dispatch.
- **Saga Pattern with Strict Compensations**: Every forward mutating activity has a corresponding idempotent compensation activity executed in reverse DAG order.
- **Tombstones Against Out-of-Order Execution**: Compensations write cryptographic tombstones into downstream systems so late-arriving forward requests are rejected immediately (`HTTP 409 TOMBSTONED`).
- **Consistency Certificates**: Every terminal order produces a cryptographically signed SHA-256 hash chain verified with Ed25519 digital signatures.

---

## 3. Architecture

```
                 +-------------------------------------------------------+
                 |            Operator Console (Next.js 14)              |
                 +---------------------------+---------------------------+
                                             | HTTP / Polling (2s)
                                             v
                 +-------------------------------------------------------+
                 |            Order API Gateway (FastAPI)                |
                 +--------------+--------------------------+-------------+
                                |                          |
                   PostgreSQL (Read Model)           Redis Streams
                                                           |
                                                           v
                                            +-----------------------------+
                                            |       Projector / SSE       |
                                            +-----------------------------+
                                                           |
                                                           v
+-----------------------------------------------------------------------------------------+
|                               Temporal Orchestration Core                               |
|                                                                                         |
|   +--------------------------+   Heartbeats    +------------------------------------+   |
|   |   Workflow (Pure DAG)    | <-------------> | Activity Workers (I/O & Forward)   |   |
|   +--------------------------+                 +------------------------------------+   |
|                 |                                                |                      |
|                 | Reverse Compensation                           | Forward Execution    |
|                 v                                                v                      |
+-----------------------------------------------------------------------------------------+
                  |                                                |
                  +-----------------------+------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------------+
|                             Downstream Telecom Systems (REST)                           |
|                                                                                         |
|   [OMS Mock]    [Inventory Mock]    [Network Mock]    [Billing Mock]   [Notification]   |
|     :8101            :8102               :8103             :8104           :8105        |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Technology Stack

- **Orchestration**: Temporal Python SDK (`temporalio` 1.9.0)
- **API & Control Plane**: FastAPI, Uvicorn, Pydantic v2
- **Persistence & Read Model**: PostgreSQL 16 (orders, tasks, events, certificates), Redis 7 (event bus / streams)
- **Frontend Dashboard**: Next.js 14 (App Router), TypeScript, Vanilla CSS design tokens
- **Cryptography**: `cryptography` (Ed25519 signature verification), hashlib (SHA-256 hash chain)
- **Testing & Tooling**: Pytest (time-skipping workflow tests, unit, integration), Ruff, Mypy (`--strict`)
- **Containerization**: Docker Compose (13 microservice containers)

---

## 5. Mock vs Real Clarification

| Component | Classification | Description |
|---|---|---|
| **OMS, Inventory, Network, Billing, Notification** | **Mock Systems** | Fast, isolated HTTP services with explicit chaos controls (latency, transient 503, business rejection, permanent 500, tombstone store). |
| **Temporal Orchestration Engine** | **Real** | Production-grade Temporal cluster managing state machines, timeouts, exponential backoff retries, and worker heartbeats. |
| **FastAPI Gateway & Read Model** | **Real** | Production REST gateway, CQRS projector with PostgreSQL read model and event timeline. |
| **Saga Compensation Engine** | **Real** | Topological reverse-DAG traversal with forward activity failure detection and rollback dispatch. |
| **Tombstone Race Prevention** | **Real** | Guaranteed rejection of out-of-order forward mutations following compensation. |
| **Consistency Certificates** | **Real** | Offline-verifiable cryptographic proofs (SHA-256 hash chain + Ed25519 digital signature). |
| **Operator Console** | **Real** | Production Next.js web application with live order DAG visualization, chaos injection toggles, and metrics graphs. |

---

## 6. Failure & Rollback Handling

1. **Transient Network Errors (HTTP 503 / Timeout)**:
   - Handled via Temporal activity retry policies with exponential backoff and jitter.
   - Forward progress resumes automatically once downstream systems recover.
2. **Business Failures (e.g. `OUT_OF_STOCK`, Invalid MSISDN)**:
   - Non-retryable; triggers immediate backward saga compensation.
3. **Permanent Downstream Failures (HTTP 500)**:
   - Retried up to activity policy limit; upon exhaustion, workflow transitions to rollback.
   - Preceding completed activities compensated in reverse topological order.
4. **Compensation Failure**:
   - If a rollback activity fails repeatedly, the order escalates to `NEEDS_ATTENTION` with full task diagnostic metadata for operator intervention.
5. **Out-of-Order Arrivals (Late Forward Request)**:
   - Downstream mock systems maintain a tombstone registry. When compensation runs first, a tombstone is recorded. Late forward attempts return `HTTP 409 TOMBSTONED`.

---

## 7. Operator Console & Dashboard

The web dashboard (`http://localhost:3000`) provides:
- **Order Pipeline & Details**: Real-time status badge (`ACTIVE`, `ROLLED_BACK`, `NEEDS_ATTENTION`), customer info, and execution timing.
- **DAG Task Graph**: Visual dependency tree with status indicators per node (Pending, Running, Completed, Rolled Back, Failed).
- **Audit Timeline**: Step-by-step event log showing activity dispatch, retries, and timestamps.
- **Chaos & Scenario Controls**: Interactive injection of network latency, 503 errors, and inventory stockouts.
- **Proof & Certificate Viewer**: Inspect cryptographic hash chain, public key, and offline verification results.

---

## 8. Verified Evaluation Metrics

### 8.1 Automated Demo Scenarios (S1–S12)
**Result: 12/12 PASS (100%)**

| Scenario | Name | Expected State | Verified Result |
|---|---|---|---|
| **S1** | Happy Path (Certificate Issued) | `ACTIVE` + Valid Certificate | **PASS** |
| **S2** | Network 503 ×2 (Retries -> OK) | `ACTIVE` (Attempts >= 3) | **PASS** |
| **S3** | Inventory Out of Stock | `ROLLED_BACK` (Attempts = 1, Fast Fail) | **PASS** |
| **S4** | Network Permanent 500 | `ROLLED_BACK` (Saga Rollback) | **PASS** |
| **S5** | Post-Verification Failure | `ROLLED_BACK` (Reverse Account Cleanup) | **PASS** |
| **S6** | Compensation Failure | `NEEDS_ATTENTION` (Escalation) | **PASS** |
| **S7** | Worker Crash Recovery | `ACTIVE` (Resume from Event Log) | **PASS** |
| **S8** | Idempotent Submission | Deduplicated (Single Execution) | **PASS** |
| **S9** | Operator Cancellation | `CANCELLED` / `ROLLED_BACK` | **PASS** |
| **S10** | Chaos Load Test | Invariants Verified Under Load | **PASS** |
| **S11** | Late Forward Request | `HTTP 409 TOMBSTONED` (Race Winner) | **PASS** |
| **S12** | A/B Proof Comparison | 100% Consistent, 0 Leaks | **PASS** |

### 8.2 Invariant Verification Engine
**Result: 50/50 Checks PASS**
- **INV-1 (Inventory vs OMS)**: Zero unreserved inventory for active orders; zero reserved inventory for rolled back orders.
- **INV-2 (Network vs OMS)**: Provisioned network services match active orders exclusively.
- **INV-3 (Billing vs OMS)**: Zero active billing accounts for rolled back orders.
- **INV-4 (No Partial Provisioning)**: No order in terminal state has some systems active and others inactive.
- **INV-5 (Terminal State Integrity)**: Terminal state is irreversible.
- **INV-6 (Tombstone Soundness)**: Tombstoned keys remain immutable.

### 8.3 A/B Proof: SwitchOn vs. Naive Baseline Engine
Evaluated with identical randomized fault injection:
- **SwitchOn Consistency Rate**: **100.0%** (0 orphaned resources, 0 zombie states)
- **Baseline Consistency Rate**: **33.3%** (leaves orphaned allocations on failures)

### 8.4 Cryptographic Verification & Tamper Detection
- **Offline Verification**: `python scripts/verify_cert.py --id <order_id>` -> `[PASS] Cryptographically verified offline`
- **Tamper Detection**: `python scripts/verify_cert.py --id <order_id> --tamper` -> `[FAIL] Hash chain mismatch: computed != expected`

---

## 9. How to Run and Demo

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ / `uv`
- Node.js 18+ (optional for local frontend dev, pre-built in Docker)

### Step-by-Step Commands
```bash
# 1. Start all 13 services
make up

# 2. Validate product DAGs
make validate-catalog

# 3. Run complete automated demo suite (S1..S12)
make demo

# 4. Check invariants across mock databases
make invariants

# 5. Run A/B proof comparative analysis
make ab-proof

# 6. Verify certificate offline & test tamper detection
uv run python scripts/verify_cert.py --id <order_id>
uv run python scripts/verify_cert.py --id <order_id> --tamper
```

### URLs
- **Operator Console**: `http://localhost:3000`
- **Order API**: `http://localhost:8000/docs`
- **Temporal UI**: `http://localhost:8233`
