import json
from collections.abc import AsyncGenerator

import redis.asyncio as redis
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from shared.config import settings

router = APIRouter(prefix="/stream", tags=["Streaming"])


@router.get("/orders")
async def stream_all_orders(request: Request) -> EventSourceResponse:
    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        client = redis.from_url(settings.REDIS_URL)
        last_id = "$"
        try:
            while True:
                if await request.is_disconnected():
                    break
                # Read new events from Redis Stream
                streams = await client.xread({"order.events": last_id}, count=5, block=2000)
                if streams:
                    for _stream_name, messages in streams:
                        for msg_id, raw_data in messages:
                            last_id = (
                                msg_id.decode("utf-8") if isinstance(msg_id, bytes) else msg_id
                            )
                            clean_data = {
                                (k.decode("utf-8") if isinstance(k, bytes) else k): (
                                    v.decode("utf-8") if isinstance(v, bytes) else v
                                )
                                for k, v in raw_data.items()
                            }
                            yield {
                                "event": "order_event",
                                "id": last_id,
                                "data": json.dumps(clean_data),
                            }
                else:
                    # Heartbeat
                    yield {"event": "ping", "data": ""}
        finally:
            await client.close()

    return EventSourceResponse(event_generator())
