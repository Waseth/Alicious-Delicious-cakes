from datetime import datetime, timedelta
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.cake import Cake
from models.order import Order, OrderItem
from utils.helpers import success_response, error_response

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")

DEPOSIT_RATE = 0.50


def _get_current_user():
    from models.user import User
    identity = get_jwt_identity()
    return User.query.get(int(identity))

@orders_bp.route("", methods=["POST"])
@jwt_required()
def create_order():
    user = _get_current_user()
    data = request.get_json(silent=True) or {}

    cart_items     = data.get("items", [])
    delivery_date  = data.get("delivery_date")
    custom_message = data.get("custom_message", "")

    if not cart_items:
        return error_response("Order must contain at least one item.", 400)

    order_items = []
    total_price = 0.0

    for item in cart_items:
        cake_id  = item.get("cake_id")
        quantity = int(item.get("quantity", 1))

        if quantity < 1:
            return error_response(f"Invalid quantity for cake_id {cake_id}.", 400)

        cake = Cake.query.get(cake_id)
        if not cake:
            return error_response(f"Cake with id {cake_id} not found.", 404)

        line_total  = float(cake.base_price) * quantity
        total_price += line_total

        order_items.append(
            OrderItem(
                cake_id=cake.id,
                quantity=quantity,
                price_at_time=float(cake.base_price),
            )
        )

    deposit_required = round(total_price * DEPOSIT_RATE, 2)

    parsed_delivery = None
    if delivery_date:
        try:
            parsed_delivery = datetime.fromisoformat(delivery_date)
        except ValueError:
            return error_response("Invalid delivery_date format. Use ISO 8601.", 400)

    order = Order(
        user_id=user.id,
        total_price=round(total_price, 2),
        deposit_required=deposit_required,
        delivery_date=parsed_delivery,
        custom_message=custom_message,
        status="order_received",
    )
    db.session.add(order)
    db.session.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.session.add(oi)

    db.session.commit()

    return success_response(
        order.to_dict(include_items=True),
        "Order placed successfully. Please pay the deposit within 24 hours.",
        201,
    )


@orders_bp.route("/my-orders", methods=["GET"])
@jwt_required()
def my_orders():
    user = _get_current_user()
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))

    pagination = (
        Order.query.filter_by(user_id=user.id)
        .order_by(Order.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return success_response({
        "orders": [o.to_dict(include_items=True) for o in pagination.items],
        "total":  pagination.total,
        "pages":  pagination.pages,
        "current_page": page,
    })


@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    user  = _get_current_user()
    order = Order.query.get_or_404(order_id)

    if user.role != "admin" and order.user_id != user.id:
        return error_response("Access denied.", 403)

    return success_response(order.to_dict(include_items=True))

@orders_bp.route("/<int:order_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_order(order_id):
    user  = _get_current_user()
    order = Order.query.get_or_404(order_id)

    if user.role != "admin" and order.user_id != user.id:
        return error_response("Access denied.", 403)

    if order.status == "cancelled":
        return error_response("Order is already cancelled.", 400)

    if order.status == "baking_in_progress":
        return error_response(
            "Cannot cancel — baking has already started.", 400
        )

    data   = request.get_json(silent=True) or {}
    reason = data.get("reason", "Cancelled by customer.")

    order.status               = "cancelled"
    order.cancellation_reason  = reason
    db.session.commit()

    from services.notification_service import notify_order_status_change
    notify_order_status_change(order, order.user)

    return success_response(order.to_dict(), "Order cancelled.")


def auto_cancel_unpaid_orders():
    cutoff = datetime.utcnow() - timedelta(hours=24)
    stale  = Order.query.filter(
        Order.status == "order_received",
        Order.deposit_paid == False,
        Order.created_at <= cutoff,
    ).all()

    for order in stale:
        order.status              = "cancelled"
        order.cancellation_reason = "Auto-cancelled: deposit not paid within 24 hours."

    if stale:
        db.session.commit()
        for order in stale:
            from services.notification_service import notify_order_status_change
            notify_order_status_change(order, order.user)

    return len(stale)