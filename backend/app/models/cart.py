from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    # Relationships
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")
