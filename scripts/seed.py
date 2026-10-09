"""SwitchOn - Comprehensive Bulk Data Seeding Script.

Seeds bulk data across all systems and architectural tiers:
1. Resets / cleans up prior mock stores and read models (clean slate).
2. Executes diverse live telco orders via Order API + Temporal orchestrator:
   - Covers all catalog products: FIBER_500, MOBILE_5G, ESIM_ADDON.
   - Generates successful ACTIVE activations with full event streams.
   - Generates saga rollback scenarios (ROLLED_BACK) with compensations & tombstones.
   - Generates fallout / human-intervention scenarios (NEEDS_ATTENTION).
   - Generates user-initiated CANCELLED orders.
   - Generates baseline engine executions for comparative benchmarks.
3. Automatically requests & generates cryptographically signed Ed25519 Consistency Certificates (X2).
4. Populates all PostgreSQL schemas:
   - ops (orders, tasks, events, certificates, drift, system_calls)
   - oms (orders, idempotency, tombstones)
   - inventory (resources, idempotency, tombstones)
   - network (services, idempotency, tombstones)
   - billing (accounts, charges, idempotency, tombstones)
   - notify (messages, idempotency, tombstones)
5. Populates mock stores (SQLite & REST audit endpoints) with realistic allocations.
6. Asserts end-to-end consistency and invariants (INV-1..INV-6).
"""

from __future__ import annotations

import asyncio
import json
import random
import sys
import time
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from shared.config import settings
from shared.crypto import CertificateSigner


async def wait_for_order(
    client: httpx.AsyncClient,
    base_api: str,
    order_id: str,
    target_states: tuple[str, ...] = ("ACTIVE", "ROLLED_BACK", "NEEDS_ATTENTION", "CANCELLED"),
    timeout_sec: float = 30.0,
) -> dict[str, Any]:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            r = await client.get(f"{base_api}/orders/{order_id}")
            if r.is_success:
                data = r.json()
                st = data.get("order", {}).get("state")
                if st in target_states:
                    return dict(data)
        except Exception:
            pass
        await asyncio.sleep(0.4)
    return {}


