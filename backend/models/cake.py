from datetime import datetime
from extensions import db


class Cake(db.Model):
    __tablename__ = "cakes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    base_price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(
        db.Enum("birthday", "wedding", "graduation", "casual"),
        nullable=False,
        default="casual",
    )
    flavor = db.Column(
        db.Enum("classic", "chocolate", "fruity", "specialty"),
        nullable=False,
        default="classic",
    )
    image_url = db.Column(db.String(500), nullable=True)
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    order_items = db.relationship("OrderItem", back_populates="cake", lazy="dynamic", passive_deletes=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "base_price": float(self.base_price),
            "category": self.category,
            "flavor": self.flavor,
            "image_url": self.image_url,
            "featured": self.featured,
            "created_at": self.created_at.isoformat(),
        }