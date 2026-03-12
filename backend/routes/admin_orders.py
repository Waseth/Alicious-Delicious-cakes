"""
Admin order management routes
GET   /admin/orders
PATCH /admin/orders/<id>/start-baking
PATCH /admin/orders/<id>/mark-ready
PATCH /admin/orders/<id>/mark-delivered
"""
from flask import Blueprint, request

from extensions import db
from models.order import Order
from services.notification_service import notify_order_status_change
from utils.decorators import admin_required
from utils.helpers import success_response, error_response

admin_orders_bp = Blueprint("admin_orders", __name__, url_prefix="/admin/orders")


@admin_orders_bp.route("", methods=["GET"])
@admin_required
def list_all_orders():
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    status   = request.args.get("status", "").strip()

    query = Order.query
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Order.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response({
        "orders": [o.to_dict(include_items=True) for o in pagination.items],
        "total":  pagination.total,
        "pages":  pagination.pages,
        "current_page": page,
    })


@admin_orders_bp.route("/<int:order_id>/start-baking", methods=["PATCH"])
@admin_required
def start_baking(order_id):
    order = Order.query.get_or_404(order_id)

    if not order.deposit_paid:
        return error_response("Deposit must be paid before baking starts.", 400)

    if order.status != "order_received":
        return error_response(
            f"Cannot start baking from status '{order.status}'.", 400
        )

    order.status = "baking_in_progress"
    db.session.commit()
    notify_order_status_change(order, order.user)

    return success_response(order.to_dict(), "Baking started. Customer notified.")


@admin_orders_bp.route("/<int:order_id>/mark-ready", methods=["PATCH"])
@admin_required
def mark_ready(order_id):
    order = Order.query.get_or_404(order_id)

    if order.status != "baking_in_progress":
        return error_response(
            f"Cannot mark ready from status '{order.status}'.", 400
        )

    order.status = "cake_ready"
    db.session.commit()
    notify_order_status_change(order, order.user)

    return success_response(order.to_dict(), "Cake marked ready. Customer notified.")


@admin_orders_bp.route("/<int:order_id>/mark-delivered", methods=["PATCH"])
@admin_required
def mark_delivered(order_id):
    order = Order.query.get_or_404(order_id)

    if order.status not in ("cake_ready", "baking_in_progress"):
        return error_response(
            f"Cannot mark delivered from status '{order.status}'.", 400
        )

    if not order.balance_paid:
        return error_response(
            "Balance payment must be completed before marking as delivered.", 400
        )

    order.status = "delivered"
    db.session.commit()
    notify_order_status_change(order, order.user)

    return success_response(order.to_dict(), "Order marked as delivered. Customer notified.")
