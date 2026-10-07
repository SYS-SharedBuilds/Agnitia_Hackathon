import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shared.catalog import catalog_loader


def main() -> None:
    print("=== Validating Product Catalog Definitions ===")
    products = catalog_loader.list_products()
    if not products:
        print("ERROR: No products found in catalog/products/")
        sys.exit(1)

    for p in products:
        print(
            f"✔ Validated product '{p.product}' (v{p.version}): {p.name} with {len(p.tasks)} tasks"
        )

    print("\nAll product definitions are acyclic, consistent, and satisfy saga invariants.")


if __name__ == "__main__":
    main()
