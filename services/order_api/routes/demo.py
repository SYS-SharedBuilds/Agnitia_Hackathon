from typing import Any

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/demo", tags=["Demo"])

VALID_SCENARIOS = {f"S{i}" for i in range(1, 13)}


@router.post("/scenarios/{name}")
async def trigger_scenario(name: str) -> dict[str, Any]:
    sc = name.strip().upper()
    if sc not in VALID_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{name}'. Supported scenarios: S1..S12",
        )
    try:
        from scripts.scenarios import runner

        res = await runner.run_scenario(sc)
        return res
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Scenario {sc} execution failed: {exc}"
        ) from exc


@router.post("/ab-proof")
async def trigger_ab_proof(
    orders: int = Query(default=20, ge=1, le=100),
    seed: int = Query(default=42, ge=0),
) -> dict[str, Any]:
    try:
        from scripts.ab_proof import run_ab_proof

        res = await run_ab_proof(orders_count=orders, seed=seed)
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"A/B Proof execution failed: {exc}") from exc


@router.post("/load")
async def trigger_load(
    count: int = Query(default=20, ge=1, le=100),
    failure_rate: float = Query(default=0.2, ge=0.0, le=1.0),
) -> dict[str, Any]:
    try:
        from scripts.load_generator import run_load_test

        res = await run_load_test(count=count, failure_rate=failure_rate)
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Load test failed: {exc}") from exc


@router.get("/invariants")
async def check_invariants() -> dict[str, Any]:
    try:
        from scripts.invariants import check_all_invariants

        res = await check_all_invariants()
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Invariant check failed: {exc}") from exc


@router.post("/reset")
async def trigger_reset() -> dict[str, Any]:
    try:
        from scripts.reset_data import reset_all

        await reset_all()
        return {"status": "SUCCESS", "message": "All mock databases and ops read models reset."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Reset failed: {exc}") from exc

