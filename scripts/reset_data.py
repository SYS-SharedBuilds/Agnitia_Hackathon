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
    print("Reset complete.")


if __name__ == "__main__":
    asyncio.run(reset_all())
