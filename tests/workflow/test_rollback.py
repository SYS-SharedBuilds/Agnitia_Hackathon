from typing import Any

import pytest
from temporalio import activity
from temporalio.exceptions import ApplicationError
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from services.orchestrator.workflows.activation import ServiceActivationWorkflow
from shared.catalog import catalog_loader
from shared.models import OrderState


@activity.defn(name="execute_task_activity")
async def fake_execute_task(
    order_id: str,
    task_id: str,
    system: str,
    action: str,
    payload: dict[str, Any],
    seq: int,
) -> dict[str, Any]:
    if task_id == "start_billing":
        # Simulate failure in billing to force rollback of preceding provisioned services
        raise ApplicationError("Simulated Billing 500 Failure", non_retryable=False)
    return {"status": "ok", "task_id": task_id}


@activity.defn(name="compensate_task_activity")
async def fake_compensate_task(
    order_id: str,
    task_id: str,
    system: str,
    comp: str,
    seq: int,
    chaos_key: str | None = None,
) -> dict[str, Any]:
    return {"status": "compensated", "task_id": task_id}


@activity.defn(name="publish_order_event_activity")
async def fake_publish_event(
    order_id: str,
    evt_type: str,
    seq: int,
    detail: dict[str, Any],
) -> None:
    pass


@pytest.mark.asyncio
async def test_workflow_saga_rollback_on_failure() -> None:
    """Verifies that failure in start_billing triggers reverse-order compensation and ends in ROLLED_BACK."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        plan = catalog_loader.resolve_plan("FIBER_500")
        order_dict = {
            "order_id": "ord_test_rollback",
            "client_order_ref": "ref_rollback",
            "customer_id": "cust_rollback",
            "product": "FIBER_500",
        }

        async with Worker(
            env.client,
            task_queue="test-queue-rollback",
            workflows=[ServiceActivationWorkflow],
            activities=[fake_execute_task, fake_compensate_task, fake_publish_event],
        ):
            result = await env.client.execute_workflow(
                ServiceActivationWorkflow.run,
                args=[order_dict, plan.model_dump()],
                id="test-wf-rollback",
                task_queue="test-queue-rollback",
            )

            assert result["state"] == OrderState.ROLLED_BACK.value
            assert "start_billing" in result["failure_reason"]


@activity.defn(name="compensate_task_activity")
async def fake_compensate_task_failing(
    order_id: str,
    task_id: str,
    system: str,
    comp: str,
    seq: int,
    chaos_key: str | None = None,
) -> dict[str, Any]:
    raise ApplicationError("Simulated Downstream Compensation Timeout 504", non_retryable=True)


@pytest.mark.asyncio
async def test_workflow_needs_attention_and_manual_resolve() -> None:
    """Verifies that exhausted compensation failure puts workflow in NEEDS_ATTENTION and resolve_manually unblocks it to ROLLED_BACK."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        plan = catalog_loader.resolve_plan("FIBER_500")
        order_dict = {
            "order_id": "ord_test_intervention",
            "client_order_ref": "ref_intervention",
            "customer_id": "cust_intervention",
            "product": "FIBER_500",
        }

        async with Worker(
            env.client,
            task_queue="test-queue-intervention",
            workflows=[ServiceActivationWorkflow],
            activities=[fake_execute_task, fake_compensate_task_failing, fake_publish_event],
        ):
            handle = await env.client.start_workflow(
                ServiceActivationWorkflow.run,
                args=[order_dict, plan.model_dump()],
                id="test-wf-intervention",
                task_queue="test-queue-intervention",
            )

            # Wait until workflow reaches NEEDS_ATTENTION state
            for _ in range(20):
                state = await handle.query("get_state")
                if state["state"] == OrderState.NEEDS_ATTENTION.value:
                    break
                await env.sleep(0.5)

            assert state["state"] == OrderState.NEEDS_ATTENTION.value

            # Send manual resolution signal
            await handle.signal("resolve_manually", "Operator cleared subscriber profile in HLR directly")

            # Workflow should now resolve and complete with state ROLLED_BACK
            result = await handle.result()
            assert result["state"] == OrderState.ROLLED_BACK.value
            assert "Manually resolved" in result["failure_reason"]

