from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.cart import CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemOut, CartSummaryResponse
from app import auth

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


@router.post(
    "",
    response_model=CartItemOut,
    status_code=status.HTTP_201_CREATED,
)
def add_to_cart(
    item_in: CartItemCreate,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Add a product to the authenticated user's cart."""
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {item_in.product_id} not found",
        )

    if product.stock < item_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough stock available. Current stock: {product.stock}",
        )

    existing_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_in.product_id,
        )
        .first()
    )

    if existing_item:
        if product.stock < (existing_item.quantity + item_in.quantity):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add more. Total in cart would exceed stock ({product.stock})",
            )
        existing_item.quantity += item_in.quantity
        db.commit()
        db.refresh(existing_item)
        cart_item = existing_item
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)

    return CartItemOut(
        id=cart_item.id,
        product_id=cart_item.product_id,
        product_name=cart_item.product.name,
        price=cart_item.product.price,
        quantity=cart_item.quantity,
        subtotal=cart_item.quantity * cart_item.product.price,
    )


@router.get(
    "",
    response_model=CartSummaryResponse,
)
def get_cart(
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all cart items belonging to the logged-in user."""
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    items_out = []
    grand_total = 0.0

    for item in cart_items:
        subtotal = item.quantity * item.product.price
        grand_total += subtotal
        items_out.append(
            CartItemOut(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                price=item.product.price,
                quantity=item.quantity,
                subtotal=subtotal,
            )
        )

    return CartSummaryResponse(items=items_out, total=round(grand_total, 2))


@router.put(
    "/{cart_item_id}",
    response_model=CartItemOut,
)
def update_cart_item(
    cart_item_id: int,
    item_update: CartItemUpdate,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Update item quantity in cart."""
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.id == cart_item_id,
            CartItem.user_id == current_user.id,
        )
        .first()
    )
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with id {cart_item_id} not found in your cart",
        )

    if cart_item.product.stock < item_update.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set quantity to {item_update.quantity}. Only {cart_item.product.stock} available",
        )

    cart_item.quantity = item_update.quantity
    db.commit()
    db.refresh(cart_item)

    return CartItemOut(
        id=cart_item.id,
        product_id=cart_item.product_id,
        product_name=cart_item.product.name,
        price=cart_item.product.price,
        quantity=cart_item.quantity,
        subtotal=cart_item.quantity * cart_item.product.price,
    )


@router.delete(
    "/{cart_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_from_cart(
    cart_item_id: int,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Remove an item from the authenticated user's cart."""
    cart_item = (
        db.query(CartItem)
        .filter(
            CartItem.id == cart_item_id,
            CartItem.user_id == current_user.id,
        )
        .first()
    )
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item with id {cart_item_id} not found in your cart",
        )

    db.delete(cart_item)
    db.commit()
    return None
