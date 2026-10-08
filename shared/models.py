from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class OrderState(StrEnum):
    RECEIVED = "RECEIVED"
    VALIDATED = "VALIDATED"
    IN_PROGRESS = "IN_PROGRESS"
    ACTIVE = "ACTIVE"
    ROLLING_BACK = "ROLLING_BACK"
    ROLLED_BACK = "ROLLED_BACK"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"
    CANCELLED = "CANCELLED"


class TaskState(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    RETRYING = "RETRYING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    COMPENSATING = "COMPENSATING"
    COMPENSATED = "COMPENSATED"
    COMPENSATION_FAILED = "COMPENSATION_FAILED"


class SystemType(StrEnum):
    OMS = "oms"
    INVENTORY = "inventory"
    NETWORK = "network"
    BILLING = "billing"
    NOTIFICATION = "notification"


class RetryConfig(BaseModel):
    max_attempts: int = 3
    initial_interval_sec: float = 1.0
    backoff_coefficient: float = 2.0
    max_interval_sec: float = 8.0


class TaskDefinition(BaseModel):
    id: str
    system: SystemType
    action: str
    depends_on: list[str] = Field(default_factory=list)
    compensation: str | None = None
    read_only: bool = False
    best_effort: bool = False
    retry: RetryConfig = Field(default_factory=RetryConfig)
    timeout_sec: int = 15


class ProductDefinition(BaseModel):
    product: str
    name: str
    version: int
    description: str = ""
    tasks: list[TaskDefinition]


class Plan(BaseModel):
    product: str
    version: int
    tasks: list[TaskDefinition]

    def get_task(self, task_id: str) -> TaskDefinition | None:
        for t in self.tasks:
            if t.id == task_id:
                return t
        return None


class OrderCreateRequest(BaseModel):
    client_order_ref: str = Field(..., min_length=1, max_length=128)
    customer_id: str = Field(..., min_length=1, max_length=128)
    product: str = Field(..., min_length=1, max_length=64)
    plan_name: str | None = Field(default=None, max_length=128)
    site_address: str | None = Field(default=None, max_length=256)
    device_id: str | None = Field(default=None, max_length=64)
    msisdn: str | None = Field(default=None, max_length=32)
    iccid: str | None = Field(default=None, max_length=32)
    engine: str = Field(
        default="temporal", max_length=32
    )  # "temporal" or "baseline" for X1 A/B comparison
    chaos_key: str | None = Field(
        default=None, max_length=128
    )  # X-Chaos-Key for deterministic fault schedules

    @field_validator("engine")
    @classmethod
    def validate_engine(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in ("temporal", "baseline"):
            raise ValueError("engine must be either 'temporal' or 'baseline'")
        return cleaned


class Order(BaseModel):
    order_id: str
    client_order_ref: str
    customer_id: str
    product: str
    catalog_version: int = 1
    plan_json: dict[str, Any] = Field(default_factory=dict)
    engine: str = "temporal"
    state: OrderState = OrderState.RECEIVED
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    activation_ms: int | None = None
    failure_reason: str | None = None
    explanation: dict[str, Any] | None = None
    workflow_id: str
    chaos_key: str | None = None


class TaskExecutionState(BaseModel):
    order_id: str
    task_id: str
    system: SystemType
    state: TaskState = TaskState.PENDING
    attempts: int = 0
    started_at: datetime | None = None
    ended_at: datetime | None = None
    last_error: str | None = None
    outcome_known: bool = True


def make_idempotency_key(order_id: str, task_id: str, action: str) -> str:
    return f"{order_id}:{task_id}:{action}"
