from typing import List
from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_id: int = Field(..., description="ID of the product to add to cart")
    quantity: int = Field(1, gt=0, description="Quantity to add (must be at least 1)")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0, description="New quantity for this cart item")


class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class CartSummaryResponse(BaseModel):
    items: List[CartItemOut]
    total: float
