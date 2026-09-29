from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.schemas.order import OrderItemOut, OrderResponse
from app import auth

router = APIRouter(tags=["Orders"])


def format_order_response(order: Order) -> OrderResponse:
    """Helper to convert an Order model with its items into an OrderResponse schema."""
    items_out = []
    for item in order.items:
        items_out.append(
            OrderItemOut(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                price=item.price,
                quantity=item.quantity,
                subtotal=round(item.quantity * item.price, 2),
            )
        )
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        total_amount=round(order.total_amount, 2),
        status=order.status,
        created_at=order.created_at,
        items=items_out,
    )


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def place_order(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Checkout & Place Order (Atomic Database Transaction)."""
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add products before placing an order.",
        )

    try:
        total_amount = 0.0
        for item in cart_items:
            if item.product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{item.product.name}'. Available: {item.product.stock}, in cart: {item.quantity}",
                )
            total_amount += item.quantity * item.product.price

        new_order = Order(
            user_id=current_user.id,
            total_amount=total_amount,
            status="completed",
        )
        db.add(new_order)
        db.flush()

        for item in cart_items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.product.price,
            )
            db.add(order_item)
            item.product.stock -= item.quantity
            db.delete(item)

        db.commit()
        db.refresh(new_order)
        return format_order_response(new_order)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order processing failed: {str(e)}",
        )


@router.get(
    "/orders",
    response_model=List[OrderResponse],
)
def get_user_orders(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """CUSTOMER: Retrieve past orders placed by the currently authenticated user."""
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [format_order_response(o) for o in orders]


@router.get(
    "/orders/{order_id}",
    response_model=OrderResponse,
)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """CUSTOMER: Retrieve a specific order receipt by ID (only if owned by user)."""
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found in your orders",
        )
    return format_order_response(order)


@router.get(
    "/admin/orders",
    response_model=List[OrderResponse],
    tags=["Admin Management"],
)
def get_all_store_orders(
    admin_user: User = Depends(auth.get_current_admin),  # 🔒 ADMIN ONLY
    db: Session = Depends(get_db),
):
    """ADMIN ONLY: View ALL orders placed by EVERY customer across the store."""
    all_orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [format_order_response(o) for o in all_orders]
