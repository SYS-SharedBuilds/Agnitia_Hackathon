from fastapi import APIRouter

from shared.catalog import catalog_loader
from shared.models import ProductDefinition

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.get("/products")
async def list_products() -> list[ProductDefinition]:
    return catalog_loader.list_products()


@router.get("/products/{product_code}")
async def get_product(product_code: str) -> ProductDefinition:
    return catalog_loader.load_product(product_code)
