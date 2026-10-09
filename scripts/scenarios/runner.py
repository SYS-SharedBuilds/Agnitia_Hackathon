import asyncio
import os
import shutil
import subprocess
import sys
import time
from typing import Any

import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


async def clear_all_chaos(client: httpx.AsyncClient) -> None:
    for port in (8101, 8102, 8103, 8104, 8105):
        try:
            await client.delete(f"http://localhost:{port}/admin/chaos")
        except Exception:
            pass


async def wait_order(
    client: httpx.AsyncClient,
    base_api: str,
    order_id: str,
    timeout_sec: float = 25.0,
) -> dict[str, Any]:
    deadline = time.time() + timeout_sec
    last_res: dict[str, Any] = {}
    while time.time() < deadline:
        try:
            r = await client.get(f"{base_api}/orders/{order_id}")
            if r.is_success:
                data = r.json()
                if isinstance(data, dict):
                    last_res = data
                    st = data.get("order", {}).get("state")
                    if st in ("ACTIVE", "ROLLED_BACK", "NEEDS_ATTENTION", "CANCELLED", "FAILED"):
                        return data
        except Exception:
            pass
        await asyncio.sleep(0.5)
    return last_res


async def wait_task_state(
    client: httpx.AsyncClient,
    base_api: str,
    order_id: str,
    task_id: str,
    expected_state: str,
    timeout_sec: float = 10.0,
) -> bool:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            r = await client.get(f"{base_api}/orders/{order_id}")
            if r.is_success:
                data = r.json()
                tasks = data.get("tasks", [])
                for t in tasks:
                    if t.get("task_id") == task_id and t.get("state") == expected_state:
                        return True
        except Exception:
            pass
        await asyncio.sleep(0.1)
    return False


