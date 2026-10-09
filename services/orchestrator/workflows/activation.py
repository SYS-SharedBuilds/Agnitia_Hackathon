import asyncio
from datetime import timedelta
from typing import Any

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from services.orchestrator.activities import (
        compensate_task_activity,
        execute_task_activity,
        publish_order_event_activity,
    )
    from shared.models import OrderState, Plan, TaskState


@workflow.defn
class ServiceActivationWorkflow:
    def __init__(self) -> None:
        self.order_id: str = ""
        self.plan: Plan | None = None
        self.state: OrderState = OrderState.RECEIVED
        self.task_states: dict[str, str] = {}
        self.completed_stack: list[str] = []
        self.attempted_effects: list[str] = []
        self.cancel_requested: bool = False
        self.cancel_reason: str = ""
        self.failure_reason: str = ""
        self.seq: int = 1
        self.results: dict[str, Any] = {}
        self.chaos_key: str | None = None

    @workflow.signal
    def cancel_order(self, reason: str = "Operator requested cancellation") -> None:
        self.cancel_requested = True
        self.cancel_reason = reason

    @workflow.signal
    def resolve_manually(self, note: str) -> None:
        if self.state == OrderState.NEEDS_ATTENTION:
            self.state = OrderState.ROLLED_BACK
            self.failure_reason = f"Manually resolved: {note}"

    @workflow.query
    def get_state(self) -> dict[str, Any]:
        return {
            "order_id": self.order_id,
            "state": self.state.value if isinstance(self.state, OrderState) else str(self.state),
            "task_states": self.task_states,
            "completed_tasks": self.completed_stack,
            "attempted_effects": self.attempted_effects,
            "cancel_requested": self.cancel_requested,
            "failure_reason": self.failure_reason,
        }

    def _next_seq(self) -> int:
        s = self.seq
        self.seq += 10
        return s

    @workflow.run
    async def run(self, order_dict: dict[str, Any], plan_dict: dict[str, Any]) -> dict[str, Any]:
        self.order_id = order_dict["order_id"]
        self.chaos_key = order_dict.get("chaos_key")
        self.plan = Plan(**plan_dict)
        self.state = OrderState.IN_PROGRESS

        for t in self.plan.tasks:
            self.task_states[t.id] = TaskState.PENDING.value

        # Emit order started event
        await workflow.execute_activity(
            publish_order_event_activity,
            args=[self.order_id, "order.started", self._next_seq(), {"product": self.plan.product}],
            start_to_close_timeout=timedelta(seconds=5),
        )

        all_tasks_map = {t.id: t for t in self.plan.tasks}
        failed_task_id: str | None = None

        # Main Forward Wave Scheduling Loop
        while True:
            if self.cancel_requested:
                self.failure_reason = f"Cancelled: {self.cancel_reason}"
                break

            pending_tasks = [
                t for t in self.plan.tasks if self.task_states[t.id] == TaskState.PENDING.value
            ]
            if not pending_tasks:
                break

            # Find ready tasks whose dependencies have all SUCCEEDED
            ready_tasks = []
            for t in pending_tasks:
                deps_met = all(
                    self.task_states.get(dep) == TaskState.SUCCEEDED.value for dep in t.depends_on
                )
                if deps_met:
                    ready_tasks.append(t)

            if not ready_tasks:
                # Deadlock or unsatisfied dependencies
                break

            # Execute ready tasks in parallel wave
            async def run_single_task(task_def: Any) -> tuple[str, bool, Any, bool]:
                self.task_states[task_def.id] = TaskState.RUNNING.value
                r_cfg = task_def.retry
                retry_policy = RetryPolicy(
                    initial_interval=timedelta(seconds=r_cfg.initial_interval_sec),
                    backoff_coefficient=r_cfg.backoff_coefficient,
                    maximum_interval=timedelta(seconds=r_cfg.max_interval_sec),
                    maximum_attempts=r_cfg.max_attempts,
                    non_retryable_error_types=["BusinessError"],
                )
                try:
                    res = await workflow.execute_activity(
                        execute_task_activity,
                        args=[
                            self.order_id,
                            task_def.id,
                            task_def.system.value,
                            task_def.action,
                            order_dict,
                            self._next_seq(),
                        ],
                        start_to_close_timeout=timedelta(seconds=task_def.timeout_sec),
                        retry_policy=retry_policy,
                    )
                    return task_def.id, True, res, False
                except Exception as exc:
                    # Detect if error is known business error (known not applied) vs unknown outcome / timeout
                    err_str = str(exc)
                    is_business_error = "BusinessError" in err_str or "422" in err_str
                    return task_def.id, False, err_str, is_business_error

            # Parallel gather for the current wave
            results = await asyncio.gather(*[run_single_task(t) for t in ready_tasks])

            has_critical_failure = False
            for tid, ok, res, is_biz_err in results:
                tdef = all_tasks_map[tid]
                if ok:
                    self.task_states[tid] = TaskState.SUCCEEDED.value
                    if not tdef.read_only:
                        self.completed_stack.append(tid)
                    self.results[tid] = res
                else:
                    self.task_states[tid] = TaskState.FAILED.value
                    self.failure_reason = f"Task {tid} failed: {res}"
                    # RULES §3.2 & §3.3: Unknown outcome (timeout/conn-loss) tasks MUST be compensated!
                    if not is_biz_err and not tdef.read_only and tdef.compensation:
                        if tid not in self.attempted_effects:
                            self.attempted_effects.append(tid)
                    if not tdef.best_effort:
                        has_critical_failure = True
                        failed_task_id = tid

            if has_critical_failure:
                break

        # Check terminal outcome
        if failed_task_id or self.cancel_requested:
            # SAGA ROLLBACK:
            # targets = reverse(completed_stack) + attempted_effects (ambiguous outcome tasks)
            self.state = OrderState.ROLLING_BACK
            await workflow.execute_activity(
                publish_order_event_activity,
                args=[
                    self.order_id,
                    "order.rolling_back",
                    self._next_seq(),
                    {"reason": self.failure_reason},
                ],
                start_to_close_timeout=timedelta(seconds=5),
            )

            # Targets list with deduplication preserving order:
            targets_to_compensate: list[str] = []
            for tid in self.attempted_effects:
                if tid not in targets_to_compensate:
                    targets_to_compensate.append(tid)
            for tid in reversed(self.completed_stack):
                if tid not in targets_to_compensate:
                    targets_to_compensate.append(tid)

            compensation_failed = False
            for tid in targets_to_compensate:
                tdef = all_tasks_map[tid]
                if tdef.compensation:
                    self.task_states[tid] = TaskState.COMPENSATING.value
                    comp_retry_policy = RetryPolicy(
                        initial_interval=timedelta(seconds=1.0),
                        backoff_coefficient=2.0,
                        maximum_interval=timedelta(seconds=8.0),
                        maximum_attempts=5,  # Higher retry cap for compensations
                    )
                    try:
                        await workflow.execute_activity(
                            compensate_task_activity,
                            args=[
                                self.order_id,
                                tid,
                                tdef.system.value,
                                tdef.compensation,
                                self._next_seq(),
                                self.chaos_key,
                            ],
                            start_to_close_timeout=timedelta(seconds=20),
                            retry_policy=comp_retry_policy,
                        )
                        self.task_states[tid] = TaskState.COMPENSATED.value
                    except Exception:
                        self.task_states[tid] = TaskState.COMPENSATION_FAILED.value
                        compensation_failed = True

            if self.cancel_requested:
                self.state = OrderState.CANCELLED
                evt_type = "order.cancelled"
            elif compensation_failed:
                self.state = OrderState.NEEDS_ATTENTION
                evt_type = "order.needs_attention"
            else:
                self.state = OrderState.ROLLED_BACK
                evt_type = "order.rolled_back"

            await workflow.execute_activity(
                publish_order_event_activity,
                args=[self.order_id, evt_type, self._next_seq(), {"reason": self.failure_reason}],
                start_to_close_timeout=timedelta(seconds=5),
            )

            if self.state == OrderState.NEEDS_ATTENTION:
                # Await manual resolution from operator (via resolve_manually signal)
                await workflow.wait_condition(lambda: self.state != OrderState.NEEDS_ATTENTION)
                await workflow.execute_activity(
                    publish_order_event_activity,
                    args=[self.order_id, "order.rolled_back", self._next_seq(), {"reason": self.failure_reason}],
                    start_to_close_timeout=timedelta(seconds=5),
                )

        else:
            self.state = OrderState.ACTIVE
            await workflow.execute_activity(
                publish_order_event_activity,
                args=[self.order_id, "order.active", self._next_seq(), {}],
                start_to_close_timeout=timedelta(seconds=5),
            )

        return {
            "order_id": self.order_id,
            "state": self.state.value if isinstance(self.state, OrderState) else str(self.state),
            "task_states": self.task_states,
            "completed_tasks": self.completed_stack,
            "attempted_effects": self.attempted_effects,
            "failure_reason": self.failure_reason,
        }
