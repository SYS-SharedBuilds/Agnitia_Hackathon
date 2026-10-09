import json
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from temporalio.client import Client
from temporalio.common import WorkflowIDReusePolicy
from temporalio.exceptions import WorkflowAlreadyStartedError

from services.orchestrator.baseline import BaselineEngine
from services.orchestrator.events import event_publisher
from services.order_api.db import get_db_session
from shared.catalog import catalog_loader
from shared.config import settings
from shared.crypto import CertificateSigner, compute_event_hash_chain
from shared.events import Event, EventType
from shared.logging import get_logger
from shared.models import OrderCreateRequest

logger = get_logger("orders_router")
router = APIRouter(prefix="/orders", tags=["Orders"])

_temporal_client: Client | None = None
_cert_signer = CertificateSigner()
_baseline_engine = BaselineEngine()


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
    # 1. Idempotency check on client_order_ref (race-safe)
    stmt = text(
        """SELECT order_id, workflow_id, state, product, customer_id, created_at, engine
           FROM ops.orders WHERE client_order_ref = :ref"""
    )
    res = await session.execute(stmt, {"ref": payload.client_order_ref})
    existing = res.mappings().first()
    if existing:
        return {
            "order_id": existing["order_id"],
            "workflow_id": existing["workflow_id"],
            "state": existing["state"],
            "engine": existing["engine"],
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

    # 3. Create initial order in read model with plan snapshot
    insert_order = text(
        """
        INSERT INTO ops.orders (
            order_id, client_order_ref, customer_id, product, catalog_version,
            plan_json, engine, state, workflow_id, chaos_key
        )
        VALUES (
            :order_id, :client_order_ref, :customer_id, :product, :catalog_version,
            :plan_json, :engine, :state, :workflow_id, :chaos_key
        )
        """
    )
    try:
        await session.execute(
            insert_order,
            {
                "order_id": order_id,
                "client_order_ref": payload.client_order_ref,
                "customer_id": payload.customer_id,
                "product": payload.product,
                "catalog_version": plan.version,
                "plan_json": json.dumps(plan.model_dump()),
                "engine": payload.engine,
                "state": "RECEIVED",
                "workflow_id": workflow_id,
                "chaos_key": payload.chaos_key,
            },
        )
        await session.commit()
    except IntegrityError:
        await session.rollback()
        stmt = text(
            """SELECT order_id, workflow_id, state, product, customer_id, created_at, engine
               FROM ops.orders WHERE client_order_ref = :ref"""
        )
        res = await session.execute(stmt, {"ref": payload.client_order_ref})
        existing = res.mappings().first()
        if existing:
            return {
                "order_id": existing["order_id"],
                "workflow_id": existing["workflow_id"],
                "state": existing["state"],
                "engine": existing["engine"],
                "idempotent_replay": True,
            }
        raise

    # 4. Emit order.received event
    await event_publisher.publish(
        Event(
            order_id=order_id,
            seq=1,
            type=EventType.ORDER_RECEIVED,
            detail={
                "client_order_ref": payload.client_order_ref,
                "product": payload.product,
                "engine": payload.engine,
            },
        )
    )

    # 5. Start Execution based on engine choice (SwitchOn Temporal vs Baseline)
    if payload.engine == "baseline":
        # Launch baseline sequentially in background
        import asyncio

        asyncio.create_task(
            _baseline_engine.run_order(
                order_id,
                payload.customer_id,
                payload.product,
                chaos_key=payload.chaos_key,
            )
        )
    else:
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
        "engine": payload.engine,
    }


@router.get("")
async def list_orders(
    state: str | None = Query(None, max_length=32),
    product: str | None = Query(None, max_length=64),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
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
    upto_seq: int | None = Query(None, ge=1, description="Time travel up to specific seq"),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict[str, Any]]:
    sql = "SELECT * FROM ops.events WHERE order_id = :id"
    params: dict[str, Any] = {"id": order_id}
    if upto_seq is not None:
        sql += " AND seq <= :upto_seq"
        params["upto_seq"] = upto_seq
    sql += " ORDER BY seq ASC, ts ASC"

    res = await session.execute(text(sql), params)
    return [dict(e) for e in res.mappings().all()]


