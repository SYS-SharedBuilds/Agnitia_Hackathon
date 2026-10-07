from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from temporalio.client import Client
from temporalio.common import WorkflowIDReusePolicy
from temporalio.exceptions import WorkflowAlreadyStartedError

from services.orchestrator.events import event_publisher
from services.order_api.db import get_db_session
from shared.catalog import catalog_loader
from shared.config import settings
from shared.events import Event, EventType
from shared.logging import get_logger
from shared.models import OrderCreateRequest

logger = get_logger("orders_router")
router = APIRouter(prefix="/orders", tags=["Orders"])

_temporal_client: Client | None = None


async def get_temporal_client() -> Client:
    global _temporal_client
    if _temporal_client is None:
        _temporal_client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
    return _temporal_client


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def submit_order(
    payload: OrderCreateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    # 1. Idempotency check on client_order_ref
    stmt = text(
        "SELECT order_id, workflow_id, state, product, customer_id, created_at FROM ops.orders WHERE client_order_ref = :ref"
    )
    res = await session.execute(stmt, {"ref": payload.client_order_ref})
    existing = res.mappings().first()
    if existing:
        return {
            "order_id": existing["order_id"],
            "workflow_id": existing["workflow_id"],
            "state": existing["state"],
            "idempotent_replay": True,
        }

    # 2. Resolve Plan from Catalog
    try:
        plan = catalog_loader.resolve_plan(payload.product)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid product '{payload.product}': {exc}",
        ) from exc

    order_id = f"ord_{uuid4().hex[:10]}"
    workflow_id = f"order-{order_id}"

    # 3. Create initial order in read model
    insert_order = text(
        """
        INSERT INTO ops.orders (order_id, client_order_ref, customer_id, product, state, workflow_id)
        VALUES (:order_id, :client_order_ref, :customer_id, :product, :state, :workflow_id)
        """
    )
    await session.execute(
        insert_order,
        {
            "order_id": order_id,
            "client_order_ref": payload.client_order_ref,
            "customer_id": payload.customer_id,
            "product": payload.product,
            "state": "RECEIVED",
            "workflow_id": workflow_id,
        },
    )
    await session.commit()

    # 4. Emit order.received event
    await event_publisher.publish(
        Event(
            order_id=order_id,
            seq=1,
            type=EventType.ORDER_RECEIVED,
            detail={"client_order_ref": payload.client_order_ref, "product": payload.product},
        )
    )

    # 5. Start Temporal Workflow
    try:
        temporal_client = await get_temporal_client()
        order_dict = {"order_id": order_id, **payload.model_dump()}
        await temporal_client.start_workflow(
            "ServiceActivationWorkflow",
            args=[order_dict, plan.model_dump()],
            id=workflow_id,
            task_queue=settings.TASK_QUEUE,
            id_reuse_policy=WorkflowIDReusePolicy.REJECT_DUPLICATE,
        )
    except WorkflowAlreadyStartedError:
        pass
    except Exception as exc:
        logger.error("failed_to_start_workflow", order_id=order_id, error=str(exc))

    return {
        "order_id": order_id,
        "workflow_id": workflow_id,
        "state": "RECEIVED",
        "product": payload.product,
    }


@router.get("")
async def list_orders(
    state: str | None = None,
    product: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    session: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    query = "SELECT * FROM ops.orders WHERE 1=1"
    params: dict[str, Any] = {"limit": limit, "offset": offset}

    if state:
        query += " AND state = :state"
        params["state"] = state
    if product:
        query += " AND product = :product"
        params["product"] = product

    query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    res = await session.execute(text(query), params)
    rows = res.mappings().all()
    return [dict(r) for r in rows]


@router.get("/{order_id}")
async def get_order_detail(
    order_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    res = await session.execute(
        text("SELECT * FROM ops.orders WHERE order_id = :id"), {"id": order_id}
    )
    order = res.mappings().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    tasks_res = await session.execute(
        text("SELECT * FROM ops.tasks WHERE order_id = :id ORDER BY started_at ASC"),
        {"id": order_id},
    )
    tasks = [dict(t) for t in tasks_res.mappings().all()]

    return {
        "order": dict(order),
        "tasks": tasks,
    }


@router.get("/{order_id}/events")
async def get_order_events(
    order_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    res = await session.execute(
        text("SELECT * FROM ops.events WHERE order_id = :id ORDER BY seq ASC, ts ASC"),
        {"id": order_id},
    )
    return [dict(e) for e in res.mappings().all()]


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    reason: str = "Operator signal",
) -> dict[str, str]:
    try:
        temporal_client = await get_temporal_client()
        handle = temporal_client.get_workflow_handle(f"order-{order_id}")
        await handle.signal("cancel_order", reason)
        return {"status": "cancel_signaled", "order_id": order_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to cancel workflow: {exc}") from exc


@router.post("/{order_id}/resolve")
async def resolve_order(
    order_id: str,
    note: str = "Manually cleared by operator",
) -> dict[str, str]:
    try:
        temporal_client = await get_temporal_client()
        handle = temporal_client.get_workflow_handle(f"order-{order_id}")
        await handle.signal("resolve_manually", note)
        return {"status": "resolve_signaled", "order_id": order_id}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to signal manual resolution: {exc}"
        ) from exc
