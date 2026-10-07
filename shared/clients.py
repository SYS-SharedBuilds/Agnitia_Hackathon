"""Clients for downstream mock systems."""

from typing import Any

import httpx

from shared.config import get_settings
from shared.errors import (
    BusinessError,
    PermanentSystemError,
    TransientError,
)


class SystemClient:
    """Base HTTP client with timeout and standard SwitchOn error taxonomy mapping."""

    def __init__(self, base_url: str, timeout: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout)

    async def close(self) -> None:
        await self.client.aclose()

    async def execute(
        self,
        method: str,
        path: str,
        idempotency_key: str | None = None,
        json_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        headers: dict[str, str] = {}
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        try:
            response = await self.client.request(
                method=method,
                url=path,
                headers=headers,
                json=json_data,
            )
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
            raise TransientError(
                f"Network failure connecting to {self.base_url}{path}: {str(e)}"
            ) from e
        except Exception as e:
            raise PermanentSystemError(f"Unexpected client exception: {str(e)}") from e

        # Error mapping
        if response.is_success:
            if response.status_code == 204 or not response.content:
                return {}
            return response.json()  # type: ignore[no-any-return]

        status = response.status_code
        try:
            body = response.json()
        except Exception:
            body = {"raw": response.text}

        if status in (502, 503, 504):
            raise TransientError(f"Downstream {self.base_url} returned {status}: {body}")

        if status == 422 or status == 409 or (status == 400 and "code" in body):
            code = body.get("code", "BUSINESS_RULE_VIOLATION")
            raise BusinessError(code=code, message=body.get("detail", str(body)), detail=body)

        if status == 404:
            # 404 on compensation / queries can have specific semantics
            return {"status": "not_found", "detail": body}

        raise PermanentSystemError(
            f"Downstream {self.base_url} returned permanent status {status}: {body}"
        )


class OmsClient(SystemClient):
    def __init__(self, base_url: str | None = None):
        super().__init__(base_url or get_settings().MOCK_OMS_URL)

    async def validate(
        self, order_id: str, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        return await self.execute("POST", "/orders/validate", idempotency_key, payload)

    async def complete(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute(
            "POST", f"/orders/{order_id}/complete", idempotency_key, {"order_id": order_id}
        )

    async def reopen(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute(
            "POST", f"/orders/{order_id}/reopen", idempotency_key, {"order_id": order_id}
        )


class InventoryClient(SystemClient):
    def __init__(self, base_url: str | None = None):
        super().__init__(base_url or get_settings().MOCK_INVENTORY_URL)

    async def reserve(self, order_id: str, item_type: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute(
            "POST", "/reservations", idempotency_key, {"order_id": order_id, "item_type": item_type}
        )

    async def release(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute("DELETE", f"/reservations/{order_id}", idempotency_key)


class NetworkClient(SystemClient):
    def __init__(self, base_url: str | None = None):
        super().__init__(base_url or get_settings().MOCK_NETWORK_URL)

    async def provision(
        self, order_id: str, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        return await self.execute(
            "POST", "/services", idempotency_key, {"order_id": order_id, **payload}
        )

    async def deprovision(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute("DELETE", f"/services/{order_id}", idempotency_key)

    async def verify(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute("POST", f"/services/{order_id}/verify", idempotency_key)


class BillingClient(SystemClient):
    def __init__(self, base_url: str | None = None):
        super().__init__(base_url or get_settings().MOCK_BILLING_URL)

    async def create_account(
        self, order_id: str, customer_id: str, idempotency_key: str
    ) -> dict[str, Any]:
        return await self.execute(
            "POST", "/accounts", idempotency_key, {"order_id": order_id, "customer_id": customer_id}
        )

    async def void_account(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute("DELETE", f"/accounts/{order_id}", idempotency_key)

    async def start_charging(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute("POST", f"/accounts/{order_id}/charging", idempotency_key)

    async def reverse_charges(self, order_id: str, idempotency_key: str) -> dict[str, Any]:
        return await self.execute("POST", f"/accounts/{order_id}/charging/reverse", idempotency_key)


class NotificationClient(SystemClient):
    def __init__(self, base_url: str | None = None):
        super().__init__(base_url or get_settings().MOCK_NOTIFICATION_URL)

    async def send_activation(
        self, order_id: str, payload: dict[str, Any], idempotency_key: str
    ) -> dict[str, Any]:
        return await self.execute(
            "POST", "/messages", idempotency_key, {"order_id": order_id, **payload}
        )
