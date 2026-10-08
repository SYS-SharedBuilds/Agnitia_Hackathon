import pytest

from scripts.scenarios.runner import run_scenario


@pytest.mark.asyncio
async def test_integration_s1_happy_path() -> None:
    res = await run_scenario("S1")
    assert res["status"] == "PASS", f"S1 failed: {res}"
    assert res["observed"] == "ACTIVE"


@pytest.mark.asyncio
async def test_integration_s4_rollback() -> None:
    res = await run_scenario("S4")
    assert res["status"] == "PASS", f"S4 failed: {res}"
    assert res["observed"] == "ROLLED_BACK"


@pytest.mark.asyncio
async def test_integration_s11_tombstone() -> None:
    res = await run_scenario("S11")
    assert res["status"] == "PASS", f"S11 failed: {res}"
    assert "409" in res["observed"]
