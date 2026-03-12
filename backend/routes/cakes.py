"""
Cake catalog routes
GET  /cakes
GET  /cakes/featured
POST /admin/cakes
PATCH /admin/cakes/<id>
DELETE /admin/cakes/<id>
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from extensions import db
from models.cake import Cake
from utils.decorators import admin_required
from utils.helpers import success_response, error_response, paginate_query

cakes_bp  = Blueprint("cakes",       __name__, url_prefix="/cakes")
admin_cakes_bp = Blueprint("admin_cakes", __name__, url_prefix="/admin/cakes")

PRICE_TIERS = {
    "budget":   (0,    1500),
    "mid":      (1500, 4000),
    "premium":  (4000, 9999999),
}


@cakes_bp.route("", methods=["GET"])
def list_cakes():
    search     = request.args.get("search", "").strip()
    category   = request.args.get("category", "").strip()
    flavor     = request.args.get("flavor", "").strip()
    price_tier = request.args.get("price_tier", "").strip()
    page       = int(request.args.get("page", 1))
    per_page   = int(request.args.get("per_page", 12))

    query = Cake.query

    if search:
        query = query.filter(
            (Cake.name.ilike(f"%{search}%")) | (Cake.description.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter_by(category=category)
    if flavor:
        query = query.filter_by(flavor=flavor)
    if price_tier and price_tier in PRICE_TIERS:
        low, high = PRICE_TIERS[price_tier]
        query = query.filter(Cake.base_price >= low, Cake.base_price <= high)

    query = query.order_by(Cake.created_at.desc())
    result = paginate_query(query, page, per_page)
    result["items"] = [c.to_dict() for c in result["items"]]

    return success_response(result)


@cakes_bp.route("/featured", methods=["GET"])
def featured_cakes():
    cakes = Cake.query.filter_by(featured=True).order_by(Cake.created_at.desc()).all()
    return success_response([c.to_dict() for c in cakes])


@admin_cakes_bp.route("", methods=["POST"])
@admin_required
def create_cake():
    data = request.get_json(silent=True) or {}

    name       = (data.get("name") or "").strip()
    base_price = data.get("base_price")
    category   = data.get("category", "casual")
    flavor     = data.get("flavor", "classic")

    errors = {}
    if not name:
        errors["name"] = "Cake name is required."
    if base_price is None:
        errors["base_price"] = "Base price is required."
    else:
        try:
            base_price = float(base_price)
            if base_price <= 0:
                raise ValueError
        except (ValueError, TypeError):
            errors["base_price"] = "Base price must be a positive number."
    if category not in ("birthday", "wedding", "graduation", "casual"):
        errors["category"] = "Invalid category."
    if flavor not in ("classic", "chocolate", "fruity", "specialty"):
        errors["flavor"] = "Invalid flavor."

    if errors:
        return error_response("Validation failed.", 422, errors)

    cake = Cake(
        name=name,
        description=data.get("description", ""),
        base_price=base_price,
        category=category,
        flavor=flavor,
        image_url=data.get("image_url"),
        featured=bool(data.get("featured", False)),
    )
    db.session.add(cake)
    db.session.commit()

    return success_response(cake.to_dict(), "Cake created successfully.", 201)


@admin_cakes_bp.route("/<int:cake_id>", methods=["PATCH"])
@admin_required
def update_cake(cake_id):
    cake = Cake.query.get_or_404(cake_id)
    data = request.get_json(silent=True) or {}

    allowed_fields = ["name", "description", "base_price", "category",
                      "flavor", "image_url", "featured"]
    for field in allowed_fields:
        if field in data:
            if field == "base_price":
                try:
                    val = float(data[field])
                    if val <= 0:
                        raise ValueError
                    setattr(cake, field, val)
                except (ValueError, TypeError):
                    return error_response("base_price must be a positive number.", 422)
            elif field == "featured":
                setattr(cake, field, bool(data[field]))
            else:
                setattr(cake, field, data[field])

    db.session.commit()
    return success_response(cake.to_dict(), "Cake updated successfully.")


@admin_cakes_bp.route("/<int:cake_id>", methods=["DELETE"])
@admin_required
def delete_cake(cake_id):
    cake = Cake.query.get_or_404(cake_id)
    db.session.delete(cake)
    db.session.commit()
    return success_response(message="Cake deleted successfully.")
