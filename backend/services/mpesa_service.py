import base64
import logging
from datetime import datetime
from flask import current_app

logger = logging.getLogger(__name__)


def _get_access_token() -> str | None:
    import requests
    consumer_key    = current_app.config["MPESA_CONSUMER_KEY"]
    consumer_secret = current_app.config["MPESA_CONSUMER_SECRET"]

    print(f"\n DEBUG - Consumer Key from config: {consumer_key[:10] if consumer_key else 'NOT FOUND'}...")
    print(f" DEBUG - Consumer Secret from config: {consumer_secret[:10] if consumer_secret else 'NOT FOUND'}...")

    if not consumer_key or not consumer_secret:
        print("DEBUG - Consumer Key or Secret missing!")
        return None

    credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    resp = requests.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {credentials}"},
        timeout=10,
    )
    if resp.status_code == 200:
        token = resp.json().get("access_token")
        logger.info("[Daraja] OAuth token obtained successfully")
        return token
    else:
        logger.error(f"[Daraja] Failed to get token: {resp.status_code} - {resp.text}")
        return None


def _generate_password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


def initiate_stk_push(phone_number: str, amount: float, order_id: int, payment_type: str) -> dict:
    import requests

    shortcode = current_app.config["MPESA_SHORTCODE"]
    passkey   = current_app.config["MPESA_PASSKEY"]
    print(f"\n DEBUG - Passkey from config: {passkey[:50]}...")
    print(f" DEBUG - Passkey length: {len(passkey)}")
    callback  = current_app.config["MPESA_CALLBACK_URL"]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password  = _generate_password(shortcode, passkey, timestamp)

    account_ref = f"ORDER-{order_id}"
    description = f"Alicious Delicious – {payment_type} payment"

    token = _get_access_token()
    if not token:
        logger.error("[Daraja] Failed to get access token")
        return {
            "success": False,
            "checkout_request_id": None,
            "error": "Failed to get access token from Safaricom"
        }

    print(f"\n DEBUG - Token obtained: {token[:20]}...")
    print(f" DEBUG - Shortcode: {shortcode}")
    print(f" DEBUG - Phone: {phone_number}")
    print(f" DEBUG - Amount: {amount}")
    print(f" DEBUG - Callback: {callback}")

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": callback,
        "AccountReference": account_ref,
        "TransactionDesc": description,
    }

    print(f" DEBUG - Payload: {payload}")

    logger.info(f"[Daraja] Sending STK Push to {phone_number} for amount {amount}")

    try:
        resp = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )

        print(f" DEBUG - Response Status: {resp.status_code}")
        print(f" DEBUG - Response Headers: {dict(resp.headers)}")
        print(f" DEBUG - Response Text: {resp.text}")

        data = resp.json()
        logger.info(f"[Daraja] STK Push response: {data}")

        if data.get("ResponseCode") == "0":
            checkout_id = data.get("CheckoutRequestID")
            logger.info(f"[Daraja] STK Push accepted. CheckoutRequestID: {checkout_id}")
            return {
                "success": True,
                "checkout_request_id": checkout_id,
                "error": None
            }
        else:
            error_msg = data.get("errorMessage", "STK push failed")
            logger.error(f"[Daraja] STK Push failed: {error_msg}")
            return {
                "success": False,
                "checkout_request_id": None,
                "error": error_msg
            }

    except requests.exceptions.Timeout:
        logger.error("[Daraja] STK Push timeout")
        return {
            "success": False,
            "checkout_request_id": None,
            "error": "Request timeout - please try again"
        }
    except Exception as exc:
        logger.error(f"[Daraja] STK Push error: {exc}")
        return {
            "success": False,
            "checkout_request_id": None,
            "error": str(exc)
        }


def handle_mpesa_callback(callback_data: dict) -> dict:
    stk_callback = callback_data.get("Body", {}).get("stkCallback", {})
    result_code  = stk_callback.get("ResultCode")
    checkout_id  = stk_callback.get("CheckoutRequestID")

    if result_code != 0:
        return {
            "success": False,
            "checkout_request_id": checkout_id,
            "error": stk_callback.get("ResultDesc"),
        }

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
