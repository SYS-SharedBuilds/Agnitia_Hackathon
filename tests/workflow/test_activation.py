import pytest
from temporalio import activity
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from services.orchestrator.workflows.activation import ServiceActivationWorkflow
from shared.catalog import catalog_loader
from shared.models import OrderState


@activity.defn(name="execute_task_activity")
async def fake_execute_task(order_id, task_id, system, action, payload, seq):
    return {"status": "ok", "task_id": task_id}


@activity.defn(name="compensate_task_activity")
async def fake_compensate_task(order_id, task_id, system, comp, seq):
    return {"status": "compensated", "task_id": task_id}


@activity.defn(name="publish_order_event_activity")
async def fake_publish_event(order_id, evt_type, seq, detail):
    pass


@pytest.mark.asyncio
async def test_workflow_happy_path():
    async with await WorkflowEnvironment.start_time_skipping() as env:
        plan = catalog_loader.resolve_plan("FIBER_500")
        order_dict = {
            "order_id": "ord_test_happy",
            "client_order_ref": "ref_happy",
            "customer_id": "cust_happy",
            "product": "FIBER_500",
        }

        async with Worker(
            env.client,
            task_queue="test-queue",
            workflows=[ServiceActivationWorkflow],
            activities=[fake_execute_task, fake_compensate_task, fake_publish_event],
        ):
            result = await env.client.execute_workflow(
                ServiceActivationWorkflow.run,
                args=[order_dict, plan.model_dump()],
                id="test-wf-happy",
                task_queue="test-queue",
            )

            assert result["state"] == OrderState.ACTIVE.value
            assert len(result["completed_tasks"]) == len(plan.tasks)
