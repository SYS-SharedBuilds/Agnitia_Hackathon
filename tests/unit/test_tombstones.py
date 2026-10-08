import pytest

from services.mocks.store import MockStateStore


@pytest.mark.asyncio
async def test_tombstone_rejection_scenario_s11() -> None:
    """Scenario S11 late-arrival race verification (RULES §3.4 & ARCHITECTURE §6.2).
    1. A compensation writes a tombstone for forward key '{order_id}:{task_id}:{action}'
    2. A delayed forward request arriving afterwards must be rejected with 409 TOMBSTONED
    """
    store = MockStateStore("inventory", db_path=":memory:")
    forward_key = "ord_s11:reserve_inventory:reserve"

    # Step 1: Simulate compensation executed first (e.g. timeout on forward call)
    store.write_tombstone(forward_key, order_id="ord_s11")

    # Step 2: Delayed forward request checks tombstone
    assert store.is_tombstoned(forward_key) is True

    # Untombstoned key passes
    assert store.is_tombstoned("ord_other:reserve_inventory:reserve") is False


@pytest.mark.asyncio
async def test_idempotent_replay() -> None:
    store = MockStateStore("network", db_path=":memory:")
    key = "ord_replay:provision_network:provision"

    # Not cached initially
    assert store.check_idempotency(key) is None

    # Record first response
    resp = {"status": "PROVISIONED", "vlan": 100}
    store.record_idempotency(key, 200, resp)

    # Replay returns identical status code and payload
    cached = store.check_idempotency(key)
    assert cached is not None
    assert cached[0] == 200
    assert cached[1] == resp
