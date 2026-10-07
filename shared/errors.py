from typing import Any


class SwitchOnError(Exception):
    """Base error for all SwitchOn application exceptions."""

    def __init__(self, message: str, detail: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail or {}


class TransientError(SwitchOnError):
    """502/503/504, network timeouts, connection resets; retryable with backoff."""

    pass


class BusinessError(SwitchOnError):
    """Out of stock, invalid address, credit rejected; non-retryable, fails fast to saga rollback."""

    pass


class PermanentSystemError(SwitchOnError):
    """500 Internal error, config rejected permanently; non-retryable after retries exhausted."""

    pass


class CompensationError(SwitchOnError):
    """Failure during undo/compensation activity. Escalates to NEEDS_ATTENTION if exhausted."""

    pass
