import base64
import logging
import requests
from datetime import datetime
from flask import current_app

logger = logging.getLogger(__name__)

SANDBOX_BASE = "https://sandbox.safaricom.co.ke"
PRODUCTION_BASE = "https://api.safaricom.co.ke"


def _base_url() -> str:
    env = current_app.config.get("MPESA_ENV", "sandbox").lower()
    return PRODUCTION_BASE if env == "production" else SANDBOX_BASE


class DarajaService:

    def get_access_token(self) -> str:
        consumer_key = current_app.config.get("MPESA_CONSUMER_KEY", "")
        consumer_secret = current_app.config.get("MPESA_CONSUMER_SECRET", "")

        if not consumer_key or not consumer_secret:
            raise RuntimeError("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set in .env")

        credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"

        logger.info("[Daraja] Fetching OAuth token from %s", url)

        try:
            resp = requests.get(
                url,
                headers={"Authorization": f"Basic {credentials}"},
                timeout=15,
            )
            resp.raise_for_status()
        except requests.exceptions.RequestException as exc:
            logger.error("[Daraja] Token request failed: %s", exc)
            raise RuntimeError(f"Could not fetch Daraja access token: {exc}") from exc

        token = resp.json().get("access_token")
        if not token:
            raise RuntimeError(f"Daraja returned no access_token. Response: {resp.text}")

        logger.info("[Daraja] Access token obtained successfully.")
        return token

    def _generate_password(self):
        shortcode = current_app.config["MPESA_SHORTCODE"]
        passkey = current_app.config["MPESA_PASSKEY"]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        raw = f"{shortcode}{passkey}{timestamp}"
        password = base64.b64encode(raw.encode()).decode()
        return password, timestamp

    @staticmethod
    def _format_phone(phone: str) -> str:
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("+"):
            phone = phone[1:]
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        return phone

    def stk_push(self, phone, amount, order_id, payment_type):
        shortcode = current_app.config["MPESA_SHORTCODE"]
        callback_url = current_app.config["MPESA_CALLBACK_URL"]
        password, timestamp = self._generate_password()
        formatted_phone = self._format_phone(phone)
        rounded_amount = int(round(amount))

        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": rounded_amount,
            "PartyA": formatted_phone,
            "PartyB": shortcode,
            "PhoneNumber": formatted_phone,
            "CallBackURL": callback_url,
            "AccountReference": f"ADC-{order_id}",
            "TransactionDesc": f"Alicious Delicious Cakes {payment_type} order {order_id}",
        }

        logger.info(
            "[Daraja] STK Push | Phone: %s | Amount: KES %s | Order: %s | Type: %s",
            formatted_phone, rounded_amount, order_id, payment_type,
        )

        try:
            token = self.get_access_token()
            resp = requests.post(
                f"{_base_url()}/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
        except requests.exceptions.RequestException as exc:
            logger.error("[Daraja] STK Push network error: %s", exc)
            return {
                "success": False,
                "checkout_request_id": None,
                "merchant_request_id": None,
                "customer_message": None,
                "error": f"Network error: {exc}",
            }

        data = resp.json()
        logger.info("[Daraja] STK Push response: %s", data)

        if data.get("ResponseCode") == "0":
            logger.info("[Daraja] STK Push accepted. CheckoutRequestID: %s", data.get("CheckoutRequestID"))
            return {
                "success": True,
                "checkout_request_id": data.get("CheckoutRequestID"),
                "merchant_request_id": data.get("MerchantRequestID"),
                "customer_message": data.get("CustomerMessage"),
                "error": None,
            }

        error_msg = data.get("errorMessage") or data.get("ResponseDescription") or str(data)
        logger.warning("[Daraja] STK Push rejected: %s", error_msg)
        return {
            "success": False,
            "checkout_request_id": None,
            "merchant_request_id": None,
            "customer_message": None,
            "error": error_msg,
        }

    def query_stk_status(self, checkout_request_id):
        shortcode = current_app.config["MPESA_SHORTCODE"]
        password, timestamp = self._generate_password()

        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id,
        }

        logger.info("[Daraja] Querying STK status: %s", checkout_request_id)

        try:
            token = self.get_access_token()
            resp = requests.post(
                f"{_base_url()}/mpesa/stkpushquery/v1/query",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
        except requests.exceptions.RequestException as exc:
            logger.error("[Daraja] STK status query failed: %s", exc)
            return {"success": False, "error": str(exc)}

        data = resp.json()
        logger.info("[Daraja] STK status response: %s", data)

        result_code = data.get("ResultCode")
        return {
            "success": result_code == "0",
            "result_code": result_code,
            "description": data.get("ResultDesc"),
            "raw": data,
        }

    @staticmethod
    def parse_callback(callback_data):
        logger.info("[Daraja] Callback received: %s", callback_data)

        try:
            stk = callback_data["Body"]["stkCallback"]
        except (KeyError, TypeError):
            logger.error("[Daraja] Malformed callback — missing Body.stkCallback")
            return {
                "success": False,
                "checkout_request_id": None,
                "merchant_request_id": None,
                "mpesa_receipt": None,
                "amount": None,
                "phone": None,
                "transaction_date": None,
                "result_code": -1,
                "result_desc": "Malformed callback payload",
            }

        result_code = stk.get("ResultCode", -1)
        result_desc = stk.get("ResultDesc", "")
        checkout_request_id = stk.get("CheckoutRequestID")
        merchant_request_id = stk.get("MerchantRequestID")

        base = {
            "checkout_request_id": checkout_request_id,
            "merchant_request_id": merchant_request_id,
            "result_code": result_code,
            "result_desc": result_desc,
        }

        if result_code != 0:
            logger.warning(
                "[Daraja] Payment FAILED | CheckoutID: %s | Code: %s | Desc: %s",
                checkout_request_id, result_code, result_desc,
            )
            return {
                **base,
                "success": False,
                "mpesa_receipt": None,
                "amount": None,
                "phone": None,
                "transaction_date": None,
            }

        metadata = {}
        for item in stk.get("CallbackMetadata", {}).get("Item", []):
            name = item.get("Name")
            if name:
                metadata[name] = item.get("Value")

        mpesa_receipt = metadata.get("MpesaReceiptNumber")
        amount = metadata.get("Amount")
        phone = str(metadata.get("PhoneNumber", ""))
        transaction_date = str(metadata.get("TransactionDate", ""))

        logger.info(
            "[Daraja] Payment SUCCESS | Receipt: %s | Amount: KES %s | Phone: %s",
            mpesa_receipt, amount, phone,
        )

        return {
            **base,
            "success": True,
            "mpesa_receipt": mpesa_receipt,
            "amount": float(amount) if amount is not None else None,
            "phone": phone,
            "transaction_date": transaction_date,
        }


def initiate_stk_push(phone, amount, order_id, payment_type):
    service = DarajaService()
    try:
        return service.stk_push(phone, amount, order_id, payment_type)
    except RuntimeError as exc:
        logger.error("[Daraja] initiate_stk_push error: %s", exc)
        return {
            "success": False,
            "checkout_request_id": None,
            "error": str(exc),
        }


def handle_mpesa_callback(callback_data):
    return DarajaService.parse_callback(callback_data)