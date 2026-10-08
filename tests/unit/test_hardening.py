"""Unit regression tests for security and input hardening."""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from services.mocks.store import MockStateStore
from services.order_api.main import app
from shared.models import OrderCreateRequest


def test_order_create_request_validation() -> None:
    # Valid model
    req = OrderCreateRequest(
        client_order_ref="ref_valid_123",
        customer_id="cust_456",
        product="FIBER_500",
        engine="temporal",
    )
    assert req.engine == "temporal"

    # Valid baseline engine
    req_base = OrderCreateRequest(
        client_order_ref="ref_valid_base",
        customer_id="cust_456",
        product="FIBER_500",
        engine="BASELINE",
    )
    assert req_base.engine == "baseline"

    # Invalid engine rejected
    with pytest.raises(ValidationError):
        OrderCreateRequest(
            client_order_ref="ref_bad",
            customer_id="cust_bad",
            product="FIBER_500",
            engine="unsupported_engine",
        )

    # Empty client_order_ref rejected
    with pytest.raises(ValidationError):
        OrderCreateRequest(
            client_order_ref="",
            customer_id="cust_bad",
            product="FIBER_500",
        )

    # Oversized client_order_ref rejected
    with pytest.raises(ValidationError):
        OrderCreateRequest(
            client_order_ref="x" * 200,
            customer_id="cust_bad",
            product="FIBER_500",
        )


def test_catalog_error_returns_404() -> None:
    client = TestClient(app)
    response = client.get("/catalog/products/NON_EXISTENT_PRODUCT_XYZ")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_catalog_root_route_success() -> None:
    client = TestClient(app)
    response = client.get("/catalog")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) >= 1


def test_security_headers_present() -> None:
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"


def test_mock_store_context_manager_lifecycle() -> None:
    store = MockStateStore("inventory", db_path=":memory:")
    # Perform multiple sequential store operations
    store.upsert_entity("ord_hardened", "RESERVED", {"sku": "ONT-V2"})
    entity = store.get_entity("ord_hardened")
    assert entity is not None
    assert entity["state"] == "RESERVED"

    # Record idempotency and tombstone
    store.write_tombstone("ord_hardened:reserve:forward")
    assert store.is_tombstoned("ord_hardened:reserve:forward") is True

    # Delete entity
    assert store.delete_entity("ord_hardened") is True
    assert store.get_entity("ord_hardened") is None