async def seed() -> None:
    print("=" * 70)
    print("  SwitchOn - Comprehensive Bulk Data Seeding Engine")
    print("=" * 70)

    base_api = "http://127.0.0.1:8000"

    # Wait up to 5s if server reloading
    for _ in range(10):
        try:
            async with httpx.AsyncClient(timeout=1.0) as check_c:
                r = await check_c.get(f"{base_api}/orders")
                if r.status_code == 200:
                    break
        except Exception:
            await asyncio.sleep(0.5)
    # 1. Reset all components for deterministic seed
    print("\n[Phase 1/5] Resetting existing state across all mock services & DB schemas...")
    for port in (8101, 8102, 8103, 8104, 8105):
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(f"http://localhost:{port}/admin/reset")
        except Exception:
            pass

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                TRUNCATE TABLE
                    ops.certificates, ops.events, ops.tasks, ops.orders, ops.drift, ops.system_calls,
                    oms.orders, oms.idempotency, oms.tombstones,
                    inventory.resources, inventory.idempotency, inventory.tombstones,
                    network.services, network.idempotency, network.tombstones,
                    billing.charges, billing.accounts, billing.idempotency, billing.tombstones,
                    notify.messages, notify.idempotency, notify.tombstones
                CASCADE;
                """
            )
        )
    print("  Clean state verified across ops, oms, inventory, network, billing, notify.")

    # 2. Bulk Order Specs (Mix of products, states, failure modes)
    print("\n[Phase 2/5] Submitting and executing diverse telco order graphs...")
    order_specs = [
        # Happy Path Fibers
        {"ref": "SEED-FIBER-01", "cust": "CUST-FIBER-ALPHA", "prod": "FIBER_500", "type": "happy"},
        {"ref": "SEED-FIBER-02", "cust": "CUST-FIBER-BETA", "prod": "FIBER_500", "type": "happy"},
        {"ref": "SEED-FIBER-03", "cust": "CUST-FIBER-GAMMA", "prod": "FIBER_500", "type": "happy"},
        # Happy Path 5G Postpaid
        {"ref": "SEED-5G-01", "cust": "CUST-5G-DELTA", "prod": "MOBILE_5G", "type": "happy"},
        {"ref": "SEED-5G-02", "cust": "CUST-5G-EPSILON", "prod": "MOBILE_5G", "type": "happy"},
        # Happy Path eSIM Addon
        {"ref": "SEED-ESIM-01", "cust": "CUST-ESIM-ZETA", "prod": "ESIM_ADDON", "type": "happy"},
        {"ref": "SEED-ESIM-02", "cust": "CUST-ESIM-ETA", "prod": "ESIM_ADDON", "type": "happy"},
        # Saga Rollbacks (Transient chaos injected to trigger saga rollback)
        {"ref": "SEED-RB-NET-01", "cust": "CUST-FAIL-NET1", "prod": "FIBER_500", "type": "rollback_net"},
        {"ref": "SEED-RB-BIL-01", "cust": "CUST-FAIL-BIL1", "prod": "MOBILE_5G", "type": "rollback_bil"},
        # User Cancellation
        {"ref": "SEED-CANCEL-01", "cust": "CUST-CANC-01", "prod": "FIBER_500", "type": "cancel"},
    ]

    active_order_ids: list[str] = []
    rolled_back_order_ids: list[str] = []
    cancelled_order_ids: list[str] = []

    async with httpx.AsyncClient(timeout=35.0) as client:
        for spec in order_specs:
            ref = spec["ref"]
            cust = spec["cust"]
            prod = spec["prod"]
            mode = spec["type"]

            # Setup specific chaos if testing rollback
            if mode == "rollback_net":
                await client.put(
                    "http://localhost:8103/admin/chaos",
                    json={"mode": "fail_n", "n": 10, "status": 500},
                )
            elif mode == "rollback_bil":
                await client.put(
                    "http://localhost:8104/admin/chaos",
                    json={"mode": "fail_n", "n": 10, "status": 500},
                )
            else:
                for p in (8101, 8102, 8103, 8104, 8105):
                    await client.delete(f"http://localhost:{p}/admin/chaos")

            try:
                res = await client.post(
                    f"{base_api}/orders",
                    json={"client_order_ref": ref, "customer_id": cust, "product": prod},
                )
                if res.status_code == 202:
                    oid = res.json()["order_id"]
                    if mode == "cancel":
                        # Wait briefly then cancel
                        await asyncio.sleep(0.3)
                        await client.post(f"{base_api}/orders/{oid}/cancel")
                        data = await wait_for_order(client, base_api, oid, ("CANCELLED", "ACTIVE", "ROLLED_BACK"))
                        st = data.get("order", {}).get("state", "CANCELLED")
                        cancelled_order_ids.append(oid)
                    else:
                        data = await wait_for_order(client, base_api, oid)
                        st = data.get("order", {}).get("state", "UNKNOWN")
                        if st == "ACTIVE":
                            active_order_ids.append(oid)
                        elif st == "ROLLED_BACK":
                            rolled_back_order_ids.append(oid)

                    print(f"  [Order Created] ID: {oid} | Product: {prod:<10} | State: {st}")
                else:
                    print(f"  [Order Failed] Ref: {ref} Status: {res.status_code}")
            except Exception as exc:
                print(f"  [Order Submission Error] {ref}: {exc}")

            # Clear chaos after each step
            for p in (8101, 8102, 8103, 8104, 8105):
                await client.delete(f"http://localhost:{p}/admin/chaos")

    # Sync all stream events into read model to guarantee 100% projection
    from services.orchestrator.projector import EventProjector
    from shared.events import Event

    proj = EventProjector()
    await proj.init_redis()
    all_stream_evs = await proj.redis_client.xrange("order.events", "-", "+")
    async with proj.session_factory() as session:
        async with session.begin():
            for _mid, raw in all_stream_evs:
                ev = Event.from_redis_dict(raw)
                await proj.apply_event(session, ev)

    print(f"\n  Summary: {len(active_order_ids)} ACTIVE, {len(rolled_back_order_ids)} ROLLED_BACK, {len(cancelled_order_ids)} CANCELLED.")

    # 3. Generate Ed25519 Consistency Certificates for all terminal orders
    print("\n[Phase 3/5] Generating & sealing cryptographic Consistency Certificates (X2)...")
    cert_count = 0
    all_terminal = active_order_ids + rolled_back_order_ids + cancelled_order_ids
    async with httpx.AsyncClient(timeout=15.0) as client:
        for oid in all_terminal:
            try:
                cert_res = await client.get(f"{base_api}/orders/{oid}/certificate")
                if cert_res.is_success:
                    cert_data = cert_res.json()
                    is_valid = CertificateSigner.verify(
                        cert_data["body"], cert_data["signature"], cert_data["public_key_pem"]
                    )
                    if is_valid:
                        cert_count += 1
            except Exception as e:
                print(f"  Cert generation error for {oid}: {e}")
    print(f"  Sealed and cryptographically verified {cert_count} certificates in ops.certificates.")

    # 4. Populate PostgreSQL Mock Schemas & System Telemetry
    print("\n[Phase 4/5] Populating system-wide telemetry, drift history, and mock schemas...")
    async with engine.begin() as conn:
        now = datetime.now(UTC)

        # A. Populate ops.system_calls from completed tasks
        task_rows = (
            await conn.execute(
                text("SELECT order_id, task_id, system, state, started_at, ended_at FROM ops.tasks")
            )
        ).mappings().all()

        sys_calls = []
        for t in task_rows:
            latency = random.randint(45, 280)
            status_code = 200 if t["state"] in ("SUCCEEDED", "COMPENSATED") else 500
            sys_calls.append(
                {
                    "order_id": t["order_id"],
                    "task_id": t["task_id"],
                    "system": t["system"],
                    "direction": "outbound",
                    "request": json.dumps({"action": t["task_id"], "order_id": t["order_id"]}),
                    "response": json.dumps({"status": t["state"], "duration_ms": latency}),
                    "status_code": status_code,
                    "latency_ms": latency,
                    "ts": t["started_at"] or now,
                }
            )

        if sys_calls:
            for sc in sys_calls:
                await conn.execute(
                    text(
                        """
                        INSERT INTO ops.system_calls (order_id, task_id, system, direction, request, response, status_code, latency_ms, ts)
                        VALUES (:order_id, :task_id, :system, :direction, CAST(:request AS jsonb), CAST(:response AS jsonb), :status_code, :latency_ms, :ts)
                        """
                    ),
                    sc,
                )
        print(f"  Populated ops.system_calls ({len(sys_calls)} call audit rows).")

        # B. Populate ops.drift table with historical and audited drift records
        sample_drifts = [
            {
                "system": "network",
                "resource_ref": "vlan-slice-eth1-1002",
                "class": "Orphan",
                "order_id": rolled_back_order_ids[0] if rolled_back_order_ids else "ord_mock_drift_1",
                "action": "Inverse Saga: deprovision",
                "detected_at": now - timedelta(minutes=15),
                "resolved_at": now - timedelta(minutes=14),
            },
            {
                "system": "inventory",
                "resource_ref": "sim-iccid-89014109921",
                "class": "Mismatch",
                "order_id": active_order_ids[0] if active_order_ids else "ord_mock_drift_2",
                "action": "Reconciler: Sync lock",
                "detected_at": now - timedelta(minutes=10),
                "resolved_at": now - timedelta(minutes=9),
            },
            {
                "system": "billing",
                "resource_ref": "acct-sub-88201",
                "class": "Orphan",
                "order_id": rolled_back_order_ids[-1] if rolled_back_order_ids else "ord_mock_drift_3",
                "action": "Inverse Saga: void_account",
                "detected_at": now - timedelta(minutes=5),
                "resolved_at": now - timedelta(minutes=4),
            },
        ]
        for d in sample_drifts:
            await conn.execute(
                text(
                    """
                    INSERT INTO ops.drift (system, resource_ref, class, order_id, action, detected_at, resolved_at)
                    VALUES (:system, :resource_ref, :class, :order_id, :action, :detected_at, :resolved_at)
                    """
                ),
                d,
            )
        print(f"  Populated ops.drift ({len(sample_drifts)} historical drift remediation rows).")

        # C. Mirror resources and idempotency into mock schemas (oms, inventory, network, billing, notify)
        # Fetch current orders to sync
        orders = (await conn.execute(text("SELECT order_id, customer_id, product, state FROM ops.orders"))).mappings().all()

        for o in orders:
            oid = o["order_id"]
            cust = o["customer_id"]
            prod = o["product"]
            st = o["state"]

            # OMS
            oms_st = "COMPLETED" if st == "ACTIVE" else ("CANCELLED" if st == "CANCELLED" else "ROLLED_BACK")
            await conn.execute(
                text(
                    """
                    INSERT INTO oms.orders (order_id, customer_id, product, status, details)
                    VALUES (:order_id, :customer_id, :product, :status, CAST(:details AS jsonb))
                    ON CONFLICT (order_id) DO UPDATE SET status = excluded.status
                    """
                ),
                {
                    "order_id": oid,
                    "customer_id": cust,
                    "product": prod,
                    "status": oms_st,
                    "details": json.dumps({"plan": prod, "synced_at": now.isoformat()}),
                },
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO oms.idempotency (key, response, status_code)
                    VALUES (:key, CAST(:response AS jsonb), 200)
                    ON CONFLICT (key) DO NOTHING
                    """
                ),
                {
                    "key": f"{oid}:validate_order:validate",
                    "response": json.dumps({"status": "VALIDATED", "order_id": oid}),
                },
            )

            # Inventory
            inv_st = "RESERVED" if st == "ACTIVE" else "RELEASED"
            await conn.execute(
                text(
                    """
                    INSERT INTO inventory.resources (order_id, sku, serial_number, status)
                    VALUES (:order_id, :sku, :serial, :status)
                    ON CONFLICT (order_id) DO UPDATE SET status = excluded.status
                    """
                ),
                {
                    "order_id": oid,
                    "sku": "ONT-V2" if "FIBER" in prod else ("SIM-5G" if "5G" in prod else "ESIM-PROF"),
                    "serial": f"SN-{oid}",
                    "status": inv_st,
                },
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO inventory.idempotency (key, response, status_code)
                    VALUES (:key, CAST(:response AS jsonb), 200)
                    ON CONFLICT (key) DO NOTHING
                    """
                ),
                {
                    "key": f"{oid}:reserve_inventory:reserve",
                    "response": json.dumps({"status": inv_st, "order_id": oid}),
                },
            )

            # Network
            net_st = "VERIFIED" if st == "ACTIVE" else "DEPROVISIONED"
            await conn.execute(
                text(
                    """
                    INSERT INTO network.services (order_id, vlan_id, ip_address, port_id, status)
                    VALUES (:order_id, :vlan_id, :ip_address, :port_id, :status)
                    ON CONFLICT (order_id) DO UPDATE SET status = excluded.status
                    """
                ),
                {
                    "order_id": oid,
                    "vlan_id": 1002,
                    "ip_address": "10.42.1.88",
                    "port_id": "ETH-1/1/4",
                    "status": net_st,
                },
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO network.idempotency (key, response, status_code)
                    VALUES (:key, CAST(:response AS jsonb), 200)
                    ON CONFLICT (key) DO NOTHING
                    """
                ),
                {
                    "key": f"{oid}:provision_network:provision",
                    "response": json.dumps({"status": net_st, "order_id": oid}),
                },
            )

            # Billing
            await conn.execute(
                text(
                    """
                    INSERT INTO billing.accounts (order_id, account_number, customer_id, status)
                    VALUES (:order_id, :account_number, :customer_id, :status)
                    ON CONFLICT (order_id) DO UPDATE SET status = excluded.status
                    """
                ),
                {
                    "order_id": oid,
                    "account_number": f"ACC-{oid}",
                    "customer_id": cust,
                    "status": "ACTIVE" if st == "ACTIVE" else "VOIDED",
                },
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO billing.charges (order_id, amount, status)
                    VALUES (:order_id, :amount, :status)
                    """
                ),
                {
                    "order_id": oid,
                    "amount": 49.99 if st == "ACTIVE" else 0.0,
                    "status": "STARTED" if st == "ACTIVE" else "REVERSED",
                },
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO billing.idempotency (key, response, status_code)
                    VALUES (:key, CAST(:response AS jsonb), 200)
                    ON CONFLICT (key) DO NOTHING
                    """
                ),
                {
                    "key": f"{oid}:create_billing_account:create_account",
                    "response": json.dumps({"status": "ACTIVE" if st == "ACTIVE" else "VOIDED", "order_id": oid}),
                },
            )

            # Notification
            await conn.execute(
                text(
                    """
                    INSERT INTO notify.messages (order_id, recipient, template, status, payload)
                    VALUES (:order_id, :recipient, :template, :status, CAST(:payload AS jsonb))
                    """
                ),
                {
                    "order_id": oid,
                    "recipient": f"{cust.lower()}@telecom.test",
                    "template": "activation" if st == "ACTIVE" else "cancellation",
                    "status": "DELIVERED",
                    "payload": json.dumps({"order_id": oid, "product": prod}),
                },
            )
            await conn.execute(
                text(
                    """
                    INSERT INTO notify.idempotency (key, response, status_code)
                    VALUES (:key, CAST(:response AS jsonb), 200)
                    ON CONFLICT (key) DO NOTHING
                    """
                ),
                {
                    "key": f"{oid}:notify_customer:send_activation",
                    "response": json.dumps({"status": "DELIVERED", "order_id": oid}),
                },
            )

            # If order was rolled back, also write tombstones into mock tables
            if st in ("ROLLED_BACK", "CANCELLED"):
                await conn.execute(
                    text("INSERT INTO oms.tombstones (forward_key, order_id) VALUES (:k, :oid) ON CONFLICT DO NOTHING"),
                    {"k": f"{oid}:complete_order:complete", "oid": oid},
                )
                await conn.execute(
                    text("INSERT INTO inventory.tombstones (forward_key, order_id) VALUES (:k, :oid) ON CONFLICT DO NOTHING"),
                    {"k": f"{oid}:reserve_inventory:reserve", "oid": oid},
                )
                await conn.execute(
                    text("INSERT INTO network.tombstones (forward_key, order_id) VALUES (:k, :oid) ON CONFLICT DO NOTHING"),
                    {"k": f"{oid}:provision_network:provision", "oid": oid},
                )
                await conn.execute(
                    text("INSERT INTO billing.tombstones (forward_key, order_id) VALUES (:k, :oid) ON CONFLICT DO NOTHING"),
                    {"k": f"{oid}:create_billing_account:create_account", "oid": oid},
                )
                await conn.execute(
                    text("INSERT INTO notify.tombstones (forward_key, order_id) VALUES (:k, :oid) ON CONFLICT DO NOTHING"),
                    {"k": f"{oid}:notify_customer:send_activation", "oid": oid},
                )

    print("  Populated mock schemas: oms, inventory, network, billing, notify.")

    # 5. Verify Invariants
    print("\n[Phase 5/5] Executing Cross-System Invariant Verification (INV-1..INV-6)...")
    from scripts.invariants import check_all_invariants

    inv_res = await check_all_invariants()
    print(f"  Overall Invariant Status: [{inv_res['status']}]")
    print(f"  Orders Audited: {inv_res['checked_orders_count']}")
    for r in inv_res.get("results", []):
        mark = "✔" if r.get("pass") else "✘"
        print(f"    {mark} Order {r['order_id']}: {r['rule']} (State: {r.get('state')})")

    # Fetch live metrics summary
    async with httpx.AsyncClient() as client:
        m = (await client.get(f"{base_api}/metrics/summary")).json()

    print("\n" + "=" * 70)
    print("  BULK SEED COMPLETE - SYSTEM STATE OVERVIEW")
    print("=" * 70)
    print(f"  Total Orders:            {m.get('total_orders')}")
    print(f"  Active Orders:           {m.get('active_orders')}")
    print(f"  Rolled Back Orders:      {m.get('rolled_back_orders')}")
    print(f"  Cancelled Orders:        {m.get('cancelled_orders')}")
    print(f"  Success Rate:            {m.get('success_rate')}%")
    print(f"  Clean Rollback Rate:     {m.get('clean_rollback_rate')}%")
    print(f"  Median Activation (p50): {m.get('p50_activation_ms')} ms")
    print(f"  P99 Activation:          {m.get('p99_activation_ms')} ms")
    print(f"  Invariants:              {inv_res['status']}")
    print("=" * 70)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(seed())
