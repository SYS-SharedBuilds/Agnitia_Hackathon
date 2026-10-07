import logging
import sys
from typing import Any

import structlog


def configure_logging(level: int = logging.INFO) -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


def mask_sensitive(val: str | None) -> str | None:
    if not val:
        return val
    if len(val) <= 4:
        return "****"
    return val[:2] + "X" * (len(val) - 4) + val[-2:]


def get_logger(name: str = "switchon", **initial_context: Any) -> Any:
    return structlog.get_logger(name).bind(**initial_context)
