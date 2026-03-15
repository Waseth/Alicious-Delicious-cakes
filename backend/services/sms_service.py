import logging
from flask import current_app

logger = logging.getLogger(__name__)

ORDER_STATUS_MESSAGES = {
    "order_received": (
        "🎂 Hi {name}! Your order #{order_id} has been received by "
        "Alicious Delicious Cakes. Please complete your 50% deposit of "
        "KES {deposit} to confirm your order. Thank you!"
    ),
    "baking_in_progress": (
        "🥚 Great news, {name}! Baking has started for your order #{order_id}. "
        "We'll notify you when your cake is ready. — Alicious Delicious Cakes"
    ),
    "cake_ready": (
        "🎉 Your cake is READY, {name}! Order #{order_id} is waiting for you. "
        "Please complete the balance payment of KES {balance} to arrange pickup/delivery. "
        "— Alicious Delicious Cakes"
    ),
    "delivered": (
        "✅ Order #{order_id} marked as delivered. Thank you for choosing "
        "Alicious Delicious Cakes, {name}! We hope you enjoy every bite 🎂"
    ),
    "cancelled": (
        "❌ Your order #{order_id} has been cancelled. Reason: {reason}. "
        "Contact us at Alicious Delicious Cakes for assistance."
    ),
}


def send_sms(phone_number: str, message: str) -> dict:
    """
    Send SMS via Africa's Talking.
    Returns a result dict with keys: success, message_id, error.

    To enable real sending:
      1. pip install africastalking
      2. Uncomment the AT block below and remove the mock block.
    """
    # ── MOCK implementation (always succeeds in dev) ──────────────────────
    logger.info("[SMS MOCK] To: %s | Message: %s", phone_number, message)
    return {"success": True, "message_id": "MOCK-ID", "error": None}

    # ── REAL Africa's Talking implementation ──────────────────────────────
    # import africastalking
    # username = current_app.config["AT_USERNAME"]
    # api_key  = current_app.config["AT_API_KEY"]
    # sender   = current_app.config.get("AT_SENDER_ID")
    #
    # africastalking.initialize(username, api_key)
    # sms = africastalking.SMS
    # try:
    #     response = sms.send(message, [phone_number], sender_id=sender)
    #     recipients = response.get("SMSMessageData", {}).get("Recipients", [])
    #     if recipients and recipients[0].get("status") == "Success":
    #         return {"success": True, "message_id": recipients[0].get("messageId"), "error": None}
    #     return {"success": False, "message_id": None, "error": str(recipients)}
    # except Exception as exc:
    #     logger.error("Africa's Talking SMS error: %s", exc)
    #     return {"success": False, "message_id": None, "error": str(exc)}


def send_order_status_sms(order, user) -> dict:
    """Build and send the appropriate SMS for an order's current status."""
    template = ORDER_STATUS_MESSAGES.get(order.status)
    if not template:
        return {"success": False, "error": "No template for status"}

    message = template.format(
        name=user.name.split()[0],
        order_id=order.id,
        deposit=f"{float(order.deposit_required):,.0f}",
        balance=f"{order.balance_due:,.0f}",
        reason=order.cancellation_reason or "N/A",
    )
    return send_sms(user.phone_number, message)
