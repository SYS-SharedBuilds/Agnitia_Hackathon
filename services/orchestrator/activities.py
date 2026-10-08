from typing import Any

from temporalio import activity
from temporalio.exceptions import ApplicationError

from services.orchestrator.events import event_publisher
from shared.clients.billing import BillingClient
from shared.clients.inventory import InventoryClient
from shared.clients.network import NetworkClient
from shared.clients.notification import NotificationClient
from shared.clients.oms import OMSClient
from shared.config import settings
from shared.errors import BusinessError, TransientError
from shared.events import Event, EventType
from shared.masking import mask_payload
from shared.models import make_idempotency_key

oms_client = OMSClient(settings.OMS_MOCK_URL)
inventory_client = InventoryClient(settings.INVENTORY_MOCK_URL)
network_client = NetworkClient(settings.NETWORK_MOCK_URL)
billing_client = BillingClient(settings.BILLING_MOCK_URL)
notification_client = NotificationClient(settings.NOTIFICATION_MOCK_URL)


@activity.defn
async def execute_task_activity(
    order_id: str,
    task_id: str,
    system: str,
    action: str,
    payload: dict[str, Any],
    seq: int,
) -> dict[str, Any]:
    """Forward activity for all system tasks with standard event publishing and error mapping."""
    idempotency_key = make_idempotency_key(order_id, task_id, action)
    attempt = activity.info().attempt
    chaos_key = payload.get("chaos_key")

    # Publish task started event
    await event_publisher.publish(
        Event(
            order_id=order_id,
            seq=seq,
            type=EventType.TASK_STARTED,
            task_id=task_id,
            system=system,
            attempt=attempt,
            state="RUNNING",
            detail={"action": action},
        )
    )

    try:
        masked_payload = mask_payload(payload)
        if system == "oms":
            if action == "validate":
                res = await oms_client.validate(
                    order_id, masked_payload, idempotency_key, chaos_key=chaos_key
                )
            elif action == "complete":
                res = await oms_client.complete(
                    order_id, idempotency_key, chaos_key=chaos_key
                )
            else:
                res = {"status": "ok"}
        elif system == "inventory":
            res = await inventory_client.reserve(
                order_id, masked_payload, idempotency_key, chaos_key=chaos_key
            )
        elif system == "network":
            if action == "provision":
                res = await network_client.provision(
                    order_id, masked_payload, idempotency_key, chaos_key=chaos_key
                )
            elif action == "verify":
                res = await network_client.verify(
                    order_id, idempotency_key, chaos_key=chaos_key
                )
            else:
                res = {"status": "ok"}
        elif system == "billing":
            if action == "create_account":
                res = await billing_client.create_account(
                    order_id, masked_payload, idempotency_key, chaos_key=chaos_key
                )
            elif action == "start_charging":
                res = await billing_client.start_charging(
                    order_id, masked_payload, idempotency_key, chaos_key=chaos_key
                )
            else:
                res = {"status": "ok"}
        elif system == "notification":
            res = await notification_client.send_activation(
                order_id, masked_payload, idempotency_key, chaos_key=chaos_key
            )
        else:
            res = {"status": "ok"}

        # Publish task succeeded event
        await event_publisher.publish(
            Event(
                order_id=order_id,
                seq=seq + 1,
                type=EventType.TASK_SUCCEEDED,
                task_id=task_id,
                system=system,
                attempt=attempt,
                state="SUCCEEDED",
                detail={"result": res},
            )
        )
        return res

    except BusinessError as exc:
        await event_publisher.publish(
            Event(
                order_id=order_id,
                seq=seq + 1,
                type=EventType.TASK_FAILED,
                task_id=task_id,
                system=system,
                attempt=attempt,
                state="FAILED",
                detail={"error": exc.message, "business_error": True, "detail": exc.detail},
            )
        )
        # Business errors are non-retryable and known-not-applied (RULES §3.3)
        raise ApplicationError(
            exc.message,
            non_retryable=True,
            type="BusinessError",
        ) from exc

    except TransientError as exc:
        await event_publisher.publish(
            Event(
                order_id=order_id,
                seq=seq + 1,
                type=EventType.TASK_RETRYING,
                task_id=task_id,
                system=system,
                attempt=attempt,
                state="RETRYING",
                detail={"error": exc.message, "next_attempt": attempt + 1},
            )
        )
        raise ApplicationError(
            exc.message,
            non_retryable=False,
            type="TransientError",
        ) from exc

    except Exception as exc:
        await event_publisher.publish(
            Event(
                order_id=order_id,
                seq=seq + 1,
                type=EventType.TASK_FAILED,
                task_id=task_id,
                system=system,
                attempt=attempt,
                state="FAILED",
                detail={"error": str(exc)},
            )
        )
        raise ApplicationError(
            str(exc),
            non_retryable=False,
            type="PermanentSystemError",
        ) from exc


@activity.defn
async def compensate_task_activity(
    order_id: str,
    task_id: str,
    system: str,
    compensation_action: str,
    seq: int,
    chaos_key: str | None = None,
) -> dict[str, Any]:
    """Compensation undo activity with standard event publishing, tombstone writing, and idempotent semantics."""
    idempotency_key = make_idempotency_key(order_id, task_id, compensation_action)
    attempt = activity.info().attempt

    await event_publisher.publish(
        Event(
            order_id=order_id,
            seq=seq,
            type=EventType.TASK_COMPENSATING,
            task_id=task_id,
            system=system,
            attempt=attempt,
            state="COMPENSATING",
            detail={"compensation": compensation_action},
        )
    )

    try:
        if system == "oms":
            if compensation_action == "reopen_order":
                res = await oms_client.reopen(order_id, idempotency_key, chaos_key=chaos_key)
            else:
                res = {"status": "ok"}
        elif system == "inventory":
            res = await inventory_client.release(order_id, idempotency_key, chaos_key=chaos_key)
        elif system == "network":
            res = await network_client.deprovision(order_id, idempotency_key, chaos_key=chaos_key)
        elif system == "billing":
            if compensation_action == "void_account":
                res = await billing_client.void_account(
                    order_id, idempotency_key, chaos_key=chaos_key
                )
            elif compensation_action == "reverse_charges":
                res = await billing_client.reverse_charges(
                    order_id, idempotency_key, chaos_key=chaos_key
                )
            else:
                res = {"status": "ok"}
        elif system == "notification":
            res = await notification_client.send_failure(
                order_id, {}, idempotency_key, chaos_key=chaos_key
            )
        else:
            res = {"status": "ok"}

        await event_publisher.publish(
            Event(
                order_id=order_id,
                seq=seq + 1,
                type=EventType.TASK_COMPENSATED,
                task_id=task_id,
                system=system,
                attempt=attempt,
                state="COMPENSATED",
                detail={"result": res},
            )
        )
        return res

    except Exception as exc:
        await event_publisher.publish(
            Event(
                order_id=order_id,
                seq=seq + 1,
                type=EventType.TASK_COMPENSATION_FAILED,
                task_id=task_id,
                system=system,
                attempt=attempt,
                state="COMPENSATION_FAILED",
                detail={"error": str(exc)},
            )
        )
        raise ApplicationError(
            f"Compensation {compensation_action} failed: {exc}",
            non_retryable=False,
            type="CompensationError",
        ) from exc


@activity.defn
async def publish_order_event_activity(
    order_id: str,
    event_type: str,
    seq: int,
    detail: dict[str, Any],
) -> None:
    await event_publisher.publish(
        Event(
            order_id=order_id,
            seq=seq,
            type=EventType(event_type),
            detail=detail,
        )
    )
