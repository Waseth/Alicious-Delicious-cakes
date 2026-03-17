import logging
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.order import Order
from models.payment import Payment
from services.mpesa_service import DarajaService, initiate_stk_push, handle_mpesa_callback
from services.notification_service import notify_order_status_change
from utils.helpers import success_response, error_response
from utils.validators import normalize_phone

logger = logging.getLogger(__name__)

payments_bp = Blueprint("payments", __name__, url_prefix="/payments")


def _get_current_user():
    from models.user import User
    return User.query.get(int(get_jwt_identity()))


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
    if not order_id:
        return error_response("order_id is required.", 400)

    order = Order.query.get(order_id)
    if not order:
        return error_response("Order not found.", 404)

    ownership_err = _assert_owns_order(user, order)
    if ownership_err:
        return ownership_err

    if order.status == "cancelled":
        return error_response("Cannot pay for a cancelled order.", 400)

    if order.deposit_paid:
        return error_response("Deposit has already been paid.", 400)

    phone = normalize_phone(data.get("phone_number") or user.phone_number)
    amount = float(order.deposit_required)

    logger.info("[Payment] Deposit STK Push | User: %s | Order: %s | Amount: KES %.2f | Phone: %s",
                user.id, order.id, amount, phone)

    result = initiate_stk_push(phone, amount, order.id, "deposit")

    if not result["success"]:
        logger.error("[Payment] Deposit STK Push FAILED | Order: %s | Error: %s", order.id, result.get("error"))
        return error_response(f"M-Pesa error: {result.get('error', 'Unknown error')}", 502)

    payment = Payment(
        order_id=order.id,
        amount=amount,
        payment_type="deposit",
        mpesa_checkout_request_id=result["checkout_request_id"],
        status="pending",
    )
    db.session.add(payment)
    db.session.commit()

    logger.info("[Payment] Deposit pending | Payment ID: %s | CheckoutRequestID: %s",
                payment.id, result["checkout_request_id"])

    return success_response(
        {
            "payment": payment.to_dict(),
            "checkout_request_id": result["checkout_request_id"],
            "customer_message": result.get("customer_message"),
        },
        "STK Push sent to your phone. Enter your M-Pesa PIN to complete.",
    )


@payments_bp.route("/balance", methods=["POST"])
@jwt_required()
def pay_balance():
    user = _get_current_user()
    data = request.get_json(silent=True) or {}

    order_id = data.get("order_id")
    if not order_id:
        return error_response("order_id is required.", 400)

    order = Order.query.get(order_id)
    if not order:
        return error_response("Order not found.", 404)

    ownership_err = _assert_owns_order(user, order)
    if ownership_err:
        return ownership_err

    if order.status == "cancelled":
        return error_response("Cannot pay for a cancelled order.", 400)

    if not order.deposit_paid:
        return error_response("Deposit must be paid before paying the balance.", 400)

    if order.balance_paid:
        return error_response("Balance has already been paid.", 400)

    phone = normalize_phone(data.get("phone_number") or user.phone_number)
    amount = float(order.balance_due)

    logger.info("[Payment] Balance STK Push | User: %s | Order: %s | Amount: KES %.2f | Phone: %s",
                user.id, order.id, amount, phone)

    result = initiate_stk_push(phone, amount, order.id, "balance")

    if not result["success"]:
        logger.error("[Payment] Balance STK Push FAILED | Order: %s | Error: %s", order.id, result.get("error"))
        return error_response(f"M-Pesa error: {result.get('error', 'Unknown error')}", 502)

    payment = Payment(
        order_id=order.id,
        amount=amount,
        payment_type="balance",
        mpesa_checkout_request_id=result["checkout_request_id"],
        status="pending",
    )
    db.session.add(payment)
    db.session.commit()

    logger.info("[Payment] Balance pending | Payment ID: %s | CheckoutRequestID: %s",
                payment.id, result["checkout_request_id"])

    return success_response(
        {
            "payment": payment.to_dict(),
            "checkout_request_id": result["checkout_request_id"],
            "customer_message": result.get("customer_message"),
        },
        "STK Push sent to your phone. Enter your M-Pesa PIN to complete.",
    )