async def run_scenario(name: str) -> dict[str, Any]:
    scenario_id = name.upper()
    client = httpx.AsyncClient(timeout=30.0)
    base_api = os.getenv("API_URL", "http://localhost:8000")

    await clear_all_chaos(client)
    order_ref = f"demo_ref_{scenario_id}_{int(time.time() * 1000)}"

    result: dict[str, Any] = {
        "scenario": scenario_id,
        "name": "",
        "expected": "",
        "observed": "",
        "status": "FAIL",
        "details": {},
    }

    try:
        if scenario_id == "S1":
            result["name"] = "Happy Path (Certificate Issued)"
            result["expected"] = "ACTIVE"
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S1",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st

            # Verify Certificate
            cert_res = await client.get(f"{base_api}/orders/{order_id}/certificate")
            has_cert = cert_res.is_success and "signature" in cert_res.json()
            result["details"] = {"order_id": order_id, "has_certificate": has_cert}
            if st == "ACTIVE" and has_cert:
                result["status"] = "PASS"

        elif scenario_id == "S2":
            result["name"] = "Network 503 x2 (Retries -> OK)"
            result["expected"] = "ACTIVE"
            await client.put(
                "http://localhost:8103/admin/chaos",
                json={"mode": "fail_n", "n": 2, "status": 503, "match_action": "provision"},
            )
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S2",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st
            tasks = order_data.get("tasks", [])
            net_task = next((t for t in tasks if t["system"] == "network"), None)
            attempts = net_task.get("attempts", 1) if net_task else 1
            result["details"] = {"order_id": order_id, "network_attempts": attempts}
            if st == "ACTIVE" and attempts >= 3:
                result["status"] = "PASS"

        elif scenario_id == "S3":
            result["name"] = "Inventory Out of Stock (Business Fast-fail)"
            result["expected"] = "ROLLED_BACK"
            await client.put(
                "http://localhost:8102/admin/chaos",
                json={"mode": "business_error", "business_code": "OUT_OF_STOCK"},
            )
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S3",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st
            tasks = order_data.get("tasks", [])
            inv_task = next((t for t in tasks if t["system"] == "inventory"), None)
            attempts = inv_task.get("attempts", 1) if inv_task else 1
            result["details"] = {"order_id": order_id, "inventory_attempts": attempts}
            # Business errors must not retry forward
            if st == "ROLLED_BACK" and attempts == 1:
                result["status"] = "PASS"

        elif scenario_id == "S4":
            result["name"] = "Network Permanent 500 (Saga Rollback)"
            result["expected"] = "ROLLED_BACK"
            await client.put(
                "http://localhost:8103/admin/chaos",
                json={"mode": "always_fail", "status": 500, "match_action": "provision"},
            )
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S4",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st

            # Verify inventory was compensated
            inv_r = await client.get("http://localhost:8102/admin/audit/resources")
            inv_entities = inv_r.json() if inv_r.is_success else []
            active_res = [
                e
                for e in inv_entities
                if e.get("order_id") == order_id and e.get("state") == "RESERVED"
            ]
            result["details"] = {
                "order_id": order_id,
                "active_reservations_remaining": len(active_res),
            }
            if st == "ROLLED_BACK" and len(active_res) == 0:
                result["status"] = "PASS"

        elif scenario_id == "S5":
            result["name"] = "Billing Fails Post-Network Live (Deprovision + Release)"
            result["expected"] = "ROLLED_BACK"
            await client.put(
                "http://localhost:8104/admin/chaos",
                json={"mode": "always_fail", "status": 500, "match_action": "create_account"},
            )
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S5",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st

            # Verify network was deprovisioned
            net_r = await client.get("http://localhost:8103/admin/audit/resources")
            net_entities = net_r.json() if net_r.is_success else []
            net_active = [
                e
                for e in net_entities
                if e.get("order_id") == order_id and e.get("state") in ("PROVISIONED", "VERIFIED")
            ]
            result["details"] = {"order_id": order_id, "active_network_remaining": len(net_active)}
            if st == "ROLLED_BACK" and len(net_active) == 0:
                result["status"] = "PASS"

        elif scenario_id == "S6":
            result["name"] = "Compensation Failure Exhausted"
            result["expected"] = "NEEDS_ATTENTION"
            # Fail on compensation in inventory
            await client.put(
                "http://localhost:8102/admin/chaos",
                json={
                    "mode": "always_fail",
                    "status": 500,
                    "match_action": "release",
                    "fail_on_compensation": True,
                },
            )
            # Fail in billing to trigger compensation
            await client.put(
                "http://localhost:8104/admin/chaos",
                json={"mode": "always_fail", "status": 500, "match_action": "create_account"},
            )
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S6",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id, timeout_sec=30.0)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st
            fail_reason = order_data.get("order", {}).get("failure_reason")
            result["details"] = {"order_id": order_id, "failure_reason": fail_reason}
            if st == "NEEDS_ATTENTION" and bool(fail_reason):
                result["status"] = "PASS"

        elif scenario_id == "S7":
            result["name"] = "Worker Crash Recovery (Durable State)"
            result["expected"] = "ACTIVE"
            # Delay network provision so we can kill worker while in progress
            await client.put(
                "http://localhost:8103/admin/chaos",
                json={"mode": "delay", "delay_ms": 3000, "match_action": "provision"},
            )
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": "CUST-S7",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            await asyncio.sleep(0.6)

            # Restart worker if docker is available
            restarted = False
            if shutil.which("docker"):
                try:
                    subprocess.run(
                        ["docker", "compose", "stop", "worker"],
                        check=False,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    await asyncio.sleep(1.0)
                    subprocess.run(
                        ["docker", "compose", "start", "worker"],
                        check=False,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    restarted = True
                except Exception:
                    pass

            order_data = await wait_order(client, base_api, order_id, timeout_sec=25.0)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st
            result["details"] = {"order_id": order_id, "worker_restarted": restarted}
            if st == "ACTIVE":
                result["status"] = "PASS"

        elif scenario_id == "S8":
            result["name"] = "Duplicate Submission (Idempotent Replay)"
            result["expected"] = "ACTIVE (Same Order)"
            # Send two concurrent submissions with identical ref
            p = {
                "client_order_ref": order_ref,
                "customer_id": "CUST-S8",
                "product": "FIBER_500",
            }
            res1, res2 = await asyncio.gather(
                client.post(f"{base_api}/orders", json=p),
                client.post(f"{base_api}/orders", json=p),
            )
            oid1 = res1.json().get("order_id")
            oid2 = res2.json().get("order_id")

            order_data = await wait_order(client, base_api, oid1)
            st = order_data.get("order", {}).get("state", "UNKNOWN")

            # Sequential replay test
            res3 = await client.post(f"{base_api}/orders", json=p)
            oid3 = res3.json().get("order_id")
            is_replay = res3.json().get("idempotent_replay")

            result["observed"] = f"{st} (oid1={oid1}, oid2={oid2})"
            result["details"] = {"matched_ids": (oid1 == oid2 == oid3), "replay_flag": is_replay}
            if st == "ACTIVE" and (oid1 == oid2 == oid3):
                result["status"] = "PASS"

        elif scenario_id == "S9":
            result["name"] = "Operator Mid-Flight Cancellation"
            result["expected"] = "CANCELLED"
            chaos_url = "http://localhost:8103/admin/chaos"
            try:
                # Injected latency on network provision so cancellation arrives mid-flight
                r = await client.put(
                    chaos_url,
                    json={
                        "mode": "none",
                        "latency": {"min_ms": 3000, "max_ms": 3500},
                        "match_action": "provision",
                    },
                )
                assert r.status_code == 200, r.text

                res = await client.post(
                    f"{base_api}/orders",
                    json={
                        "client_order_ref": order_ref,
                        "customer_id": "CUST-S9",
                        "product": "FIBER_500",
                    },
                )
                assert res.status_code in (200, 202), res.text
                order_id = res.json()["order_id"]

                # Wait until order is mid-flight in provision_network
                await wait_task_state(client, base_api, order_id, "provision_network", "RUNNING", timeout_sec=10.0)

                cancel_res = await client.post(
                    f"{base_api}/orders/{order_id}/cancel",
                    params={"reason": "S9 operator cancel"},
                )
                assert cancel_res.status_code == 202, cancel_res.text

                order_data = await wait_order(client, base_api, order_id, timeout_sec=25.0)
                st = order_data.get("order", {}).get("state", "UNKNOWN")
                result["observed"] = f"{st} (cancel_call={cancel_res.status_code})"
                result["details"] = {"order_id": order_id, "cancel_call": cancel_res.status_code}
                if st == "CANCELLED" and cancel_res.status_code == 202:
                    result["status"] = "PASS"
            finally:
                await client.delete(chaos_url)

        elif scenario_id == "S10":
            result["name"] = "High Load (Orders + Transient Faults)"
            result["expected"] = "INVARIANTS PASS"
            from scripts.invariants import check_all_invariants
            from scripts.load_generator import run_load_test

            load_res = await run_load_test(count=6, failure_rate=0.2)
            # Wait for in-flight orders to finish executing
            deadline = time.time() + 15.0
            while time.time() < deadline:
                try:
                    m_res = await client.get(f"{base_api}/metrics/summary")
                    if m_res.is_success and m_res.json().get("in_flight_orders", 0) == 0:
                        break
                except Exception:
                    pass
                await asyncio.sleep(0.5)

            inv_res = await check_all_invariants()
            inv_status = inv_res.get("status")
            result["observed"] = f"Invariants {inv_status}"
            result["details"] = {"load_summary": load_res, "invariants_pass": inv_status == "PASS"}
            if inv_status == "PASS":
                result["status"] = "PASS"

        elif scenario_id == "S11":
            result["name"] = "Late Forward Request (Tombstone Wins)"
            result["expected"] = "409 TOMBSTONED"
            # 1. Forward reservation in mock-inventory
            s11_oid = f"ord_s11_{int(time.time() * 1000)}"
            forward_key = f"{s11_oid}:reserve_inventory:reserve"
            r1 = await client.post(
                "http://localhost:8102/reservations",
                json={"order_id": s11_oid, "product": "FIBER_500"},
                headers={"Idempotency-Key": forward_key},
            )
            # 2. Compensation deletes reservation and writes tombstone
            r2 = await client.delete(
                f"http://localhost:8102/reservations/{s11_oid}",
                headers={"Idempotency-Key": f"comp_{s11_oid}"},
            )
            # 3. Late-arriving forward request arrives with forward key
            r3 = await client.post(
                "http://localhost:8102/reservations",
                json={"order_id": s11_oid, "product": "FIBER_500"},
                headers={"Idempotency-Key": forward_key},
            )
            code = r3.status_code
            err = r3.json().get("error") if r3.is_success or r3.status_code == 409 else ""
            result["observed"] = f"{code} {err}"
            result["details"] = {
                "reserve_code": r1.status_code,
                "release_code": r2.status_code,
                "late_code": code,
            }
            if code == 409 and err == "TOMBSTONED":
                result["status"] = "PASS"

        elif scenario_id == "S12":
            result["name"] = "A/B Proof (SwitchOn 0 Leaks vs Baseline)"
            result["expected"] = "100.0% CONSISTENT"
            from scripts.ab_proof import run_ab_proof

            proof_res = await run_ab_proof(orders_count=6, seed=42, api_url=base_api)
            comp = proof_res.get("comparison", {})
            sw = comp.get("switchon", {})
            base = comp.get("baseline", {})
            sw_orphans = sw.get("leaks", {}).get("orphaned_resources", 1)
            sw_rate = sw.get("consistency_rate_pct", 0)
            base_rate = base.get("consistency_rate_pct", 0)

            result["observed"] = f"SwitchOn: {sw_rate}%, Base: {base_rate}%"
            result["details"] = {
                "switchon_orphans": sw_orphans,
                "baseline_orphans": base.get("leaks", {}).get("orphaned_resources", 0),
            }
            if sw_orphans == 0 and sw_rate == 100.0:
                result["status"] = "PASS"

        else:
            result["name"] = f"Scenario {scenario_id}"
            result["expected"] = "ACTIVE"
            res = await client.post(
                f"{base_api}/orders",
                json={
                    "client_order_ref": order_ref,
                    "customer_id": f"CUST-{scenario_id}",
                    "product": "FIBER_500",
                },
            )
            order_id = res.json()["order_id"]
            order_data = await wait_order(client, base_api, order_id)
            st = order_data.get("order", {}).get("state", "UNKNOWN")
            result["observed"] = st
            result["status"] = "PASS" if st == "ACTIVE" else "FAIL"

    except Exception as exc:
        result["observed"] = f"EXCEPTION: {exc}"
        result["details"] = {"error": str(exc)}
    finally:
        await clear_all_chaos(client)
        await client.aclose()

    return result


async def main() -> None:
    print("================================================================================")
    print("                 SWITCHON DEMO SCENARIOS SUITE (S1..S12)                        ")
    print("================================================================================")

    scenarios = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12"]
    if len(sys.argv) > 1:
        chosen = sys.argv[1].upper()
        if chosen in scenarios:
            scenarios = [chosen]
    results = []

    for sc in scenarios:
        print(f"\n[EXEC] Running Scenario {sc}...")
        res = await run_scenario(sc)
        results.append(res)
        tag = "[PASS]" if res["status"] == "PASS" else "[FAIL]"
        print(f"       Result: {tag} | Observed: {res['observed']}")

    # Print Official Summary Table
    print("\n")
    print("================================================================================")
    print(f"{'#':<4} | {'Scenario Description':<44} | {'Expected':<14} | {'Result':<6}")
    print("-----+----------------------------------------------+----------------+-------")
    for r in results:
        tag = "[PASS]" if r["status"] == "PASS" else "[FAIL]"
        print(f"{r['scenario']:<4} | {r['name']:<44} | {r['expected']:<14} | {tag}")
    print("================================================================================")

    passed_count = sum(1 for r in results if r["status"] == "PASS")
    total_count = len(results)
    print(f"\nSummary: {passed_count}/{total_count} scenarios PASSED.")

    if passed_count < total_count:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
