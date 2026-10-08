from typing import Any

from shared.clients.base import BaseSystemClient


class InventoryClient(BaseSystemClient):
    def __init__(self, base_url: str) -> None:
        super().__init__(base_url=base_url, system_name="inventory")

    async def reserve(
        self,
        order_id: str,
        payload: dict[str, Any],
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            "/reservations",
            {"order_id": order_id, **payload},
            idempotency_key,
            "reserve",
            chaos_key=chaos_key,
        )

    async def release(
        self,
        order_id: str,
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._delete(
            f"/reservations/{order_id}", idempotency_key, "release", chaos_key=chaos_key
        )
