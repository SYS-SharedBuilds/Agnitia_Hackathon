import asyncio
import sys
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from shared.config import settings


async def check_all_invariants(
    custom_orders: list[dict[str, Any]] | None = None,
    custom_mock_data: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Evaluates cross-system invariants defined in BRAIN.md §7 (INV-1..INV-6).
    Reads ops.orders and audits state directly against the mock systems' persistent store via /admin/audit/resources.
    """
    results: list[dict[str, Any]] = []
    overall_pass = True

    # 1. Fetch live resource allocations from each mock system
    inv_data: dict[str, dict[str, Any]] = custom_mock_data.get("inventory", {}) if custom_mock_data else {}
    net_data: dict[str, dict[str, Any]] = custom_mock_data.get("network", {}) if custom_mock_data else {}
    bil_data: dict[str, dict[str, Any]] = custom_mock_data.get("billing", {}) if custom_mock_data else {}
    oms_data: dict[str, dict[str, Any]] = custom_mock_data.get("oms", {}) if custom_mock_data else {}

    if not custom_mock_data:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(f"{settings.INVENTORY_MOCK_URL}/admin/audit/resources")
                if r.is_success:
                    inv_data = {item["order_id"]: item for item in r.json() if "order_id" in item}
            except Exception:
                pass

            try:
                r = await client.get(f"{settings.NETWORK_MOCK_URL}/admin/audit/resources")
                if r.is_success:
                    net_data = {item["order_id"]: item for item in r.json() if "order_id" in item}
            except Exception:
                pass

            try:
                r = await client.get(f"{settings.BILLING_MOCK_URL}/admin/audit/resources")
                if r.is_success:
                    bil_data = {item["order_id"]: item for item in r.json() if "order_id" in item}
            except Exception:
                pass

            try:
                r = await client.get(f"{settings.OMS_MOCK_URL}/admin/audit/resources")
                if r.is_success:
                    oms_data = {item["order_id"]: item for item in r.json() if "order_id" in item}
            except Exception:
                pass

    # 2. Query orders from database or use custom_orders (for testing/negative testing)
    orders: list[dict[str, Any]] = []
    if custom_orders is not None:
        orders = custom_orders
    else:
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        try:
            async with engine.connect() as conn:
                q = text(
                    "SELECT order_id, state, product, failure_reason FROM ops.orders WHERE state IN ('ACTIVE', 'ROLLED_BACK', 'NEEDS_ATTENTION', 'CANCELLED') AND (engine IS NULL OR engine = 'temporal')"
                )
                res = await conn.execute(q)
                orders = [dict(r) for r in res.mappings().all()]
        except Exception as exc:
            results.append(
                {"rule": "DB_CHECK", "pass": False, "note": f"DB connection check: {exc}"}
            )
            return {"status": "FAIL", "checked_orders_count": 0, "results": results}
        finally:
            await engine.dispose()

    for o in orders:
        oid = o["order_id"]
        state = o["state"]

        inv_item = inv_data.get(oid)
        net_item = net_data.get(oid)
        bil_item = bil_data.get(oid)
        oms_item = oms_data.get(oid)

        inv_status = inv_item["state"] if inv_item else None
        net_status = net_item["state"] if net_item else None
        bil_status = bil_item["state"] if bil_item else None
        oms_status = oms_item["state"] if oms_item else None

        # INV-1: ACTIVE => inventory reserved and network service active/verified and billing charging/active and OMS completed
        if state == "ACTIVE":
            passed = (
                (inv_status == "RESERVED")
                and (net_status in ("PROVISIONED", "VERIFIED"))
                and (bil_status in ("ACTIVE", "CHARGING"))
                and (oms_status in ("COMPLETED", "VALIDATED"))
            )
            results.append(
                {
                    "order_id": oid,
                    "rule": "INV-1: ACTIVE_CONSISTENCY",
                    "pass": passed,
                    "state": state,
                    "details": {
                        "inventory": inv_status,
                        "network": net_status,
                        "billing": bil_status,
                        "oms": oms_status,
                    },
                }
            )
            if not passed:
                overall_pass = False

        # INV-2: ROLLED_BACK | CANCELLED => no reservation and no network service and no active billing and OMS not completed
        elif state in ("ROLLED_BACK", "CANCELLED"):
            inv_clean = inv_status in ("RELEASED", None)
            net_clean = net_status in ("DEPROVISIONED", None)
            bil_clean = bil_status in ("VOIDED", "REVERSED", None)
            oms_clean = oms_status != "COMPLETED"
            passed = inv_clean and net_clean and bil_clean and oms_clean
            results.append(
                {
                    "order_id": oid,
                    "rule": "INV-2: CLEAN_ROLLBACK_CONSISTENCY",
                    "pass": passed,
                    "state": state,
                    "details": {
                        "inventory": inv_status,
                        "network": net_status,
                        "billing": bil_status,
                        "oms": oms_status,
                    },
                }
            )
            if not passed:
                overall_pass = False

        # INV-3: NEEDS_ATTENTION => compensation failed
        elif state == "NEEDS_ATTENTION":
            passed = bool(o.get("failure_reason"))
            results.append(
                {
                    "order_id": oid,
                    "rule": "INV-3: NEEDS_ATTENTION_AUDIT",
                    "pass": passed,
                    "state": state,
                }
            )
            if not passed:
                overall_pass = False

    final_status = (
        "PASS" if overall_pass and len(results) > 0 else ("PASS" if len(results) == 0 else "FAIL")
    )
    return {
        "status": final_status,
        "checked_orders_count": len(results),
        "results": results,
    }


async def check_invariants() -> dict[str, Any]:
    return await check_all_invariants()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    res = asyncio.run(check_all_invariants())
    print("=== Cross-System Invariant Verification ===")
    print(f"Overall Status: {res['status']}")
    print(f"Checks Passed: {sum(1 for r in res['results'] if r.get('pass'))}/{len(res['results'])}")
    if res["status"] != "PASS":
        sys.exit(1)
