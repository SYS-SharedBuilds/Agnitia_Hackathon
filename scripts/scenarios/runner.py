import asyncio
import time
from typing import Any

import httpx


async def run_scenario(name: str) -> dict[str, Any]:
    scenario_id = name.upper()
    client = httpx.AsyncClient(timeout=30.0)
    base_api = "http://localhost:8000"

    print(f"\n--- Running Scenario {scenario_id} ---")

    # Clear chaos first
    for port in (8101, 8102, 8103, 8104, 8105):
        try:
            await client.delete(f"http://localhost:{port}/admin/chaos")
        except Exception:
            pass

    order_ref = f"demo_ref_{scenario_id}_{int(time.time())}"

    if scenario_id == "S1":
        # Happy path
        payload = {
            "client_order_ref": order_ref,
            "customer_id": "CUST-S1",
            "product": "FIBER_500",
        }
        res = await client.post(f"{base_api}/orders", json=payload)
        return {"scenario": "S1", "expected": "ACTIVE", "response": res.json()}

    elif scenario_id == "S2":
        # Network 503 twice
        await client.put(
            "http://localhost:8103/admin/chaos",
            json={"mode": "fail_n", "n": 2, "status": 503, "match_action": "provision"},
        )
        payload = {
            "client_order_ref": order_ref,
            "customer_id": "CUST-S2",
            "product": "FIBER_500",
        }
        res = await client.post(f"{base_api}/orders", json=payload)
        return {"scenario": "S2", "expected": "ACTIVE_WITH_RETRIES", "response": res.json()}

    elif scenario_id == "S3":
        # Inventory out of stock (Business error)
        await client.put(
            "http://localhost:8102/admin/chaos",
            json={"mode": "business_error", "business_code": "OUT_OF_STOCK"},
        )
        payload = {
            "client_order_ref": order_ref,
            "customer_id": "CUST-S3",
            "product": "FIBER_500",
        }
        res = await client.post(f"{base_api}/orders", json=payload)
        return {"scenario": "S3", "expected": "ROLLED_BACK_NO_RETRIES", "response": res.json()}

    elif scenario_id == "S4":
        # Network permanent 500 failure -> saga rollback
        await client.put(
            "http://localhost:8103/admin/chaos",
            json={"mode": "always_fail", "status": 500, "match_action": "provision"},
        )
        payload = {
            "client_order_ref": order_ref,
            "customer_id": "CUST-S4",
            "product": "FIBER_500",
        }
        res = await client.post(f"{base_api}/orders", json=payload)
        return {"scenario": "S4", "expected": "ROLLED_BACK", "response": res.json()}

    elif scenario_id == "S6":
        # Compensation failure -> NEEDS_ATTENTION
        await client.put(
            "http://localhost:8102/admin/chaos",
            json={
                "mode": "always_fail",
                "status": 500,
                "match_action": "release",
                "fail_on_compensation": True,
            },
        )
        # Trigger failure in billing to force compensation of inventory
        await client.put(
            "http://localhost:8104/admin/chaos",
            json={"mode": "always_fail", "status": 500, "match_action": "create_account"},
        )
        payload = {
            "client_order_ref": order_ref,
            "customer_id": "CUST-S6",
            "product": "FIBER_500",
        }
        res = await client.post(f"{base_api}/orders", json=payload)
        return {"scenario": "S6", "expected": "NEEDS_ATTENTION", "response": res.json()}

    else:
        # Default scenario
        payload = {
            "client_order_ref": order_ref,
            "customer_id": f"CUST-{scenario_id}",
            "product": "FIBER_500",
        }
        res = await client.post(f"{base_api}/orders", json=payload)
        return {"scenario": scenario_id, "response": res.json()}


async def main() -> None:
    print("=== Executing SwitchOn Demo Scenario Suite S1..S10 ===")
    scenarios = ["S1", "S2", "S3", "S4", "S6"]
    for sc in scenarios:
        res = await run_scenario(sc)
        print(f"✔ Scenario {sc} executed: {res}")


if __name__ == "__main__":
    asyncio.run(main())
