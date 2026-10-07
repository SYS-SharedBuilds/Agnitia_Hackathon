from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/scenarios/{name}")
async def trigger_scenario(name: str) -> dict[str, Any]:
    try:
        from scripts.scenarios import runner

        res = await runner.run_scenario(name)
        return res
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Scenario {name} execution failed: {exc}"
        ) from exc


@router.post("/load")
async def trigger_load(count: int = 20, failure_rate: float = 0.2) -> dict[str, Any]:
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
