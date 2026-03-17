import logging
from extensions import db
from models.notification import Notification
from services.sms_service import send_order_status_sms, ORDER_STATUS_MESSAGES

logger = logging.getLogger(__name__)


def notify_order_status_change(order, user) -> Notification:
    result = send_order_status_sms(order, user)

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
        logger.warning("[Notification] SMS failed for order %s: %s", order.id, result.get("error"))

    return notification