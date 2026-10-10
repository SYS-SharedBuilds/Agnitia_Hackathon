import pytest

from scripts.invariants import check_all_invariants


@pytest.mark.asyncio
async def test_invariants_pass_on_consistent_orders() -> None:
    # Test checking consistent active and rolled back orders
    sample_consistent = [
        {"order_id": "ord_83340a2ff6", "state": "ACTIVE", "product": "FIBER_500"},
        {"order_id": "ord_ef9762f665", "state": "ROLLED_BACK", "product": "FIBER_500"},
    ]
    res = await check_all_invariants(custom_orders=sample_consistent)
    assert res["status"] == "PASS"


@pytest.mark.asyncio
async def test_invariants_negative_test_corrupted_data_fails() -> None:
    """RULES §6.4 & PRIORITY 3: Negative test where corrupted state causes invariant check to FAIL."""
    # Simulate an order that is ACTIVE but has no network/billing resources
    fake_corrupted_orders = [
        {
            "order_id": "ord_fake_corrupted_999",
            "state": "ACTIVE",
            "product": "FIBER_500",
            "failure_reason": None,
        }
    ]
    res = await check_all_invariants(custom_orders=fake_corrupted_orders)
    assert res["status"] == "FAIL"
    assert res["checked_orders_count"] == 1
    assert res["results"][0]["pass"] is False
    assert "INV-1" in res["results"][0]["rule"]
