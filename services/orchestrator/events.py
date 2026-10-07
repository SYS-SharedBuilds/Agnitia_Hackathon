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

    async def get_client(self) -> Any:
        if self._client is None:
            self._client = redis.from_url(self.redis_url)
        return self._client

    async def publish(self, event: Event) -> str:
        try:
            client = await self.get_client()
            msg_id = await client.xadd(
                "order.events",
                event.to_redis_dict(),
            )
            return str(msg_id)
        except Exception as exc:
            # Best effort or log warning; does not crash workflow
            logger.warning("failed_to_publish_event", event_id=event.event_id, error=str(exc))
            return ""

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()


event_publisher = EventPublisher()
