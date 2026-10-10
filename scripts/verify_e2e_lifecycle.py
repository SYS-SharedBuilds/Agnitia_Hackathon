"""
End-to-end Operational Lifecycle Verification Script.
Tests:
1. Test 1 — Successful Activation (Happy path: FIBER_500, no chaos)
2. Test 2 — Injected Fault & Saga Rollback (chaos_key: fail_start_charging)
3. Test 3 — Compensation Failure -> Admin/NOC Fallout Detection -> Operator Resolution (chaos_key: fail_start_charging_fail_compensation)
4. Test 4 — Cryptographic Certificate Retrieval & Verification via POST /certificates/verify
"""

import json
import time
import urllib.error
import urllib.request
import uuid

API_BASE = "http://127.0.0.1:8000"


def http_req(path: str, method: str = "GET", data: dict | None = None) -> tuple[int, dict]:
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            res_body = res.read().decode("utf-8")
            return res.getcode(), json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        return e.code, json.loads(res_body) if res_body else {}


def get_order_dict(data: dict) -> dict:
    if isinstance(data, dict) and "order" in data and isinstance(data["order"], dict):
        return data["order"]
    return data


def wait_for_state(order_id: str, terminal_states: list[str], max_wait_sec: int = 50) -> dict:
    start = time.time()
    last_state = None
    while time.time() - start < max_wait_sec:
        code, data = http_req(f"/orders/{order_id}")
        assert code == 200, f"Failed to get order: {code} {data}"
        order = get_order_dict(data)
        state = order.get("state")
        last_state = state
        if state in terminal_states:
            return order
        time.sleep(1)
    raise TimeoutError(f"Order {order_id} reached state '{last_state}', expected one of {terminal_states}")


