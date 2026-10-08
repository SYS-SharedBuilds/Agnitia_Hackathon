import base64
import json
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
    load_pem_private_key,
    load_pem_public_key,
)


def canonical_json_bytes(data: Any) -> bytes:
    """Returns canonical JSON bytes: sorted keys, compact separators, UTF-8 encoded."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def compute_sha256(data: bytes) -> str:
    digest = hashes.Hash(hashes.SHA256())
    digest.update(data)
    return digest.finalize().hex()


def compute_event_hash_chain(order_id: str, ordered_events: list[dict[str, Any]]) -> str:
    """h_0 = SHA256("switchon:" + order_id)
    h_i = SHA256(h_{i-1} || canonical(event_i))
    """
    initial_seed = f"switchon:{order_id}".encode()
    h_prev = compute_sha256(initial_seed)

    for event in ordered_events:
        c_bytes = canonical_json_bytes(event)
        combined = h_prev.encode("utf-8") + c_bytes
        h_prev = compute_sha256(combined)

    return f"sha256:{h_prev}"


class CertificateSigner:
    """Ed25519 signer and verifier for Consistency Certificates."""

    def __init__(self, key_path: str | Path | None = None, key_id: str = "dev-1") -> None:
        self.key_id = key_id
        self._private_key: ed25519.Ed25519PrivateKey | None = None
        self._public_key: ed25519.Ed25519PublicKey

        if key_path and Path(key_path).exists():
            with open(key_path, "rb") as f:
                loaded = load_pem_private_key(f.read(), password=None)
                if isinstance(loaded, ed25519.Ed25519PrivateKey):
                    self._private_key = loaded
                    self._public_key = self._private_key.public_key()
                else:
                    raise ValueError("Key in path is not Ed25519PrivateKey")
        else:
            # Generate local dev key
            self._private_key = ed25519.Ed25519PrivateKey.generate()
            self._public_key = self._private_key.public_key()
            if key_path:
                p = Path(key_path)
                p.parent.mkdir(parents=True, exist_ok=True)
                pem = self._private_key.private_bytes(
                    Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()
                )
                with open(p, "wb") as f:
                    f.write(pem)

    def get_public_key_pem(self) -> str:
        return self._public_key.public_bytes(
            Encoding.PEM, PublicFormat.SubjectPublicKeyInfo
        ).decode("utf-8")

    def sign(self, body: dict[str, Any]) -> str:
        if not self._private_key:
            raise RuntimeError("Private key not available for signing")
        body_bytes = canonical_json_bytes(body)
        sig_bytes = self._private_key.sign(body_bytes)
        return "ed25519:" + base64.b64encode(sig_bytes).decode("utf-8")

    @staticmethod
    def verify(
        body: dict[str, Any], signature: str, public_key_pem: str | None = None
    ) -> bool:
        if not signature.startswith("ed25519:"):
            return False
        b64_sig = signature[len("ed25519:") :]
        try:
            sig_bytes = base64.b64decode(b64_sig)
        except Exception:
            return False

        if public_key_pem:
            loaded_pub = load_pem_public_key(public_key_pem.encode("utf-8"))
            if not isinstance(loaded_pub, ed25519.Ed25519PublicKey):
                return False
            pub_key = loaded_pub
        else:
            return False

        body_bytes = canonical_json_bytes(body)
        try:
            pub_key.verify(sig_bytes, body_bytes)
            return True
        except InvalidSignature:
            return False
        except Exception:
            return False
