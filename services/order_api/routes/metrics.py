from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from services.order_api.db import get_db_session

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/summary")
async def get_metrics_summary(
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    query = """
    SELECT
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN state = 'ACTIVE' THEN 1 END) AS active_orders,
        COUNT(CASE WHEN state = 'ROLLED_BACK' THEN 1 END) AS rolled_back_orders,
        COUNT(CASE WHEN state = 'NEEDS_ATTENTION' THEN 1 END) AS needs_attention_orders,
        COUNT(CASE WHEN state = 'CANCELLED' THEN 1 END) AS cancelled_orders,
        COUNT(CASE WHEN state IN ('IN_PROGRESS', 'ROLLING_BACK', 'RECEIVED', 'VALIDATED') THEN 1 END) AS in_flight_orders,
        COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY activation_ms) FILTER (WHERE state = 'ACTIVE'), 0) AS p50_activation_ms,
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY activation_ms) FILTER (WHERE state = 'ACTIVE'), 0) AS p95_activation_ms,
        COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY activation_ms) FILTER (WHERE state = 'ACTIVE'), 0) AS p99_activation_ms
    FROM ops.orders;
    """
    res = await session.execute(text(query))
    row = res.mappings().first()
    if not row:
        return {}

    total_terminal = (
        row["active_orders"] + row["rolled_back_orders"] + row["needs_attention_orders"]
    )
    success_rate = (row["active_orders"] / total_terminal * 100.0) if total_terminal > 0 else 100.0
    failed_orders = row["rolled_back_orders"] + row["needs_attention_orders"]
    rollback_rate = (
        (row["rolled_back_orders"] / failed_orders * 100.0) if failed_orders > 0 else 100.0
    )

    return {
        "total_orders": row["total_orders"],
        "active_orders": row["active_orders"],
        "rolled_back_orders": row["rolled_back_orders"],
        "needs_attention_orders": row["needs_attention_orders"],
        "cancelled_orders": row["cancelled_orders"],
        "in_flight_orders": row["in_flight_orders"],
        "success_rate": round(success_rate, 2),
        "clean_rollback_rate": round(rollback_rate, 2),
        "p50_activation_ms": round(float(row["p50_activation_ms"]), 1),
        "p95_activation_ms": round(float(row["p95_activation_ms"]), 1),
        "p99_activation_ms": round(float(row["p99_activation_ms"]), 1),
    }
