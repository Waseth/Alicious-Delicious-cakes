from datetime import datetime
from extensions import db


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    deposit_required = db.Column(db.Numeric(10, 2), nullable=False)
    deposit_paid = db.Column(db.Boolean, default=False)
    balance_paid = db.Column(db.Boolean, default=False)
    status = db.Column(
        db.Enum(
            "order_received",
            "baking_in_progress",
            "cake_ready",
            "delivered",
            "cancelled",
        ),
        nullable=False,
        default="order_received",
    )
    delivery_date = db.Column(db.DateTime, nullable=True)
    custom_message = db.Column(db.String(300), nullable=True)
    cancellation_reason = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="orders")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = db.relationship("Payment", back_populates="order", lazy="dynamic")
    expenses = db.relationship("Expense", back_populates="order", lazy="dynamic")
    notifications = db.relationship("Notification", back_populates="order", lazy="dynamic")

    @property
    def balance_due(self):
        if self.deposit_paid:
            return float(self.total_price) - float(self.deposit_required)
        return float(self.total_price)

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_phone": self.user.phone_number if self.user else None,
            "total_price": float(self.total_price),
            "deposit_required": float(self.deposit_required),
            "deposit_paid": self.deposit_paid,
            "balance_paid": self.balance_paid,
            "balance_due": self.balance_due,
            "status": self.status,
            "delivery_date": self.delivery_date.isoformat() if self.delivery_date else None,
            "custom_message": self.custom_message,
            "cancellation_reason": self.cancellation_reason,
            "created_at": self.created_at.isoformat(),
        }
        if include_items:
            data["items"] = [item.to_dict() for item in self.items]
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    cake_id = db.Column(db.Integer, db.ForeignKey("cakes.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price_at_time = db.Column(db.Numeric(10, 2), nullable=False)

    order = db.relationship("Order", back_populates="items")
    cake = db.relationship("Cake", back_populates="order_items")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "cake_id": self.cake_id,
            "cake_name": self.cake.name if self.cake else None,
            "quantity": self.quantity,
            "price_at_time": float(self.price_at_time),
            "subtotal": float(self.price_at_time) * self.quantity,
        }