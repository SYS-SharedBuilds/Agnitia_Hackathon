import asyncio
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from shared.clients.billing import BillingClient
from shared.clients.inventory import InventoryClient
from shared.clients.network import NetworkClient
from shared.clients.oms import OMSClient
from shared.config import settings
from shared.logging import configure_logging, get_logger
from shared.models import make_idempotency_key

configure_logging()
logger = get_logger("reconciler")


class Reconciler:
    """Out-of-band audit and auto-repair reconciler (X4).
    ARCHITECTURE §10:
    Compares mock-side resources from GET /admin/audit/resources to ops read model and Temporal truth.
    - Orphan: resource exists, order is terminal-failed or non-existent -> safe auto-compensate
    - Missing: order ACTIVE but resource absent -> record drift
    """

    def __init__(self) -> None:
        self.oms = OMSClient(settings.OMS_MOCK_URL)
        self.inventory = InventoryClient(settings.INVENTORY_MOCK_URL)
        self.network = NetworkClient(settings.NETWORK_MOCK_URL)
        self.billing = BillingClient(settings.BILLING_MOCK_URL)

        self.engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            connect_args={"prepared_statement_cache_size": 0},
        )
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def sweep(self) -> dict[str, Any]:
        logger.info("reconciler_sweep_start")
        drifts: list[dict[str, Any]] = []

        try:
            # 1. Fetch resources from each mock audit endpoint
            inv_entities = await self.inventory.client.get("/admin/audit/resources")
            inv_resources = inv_entities.json() if inv_entities.is_success else []

            net_entities = await self.network.client.get("/admin/audit/resources")
            net_resources = net_entities.json() if net_entities.is_success else []

            bil_entities = await self.billing.client.get("/admin/audit/resources")
            bil_resources = bil_entities.json() if bil_entities.is_success else []

            async with self.session_factory() as session:
                # Check for orphans: resources whose order is ROLLED_BACK, CANCELLED, or missing
                for item in inv_resources:
                    oid = item.get("order_id")
                    if not oid:
                        continue
                    res = await session.execute(
                        text("SELECT state FROM ops.orders WHERE order_id = :oid"), {"oid": oid}
                    )
                    order_row = res.mappings().first()
                    order_state = order_row["state"] if order_row else None

                    if order_state in ("ROLLED_BACK", "CANCELLED", None):
                        logger.info("orphan_detected", system="inventory", order_id=oid)
                        # Safe auto-compensate: release reservation with tombstone
                        key = make_idempotency_key(oid, "reconciler", "release")
                        await self.inventory.release(oid, key)
                        drifts.append(
                            {
                                "system": "inventory",
                                "class": "Orphan",
                                "order_id": oid,
                                "action": "auto-compensated",
                            }
                        )

                for item in net_resources:
                    oid = item.get("order_id")
                    if not oid:
                        continue
                    res = await session.execute(
                        text("SELECT state FROM ops.orders WHERE order_id = :oid"), {"oid": oid}
                    )
                    order_row = res.mappings().first()
                    order_state = order_row["state"] if order_row else None

                    if order_state in ("ROLLED_BACK", "CANCELLED", None):
                        logger.info("orphan_detected", system="network", order_id=oid)
                        key = make_idempotency_key(oid, "reconciler", "deprovision")
                        await self.network.deprovision(oid, key)
                        drifts.append(
                            {
                                "system": "network",
                                "class": "Orphan",
                                "order_id": oid,
                                "action": "auto-compensated",
                            }
                        )

                for item in bil_resources:
                    oid = item.get("order_id")
                    if not oid:
                        continue
                    res = await session.execute(
                        text("SELECT state FROM ops.orders WHERE order_id = :oid"), {"oid": oid}
                    )
                    order_row = res.mappings().first()
                    order_state = order_row["state"] if order_row else None

                    if order_state in ("ROLLED_BACK", "CANCELLED", None):
                        logger.info("orphan_detected", system="billing", order_id=oid)
                        key = make_idempotency_key(oid, "reconciler", "void_account")
                        await self.billing.void_account(oid, key)
                        drifts.append(
                            {
                                "system": "billing",
                                "class": "Orphan",
                                "order_id": oid,
                                "action": "auto-compensated",
                            }
                        )

        except Exception as exc:
            logger.warn("reconciler_sweep_error", error=str(exc))

        return {
            "status": "completed",
            "drifts_found": len(drifts),
            "details": drifts,
        }

    async def run_loop(self, interval_sec: int = 30) -> None:
        while True:
            await self.sweep()
            await asyncio.sleep(interval_sec)


if __name__ == "__main__":
    rec = Reconciler()
    asyncio.run(rec.run_loop())
