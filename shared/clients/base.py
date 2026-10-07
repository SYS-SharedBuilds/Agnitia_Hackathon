from typing import Any

import httpx

from shared.errors import (
    BusinessError,
    PermanentSystemError,
    TransientError,
)
from shared.logging import get_logger

logger = get_logger("system_client")


class BaseSystemClient:
    def __init__(self, base_url: str, system_name: str, timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.system_name = system_name
        self.timeout = timeout
        # Explicit connect/read timeout, no internal retries (Temporal owns retries)
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(self.timeout, connect=5.0),
        )

    async def close(self) -> None:
        await self.client.aclose()

    def _map_status_to_error(
        self,
        status_code: int,
        response_body: dict[str, Any] | str,
        action: str,
    ) -> Exception:
        msg = f"System '{self.system_name}' action '{action}' failed with status {status_code}: {response_body}"
        detail = response_body if isinstance(response_body, dict) else {"raw": str(response_body)}

        if status_code in (400, 422, 409):
            return BusinessError(msg, detail=detail)
        elif status_code in (502, 503, 504):
            return TransientError(msg, detail=detail)
        elif status_code >= 500:
            return PermanentSystemError(msg, detail=detail)
        else:
            return PermanentSystemError(msg, detail=detail)

    async def _post(
        self,
        path: str,
        payload: dict[str, Any],
        idempotency_key: str,
        action: str,
    ) -> dict[str, Any]:
        headers = {
            "Idempotency-Key": idempotency_key,
            "Content-Type": "application/json",
        }
        try:
            resp = await self.client.post(path, json=payload, headers=headers)
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
            raise TransientError(
                f"Network/timeout error calling '{self.system_name}' on '{action}': {exc}"
            ) from exc

        if resp.is_success:
            return resp.json() if resp.content else {}

        # Error mapping
        try:
            body = resp.json()
        except Exception:
            body = resp.text

        raise self._map_status_to_error(resp.status_code, body, action)

    async def _delete(
        self,
        path: str,
        idempotency_key: str,
        action: str,
    ) -> dict[str, Any]:
        headers = {
            "Idempotency-Key": idempotency_key,
            "Content-Type": "application/json",
        }
        try:
            resp = await self.client.delete(path, headers=headers)
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
            raise TransientError(
                f"Network/timeout error calling '{self.system_name}' on '{action}': {exc}"
            ) from exc

        # For compensations / delete: 200, 204, or 404 (already deleted/undone) are considered success
        if resp.is_success or resp.status_code == 404:
            return resp.json() if resp.content and resp.status_code != 404 else {"status": "ok"}

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        raise self._map_status_to_error(resp.status_code, body, action)
