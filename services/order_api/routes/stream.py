import asyncio
import json
from collections.abc import AsyncGenerator

import redis.asyncio as redis
from fastapi import APIRouter, Request
from sqlalchemy import text
from sse_starlette.sse import EventSourceResponse

from services.order_api.db import get_db_session
from shared.config import settings

router = APIRouter(prefix="/stream", tags=["Streaming"])


@router.get("/orders")
async def stream_all_orders(request: Request) -> EventSourceResponse:
    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        client = None
        redis_failed = False
        try:
            client = redis.from_url(settings.REDIS_URL, socket_timeout=0.5, socket_connect_timeout=0.5)
        except Exception:
            redis_failed = True

        last_id = "$"
        last_event_id = 0
        try:
            while True:
                if await request.is_disconnected():
                    break
                if not redis_failed and client is not None:
                    try:
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
                            yield {"event": "ping", "data": ""}
                    except Exception:
                        redis_failed = True
                else:
                    # Database fallback: stream recent events from ops.events
                    try:
                        async for session in get_db_session():
                            res = await session.execute(
                                text("SELECT * FROM ops.events WHERE id > :last_id ORDER BY id ASC LIMIT 10"),
                                {"last_id": last_event_id},
                            )
                            rows = res.mappings().all()
                            if rows:
                                for r in rows:
                                    last_event_id = max(last_event_id, r["id"])
                                    yield {
                                        "event": "order_event",
                                        "id": str(r["id"]),
                                        "data": json.dumps({
                                            "order_id": r["order_id"],
                                            "type": r["type"],
                                            "seq": r["seq"],
                                            "task_id": r["task_id"],
                                            "payload": r.get("payload") or {},
                                        }),
                                    }
                            else:
                                yield {"event": "ping", "data": ""}
                            break
                    except Exception:
                        yield {"event": "ping", "data": ""}
                    await asyncio.sleep(2)
        finally:
            if client is not None:
                try:
                    await client.close()
                except Exception:
                    pass

    return EventSourceResponse(event_generator())
