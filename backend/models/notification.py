from datetime import datetime
from extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=True)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum("sms"), nullable=False, default="sms")
    status = db.Column(
        db.Enum("pending", "sent", "failed"),
        nullable=False,
        default="pending",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="notifications")
    order = db.relationship("Order", back_populates="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "order_id": self.order_id,
            "message": self.message,
            "type": self.type,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
