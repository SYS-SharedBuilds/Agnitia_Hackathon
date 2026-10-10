import os
from typing import Any

from fastapi import FastAPI, Header, Request, Response
from fastapi.responses import JSONResponse

from services.mocks.chaos import ChaosConfig, ChaosEngine
from services.mocks.store import MockStateStore
from shared.logging import get_logger

SYSTEM_NAME = os.getenv("SYSTEM", "oms").lower()
logger = get_logger(f"mock-{SYSTEM_NAME}")

app = FastAPI(title=f"Mock System - {SYSTEM_NAME.upper()}", version="1.0.0")
chaos_engine = ChaosEngine()
store = MockStateStore(SYSTEM_NAME)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "system": SYSTEM_NAME}


@app.get("/metrics")
async def metrics() -> dict[str, Any]:
    return {"system": SYSTEM_NAME, "status": "healthy"}


# Admin Chaos & Audit Endpoints
@app.get("/admin/chaos")
async def get_chaos() -> ChaosConfig:
    return chaos_engine.get_config()


@app.put("/admin/chaos")
async def set_chaos(config: ChaosConfig) -> ChaosConfig:
    chaos_engine.set_config(config)
    return chaos_engine.get_config()


@app.delete("/admin/chaos")
async def reset_chaos() -> dict[str, str]:
    chaos_engine.reset()
    return {"status": "reset"}


@app.get("/admin/audit/resources")
async def audit_resources() -> list[dict[str, Any]]:
    """Returns allocated resources/entities for consistency and invariant auditing."""
    return store.list_entities()


@app.post("/admin/reset")
async def reset_store() -> dict[str, str]:
    store.clear()
    chaos_engine.reset()
    return {"status": "cleared"}


async def _parse_body(request: Request) -> tuple[dict[str, Any] | None, JSONResponse | None]:
    try:
        data = await request.json()
        if isinstance(data, dict):
            return data, None
        return None, JSONResponse(
            status_code=400,
            content={"error": "INVALID_JSON", "detail": "Request body must be a JSON object"},
        )
    except Exception:
        return None, JSONResponse(
            status_code=400,
            content={"error": "MALFORMED_JSON", "detail": "Could not parse JSON body"},
        )


