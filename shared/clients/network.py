from typing import Any

from shared.clients.base import BaseSystemClient


class NetworkClient(BaseSystemClient):
    def __init__(self, base_url: str) -> None:
        super().__init__(base_url=base_url, system_name="network")

    async def provision(
        self, order_id: str, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        return await self._post(
            "/services", {"order_id": order_id, **payload}, idempotency_key, "provision"
        )

    async def verify(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self._post(f"/services/{order_id}/verify", {}, idempotency_key, "verify")

    async def deprovision(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self._delete(f"/services/{order_id}", idempotency_key, "deprovision")
