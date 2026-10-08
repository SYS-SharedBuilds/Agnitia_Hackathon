import asyncio
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from shared.clients.billing import BillingClient
from shared.clients.inventory import InventoryClient
from shared.clients.network import NetworkClient
from shared.clients.notification import NotificationClient
from shared.clients.oms import OMSClient
from shared.config import settings
from shared.logging import configure_logging, get_logger
from shared.models import make_idempotency_key

configure_logging()
logger = get_logger("baseline_engine")


class BaselineEngine:
    """Scripted sequential hand-off baseline engine for fair A/B comparison (X1).
    RULES §6.1 & D13:
    - Sequential execution of tasks
    - Equal retry budget (up to 3 attempts with exponential backoff)
    - Face identical seeded faults via X-Chaos-Key
    - DOES NOT COMPENSATE ON FAILURE: simply stops and logs, leaving behind leaks
    """

    def __init__(self) -> None:
        self.oms = OMSClient(settings.OMS_MOCK_URL)
        self.inventory = InventoryClient(settings.INVENTORY_MOCK_URL)
        self.network = NetworkClient(settings.NETWORK_MOCK_URL)
        self.billing = BillingClient(settings.BILLING_MOCK_URL)
        self.notification = NotificationClient(settings.NOTIFICATION_MOCK_URL)

        self.engine = create_async_engine(settings.DATABASE_URL, echo=False)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def run_order(
        self,
        order_id: str,
        customer_id: str,
        product: str,
        chaos_key: str | None = None,
    ) -> dict[str, Any]:
        logger.info("baseline_order_started", order_id=order_id, chaos_key=chaos_key)

        steps: list[tuple[str, str, str, dict[str, Any]]] = [
            ("validate_order", "oms", "validate", {"customer_id": customer_id, "product": product}),
            ("reserve_inventory", "inventory", "reserve", {"item_type": "ONT-V2"}),
            ("provision_network", "network", "provision", {"speed_mbps": 500}),
            ("create_billing_account", "billing", "create_account", {"customer_id": customer_id}),
            ("verify_service", "network", "verify", {}),
            ("start_billing", "billing", "start_charging", {"amount": 49.99}),
            ("complete_order", "oms", "complete", {}),
            ("notify_customer", "notification", "send_activation", {"customer_id": customer_id}),
        ]

        failed_step = None
        failure_reason = None

        for task_id, system, action, payload in steps:
            idempotency_key = make_idempotency_key(order_id, task_id, action)
            step_success = False

            # Same retry budget as SwitchOn: 3 attempts
            for attempt in range(1, 4):
                try:
                    if system == "oms":
                        if action == "validate":
                            await self.oms.validate(
                                order_id, payload, idempotency_key, chaos_key=chaos_key
                            )
                        else:
                            await self.oms.complete(
                                order_id, idempotency_key, chaos_key=chaos_key
                            )
                    elif system == "inventory":
                        await self.inventory.reserve(
                            order_id, payload, idempotency_key, chaos_key=chaos_key
                        )
                    elif system == "network":
                        if action == "provision":
                            await self.network.provision(
                                order_id, payload, idempotency_key, chaos_key=chaos_key
                            )
                        else:
                            await self.network.verify(
                                order_id, idempotency_key, chaos_key=chaos_key
                            )
                    elif system == "billing":
                        if action == "create_account":
                            await self.billing.create_account(
                                order_id, payload, idempotency_key, chaos_key=chaos_key
                            )
                        else:
                            await self.billing.start_charging(
                                order_id, payload, idempotency_key, chaos_key=chaos_key
                            )
                    elif system == "notification":
                        await self.notification.send_activation(
                            order_id, payload, idempotency_key, chaos_key=chaos_key
                        )

                    step_success = True
                    break
                except Exception as exc:
                    logger.warn(
                        "baseline_attempt_failed",
                        order_id=order_id,
                        task_id=task_id,
                        attempt=attempt,
                        error=str(exc),
                    )
                    if attempt < 3:
                        await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
                    else:
                        failed_step = task_id
                        failure_reason = str(exc)

            if not step_success:
                # Scripted baseline does NOT have a saga orchestrator or compensations!
                break

        state = "ACTIVE" if not failed_step else "FAILED"
        async with self.session_factory() as session:
            async with session.begin():
                stmt = text(
                    """
                    UPDATE ops.orders
                    SET state = :state,
                        completed_at = NOW(),
                        failure_reason = :reason
                    WHERE order_id = :order_id
                    """
                )
                await session.execute(
                    stmt,
                    {
                        "state": state,
                        "reason": failure_reason,
                        "order_id": order_id,
                    },
                )

        return {
            "order_id": order_id,
            "engine": "baseline",
            "state": state,
            "failed_step": failed_step,
            "failure_reason": failure_reason,
        }


if __name__ == "__main__":
    baseline = BaselineEngine()
    print("Baseline engine initialized.")
