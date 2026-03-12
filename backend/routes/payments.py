"""
Payment routes
POST /payments/deposit
POST /payments/balance
POST /payments/mpesa-callback  (M-Pesa Daraja callback)
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.order import Order
from models.payment import Payment
from services.mpesa_service import initiate_stk_push, handle_mpesa_callback
from services.notification_service import notify_order_status_change
from utils.helpers import success_response, error_response
from utils.validators import normalize_phone

payments_bp = Blueprint("payments", __name__, url_prefix="/payments")


def _get_current_user():
    from models.user import User
    return User.query.get(get_jwt_identity().get("user_id"))


def _assert_owns_order(user, order):
    if user.role != "admin" and order.user_id != user.id:
        return error_response("Access denied.", 403)
    return None


@payments_bp.route("/deposit", methods=["POST"])
@jwt_required()
def pay_deposit():
    user = _get_current_user()
    data = request.get_json(silent=True) or {}

    order_id = data.get("order_id")
    order    = Order.query.get(order_id)
    if not order:
        return error_response("Order not found.", 404)

    err = _assert_owns_order(user, order)
    if err:
        return err

    if order.deposit_paid:
        return error_response("Deposit has already been paid.", 400)

    if order.status == "cancelled":
        return error_response("Cannot pay for a cancelled order.", 400)

    phone = normalize_phone(data.get("phone_number") or user.phone_number)
    amount = float(order.deposit_required)

    result = initiate_stk_push(phone, amount, order.id, "deposit")
    if not result["success"]:
        return error_response(f"M-Pesa error: {result['error']}", 502)

    payment = Payment(
        order_id=order.id,
        amount=amount,
        payment_type="deposit",
        mpesa_checkout_request_id=result["checkout_request_id"],
        status="pending",
    )
    db.session.add(payment)
    db.session.commit()

    return success_response(
        {
            "payment": payment.to_dict(),
            "checkout_request_id": result["checkout_request_id"],
        },
        "STK Push sent. Enter M-Pesa PIN to complete payment.",
    )


@payments_bp.route("/balance", methods=["POST"])
@jwt_required()
def pay_balance():
    user = _get_current_user()
    data = request.get_json(silent=True) or {}

    order_id = data.get("order_id")
    order    = Order.query.get(order_id)
    if not order:
        return error_response("Order not found.", 404)

    err = _assert_owns_order(user, order)
    if err:
        return err

    if not order.deposit_paid:
        return error_response("Deposit must be paid before paying the balance.", 400)

    if order.balance_paid:
        return error_response("Balance has already been paid.", 400)

    if order.status == "cancelled":
        return error_response("Cannot pay for a cancelled order.", 400)

    phone  = normalize_phone(data.get("phone_number") or user.phone_number)
    amount = order.balance_due

    result = initiate_stk_push(phone, amount, order.id, "balance")
    if not result["success"]:
        return error_response(f"M-Pesa error: {result['error']}", 502)

    payment = Payment(
        order_id=order.id,
        amount=amount,
        payment_type="balance",
        mpesa_checkout_request_id=result["checkout_request_id"],
        status="pending",
    )
    db.session.add(payment)
    db.session.commit()

    return success_response(
        {
            "payment": payment.to_dict(),
            "checkout_request_id": result["checkout_request_id"],
        },
        "STK Push sent. Enter M-Pesa PIN to complete payment.",
    )


@payments_bp.route("/mpesa-callback", methods=["POST"])
def mpesa_callback():
    callback_data = request.get_json(silent=True) or {}
    result = handle_mpesa_callback(callback_data)

    if not result.get("success"):
        checkout_id = result.get("checkout_request_id")
        payment = Payment.query.filter_by(
            mpesa_checkout_request_id=checkout_id, status="pending"
        ).first()
        if payment:
            payment.status = "failed"
            db.session.commit()
        return success_response(message="Callback received (payment failed).")

    checkout_id   = result.get("checkout_request_id")
    mpesa_receipt = result.get("mpesa_receipt")

    payment = Payment.query.filter_by(
        mpesa_checkout_request_id=checkout_id, status="pending"
    ).first()

    if not payment:
        return success_response(message="Callback received (no matching payment).")

    payment.status        = "completed"
    payment.mpesa_receipt = mpesa_receipt

    order = payment.order

    if payment.payment_type == "deposit":
        order.deposit_paid = True
        order.status       = "order_received"
    elif payment.payment_type == "balance":
        order.balance_paid = True
        order.status       = "delivered"

    db.session.commit()
    notify_order_status_change(order, order.user)

    return success_response(message="Payment recorded successfully.")


@payments_bp.route("/confirm-mock", methods=["POST"])
@jwt_required()
def confirm_mock_payment():
    """
    Development helper — manually confirm a pending payment without
    waiting for the M-Pesa callback.
    """
    user = _get_current_user()
    if user.role != "admin":
        return error_response("Admin only.", 403)

    data       = request.get_json(silent=True) or {}
    payment_id = data.get("payment_id")
    receipt    = data.get("mpesa_receipt", f"MOCK-{payment_id}")

    payment = Payment.query.get(payment_id)
    if not payment:
        return error_response("Payment not found.", 404)

    payment.status        = "completed"
    payment.mpesa_receipt = receipt

    order = payment.order
    if payment.payment_type == "deposit":
        order.deposit_paid = True
        order.status       = "order_received"
    elif payment.payment_type == "balance":
        order.balance_paid = True
        order.status       = "delivered"

    db.session.commit()
    notify_order_status_change(order, order.user)

    return success_response(payment.to_dict(), "Payment confirmed.")
