from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product title")
    description: Optional[str] = Field(None, description="Detailed product description")
    price: float = Field(..., gt=0, description="Product price must be greater than 0")
    stock: int = Field(0, ge=0, description="Available stock quantity, cannot be negative")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
