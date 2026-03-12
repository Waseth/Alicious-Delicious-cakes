import base64
import logging
from datetime import datetime
from flask import current_app

logger = logging.getLogger(__name__)


def _get_access_token() -> str | None:
    """Fetch OAuth token from Daraja API."""
    # ── REAL implementation ───────────────────────────────────────────────
    # import requests
    # consumer_key    = current_app.config["MPESA_CONSUMER_KEY"]
    # consumer_secret = current_app.config["MPESA_CONSUMER_SECRET"]
    # credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    # resp = requests.get(
    #     "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    #     headers={"Authorization": f"Basic {credentials}"},
    #     timeout=10,
    # )
    # return resp.json().get("access_token")
    return "MOCK_TOKEN"


def _generate_password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


def initiate_stk_push(phone_number: str, amount: float, order_id: int, payment_type: str) -> dict:
    """
    Trigger M-Pesa STK push to collect payment.

    Returns:
        {
            "success": bool,
            "checkout_request_id": str | None,
            "error": str | None,
        }
    """
    shortcode = current_app.config["MPESA_SHORTCODE"]
    passkey   = current_app.config["MPESA_PASSKEY"]
    callback  = current_app.config["MPESA_CALLBACK_URL"]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password  = _generate_password(shortcode, passkey, timestamp)

    account_ref = f"ORDER-{order_id}"
    description = f"Alicious Delicious – {payment_type} payment"

    logger.info(
        "[MPESA MOCK] STK Push | Phone: %s | Amount: %.2f | Order: %s | Type: %s",
        phone_number, amount, order_id, payment_type,
    )
    return {
        "success": True,
        "checkout_request_id": f"MOCK-CRI-{order_id}-{timestamp}",
        "error": None,
    }

    # ── REAL implementation ───────────────────────────────────────────────
    # import requests
    # token = _get_access_token()
    # payload = {
    #     "BusinessShortCode": shortcode,
    #     "Password": password,
    #     "Timestamp": timestamp,
    #     "TransactionType": "CustomerPayBillOnline",
    #     "Amount": int(amount),
    #     "PartyA": phone_number,
    #     "PartyB": shortcode,
    #     "PhoneNumber": phone_number,
    #     "CallBackURL": callback,
    #     "AccountReference": account_ref,
    #     "TransactionDesc": description,
    # }
    # try:
    #     resp = requests.post(
    #         "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    #         json=payload,
    #         headers={"Authorization": f"Bearer {token}"},
    #         timeout=15,
    #     )
    #     data = resp.json()
    #     if data.get("ResponseCode") == "0":
    #         return {"success": True, "checkout_request_id": data.get("CheckoutRequestID"), "error": None}
    #     return {"success": False, "checkout_request_id": None, "error": data.get("errorMessage", "STK push failed")}
    # except Exception as exc:
    #     logger.error("M-Pesa STK Push error: %s", exc)
    #     return {"success": False, "checkout_request_id": None, "error": str(exc)}


def handle_mpesa_callback(callback_data: dict) -> dict:
    """
    Process Daraja STK callback payload.
    Returns parsed payment result.
    """
    stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
    result_code  = stk_callback.get("ResultCode")
    checkout_id  = stk_callback.get("CheckoutRequestID")

    if result_code != 0:
        return {
            "success": False,
            "checkout_request_id": checkout_id,
            "error": stk_callback.get("ResultDesc"),
        }

    # Extract metadata items
    metadata = {}
    items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
    for item in items:
        metadata[item.get("Name")] = item.get("Value")

    return {
        "success": True,
        "checkout_request_id": checkout_id,
        "mpesa_receipt": metadata.get("MpesaReceiptNumber"),
        "amount": metadata.get("Amount"),
        "phone": metadata.get("PhoneNumber"),
    }
