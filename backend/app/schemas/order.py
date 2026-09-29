from datetime import datetime
from typing import List
from pydantic import BaseModel


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True
