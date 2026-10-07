import asyncio
import json
from typing import Any

import redis.asyncio as redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from shared.config import settings
from shared.events import Event, EventType
from shared.logging import configure_logging, get_logger

configure_logging()
logger = get_logger("projector")


class EventProjector:
    def __init__(self, db_url: str | None = None, redis_url: str | None = None) -> None:
        self.db_url = db_url or settings.DATABASE_URL
        self.redis_url = redis_url or settings.REDIS_URL
        self.engine = create_async_engine(self.db_url, echo=False)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.redis_client: Any = None

    async def init_redis(self) -> None:
        self.redis_client = redis.from_url(self.redis_url)
        try:
            await self.redis_client.xgroup_create(
                "order.events", "projector_group", id="0", mkstream=True
            )
        except Exception:
            pass  # Group already exists

    async def apply_event(self, session: AsyncSession, event: Event) -> None:
        # Check event deduplication
        stmt = text("SELECT 1 FROM ops.events WHERE event_id = :event_id")
        res = await session.execute(stmt, {"event_id": event.event_id})
        if res.scalar():
            return  # Already processed

        # Record event in ops.events
        insert_event = text(
            """
            INSERT INTO ops.events (order_id, seq, event_id, ts, type, task_id, payload)
            VALUES (:order_id, :seq, :event_id, :ts, :type, :task_id, :payload)
            ON CONFLICT (event_id) DO NOTHING
            """
        )
        await session.execute(
            insert_event,
            {
                "order_id": event.order_id,
                "seq": event.seq,
                "event_id": event.event_id,
                "ts": event.ts,
                "type": event.type.value,
                "task_id": event.task_id,
                "payload": json.dumps(event.detail),
            },
        )

        # Update order state on order events
        if event.type.value.startswith("order."):
            state_map = {
                EventType.ORDER_RECEIVED: "RECEIVED",
                EventType.ORDER_VALIDATED: "VALIDATED",
                EventType.ORDER_STARTED: "IN_PROGRESS",
                EventType.ORDER_ACTIVE: "ACTIVE",
                EventType.ORDER_ROLLING_BACK: "ROLLING_BACK",
                EventType.ORDER_ROLLED_BACK: "ROLLED_BACK",
                EventType.ORDER_NEEDS_ATTENTION: "NEEDS_ATTENTION",
                EventType.ORDER_CANCELLED: "CANCELLED",
            }
            order_state = state_map.get(event.type)
            if order_state:
                if order_state in ("ACTIVE", "ROLLED_BACK", "NEEDS_ATTENTION", "CANCELLED"):
                    update_order = text(
                        """
                        UPDATE ops.orders
                        SET state = :state,
                            completed_at = :ts,
                            activation_ms = EXTRACT(EPOCH FROM (:ts - created_at)) * 1000,
                            failure_reason = :reason
                        WHERE order_id = :order_id
                        """
                    )
                    await session.execute(
                        update_order,
                        {
                            "state": order_state,
                            "ts": event.ts,
                            "reason": event.detail.get("reason"),
                            "order_id": event.order_id,
                        },
                    )
                else:
                    update_order = text(
                        """
                        UPDATE ops.orders
                        SET state = :state
                        WHERE order_id = :order_id
                        """
                    )
                    await session.execute(
                        update_order, {"state": order_state, "order_id": event.order_id}
                    )

        # Update task state on task events
        if event.type.value.startswith("task.") and event.task_id:
            task_state_map = {
                EventType.TASK_STARTED: "RUNNING",
                EventType.TASK_SUCCEEDED: "SUCCEEDED",
                EventType.TASK_RETRYING: "RETRYING",
                EventType.TASK_FAILED: "FAILED",
                EventType.TASK_COMPENSATING: "COMPENSATING",
                EventType.TASK_COMPENSATED: "COMPENSATED",
                EventType.TASK_COMPENSATION_FAILED: "COMPENSATION_FAILED",
            }
            t_state = task_state_map.get(event.type, "PENDING")
            upsert_task = text(
                """
                INSERT INTO ops.tasks (order_id, task_id, system, state, attempts, started_at, ended_at, last_error)
                VALUES (:order_id, :task_id, :system, :state, :attempts, :ts, NULL, :last_error)
                ON CONFLICT (order_id, task_id) DO UPDATE SET
                    state = excluded.state,
                    attempts = CASE WHEN excluded.attempts > ops.tasks.attempts THEN excluded.attempts ELSE ops.tasks.attempts END,
                    ended_at = CASE WHEN excluded.state IN ('SUCCEEDED', 'FAILED', 'COMPENSATED', 'COMPENSATION_FAILED') THEN excluded.started_at ELSE ops.tasks.ended_at END,
                    last_error = COALESCE(excluded.last_error, ops.tasks.last_error)
                """
            )
            await session.execute(
                upsert_task,
                {
                    "order_id": event.order_id,
                    "task_id": event.task_id,
                    "system": event.system or "unknown",
                    "state": t_state,
                    "attempts": event.attempt or 1,
                    "ts": event.ts,
                    "last_error": event.detail.get("error"),
                },
            )

    async def run(self) -> None:
        await self.init_redis()
        logger.info("projector_started")

        assert self.redis_client is not None
        while True:
            try:
                entries = await self.redis_client.xreadgroup(
                    "projector_group",
                    "projector_worker_1",
                    {"order.events": ">"},
                    count=10,
                    block=2000,
                )
                if not entries:
                    continue

                async with self.session_factory() as session:
                    async with session.begin():
                        for _stream_name, messages in entries:
                            for msg_id, raw_data in messages:
                                try:
                                    event = Event.from_redis_dict(raw_data)
                                    await self.apply_event(session, event)
                                    await self.redis_client.xack(
                                        "order.events", "projector_group", msg_id
                                    )
                                except Exception as exc:
                                    logger.error(
                                        "failed_to_project_event", msg_id=msg_id, error=str(exc)
                                    )
                                    # Send to DLQ stream
                                    await self.redis_client.xadd("order.events.dlq", raw_data)
                                    await self.redis_client.xack(
                                        "order.events", "projector_group", msg_id
                                    )
            except Exception as exc:
                logger.error("projector_loop_error", error=str(exc))
                await asyncio.sleep(1.0)


if __name__ == "__main__":
    projector = EventProjector()
    asyncio.run(projector.run())
