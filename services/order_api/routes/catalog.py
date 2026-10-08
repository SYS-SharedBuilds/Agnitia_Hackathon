from fastapi import APIRouter, HTTPException, Path

from shared.catalog import CatalogError, catalog_loader
from shared.models import ProductDefinition

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.get("")
@router.get("/")
@router.get("/products")
async def list_products() -> list[ProductDefinition]:
    return catalog_loader.list_products()


@router.get("/products/{product_code}")
async def get_product(
    product_code: str = Path(..., min_length=1, max_length=64),
) -> ProductDefinition:
    try:
        return catalog_loader.load_product(product_code)
    except CatalogError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
