from typing import Any

from shared.clients.base import BaseSystemClient


class BillingClient(BaseSystemClient):
    def __init__(self, base_url: str) -> None:
        super().__init__(base_url=base_url, system_name="billing")

    async def create_account(
        self,
        order_id: str,
        payload: dict[str, Any],
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            "/accounts",
            {"order_id": order_id, **payload},
            idempotency_key,
            "create_account",
            chaos_key=chaos_key,
        )

    async def void_account(
        self,
        order_id: str,
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._delete(
            f"/accounts/{order_id}", idempotency_key, "void_account", chaos_key=chaos_key
        )

    async def start_charging(
        self,
        order_id: str,
        payload: dict[str, Any],
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            f"/accounts/{order_id}/charging",
            payload,
            idempotency_key,
            "start_charging",
            chaos_key=chaos_key,
        )

    async def reverse_charges(
        self,
        order_id: str,
        idempotency_key: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        return await self._post(
            f"/accounts/{order_id}/charging/reverse",
            {},
            idempotency_key,
            "reverse_charges",
            chaos_key=chaos_key,
        )
