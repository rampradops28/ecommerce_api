from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app import auth

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=List[ProductResponse],
)
def get_products(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """PUBLIC: Retrieve all products with pagination."""
    return db.query(Product).offset(skip).limit(limit).all()


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """PUBLIC: Retrieve a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )
    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_in: ProductCreate,
    admin_user: User = Depends(auth.get_current_admin),  # 🔒 ADMIN ONLY
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: Add a new product to the catalog."""
    new_product = Product(**product_in.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    admin_user: User = Depends(auth.get_current_admin),  # 🔒 ADMIN ONLY
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: Update product details or stock inventory."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    admin_user: User = Depends(auth.get_current_admin),  # 🔒 ADMIN ONLY
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: Remove a product from the catalog."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found",
        )

    db.delete(product)
    db.commit()
    return None
