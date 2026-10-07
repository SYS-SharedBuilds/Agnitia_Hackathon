import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from services.orchestrator.activities import (
    compensate_task_activity,
    execute_task_activity,
    publish_order_event_activity,
)
from services.orchestrator.workflows.activation import ServiceActivationWorkflow
from shared.config import settings
from shared.logging import configure_logging, get_logger

configure_logging()
logger = get_logger("orchestrator_worker")


async def main() -> None:
    logger.info("connecting_to_temporal", host=settings.TEMPORAL_HOST)
    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE,
    )

    worker = Worker(
        client,
        task_queue=settings.TASK_QUEUE,
        workflows=[ServiceActivationWorkflow],
        activities=[
            execute_task_activity,
            compensate_task_activity,
            publish_order_event_activity,
        ],
    )

    logger.info("worker_started", queue=settings.TASK_QUEUE)
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