# OMS Endpoints
@app.post("/orders/validate")
async def oms_validate(
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    body, err_resp = await _parse_body(request)
    if err_resp or body is None:
        return err_resp or JSONResponse(status_code=400, content={"error": "MISSING_BODY"})
    order_id = body.get("order_id", "unknown")

    # Tombstone check
    if store.is_tombstoned(idempotency_key):
        return JSONResponse(
            status_code=409,
            content={"error": "TOMBSTONED", "detail": "Forward action rejected by tombstone"},
        )

    # Idempotency check
    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    # Chaos check
    status, err = await chaos_engine.apply("validate", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    if not body.get("customer_id"):
        res = {"code": "INVALID_CUSTOMER", "error": "Customer ID missing"}
        store.record_idempotency(idempotency_key, 422, res)
        return JSONResponse(status_code=422, content=res)

    store.upsert_entity(order_id, "VALIDATED", body)
    res = {"status": "VALIDATED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


@app.post("/orders/{order_id}/complete")
async def oms_complete(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    if store.is_tombstoned(idempotency_key):
        return JSONResponse(
            status_code=409,
            content={"error": "TOMBSTONED", "detail": "Forward action rejected by tombstone"},
        )

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("complete", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.upsert_entity(order_id, "COMPLETED", {"order_id": order_id})
    res = {"status": "COMPLETED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


@app.post("/orders/{order_id}/reopen")
async def oms_reopen(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    # Write tombstone for forward complete key
    forward_key = f"{order_id}:complete_order:complete"
    store.write_tombstone(forward_key, order_id)

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("reopen", order_id, chaos_key=x_chaos_key, is_compensation=True)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.upsert_entity(order_id, "REOPENED", {"order_id": order_id})
    res = {"status": "REOPENED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


# Inventory Endpoints
@app.post("/reservations")
async def inventory_reserve(
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    body, err_resp = await _parse_body(request)
    if err_resp or body is None:
        return err_resp or JSONResponse(status_code=400, content={"error": "MISSING_BODY"})
    order_id = body.get("order_id", "unknown")

    # Tombstone check (RULES §3.4: late-arrival forward rejected)
    if store.is_tombstoned(idempotency_key):
        return JSONResponse(
            status_code=409,
            content={"error": "TOMBSTONED", "detail": "Forward reservation rejected by tombstone"},
        )

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("reserve", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.upsert_entity(
        order_id,
        "RESERVED",
        {"sku": "ONT-V2", "serial": f"SN-{order_id}"},
    )
    res = {
        "status": "RESERVED",
        "order_id": order_id,
        "sku": "ONT-V2",
        "serial": f"SN-{order_id}",
    }
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


@app.delete("/reservations/{order_id}")
async def inventory_release(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    # Write tombstone for the forward reserve key
    forward_key = f"{order_id}:reserve_inventory:reserve"
    store.write_tombstone(forward_key, order_id)

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("release", order_id, chaos_key=x_chaos_key, is_compensation=True)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.delete_entity(order_id)
    res = {"status": "RELEASED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


# Network Endpoints
@app.post("/services")
async def network_provision(
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    body, err_resp = await _parse_body(request)
    if err_resp or body is None:
        return err_resp or JSONResponse(status_code=400, content={"error": "MISSING_BODY"})
    order_id = body.get("order_id", "unknown")

    # Tombstone check
    if store.is_tombstoned(idempotency_key):
        return JSONResponse(
            status_code=409,
            content={"error": "TOMBSTONED", "detail": "Forward provision rejected by tombstone"},
        )

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("provision", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    data: dict[str, Any] = {"vlan_id": 1002, "ip": "10.42.1.88", "port": "ETH-1/1/4"}
    store.upsert_entity(order_id, "PROVISIONED", data)
    res_network: dict[str, Any] = {"status": "PROVISIONED", "order_id": order_id, **data}
    store.record_idempotency(idempotency_key, 200, res_network)
    return JSONResponse(status_code=200, content=res_network)


@app.post("/services/{order_id}/verify")
async def network_verify(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("verify", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    entity = store.get_entity(order_id)
    if not entity or entity["state"] not in ("PROVISIONED", "VERIFIED"):
        res = {"error": "Service not provisioned", "order_id": order_id}
        return JSONResponse(status_code=422, content=res)

    store.upsert_entity(order_id, "VERIFIED", entity["data"])
    res_verify: dict[str, Any] = {"status": "VERIFIED", "order_id": order_id, "signal_dbm": -18.2}
    store.record_idempotency(idempotency_key, 200, res_verify)
    return JSONResponse(status_code=200, content=res_verify)


@app.delete("/services/{order_id}")
async def network_deprovision(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    forward_key = f"{order_id}:provision_network:provision"
    store.write_tombstone(forward_key, order_id)

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("deprovision", order_id, chaos_key=x_chaos_key, is_compensation=True)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.delete_entity(order_id)
    res = {"status": "DEPROVISIONED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


# Billing Endpoints
@app.post("/accounts")
async def billing_create_account(
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    body, err_resp = await _parse_body(request)
    if err_resp or body is None:
        return err_resp or JSONResponse(status_code=400, content={"error": "MISSING_BODY"})
    order_id = body.get("order_id", "unknown")

    if store.is_tombstoned(idempotency_key):
        return JSONResponse(
            status_code=409,
            content={"error": "TOMBSTONED", "detail": "Account creation rejected by tombstone"},
        )

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("create_account", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    data_acc: dict[str, Any] = {"account_number": f"ACC-{order_id}", "status": "ACTIVE"}
    store.upsert_entity(order_id, "ACTIVE", data_acc)
    res_acc: dict[str, Any] = {"status": "ACTIVE", "order_id": order_id, **data_acc}
    store.record_idempotency(idempotency_key, 200, res_acc)
    return JSONResponse(status_code=200, content=res_acc)


@app.delete("/accounts/{order_id}")
async def billing_void_account(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    forward_key = f"{order_id}:create_billing_account:create_account"
    store.write_tombstone(forward_key, order_id)

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("void_account", order_id, chaos_key=x_chaos_key, is_compensation=True)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.delete_entity(order_id)
    res = {"status": "VOIDED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)


@app.post("/accounts/{order_id}/charging")
async def billing_start_charging(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    if store.is_tombstoned(idempotency_key):
        return JSONResponse(
            status_code=409,
            content={"error": "TOMBSTONED", "detail": "Charging rejected by tombstone"},
        )

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("start_charging", order_id, chaos_key=x_chaos_key)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    entity = store.get_entity(order_id)
    if not entity or entity["state"] == "VOIDED":
        res = {"error": "Cannot charge non-existent or voided account"}
        return JSONResponse(status_code=409, content=res)

    store.upsert_entity(order_id, "CHARGING", {"amount": 49.99, "currency": "USD"})
    res_charge: dict[str, Any] = {"status": "CHARGING", "order_id": order_id, "amount": 49.99}
    store.record_idempotency(idempotency_key, 200, res_charge)
    return JSONResponse(status_code=200, content=res_charge)


@app.post("/accounts/{order_id}/charging/reverse")
async def billing_reverse_charges(
    order_id: str,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    forward_key = f"{order_id}:start_billing:start_charging"
    store.write_tombstone(forward_key, order_id)

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("reverse_charges", order_id, chaos_key=x_chaos_key, is_compensation=True)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.upsert_entity(order_id, "REVERSED", {"amount": 0.0})
    res_rev: dict[str, Any] = {"status": "REVERSED", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res_rev)
    return JSONResponse(status_code=200, content=res_rev)


# Notification Endpoints
@app.post("/messages")
async def notify_message(
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_chaos_key: str | None = Header(None, alias="X-Chaos-Key"),
) -> Response:
    body, err_resp = await _parse_body(request)
    if err_resp or body is None:
        return err_resp or JSONResponse(status_code=400, content={"error": "MISSING_BODY"})
    order_id = body.get("order_id", "unknown")

    cached = store.check_idempotency(idempotency_key)
    if cached:
        return JSONResponse(
            status_code=cached[0], content=cached[1], headers={"Idempotent-Replay": "true"}
        )

    status, err = await chaos_engine.apply("send_activation", order_id)
    if status:
        return JSONResponse(status_code=status, content=err or {"error": "chaos"})

    store.upsert_entity(order_id, "SENT", body)
    res = {"status": "SENT", "message_id": f"msg-{order_id}", "order_id": order_id}
    store.record_idempotency(idempotency_key, 200, res)
    return JSONResponse(status_code=200, content=res)
