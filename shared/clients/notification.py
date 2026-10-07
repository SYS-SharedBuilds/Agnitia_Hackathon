from typing import Any

from shared.clients.base import BaseSystemClient


class NotificationClient(BaseSystemClient):
    def __init__(self, base_url: str) -> None:
        super().__init__(base_url=base_url, system_name="notification")

    async def send_activation(
        self, order_id: str, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        return await self._post(
            "/messages",
            {"order_id": order_id, "template": "activation", **payload},
            idempotency_key,
            "send_activation",
        )

    async def send_failure(
        self, order_id: str, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        return await self._post(
            "/messages",
            {"order_id": order_id, "template": "failure", **payload},
            idempotency_key,
            "send_failure",
        )
