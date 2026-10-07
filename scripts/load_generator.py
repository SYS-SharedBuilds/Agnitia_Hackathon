import asyncio
import random
import time
from typing import Any

import httpx


async def run_load_test(count: int = 20, failure_rate: float = 0.2) -> dict[str, Any]:
    client = httpx.AsyncClient(timeout=30.0)
    base_api = "http://localhost:8000"
    products = ["FIBER_500", "MOBILE_5G", "ESIM_ADDON"]

    print(f"Submitting {count} orders (simulated failure mix {failure_rate * 100}%)...")
    start_time = time.time()
    order_ids = []

    for i in range(count):
        prod = random.choice(products)
        ref = f"load_{int(time.time() * 1000)}_{i}"
        cust = f"CUST-LOAD-{i}"

        # If failure injected, set temporary chaos
        if random.random() < failure_rate:
            await client.put(
                "http://localhost:8103/admin/chaos",
                json={"mode": "fail_n", "n": 1, "status": 503},
            )

        res = await client.post(
            f"{base_api}/orders",
            json={"client_order_ref": ref, "customer_id": cust, "product": prod},
        )
        if res.status_code == 202:
            order_ids.append(res.json().get("order_id"))

    duration = time.time() - start_time
    return {
        "status": "LOAD_SUBMITTED",
        "count": count,
        "submitted_orders": len(order_ids),
        "duration_sec": round(duration, 2),
    }


if __name__ == "__main__":
    asyncio.run(run_load_test(count=20, failure_rate=0.2))
