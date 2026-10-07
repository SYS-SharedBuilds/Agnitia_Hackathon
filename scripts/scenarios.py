"""Scenario runner for S1..S10."""

import asyncio
import uuid

import httpx

from scripts.invariants import check_invariants
from shared.config import get_settings

settings = get_settings()


async def run_scenario(name: str, description: str, setup_fn, expected_state: str) -> bool:
    print(f"\n--- Running Scenario {name}: {description} ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Reset chaos first
        for port in (8101, 8102, 8103, 8104, 8105):
            try:
                await client.delete(f"http://localhost:{port}/admin/chaos")
            except Exception:
                pass

        await setup_fn(client)

        ref = f"demo-{name}-{uuid.uuid4().hex[:6]}"
        resp = await client.post(
            f"{settings.ORDER_API_URL}/orders",
            json={
                "client_order_ref": ref,
                "customer_id": f"cust_{name}",
                "product": "FIBER_500",
                "details": {"address": "123 Telecom Street", "item_type": "ONT_PORT"},
            },
        )
        if resp.status_code != 202:
            print(f"Failed to submit order: {resp.text}")
            return False

        order_id = resp.json()["order_id"]
        print(f"Submitted order {order_id}, waiting for completion...")

        # Poll for completion
        for _ in range(30):
            await asyncio.sleep(1.0)
            res = await client.get(f"{settings.ORDER_API_URL}/orders/{order_id}")
            if res.status_code == 200:
                state = res.json()["order"]["state"]
                if state in ("ACTIVE", "ROLLED_BACK", "NEEDS_ATTENTION", "CANCELLED"):
                    print(f"Order reached terminal state: {state}")
                    if state == expected_state:
                        print(f"Scenario {name} SUCCESS: expected {expected_state}, got {state}")
                        return True
                    else:
                        print(f"Scenario {name} MISMATCH: expected {expected_state}, got {state}")
                        return False

        print(f"Scenario {name} TIMED OUT")
        return False


async def s1_setup(client: httpx.AsyncClient):
    pass  # No chaos


async def s2_setup(client: httpx.AsyncClient):
    # Network 503 twice
    await client.put(
        "http://localhost:8103/admin/chaos", json={"mode": "fail_n", "n": 2, "status": 503}
    )


async def s3_setup(client: httpx.AsyncClient):
    # Inventory out of stock
    await client.put(
        "http://localhost:8102/admin/chaos",
        json={"mode": "business_error", "business_code": "OUT_OF_STOCK"},
    )


async def s4_setup(client: httpx.AsyncClient):
    # Network permanent 500
    await client.put(
        "http://localhost:8103/admin/chaos", json={"mode": "always_fail", "status": 500}
    )


async def s5_setup(client: httpx.AsyncClient):
    # Billing charging 500
    await client.put(
        "http://localhost:8104/admin/chaos",
        json={"mode": "always_fail", "status": 500, "match_action": "start_charging"},
    )


async def s6_setup(client: httpx.AsyncClient):
    # Compensation failure on network
    await client.put(
        "http://localhost:8103/admin/chaos",
        json={"mode": "always_fail", "status": 500, "fail_on_compensation": True},
    )
    # Also fail billing start to trigger rollback
    await client.put(
        "http://localhost:8104/admin/chaos",
        json={"mode": "always_fail", "status": 500, "match_action": "start_charging"},
    )


async def main():
    scenarios = [
        ("S1", "Happy path", s1_setup, "ACTIVE"),
        ("S2", "Transient Network 503 x2 (Retry)", s2_setup, "ACTIVE"),
        ("S3", "Inventory Out of Stock (Business Fast Fail)", s3_setup, "ROLLED_BACK"),
        ("S4", "Network Provision Failure (Saga Rollback)", s4_setup, "ROLLED_BACK"),
        ("S5", "Billing Start Charging Failure (Rollback Live Network)", s5_setup, "ROLLED_BACK"),
        ("S6", "Compensation Failure (Escalate to NEEDS_ATTENTION)", s6_setup, "NEEDS_ATTENTION"),
    ]

    print("==================================================")
    print("      SwitchOn Automated Scenario Suite (S1-S6)   ")
    print("==================================================")

    for name, desc, setup, expected in scenarios:
        try:
            await run_scenario(name, desc, setup, expected)
        except Exception as e:
            print(f"Error running {name}: {e}")

    # Check invariants
    await check_invariants()


if __name__ == "__main__":
    asyncio.run(main())
