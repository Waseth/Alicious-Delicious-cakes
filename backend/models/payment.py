from datetime import datetime
from extensions import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_type = db.Column(db.Enum("deposit", "balance"), nullable=False)
    mpesa_receipt = db.Column(db.String(50), nullable=True, unique=True)
    mpesa_checkout_request_id = db.Column(db.String(100), nullable=True)
    status = db.Column(
        db.Enum("pending", "completed", "failed"),
        nullable=False,
        default="pending",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    order = db.relationship("Order", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "amount": float(self.amount),
            "payment_type": self.payment_type,
            "mpesa_receipt": self.mpesa_receipt,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
