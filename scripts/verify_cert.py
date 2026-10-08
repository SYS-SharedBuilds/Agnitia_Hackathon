import argparse
import asyncio
import sys
from typing import Any

import httpx

from shared.crypto import CertificateSigner, compute_event_hash_chain


def verify_certificate_offline(
    cert_data: dict[str, Any],
    public_key_pem: str,
    ordered_events: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Offline verification of Consistency Certificate (X2).
    1. Recomputes event hash chain if events provided and checks events_digest
    2. Verifies Ed25519 cryptographic signature using canonical JSON
    """
    body = cert_data.get("body", cert_data)
    sig = cert_data.get("signature", "")

    # Check hash chain digest if event stream is attached
    if ordered_events:
        order_id = body.get("order_id", "")
        recalculated_digest = compute_event_hash_chain(order_id, ordered_events)
        if recalculated_digest != body.get("events_digest"):
            return {
                "valid": False,
                "reason": f"Hash chain mismatch: recorded {body.get('events_digest')} != recalculated {recalculated_digest}",
            }

    # Verify Ed25519 signature
    valid = CertificateSigner.verify(body, sig, public_key_pem)
    return {
        "valid": valid,
        "reason": "Cryptographically verified offline" if valid else "Invalid Ed25519 signature",
    }


async def main() -> None:
    parser = argparse.ArgumentParser(description="Verify SwitchOn Consistency Certificate")
    parser.add_argument("--id", help="Order ID to fetch and verify")
    parser.add_argument("--file", help="Path to exported certificate JSON file")
    parser.add_argument("--tamper", action="store_true", help="Simulate event tampering")
    args = parser.parse_args()

    api_url = "http://localhost:8000"

    if args.id:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{api_url}/orders/{args.id}/certificate")
            if not res.is_success:
                print(f"Failed to fetch certificate: {res.text}")
                sys.exit(1)
            cert = res.json()

            pub_key = cert.get("public_key_pem", "")
            events_res = await client.get(f"{api_url}/orders/{args.id}/events")
            events: list[dict[str, Any]] = (
                events_res.json() if events_res.is_success else []
            )

            if args.tamper and events:
                print("⚠ Simulating tampering of historical event payload...")
                events[0]["payload"]["tampered"] = True

            v_res = verify_certificate_offline(cert, pub_key, events)
            print("=== Consistency Certificate Verification ===")
            print(f"Order ID: {args.id}")
            print(f"Status:   {'✔ PASS' if v_res['valid'] else '✘ FAIL'}")
            print(f"Details:  {v_res['reason']}")
            if not v_res["valid"]:
                sys.exit(1)
    else:
        print("Usage: python scripts/verify_cert.py --id <order_id> [--tamper]")


if __name__ == "__main__":
    asyncio.run(main())
