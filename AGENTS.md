# AGENTS — Instructions for AI Coding Agents (Claude Code, Cursor, Codex, etc.)

You are a contributor to **SwitchOn**, a telecom service-activation orchestrator built for a national hackathon. Be autonomous, precise, and conservative with scope.

## 0. Read Order (every session)
1. `BRAIN.md` — context, locked decisions, invariants, status.
2. `RULES.md` — non-negotiable constraints.
3. `TASKS.md` — find your assigned `T-xx`.
4. `ARCHITECTURE.md` + `TECHSTACK.md` — as needed.
5. `SKILLS.md` — follow the matching **playbook**.

If anything conflicts, precedence: **RULES.md > BRAIN.md (locked decisions) > ARCHITECTURE.md > TASKS.md > everything else.**

## 1. Operating Procedure

For each task:
1. **Restate** the task and its acceptance criteria in 3–5 lines.
2. **Plan** the files you will touch (list them). Keep the change set minimal.
3. **Write tests first or alongside** (workflow tests use time-skipping env).
4. **Implement** following the relevant playbook.
5. **Run** `make check` (format, lint, types, unit tests). Fix until green.
6. **Verify** against the AC manually if it involves running services (`make up`, curl/scenario).
7. **Report** using the template in §6.
8. **Update** `TASKS.md` checkbox and `BRAIN.md` (status board, decision log) when applicable.

Do **one task at a time**. Do not start the next until the current one is verified.

## 2. Repo Map

| Path | Purpose |
|---|---|
| `shared/` | Models, events, errors, settings, catalog loader, system clients |
| `services/order_api/` | FastAPI gateway, SSE, metrics API |
| `services/orchestrator/workflows/` | **Pure** Temporal workflows |
| `services/orchestrator/activities/` | I/O activities (forward + compensation) |
| `services/orchestrator/worker.py` | Worker entrypoint |
| `services/orchestrator/projector.py` | Stream → read model |
| `services/mocks/` | 5 mock systems (one codebase) |
| `catalog/products/` | Product task-graph YAML |
| `web/` | Next.js operator console |
| `scripts/` | scenarios, load, invariants, report-data |
| `tests/` | unit / workflow / integration / e2e / histories |
| `docs/` | diagrams, report, demo script |

## 3. Commands

```
make up            # start full stack
make down          # stop
make logs s=worker # tail one service
make check         # ruff + mypy + unit tests (must pass before reporting done)
make test-wf       # workflow tests (time-skipping) + replay
make test-int      # compose-based integration tests
make validate-catalog
make demo          # run scenarios S1..S10
make invariants    # check no half-activated state
make kill-worker / make start-worker
make seed / make reset-data
make web-dev       # Next.js dev server
```

## 4. Hard Boundaries (summary — full list in RULES.md)
- **Never** do I/O, randomness, wall-clock reads, or env reads inside workflow code.
- **Never** retry inside HTTP clients; Temporal owns retries.
- **Every** forward action that mutates state **must** have an idempotent compensation (unless read-only/best-effort and declared so in the catalog).
- **Never** add dependencies without adding them to TECHSTACK.md in the same change.
- **Never** change locked decisions (BRAIN §5) — raise it in your report instead.
- **Never** commit secrets, `.env`, or real personal data.
- **Never** weaken or delete a test to make it pass.

## 5. Decision Authority

| You MAY decide alone | You MUST flag in report | You MUST NOT do |
|---|---|---|
| Internal naming, helper functions, test structure, minor refactors inside your task | New dependency, API shape change, event schema change, DB migration, catalog schema change | Change locked decisions, restructure repo, alter RULES/BRAIN invariants |

Ambiguity policy: if the spec is ambiguous, choose the **simplest option consistent with ARCHITECTURE.md**, state the assumption in the report, and proceed. Ask a question only when the choice is irreversible or affects another task's contract.

## 6. Report Template (end of every task)

```
## T-xx <title> — DONE | PARTIAL | BLOCKED
**Changed files:** (list)
**What I did:** (3–6 bullets)
**Tests added:** (names) — `make check`: PASS/FAIL
**Verified manually:** (commands + observed result)
**Assumptions / decisions:** (anything BRAIN.md should record)
**Risks / follow-ups:** (if any)
```

## 7. Code Style Quick Reference
- Python: 3.12, full type hints, `mypy --strict` on `shared/` and `services/orchestrator/`; ruff format; Pydantic v2 models at every boundary; async everywhere for I/O; no bare `except`.
- TypeScript: strict mode; zod at API boundary; no `any`; functional components; server components by default, client components only for live views.
- Commits: Conventional Commits (`feat(orchestrator): …`, `test(workflow): …`), reference `T-xx`.
- Branching: `feat/T-xx-short-name`; PR must pass CI.

## 8. Testing Expectations
- Every activity: unit test (success, transient, business error, idempotent replay).
- Every workflow behavior: time-skipping test with scripted fakes.
- Rollback: parameterized over **every task position** failing.
- UI: Playwright smoke for S1 and S4.
- Flaky test = bug. Fix the cause; do not add retries or sleeps to tests.

## 9. When You Are Stuck
1. Re-read the AC and the playbook.
2. Check `docs/` and BRAIN §10 (Known Traps).
3. Reproduce minimally with a failing test.
4. If still blocked after two focused attempts, stop and report `BLOCKED` with: what you tried, evidence (logs/test output), and the smallest question that would unblock you.

## 10. Quality Bar
Production-minded: clear errors, structured logs with `order_id`, timeouts on every call, no dead code, no commented-out blocks, docstrings on public functions explaining *why* (not what). Demo-minded: every feature you add should be visible and explainable in the live demo, or it is probably out of scope.