@payments_bp.route("/mpesa-callback", methods=["POST"])
def mpesa_callback():
    raw_data = request.get_json(silent=True) or {}
    logger.info("[Callback] Raw M-Pesa callback payload: %s", raw_data)

    result = handle_mpesa_callback(raw_data)
    checkout_id = result.get("checkout_request_id")

    if not result.get("success"):
        logger.warning("[Callback] Payment FAILED | CheckoutID: %s | Code: %s | Desc: %s",
                       checkout_id, result.get("result_code"), result.get("result_desc"))
        payment = Payment.query.filter_by(
            mpesa_checkout_request_id=checkout_id, status="pending"
        ).first()
        if payment:
            payment.status = "failed"
            db.session.commit()
            logger.info("[Callback] Payment %s marked as FAILED.", payment.id)
        return success_response(message="Callback received (payment failed).")

    mpesa_receipt = result.get("mpesa_receipt")

    payment = Payment.query.filter_by(
        mpesa_checkout_request_id=checkout_id, status="pending"
    ).first()

    if not payment:
        logger.warning("[Callback] No pending payment found for CheckoutID: %s", checkout_id)
        return success_response(message="Callback received (no matching payment).")

    if Payment.query.filter_by(mpesa_receipt=mpesa_receipt).first():
        logger.warning("[Callback] Duplicate callback — receipt %s already processed.", mpesa_receipt)
        return success_response(message="Callback already processed.")

    payment.status = "completed"
    payment.mpesa_receipt = mpesa_receipt

    order = payment.order

    if payment.payment_type == "deposit":
        order.deposit_paid = True
        order.status = "order_received"
        logger.info("[Callback] Deposit confirmed | Order: %s | Receipt: %s", order.id, mpesa_receipt)
    elif payment.payment_type == "balance":
        order.balance_paid = True
        order.status = "delivered"
        logger.info("[Callback] Balance confirmed | Order: %s | Receipt: %s", order.id, mpesa_receipt)

    db.session.commit()

    try:
        notify_order_status_change(order, order.user)
    except Exception as exc:
        logger.error("[Callback] SMS notification failed: %s", exc)

    return success_response(message="Payment recorded successfully.")


@payments_bp.route("/status/<int:payment_id>", methods=["GET"])
@jwt_required()
def payment_status(payment_id):
    user = _get_current_user()
    payment = Payment.query.get(payment_id)

    if not payment:
        return error_response("Payment not found.", 404)

    if user.role != "admin" and payment.order.user_id != user.id:
        return error_response("Access denied.", 403)

    if payment.status in ("completed", "failed"):
        return success_response(
            {"payment": payment.to_dict(), "daraja_query": None},
            f"Payment is already {payment.status}.",
        )

    service = DarajaService()
    query_result = service.query_stk_status(payment.mpesa_checkout_request_id)
    logger.info("[Status] STK query for payment %s: %s", payment_id, query_result)

    return success_response(
        {"payment": payment.to_dict(), "daraja_query": query_result},
        "Status retrieved.",
    )


@payments_bp.route("/confirm-mock", methods=["POST"])
@jwt_required()
def confirm_mock_payment():
    user = _get_current_user()
    if user.role != "admin":
        return error_response("Admin only.", 403)

    data = request.get_json(silent=True) or {}
    payment_id = data.get("payment_id")
    receipt = data.get("mpesa_receipt", f"MOCK-RCPT-{payment_id}")

    if not payment_id:
        return error_response("payment_id is required.", 400)

    payment = Payment.query.get(payment_id)
    if not payment:
        return error_response("Payment not found.", 404)

    if payment.status != "pending":
        return error_response(f"Payment is already '{payment.status}' — cannot re-confirm.", 400)

    payment.status = "completed"
    payment.mpesa_receipt = receipt

    order = payment.order
    if payment.payment_type == "deposit":
        order.deposit_paid = True
        order.status = "order_received"
    elif payment.payment_type == "balance":
        order.balance_paid = True
        order.status = "delivered"

    db.session.commit()

    logger.info("[MockConfirm] Payment %s confirmed | Order: %s | Receipt: %s",
                payment.id, order.id, receipt)

    try:
        notify_order_status_change(order, order.user)
    except Exception as exc:
        logger.error("[MockConfirm] SMS notification failed: %s", exc)

    return success_response(payment.to_dict(), "Payment confirmed (mock).")