def run_e2e_tests():
    print("=================================================================")
    print("STARTING SWITCHON END-TO-END OPERATIONAL LIFECYCLE TESTS")
    print("=================================================================")

    # -------------------------------------------------------------
    # TEST 1: Happy Path Activation
    # -------------------------------------------------------------
    print("\n--- TEST 1: Happy Path Activation (FIBER_500) ---")
    ref_1 = f"sub-happy-{uuid.uuid4().hex[:8]}"
    create_payload = {
        "client_order_ref": ref_1,
        "customer_id": "cust-sub-001",
        "product": "FIBER_500",
        "msisdn": "+15550192834",
        "iccid": "8901410321111851072",
        "engine": "temporal",
    }
    code, order1 = http_req("/orders", method="POST", data=create_payload)
    assert code == 202, f"Expected 202 Accepted, got {code}: {order1}"
    order_id_1 = order1["order_id"]
    print(f"[TEST 1] Order created: {order_id_1} (ref: {ref_1})")

    # Wait for completion to ACTIVE
    final_order1 = wait_for_state(order_id_1, ["ACTIVE", "FAILED", "ROLLED_BACK"], max_wait_sec=35)
    print(f"[TEST 1] Final Order State: {final_order1.get('state')}")
    assert final_order1.get("state") == "ACTIVE", f"Expected ACTIVE, got {final_order1.get('state')}"
    print(f"[TEST 1] Activation Duration: {final_order1.get('activation_ms')} ms")

    # Verify events for Order 1
    code, events1 = http_req(f"/orders/{order_id_1}/events")
    assert code == 200
    event_list = events1.get("events", events1) if isinstance(events1, dict) else events1
    print(f"[TEST 1] Verified {len(event_list)} persistent domain events for {order_id_1}")
    assert len(event_list) > 0
    print("[TEST 1] PASS: Order successfully completed and reached ACTIVE state via Temporal!")

    # -------------------------------------------------------------
    # TEST 2: Injected Fault & Saga Rollback
    # -------------------------------------------------------------
    print("\n--- TEST 2: Injected Fault & Saga Rollback (chaos_key: fail_start_charging) ---")
    ref_2 = f"sub-rollback-{uuid.uuid4().hex[:8]}"
    create_payload_2 = {
        "client_order_ref": ref_2,
        "customer_id": "cust-sub-002",
        "product": "FIBER_500",
        "msisdn": "+15550192835",
        "iccid": "8901410321111851073",
        "engine": "temporal",
        "chaos_key": "fail_start_charging",
    }
    code, order2 = http_req("/orders", method="POST", data=create_payload_2)
    assert code == 202, f"Expected 202 Accepted, got {code}: {order2}"
    order_id_2 = order2["order_id"]
    print(f"[TEST 2] Order created with chaos_key: {order_id_2}")

    final_order2 = wait_for_state(order_id_2, ["ROLLED_BACK", "FAILED", "ACTIVE"], max_wait_sec=60)
    print(f"[TEST 2] Final Order State: {final_order2.get('state')}")
    assert final_order2.get("state") == "ROLLED_BACK", f"Expected ROLLED_BACK, got {final_order2.get('state')}"
    print(f"[TEST 2] Failure Reason: {final_order2.get('failure_reason')}")
    print("[TEST 2] PASS: Order encountered injected billing fault and cleanly ROLLED_BACK via Saga compensation!")

    # -------------------------------------------------------------
    # TEST 3: Compensation Failure -> NOC Fallout Detection -> Operator Resolution
    # -------------------------------------------------------------
    print("\n--- TEST 3: Compensation Failure -> NOC Fallout -> Operator Resolution ---")
    ref_3 = f"sub-fallout-{uuid.uuid4().hex[:8]}"
    create_payload_3 = {
        "client_order_ref": ref_3,
        "customer_id": "cust-sub-003",
        "product": "FIBER_500",
        "msisdn": "+15550192836",
        "iccid": "8901410321111851074",
        "engine": "temporal",
        "chaos_key": "fail_start_charging_fail_compensation",
    }
    code, order3 = http_req("/orders", method="POST", data=create_payload_3)
    assert code == 202, f"Expected 202 Accepted, got {code}: {order3}"
    order_id_3 = order3["order_id"]
    print(f"[TEST 3] Order created with compensation failure chaos_key: {order_id_3}")

    final_order3 = wait_for_state(order_id_3, ["NEEDS_ATTENTION", "FAILED"], max_wait_sec=120)
    print(f"[TEST 3] Pre-resolution State: {final_order3.get('state')}")
    assert final_order3.get("state") == "NEEDS_ATTENTION", f"Expected NEEDS_ATTENTION, got {final_order3.get('state')}"

    # Verify that NOC Fallout Queue query sees this order
    code, all_orders = http_req("/orders?limit=100")
    assert code == 200
    orders_list = all_orders.get("orders", all_orders) if isinstance(all_orders, dict) else all_orders
    fallout_orders = [o for o in orders_list if o.get("state") == "NEEDS_ATTENTION" and o.get("order_id") == order_id_3]
    assert len(fallout_orders) == 1, f"Expected order {order_id_3} in NOC fallout list, found {len(fallout_orders)}"
    print(f"[TEST 3] Order {order_id_3} verified in Admin/NOC Fallout queue!")

    # Operator resolves the incident
    print(f"[TEST 3] Operator triggering resolution via POST /orders/{order_id_3}/resolve...")
    resolve_payload = {"note": "Operator manually cleared stuck reservation lock on Inventory and reconciled OMS."}
    code, res_data = http_req(f"/orders/{order_id_3}/resolve", method="POST", data=resolve_payload)
    assert code == 200, f"Expected 200 from resolve, got {code}: {res_data}"
    print(f"[TEST 3] Resolution response: {res_data}")

    # Verify updated state is ROLLED_BACK with resolution details
    resolved_order3 = wait_for_state(order_id_3, ["ROLLED_BACK"], max_wait_sec=15)
    print(f"[TEST 3] Post-resolution State: {resolved_order3.get('state')}")
    assert resolved_order3.get("state") == "ROLLED_BACK"
    print(f"[TEST 3] Order failure_reason / resolution note: {resolved_order3.get('failure_reason')}")
    print("[TEST 3] PASS: Order successfully transitioned from NEEDS_ATTENTION to ROLLED_BACK via Operator Resolution!")

    # -------------------------------------------------------------
    # TEST 4: Certificate Retrieval & Cryptographic Verification
    # -------------------------------------------------------------
    print("\n--- TEST 4: Cryptographic Certificate Verification ---")
    code, cert_data = http_req(f"/orders/{order_id_1}/certificate")
    assert code == 200, f"Expected 200 from certificate, got {code}: {cert_data}"
    print(f"[TEST 4] Certificate retrieved: order_id={cert_data.get('order_id')}, key_id={cert_data.get('key_id')}")
    assert cert_data.get("order_id") == order_id_1
    assert "signature" in cert_data

    # Verify certificate endpoint via POST /certificates/verify
    verify_payload = {
        "body": cert_data.get("body"),
        "signature": cert_data.get("signature"),
        "key_id": cert_data.get("key_id"),
    }
    code, verify_res = http_req("/certificates/verify", method="POST", data=verify_payload)
    assert code == 200, f"Expected 200 from cert verification, got {code}: {verify_res}"
    print(f"[TEST 4] Certificate verification result: {verify_res}")
    assert verify_res.get("valid") is True, f"Cert verification failed: {verify_res}"
    print("[TEST 4] PASS: Certificate cryptographically verified with Ed25519 signature!")

    print("\n=================================================================")
    print("ALL 4 END-TO-END OPERATIONAL LIFECYCLE TESTS PASSED PERFECTLY!")
    print("=================================================================")


if __name__ == "__main__":
    run_e2e_tests()
