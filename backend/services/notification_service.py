"""
Notification service — creates DB records and dispatches SMS.
"""
import logging
from extensions import db
from models.notification import Notification
from services.sms_service import send_order_status_sms

logger = logging.getLogger(__name__)


def notify_order_status_change(order, user) -> Notification:
    """
    Create a Notification record and send an SMS when order status changes.
    """
    result = send_order_status_sms(order, user)

    from services.sms_service import ORDER_STATUS_MESSAGES
    template = ORDER_STATUS_MESSAGES.get(order.status, "Order #{order_id} updated.")
    message = template.format(
        name=user.name.split()[0],
        order_id=order.id,
        deposit=f"{float(order.deposit_required):,.0f}",
        balance=f"{order.balance_due:,.0f}",
        reason=order.cancellation_reason or "N/A",
    )

    notification = Notification(
        user_id=user.id,
        order_id=order.id,
        message=message,
        type="sms",
        status="sent" if result.get("success") else "failed",
    )
    db.session.add(notification)
    db.session.commit()

    if not result.get("success"):
        logger.warning("SMS failed for order %s: %s", order.id, result.get("error"))

    return notification
