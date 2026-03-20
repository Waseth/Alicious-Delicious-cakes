import re
import logging
from flask import current_app

logger = logging.getLogger(__name__)

ORDER_STATUS_MESSAGES = {
    "order_received": (
        "Hi {name}! Your order #{order_id} has been received by "
        "Alicious Delicious Cakes. Please complete your 50% deposit of "
        "Ksh {deposit} to confirm your order. Thank you!"
    ),
    "baking_in_progress": (
        "Hi, {name}! Baking has started for your order #{order_id}. "
        "We will notify you when your cake is ready."
    ),
    "cake_ready": (
        "Your cake is READY, {name}! Order #{order_id} is waiting for you. "
        "We will prompt you to pay Ksh {balance} upon delivery."
    ),
    "delivered": (
        "Order #{order_id} has been delivered successfully.Thank you for choosing "
        "Alicious Delicious Cakes, {name}! We hope you enjoy every bite"
    ),
    "cancelled": (
        "Your order #{order_id} has been cancelled. Reason: {reason}. "
        "Contact us at Alicious Delicious Cakes for assistance."
    ),
}


def _format_phone(phone_number: str) -> str:
    clean = re.sub(r'\D', '', str(phone_number))
    if clean.startswith('0'):
        return '+254' + clean[1:]
    elif clean.startswith('7') and len(clean) == 9:
        return '+254' + clean
    elif clean.startswith('254'):
        return '+' + clean
    return '+254' + clean


def send_sms(phone_number: str, message: str) -> dict:
    username = current_app.config.get("AT_USERNAME")
    api_key = current_app.config.get("AT_API_KEY")
    formatted_number = _format_phone(phone_number)

    logger.info("[SMS] To: %s (formatted: %s)", phone_number, formatted_number)

    if not username or not api_key:
        logger.info("[SMS MOCK] To: %s | Message: %s", formatted_number, message)
        return {"success": True, "message_id": "MOCK-ID", "error": None}

    try:
        import africastalking
        africastalking.initialize(username, api_key)
        sms = africastalking.SMS

        response = sms.send(message, [formatted_number])
        logger.info("[SMS] Full response: %s", response)

        if isinstance(response, dict):
            recipients = response.get("SMSMessageData", {}).get("Recipients", [])
            if recipients and recipients[0].get("status") == "Success":
                message_id = recipients[0].get("messageId")
                logger.info("[SMS] Sent successfully. ID: %s", message_id)
                return {"success": True, "message_id": message_id, "error": None}
            else:
                error_msg = recipients[0].get("status", "Unknown") if recipients else "No recipients"
                logger.error("[SMS] Failed: %s", error_msg)
                return {"success": False, "message_id": None, "error": error_msg}

        logger.error("[SMS] Unexpected response type: %s", type(response))
        return {"success": False, "message_id": None, "error": f"Unexpected response: {type(response)}"}

    except ImportError:
        logger.error("[SMS] africastalking not installed. Run: pip install africastalking")
        return {"success": False, "message_id": None, "error": "africastalking not installed"}
    except Exception as exc:
        logger.error("[SMS] Error: %s", str(exc))
        return {"success": False, "message_id": None, "error": str(exc)}


def send_order_status_sms(order, user) -> dict:
    template = ORDER_STATUS_MESSAGES.get(order.status)
    if not template:
        logger.warning("[SMS] No template for status: %s", order.status)
        return {"success": False, "error": "No template for status"}

    message = template.format(
        name=user.name.split()[0],
        order_id=order.id,
        deposit=f"{float(order.deposit_required):,.0f}",
        balance=f"{order.balance_due:,.0f}",
        reason=order.cancellation_reason or "N/A",
    )
    return send_sms(user.phone_number, message)