import json
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class EventType(StrEnum):
    # Order Events
    ORDER_RECEIVED = "order.received"
    ORDER_VALIDATED = "order.validated"
    ORDER_STARTED = "order.started"
    ORDER_ACTIVE = "order.active"
    ORDER_ROLLING_BACK = "order.rolling_back"
    ORDER_ROLLED_BACK = "order.rolled_back"
    ORDER_NEEDS_ATTENTION = "order.needs_attention"
    ORDER_CANCELLED = "order.cancelled"

    # Task Events
    TASK_STARTED = "task.started"
    TASK_SUCCEEDED = "task.succeeded"
    TASK_RETRYING = "task.retrying"
    TASK_FAILED = "task.failed"
    TASK_COMPENSATING = "task.compensating"
    TASK_COMPENSATED = "task.compensated"
    TASK_COMPENSATION_FAILED = "task.compensation_failed"


class Event(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    order_id: str
    seq: int
    ts: datetime = Field(default_factory=lambda: datetime.now(UTC))
    type: EventType
    task_id: str | None = None
    system: str | None = None
    attempt: int | None = None
    state: str | None = None
    detail: dict[str, Any] = Field(default_factory=dict)

    def to_redis_dict(self) -> dict[str, str]:
        return {
            "event_id": self.event_id,
            "order_id": self.order_id,
            "seq": str(self.seq),
            "ts": self.ts.isoformat(),
            "type": self.type.value,
            "task_id": self.task_id or "",
            "system": self.system or "",
            "attempt": str(self.attempt or 0),
            "state": self.state or "",
            "detail": json.dumps(self.detail),
        }

    @classmethod
    def from_redis_dict(cls, data: dict[bytes | str, bytes | str]) -> "Event":
        clean_data: dict[str, str] = {}
        for k, v in data.items():
            key_str = k.decode("utf-8") if isinstance(k, bytes) else k
            val_str = v.decode("utf-8") if isinstance(v, bytes) else v
            clean_data[key_str] = val_str

        detail = json.loads(clean_data.get("detail", "{}"))
        return cls(
            event_id=clean_data["event_id"],
            order_id=clean_data["order_id"],
            seq=int(clean_data["seq"]),
            ts=datetime.fromisoformat(clean_data["ts"]),
            type=EventType(clean_data["type"]),
            task_id=clean_data.get("task_id") or None,
            system=clean_data.get("system") or None,
            attempt=int(clean_data.get("attempt", 0)) or None,
            state=clean_data.get("state") or None,
            detail=detail,
        )
