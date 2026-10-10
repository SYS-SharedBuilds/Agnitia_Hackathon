from typing import Any

import redis.asyncio as redis

from shared.config import settings
from shared.events import Event
from shared.logging import get_logger

logger = get_logger("event_publisher")


class EventPublisher:
    def __init__(self, redis_url: str | None = None) -> None:
        self.redis_url = redis_url or settings.REDIS_URL
        self._client: Any = None
        self._redis_disabled: bool = False
        self._projector: Any = None

    async def get_client(self) -> Any:
        if self._redis_disabled:
            return None
        if self._client is None:
            self._client = redis.from_url(
                self.redis_url,
                socket_connect_timeout=0.2,
                socket_timeout=0.2,
            )
        return self._client

    async def publish(self, event: Event) -> str:
        msg_id = ""
        if not self._redis_disabled:
            try:
                client = await self.get_client()
                if client is not None:
                    msg_id = str(await client.xadd(
                        "order.events",
                        event.to_redis_dict(),
                    ))
            except Exception as exc:
                self._redis_disabled = True
                logger.warning("failed_to_publish_event", event_id=event.event_id, error=str(exc))

        # Always ensure projection directly into PostgreSQL read models
        try:
            from services.orchestrator.projector import EventProjector

            if not hasattr(self, "_projector") or self._projector is None:
                self._projector = EventProjector()
            async with self._projector.session_factory() as session:
                async with session.begin():
                    await self._projector.apply_event(session, event)
        except Exception as p_exc:
            logger.warning("direct_projection_failed", event_id=event.event_id, error=str(p_exc))

        return msg_id

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()


event_publisher = EventPublisher()
