import asyncio
import random
from typing import Any

from pydantic import BaseModel, Field


class LatencyConfig(BaseModel):
    min_ms: int = 10
    max_ms: int = 50


class ChaosConfig(BaseModel):
    mode: str = "none"  # none, fail_n, always_fail, random, timeout, business_error
    n: int = 0
    status: int = 503
    business_code: str = "OUT_OF_STOCK"
    business_message: str = "Requested resource is not available"
    random_prob: float = 0.0
    match_action: str | None = None
    match_order_id: str | None = None
    fail_on_compensation: bool = False
    latency: LatencyConfig = Field(default_factory=LatencyConfig)


class ChaosEngine:
    def __init__(self) -> None:
        self.config = ChaosConfig()
        self._action_fail_counts: dict[str, int] = {}
        self._lock = asyncio.Lock()

    def set_config(self, config: ChaosConfig) -> None:
        self.config = config
        self._action_fail_counts.clear()

    def get_config(self) -> ChaosConfig:
        return self.config

    def reset(self) -> None:
        self.config = ChaosConfig()
        self._action_fail_counts.clear()

    async def apply(
        self,
        action: str,
        order_id: str | None = None,
        is_compensation: bool = False,
        chaos_key: str | None = None,
    ) -> tuple[int | None, dict[str, Any] | None]:
        """Applies configured latency and chaos simulation.
        Returns (status_code, error_body) if failure is triggered, else (None, None).
        RULES §5.5: Seeded faults are a pure function of (chaos_key, action).
        """
        # Deterministic seeded fault support (RULES §5.5 & X1)
        if chaos_key and not is_compensation:
            import hashlib

            if f"fail_{action}" in chaos_key or "always_fail" in chaos_key:
                return 500, {
                    "error": f"Chaos: deterministic seeded fault for action '{action}'",
                    "chaos_key": chaos_key,
                }
            if "seed" in chaos_key and action in ("start_charging", "provision"):
                h = int(hashlib.sha256(f"{chaos_key}:{action}".encode()).hexdigest(), 16)
                if (h % 100) < 35:
                    return 500, {
                        "error": f"Chaos: deterministic seeded fault for action '{action}'",
                        "chaos_key": chaos_key,
                    }

        # Latency simulation
        min_ms = self.config.latency.min_ms
        max_ms = max(min_ms, self.config.latency.max_ms)
        delay_ms = random.randint(min_ms, max_ms)
        if delay_ms > 0:
            await asyncio.sleep(delay_ms / 1000.0)

        # Compensation bypass check
        if is_compensation and not self.config.fail_on_compensation:
            return None, None

        if self.config.mode == "none":
            return None, None

        # Filter matches
        if self.config.match_action and self.config.match_action != action:
            return None, None
        if self.config.match_order_id and self.config.match_order_id != order_id:
            return None, None

        async with self._lock:
            key = f"{order_id or 'global'}:{action}"
            current_fails = self._action_fail_counts.get(key, 0)

            if self.config.mode == "fail_n":
                if current_fails < self.config.n:
                    self._action_fail_counts[key] = current_fails + 1
                    return self.config.status, {
                        "error": "Chaos: simulated transient failure",
                        "attempt_failed": current_fails + 1,
                        "max_fails": self.config.n,
                        "action": action,
                    }
                return None, None

            elif self.config.mode == "always_fail":
                return self.config.status, {
                    "error": "Chaos: simulated permanent failure",
                    "action": action,
                }

            elif self.config.mode == "random":
                if random.random() < self.config.random_prob:
                    return self.config.status, {
                        "error": "Chaos: simulated random failure",
                        "action": action,
                    }
                return None, None

            elif self.config.mode == "timeout":
                await asyncio.sleep(2.0)
                return 504, {"error": "Chaos: simulated gateway timeout"}

            elif self.config.mode == "business_error":
                return 422, {
                    "code": self.config.business_code,
                    "message": self.config.business_message,
                    "action": action,
                }

        return None, None
