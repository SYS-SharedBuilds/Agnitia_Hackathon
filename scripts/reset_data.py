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
                    "TRUNCATE TABLE ops.certificates, ops.events, ops.tasks, ops.orders CASCADE;"
                )
            )
        await engine.dispose()
    except Exception as exc:
        print(f"Warning: could not truncate DB tables: {exc}")

    print("Reset complete.")


if __name__ == "__main__":
    asyncio.run(reset_all())
