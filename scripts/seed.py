import asyncio

import httpx


async def seed() -> None:
    print("Seeding sample orders...")
    base_api = "http://localhost:8000"
    orders = [
        {"client_order_ref": "seed_ref_1", "customer_id": "CUST-SEED-01", "product": "FIBER_500"},
        {"client_order_ref": "seed_ref_2", "customer_id": "CUST-SEED-02", "product": "MOBILE_5G"},
        {"client_order_ref": "seed_ref_3", "customer_id": "CUST-SEED-03", "product": "ESIM_ADDON"},
    ]
    async with httpx.AsyncClient() as client:
        for o in orders:
            try:
                res = await client.post(f"{base_api}/orders", json=o)
                print(f"Submitted seed order: {res.json()}")
            except Exception as e:
                print(f"Seed submit skipped (server offline): {e}")


if __name__ == "__main__":
    asyncio.run(seed())
