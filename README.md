# SwitchOn — Automated Telecom Service Activation Orchestrator

Durable, dependency-aware telecom service activation orchestrator powered by **Temporal Python SDK**, **FastAPI**, **Redis Streams**, and **Next.js**.

## Quickstart

```bash
# 1. Start full infrastructure & mock systems
make up

# 2. Validate product catalog DAGs
make validate-catalog

# 3. Run automated demo scenarios (S1..S10)
make demo

# 4. Check zero half-activated state invariants
make invariants
```

## Services Overview

| Service | Port | Description |
|---|---|---|
| **Operator Console** | `3000` | Next.js live DAG & metrics dashboard |
| **Order API Gateway** | `8000` | FastAPI control plane & SSE stream |
| **Temporal UI** | `8233` | Temporal server workflow history viewer |
| **OMS Mock** | `8101` | Order management mock |
| **Inventory Mock** | `8102` | Resource reservation mock |
| **Network Mock** | `8103` | Network provisioning mock |
| **Billing Mock** | `8104` | Billing account & charging mock |
| **Notification Mock** | `8105` | SMS & customer email mock |

## Scenarios Handled

- **S1: Happy Path** — Full multi-system activation.
- **S2: Transient Retries** — Automatic backoff on network 503 errors.
- **S3: Business Rejections** — Fast rollback on inventory out of stock.
- **S4: Provisioning Failure** — Reverse saga compensation.
- **S5: Post-Verification Failure** — Deprovisioning & account reversal.
- **S6: Compensation Failure** — Escalation to `NEEDS_ATTENTION`.
- **S7: Crash Recovery** — Mid-workflow worker crash survival.
- **S8: Idempotent Submission** — Duplicate client order deduplication.
- **S9: Operator Cancellation** — Mid-flight cancellation signal.
- **S10: Chaos Load Test** — 100 concurrent activations with invariant verification.