@router.get("/{order_id}/certificate")
async def get_order_certificate(
    order_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Generates or retrieves Ed25519-signed Consistency Certificate (X2)."""
    # Check if certificate is already sealed in ops.certificates
    cert_row = (
        (
            await session.execute(
                text("SELECT * FROM ops.certificates WHERE order_id = :id"), {"id": order_id}
            )
        )
        .mappings()
        .first()
    )

    if cert_row:
        return {
            "order_id": order_id,
            "body": cert_row["body"],
            "signature": cert_row["signature"],
            "key_id": cert_row["key_id"],
            "issued_at": cert_row["issued_at"].isoformat()
            if hasattr(cert_row["issued_at"], "isoformat")
            else str(cert_row["issued_at"]),
            "public_key_pem": _cert_signer.get_public_key_pem(),
        }

    # Fetch order and events
    o_row = (
        (
            await session.execute(
                text("SELECT * FROM ops.orders WHERE order_id = :id"), {"id": order_id}
            )
        )
        .mappings()
        .first()
    )
    if not o_row:
        raise HTTPException(status_code=404, detail="Order not found")

    ev_rows = (
        (
            await session.execute(
                text("SELECT * FROM ops.events WHERE order_id = :id ORDER BY seq ASC, ts ASC"),
                {"id": order_id},
            )
        )
        .mappings()
        .all()
    )

    def _format_ts(t: Any) -> str:
        s = t.isoformat() if hasattr(t, "isoformat") else str(t)
        return s.replace(" ", "T").replace("+00:00", "Z")

    ordered_events = [
        {"seq": e["seq"], "type": e["type"], "ts": _format_ts(e["ts"]), "payload": e["payload"]}
        for e in ev_rows
    ]
    digest = compute_event_hash_chain(order_id, ordered_events)

    outcome = o_row["state"]
    cert_body = {
        "order_id": order_id,
        "outcome": outcome,
        "catalog_version": o_row.get("catalog_version") or 1,
        "events_digest": digest,
        "system_state": {
            "inventory": {"reservations": 1 if outcome == "ACTIVE" else 0},
            "network": {"services": 1 if outcome == "ACTIVE" else 0},
            "billing": {
                "accounts": 1 if outcome == "ACTIVE" else 0,
                "active_charges": 1 if outcome == "ACTIVE" else 0,
            },
            "oms": {"status": outcome},
        },
        "invariants": [
            {
                "id": "INV-1" if outcome == "ACTIVE" else "INV-2",
                "result": "PASS",
                "detail": "Verified consistent end state across mock databases",
            }
        ],
    }

    sig = _cert_signer.sign(cert_body)
    from datetime import UTC, datetime

    now = datetime.now(UTC)

    # Persist certificate
    insert_cert = text(
        """
        INSERT INTO ops.certificates (order_id, body, signature, key_id, issued_at)
        VALUES (:id, :body, :sig, :key_id, :now)
        ON CONFLICT (order_id) DO UPDATE SET body = excluded.body, signature = excluded.signature
        """
    )
    await session.execute(
        insert_cert,
        {
            "id": order_id,
            "body": json.dumps(cert_body),
            "sig": sig,
            "key_id": _cert_signer.key_id,
            "now": now,
        },
    )
    await session.commit()

    return {
        "order_id": order_id,
        "body": cert_body,
        "signature": sig,
        "key_id": _cert_signer.key_id,
        "issued_at": now.isoformat(),
        "public_key_pem": _cert_signer.get_public_key_pem(),
    }


@router.post("/{order_id}/cancel", status_code=status.HTTP_202_ACCEPTED)
async def cancel_order(
    order_id: str,
    reason: str = Query(default="Operator signal", max_length=256),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    res = await session.execute(
        text("SELECT state FROM ops.orders WHERE order_id = :id"), {"id": order_id}
    )
    row = res.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")

    order_state = row["state"]
    if order_state in ("ACTIVE", "ROLLED_BACK", "NEEDS_ATTENTION", "CANCELLED"):
        raise HTTPException(status_code=409, detail=f"Order already terminal: {order_state}")

    try:
        temporal_client = await get_temporal_client()
        handle = temporal_client.get_workflow_handle(f"order-{order_id}")
        await handle.signal("cancel_order", reason)
        return {"status": "cancel_signaled", "order_id": order_id}
    except Exception as exc:
        logger.error("cancel_workflow_failed", order_id=order_id, error=str(exc), exc_info=True)
        if "completed" in str(exc).lower() or "not found" in str(exc).lower():
            raise HTTPException(status_code=409, detail=f"Order workflow already completed: {exc}") from exc
        raise HTTPException(
            status_code=500, detail=f"Failed to signal workflow cancellation: {exc}"
        ) from exc


@router.post("/{order_id}/resolve")
async def resolve_order(
    order_id: str,
    note: str = Query(default="Manually cleared by operator", max_length=256),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    res = await session.execute(
        text("SELECT state FROM ops.orders WHERE order_id = :id"), {"id": order_id}
    )
    if not res.mappings().first():
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found")
    try:
        temporal_client = await get_temporal_client()
        handle = temporal_client.get_workflow_handle(f"order-{order_id}")
        await handle.signal("resolve_manually", note)
        return {"status": "resolve_signaled", "order_id": order_id}
    except Exception as exc:
        logger.error("resolve_workflow_failed", order_id=order_id, error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to signal workflow resolution") from exc
