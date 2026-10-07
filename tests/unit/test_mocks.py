import pytest

from services.mocks.chaos import ChaosConfig, ChaosEngine


@pytest.mark.asyncio
async def test_chaos_engine_fail_n():
    engine = ChaosEngine()
    engine.set_config(ChaosConfig(mode="fail_n", n=2, status=503, match_action="provision"))

    # Attempt 1: Fail
    status, err = await engine.apply("provision", "ord_1")
    assert status == 503
    assert err is not None

    # Attempt 2: Fail
    status, err = await engine.apply("provision", "ord_1")
    assert status == 503

    # Attempt 3: Succeed
    status, err = await engine.apply("provision", "ord_1")
    assert status is None
    assert err is None


@pytest.mark.asyncio
async def test_chaos_engine_business_error():
    engine = ChaosEngine()
    engine.set_config(ChaosConfig(mode="business_error", business_code="OUT_OF_STOCK"))

    status, err = await engine.apply("reserve", "ord_2")
    assert status == 422
    assert err is not None
    assert err.get("code") == "OUT_OF_STOCK"
