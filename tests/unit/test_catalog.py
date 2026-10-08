from shared.catalog import catalog_loader
from shared.models import make_idempotency_key


def test_catalog_loader_fiber() -> None:
    product = catalog_loader.load_product("FIBER_500")
    assert product.product == "FIBER_500"
    assert len(product.tasks) >= 6

    # Verify DAG validity
    task_ids = [t.id for t in product.tasks]
    assert "validate_order" in task_ids
    assert "provision_network" in task_ids
    assert "create_billing_account" in task_ids
    assert "verify_service" in task_ids
    assert "start_billing" in task_ids


def test_catalog_loader_all_products() -> None:
    products = catalog_loader.list_products()
    assert len(products) >= 3
    product_codes = [p.product for p in products]
    assert "FIBER_500" in product_codes
    assert "MOBILE_5G" in product_codes
    assert "ESIM_ADDON" in product_codes


def test_idempotency_key_helper() -> None:
    key = make_idempotency_key("ord_123", "reserve_inventory", "reserve")
    assert key == "ord_123:reserve_inventory:reserve"
