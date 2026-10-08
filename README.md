# SwitchOn — Automated Telecom Service Activation Orchestrator

Durable, dependency-aware telecom service activation orchestrator powered by **Temporal Python SDK**, **FastAPI**, **Redis Streams**, and **Next.js**.

## Quickstart

```bash
# 1. Start full infrastructure & mock systems
make up

# 2. Validate product catalog DAGs
make validate-catalog

# 3. Run automated demo scenarios (S1..S12)
make demo

# 4. Check zero half-activated state invariants
make invariants
```

## Mock vs Real Architecture

| Component | Nature | Description |
|---|---|---|
| **OMS, Inventory, Network, Billing, Notification** | **Mock Systems** | REST services running with configurable chaos, latency, and fault injection |
| **Temporal Orchestration Engine** | **Real** | Durable workflow execution, activity dispatch, heartbeat tracking, time-skipping tests |
| **Exponential Retries & Backoff** | **Real** | Temporal-native transient error retry policies (no client-side retry storms) |
| **Saga Compensation & Reverse DAG** | **Real** | Automatic backward rollback on business/permanent failure |
| **Tombstone Race Prevention** | **Real** | Forward endpoints reject late-arriving requests (HTTP 409) if compensation arrived first |
| **Consistency Certificate & Proofs** | **Real** | SHA-256 hash chaining + Ed25519 cryptographic signing for offline tamper detection |

## Verification CLI Commands

Concise CLI examples to test and verify the orchestrator:

```bash
# Run all 12 demo scenarios (S1..S12)
make demo
# or: uv run python scripts/scenarios/runner.py

# Verify cross-system invariants (INV-1..INV-6, zero orphaned state)
make invariants
# or: uv run python scripts/invariants.py

# Run A/B proof harness (SwitchOn 100% consistent vs naive baseline)
make ab-proof
# or: uv run python scripts/ab_proof.py --orders 20 --seed 42

# Verify consistency certificate & tamper detection offline
uv run python scripts/verify_cert.py --id <order_id>
uv run python scripts/verify_cert.py --id <order_id> --tamper
```

## Services Overview

| Service | Port | Description |
|---|---|---|
| **Operator Console** | `3000` | Next.js live DAG & metrics dashboard |
| **Order API Gateway** | `8000` | FastAPI control plane & read model |
| **Temporal UI** | `8233` | Temporal server workflow history viewer |
| **OMS Mock** | `8101` | Order management mock |
| **Inventory Mock** | `8102` | Resource reservation mock |
| **Network Mock** | `8103` | Network provisioning mock |
| **Billing Mock** | `8104` | Billing account & charging mock |
| **Notification Mock** | `8105` | SMS & customer email mock |

## Scenarios Handled (S1..S12)

- **S1: Happy Path** — Full multi-system activation with Ed25519 certificate issued.
- **S2: Transient Retries** — Automatic backoff on network 503 errors (retries -> OK).
- **S3: Business Rejections** — Fast rollback on inventory out of stock (no retry).
- **S4: Provisioning Failure** — Reverse saga compensation on permanent 500 error.
- **S5: Post-Verification Failure** — Deprovisioning & account reversal.
- **S6: Compensation Failure** — Escalation to `NEEDS_ATTENTION` when compensation fails.
- **S7: Crash Recovery** — Mid-workflow worker crash survival without duplication.
- **S8: Idempotent Submission** — Duplicate client order deduplication via Idempotency-Key.
- **S9: Operator Cancellation** — Mid-flight cancellation signal and graceful compensation.
- **S10: Chaos Load Test** — Concurrent activations with invariant verification.
- **S11: Late Forward Request** — Tombstone wins (HTTP 409 TOMBSTONED preventing race condition).
- **S12: A/B Proof** — SwitchOn 100% consistency (0 orphaned resources) vs Baseline engine.
