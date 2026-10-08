from typing import Any

from shared.clients.base import BaseSystemClient


class OMSClient(BaseSystemClient):
    def __init__(self, base_url: str) -> None:
        super().__init__(base_url=base_url, system_name="oms")

    async def validate(
        self,
        order_id: str,
        payload: dict[str, Any],
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            "/orders/validate",
            {"order_id": order_id, **payload},
            idempotency_key,
            "validate",
            chaos_key=chaos_key,
        )

    async def complete(
        self,
        order_id: str,
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            f"/orders/{order_id}/complete",
            {},
            idempotency_key,
            "complete",
            chaos_key=chaos_key,
        )

    async def reopen(
        self,
        order_id: str,
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            f"/orders/{order_id}/reopen",
            {},
            idempotency_key,
            "reopen",
            chaos_key=chaos_key,
        )
