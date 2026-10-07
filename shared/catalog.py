from pathlib import Path

import networkx as nx
import yaml

from shared.errors import SwitchOnError
from shared.models import Plan, ProductDefinition


class CatalogError(SwitchOnError):
    pass


class CatalogLoader:
    def __init__(self, catalog_dir: str | Path | None = None) -> None:
        if catalog_dir is None:
            self.catalog_dir = Path(__file__).resolve().parent.parent / "catalog" / "products"
        else:
            self.catalog_dir = Path(catalog_dir)
        self._cache: dict[str, ProductDefinition] = {}

    def load_product(self, product_code: str) -> ProductDefinition:
        product_key = product_code.upper()
        if product_key in self._cache:
            return self._cache[product_key]

        target_file = None
        if self.catalog_dir.exists():
            for yaml_file in self.catalog_dir.glob("*.yaml"):
                with open(yaml_file, encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    if data and data.get("product", "").upper() == product_key:
                        target_file = yaml_file
                        break

        if not target_file:
            raise CatalogError(f"Product definition for '{product_code}' not found in catalog")

        with open(target_file, encoding="utf-8") as f:
            data = yaml.safe_load(f)

        product = ProductDefinition(**data)
        self.validate(product)
        self._cache[product_key] = product
        return product

    def resolve_plan(self, product_code: str) -> Plan:
        product = self.load_product(product_code)
        return Plan(
            product=product.product,
            version=product.version,
            tasks=product.tasks,
        )

    def list_products(self) -> list[ProductDefinition]:
        products: list[ProductDefinition] = []
        if not self.catalog_dir.exists():
            return products

        for yaml_file in sorted(self.catalog_dir.glob("*.yaml")):
            with open(yaml_file, encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if data:
                    product = ProductDefinition(**data)
                    self.validate(product)
                    self._cache[product.product.upper()] = product
                    products.append(product)
        return products

    def validate(self, product: ProductDefinition) -> None:
        """Validates DAG structure, acyclicity, dependencies, and compensation rules."""
        g = nx.DiGraph()
        task_ids = set()

        for task in product.tasks:
            if task.id in task_ids:
                raise CatalogError(f"Duplicate task id '{task.id}' in product '{product.product}'")
            task_ids.add(task.id)
            g.add_node(task.id)

        # Check dependencies exist & add edges
        for task in product.tasks:
            for dep in task.depends_on:
                if dep not in task_ids:
                    raise CatalogError(
                        f"Task '{task.id}' depends on non-existent task '{dep}' in product '{product.product}'"
                    )
                g.add_edge(dep, task.id)

        # Check DAG acyclicity
        if not nx.is_directed_acyclic_graph(g):
            cycle = nx.find_cycle(g)
            raise CatalogError(f"Cycle detected in product '{product.product}' DAG: {cycle}")

        # Invariant checks:
        # Every non-read-only, non-best-effort task must have a compensation action
        for task in product.tasks:
            if not task.read_only and not task.best_effort and not task.compensation:
                raise CatalogError(
                    f"State-mutating task '{task.id}' must declare a compensation action (or mark read_only/best_effort)"
                )

        # Business ordering invariant (RULES.md §3.5):
        # Billing start must depend directly or transitively on verify_service if verify_service exists
        if "verify_service" in task_ids and "start_billing" in task_ids:
            if not nx.has_path(g, "verify_service", "start_billing"):
                raise CatalogError(
                    f"Product '{product.product}' violates rule: 'start_billing' must depend on 'verify_service'"
                )


catalog_loader = CatalogLoader()
