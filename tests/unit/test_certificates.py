
from shared.crypto import CertificateSigner, compute_event_hash_chain


def test_certificate_signing_and_verification_happy_path() -> None:
    signer = CertificateSigner()
    body = {
        "order_id": "ord_cert_1",
        "outcome": "ACTIVE",
        "events_digest": "sha256:abcd",
    }
    signature = signer.sign(body)
    assert signature.startswith("ed25519:")

    is_valid = CertificateSigner.verify(body, signature, signer.get_public_key_pem())
    assert is_valid is True


def test_certificate_tamper_fails_verification() -> None:
    """Negative tamper test: corrupting any field fails verification (RULES §6.4 & X2)."""
    signer = CertificateSigner()
    body = {
        "order_id": "ord_cert_tamper",
        "outcome": "ACTIVE",
        "events_digest": "sha256:abcd",
    }
    signature = signer.sign(body)

    # Tamper with body
    tampered_body = dict(body)
    tampered_body["outcome"] = "ROLLED_BACK"

    is_valid = CertificateSigner.verify(
        tampered_body, signature, signer.get_public_key_pem()
    )
    assert is_valid is False


def test_hash_chain_tamper_fails() -> None:
    events = [
        {"seq": 1, "type": "order.received"},
        {"seq": 2, "type": "order.started"},
    ]
    digest1 = compute_event_hash_chain("ord_1", events)

    # Mutate event payload
    tampered_events = [
        {"seq": 1, "type": "order.received"},
        {"seq": 2, "type": "order.started", "tampered": True},
    ]
    digest2 = compute_event_hash_chain("ord_1", tampered_events)
    assert digest1 != digest2
