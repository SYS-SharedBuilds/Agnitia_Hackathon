"""Unit tests for models and catalog loader."""

import pytest

from shared.catalog import CatalogError, catalog_loader
from shared.models import Order, OrderState, SystemType, TaskDefinition


def test_order_model_initialization() -> None:
    order = Order(
        order_id="ord_123",
        client_order_ref="ref_123",
        customer_id="cust_1",
        product="FIBER_500",
        workflow_id="order-ord_123",
    )
    assert order.state == OrderState.RECEIVED
    assert order.order_id == "ord_123"


def test_catalog_loader() -> None:
    product = catalog_loader.load_product("FIBER_500")
    assert product.product == "FIBER_500"
    assert len(product.tasks) == 8


def test_catalog_cycle_detection() -> None:
    from shared.models import ProductDefinition

    cyclic_product = ProductDefinition(
        product="CYCLE_TEST",
        name="Cycle Test",
        version=1,
        tasks=[
            TaskDefinition(
                id="task_a",
                system=SystemType.OMS,
                action="validate",
                compensation=None,
                depends_on=["task_b"],
                read_only=True,
            ),
            TaskDefinition(
                id="task_b",
                system=SystemType.INVENTORY,
                action="reserve",
                compensation="release",
                depends_on=["task_a"],
            ),
        ],
    )
    with pytest.raises(CatalogError, match="Cycle detected"):
        catalog_loader.validate(cyclic_product)
