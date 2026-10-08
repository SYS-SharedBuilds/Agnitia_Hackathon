# AGENTS — Instructions for AI Coding Agents (v2)

You are a contributor to **SwitchOn**, a telecom service-activation orchestrator for a national hackathon. Be autonomous, precise, conservative with scope, and honest in reporting.

## 0. Read Order (every session)
1. `BRAIN.md` (context, locked decisions, invariants, status) → 2. `RULES.md` → 3. your `T-xx` in `TASKS.md` → 4. `contracts/` for interfaces you touch → 5. `ARCHITECTURE.md` / `TECHSTACK.md` as needed → 6. matching playbook in `SKILLS.md`.
Precedence: **RULES > BRAIN locked decisions > ARCHITECTURE > TASKS > rest.** If you find a contradiction, report it (do not silently pick).

## 1. Operating Procedure (per task)
1. **Restate** the task + acceptance criteria (3–5 lines).
2. **Plan**: list files you will touch; keep the change set minimal.
3. **Contracts first**: if an interface changes, update `contracts/` before code.
4. **Tests first or alongside** (workflow tests use time-skipping; add property tests for saga logic).
5. **Implement** per playbook.
6. **Run `make check`** until green; run `make test-wf` if orchestrator touched; `make test-int` if cross-service.
7. **Verify manually** when services are involved (`make up`, scenario/curl) and capture the observed result.
8. **Report** (§6). Update TASKS checkbox and BRAIN status/decision log when applicable.
One task at a time; don't start the next until the current one is verified.

## 2. Repo Map
| Path | Purpose |
|---|---|
| `contracts/` | OpenAPI, event + certificate JSON Schemas — **source of truth** |
| `shared/` | models, events, errors, settings, catalog loader, clients, crypto helpers |
| `services/order_api/` | FastAPI gateway, SSE, metrics, demo, TMF façade, certificates |
| `services/orchestrator/workflows/` | **Pure** Temporal workflows |
| `services/orchestrator/activities/` | I/O activities (forward + compensation) |
| `services/orchestrator/` | `worker.py`, `baseline.py`, `projector.py`, `reconciler.py`, `explainer.py` |
| `services/mocks/` | 5 mock systems |
| `catalog/products/` | Task-graph YAML |
| `web/` | Operator console |
| `scripts/` | scenarios, load, ab_proof, invariants, verify_cert, report_data |
| `tests/` | unit, workflow, property, integration, e2e, histories |
| `docs/` | diagrams, report, demo script, versions |

## 3. Commands
```
make up | down | logs s=<svc> | seed | reset-data
make check            # ruff + mypy + unit  (MUST pass before reporting done)
make test-wf          # workflow (time-skipping) + replay + property tests
make test-int         # compose integration (S1, S4, S11)
make validate-catalog | gen-types
make demo             # S1..S12 with PASS table
make invariants       # INV-1..INV-6 from mock DBs
make ab-proof         # baseline vs SwitchOn
make verify-cert id=<order_id>
make kill-worker | start-worker
make report-data      # the ONLY source for report numbers
make web-dev
```

## 4. Hard Boundaries (summary of RULES)
- Workflow code: no I/O, no time/random/uuid/env.
- No HTTP-client retries; Temporal owns retries.
- Every mutating action: idempotent forward + idempotent compensation **with tombstone**; forward endpoints check tombstones.
- Unknown outcomes are compensated; business errors are not.
- Baseline engine gets equal retries and identical seeded faults.
- New dependency ⇒ update TECHSTACK in the same change. Never use `temporalio/auto-setup`.
- Never change locked decisions; raise them in your report.
- Never commit secrets, keys, `.env`, or real personal data.
- Never weaken/delete tests to pass.

## 5. Decision Authority
| Decide alone | Flag in report | Never do |
|---|---|---|
| Internal naming, helpers, test layout, small refactors inside your task | New dependency, API/event/catalog schema change, DB migration, behavior change visible in demo | Change locked decisions, restructure repo, edit RULES, fabricate metrics |

Ambiguity: choose the simplest option consistent with ARCHITECTURE, state the assumption, proceed. Ask only if irreversible or if it changes another task's contract.

## 6. Report Template
```
## T-xx <title> — DONE | PARTIAL | BLOCKED
Changed files: …
What I did: (3–6 bullets)
Tests added: … — make check: PASS/FAIL (paste summary)
Verified manually: (commands + observed output)
Assumptions / decisions for BRAIN: …
Contradictions found in docs: …
Risks / follow-ups: …
```

## 7. Code Style
- Python 3.12, full type hints, `mypy --strict` on `shared/` and `services/orchestrator/`; ruff; Pydantic v2 at boundaries; async I/O; no bare `except`; no swallowed errors.
- TypeScript strict, zod at boundaries, no `any`, server components by default.
- Conventional Commits with `T-xx`; branch `feat/T-xx-name`; PR ≤ ~400 lines.
- Comments explain *why*; no dead or commented-out code.

## 8. Testing Expectations
Per activity: success, transient, business, idempotent replay. Per workflow behavior: time-skipping test. Rollback: every task position × every failure type. Property tests (X9) for invariants. Replay test in CI. UI: Playwright for S1/S4/S11. Negative tests for invariant checker and certificate verifier. Flaky ⇒ fix cause.

## 9. When Stuck
Re-read AC + playbook → BRAIN §10 Known Traps → reproduce with a minimal failing test → after two focused attempts report `BLOCKED` with what you tried, evidence, and the smallest unblocking question.

## 10. Parallel Agent Lanes (to avoid merge conflicts)
| Lane | Owns | Touches only |
|---|---|---|
| A — Mocks & chaos | T-10…T-16, T-68 | `services/mocks/`, `contracts/openapi/<mock>` |
| B — Orchestration | T-20…T-31 | `shared/`, `services/orchestrator/`, `catalog/` |
| C — API & events | T-40…T-47 | `services/order_api/`, projector, `contracts/` |
| D — Console | T-50…T-55, T-69, T-70+ UI | `web/` (consumes generated types) |
| E — Proof | T-60…T-67 | `scripts/`, `tests/property/`, baseline, certificates |
| F — Docs/demo | T-90…T-97 | `docs/`, README |
Cross-lane changes go through `contracts/` + a short note in BRAIN §13. Use separate git worktrees per agent.

## 11. Master Kickoff Prompt (paste to start an autonomous session)
```
You are building SwitchOn per the repo docs. Read BRAIN.md, RULES.md, AGENTS.md, then TASKS.md.
Work lane <A|B|C|D|E|F>. Execute tasks in dependency order from TASKS.md, one at a time.
For each task: restate AC → plan files → update contracts → write tests → implement per SKILLS playbook →
run `make check` (+ make test-wf/test-int when relevant) → verify manually → write the report (AGENTS §6) →
tick the TASKS checkbox → continue to the next task.
Stop and report BLOCKED only per AGENTS §9. Never change locked decisions or RULES. Never invent metrics.
Do not stop until every P0 task in your lane is DONE or BLOCKED.
```

## 12. Quality Bar
Production-minded (typed, bounded, observable, idempotent) **and** demo-minded: every feature must be visible and explainable on stage, or it is probably out of scope.
