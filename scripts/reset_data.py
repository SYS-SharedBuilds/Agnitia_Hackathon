import asyncio

import httpx


async def reset_all() -> None:
    print("Resetting mock states and read model...")
    for port in (8101, 8102, 8103, 8104, 8105):
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"http://localhost:{port}/admin/reset")
        except Exception:
            pass

    # Clear PostgreSQL read model tables
    try:
        from sqlalchemy import text
        from sqlalchemy.ext.asyncio import create_async_engine

        from shared.config import settings

        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            await conn.execute(
                text(
                    """
                    TRUNCATE TABLE
                        ops.certificates, ops.events, ops.tasks, ops.orders, ops.drift, ops.system_calls,
                        oms.orders, oms.idempotency, oms.tombstones,
                        inventory.resources, inventory.idempotency, inventory.tombstones,
                        network.services, network.idempotency, network.tombstones,
                        billing.charges, billing.accounts, billing.idempotency, billing.tombstones,
                        notify.messages, notify.idempotency, notify.tombstones
                    CASCADE;
                    """
                )
            )
        await engine.dispose()

        # Clear Redis streams
        try:
            import redis.asyncio as aioredis

            r = aioredis.from_url(settings.REDIS_URL)
            await r.delete("order.events", "order.events.dlq")
            await r.close()
        except Exception as r_exc:
            print(f"Warning: could not clear Redis streams: {r_exc}")
        await engine.dispose()
    except Exception as exc:
        print(f"Warning: could not truncate DB tables: {exc}")

    print("Reset complete.")


if __name__ == "__main__":
    asyncio.run(reset_all())
