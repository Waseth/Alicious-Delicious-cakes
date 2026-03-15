from datetime import datetime, date
from calendar import month_abbr

from flask import Blueprint, request
from sqlalchemy import func, extract

from extensions import db
from models.order import Order
from models.payment import Payment
from models.expense import Expense
from utils.decorators import admin_required
from utils.helpers import success_response

analytics_bp = Blueprint("analytics", __name__, url_prefix="/admin")


@analytics_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    total_orders = Order.query.filter(Order.status != "cancelled").count()

    total_revenue = db.session.query(
        func.coalesce(func.sum(Payment.amount), 0)
    ).filter_by(status="completed").scalar()

    total_expenses = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).scalar()

    net_profit = float(total_revenue) - float(total_expenses)

    pending_rows = Order.query.filter_by(
        deposit_paid=True, balance_paid=False
    ).filter(Order.status != "cancelled").all()
    pending_balances = sum(o.balance_due for o in pending_rows)

    order_profits = _calculate_per_order_profit()

    return success_response({
        "total_orders":     total_orders,
        "total_revenue":    float(total_revenue),
        "total_expenses":   float(total_expenses),
        "net_profit":       net_profit,
        "pending_balances": pending_balances,
        "order_profits":    order_profits,
    })


def _calculate_per_order_profit():
    """Return list of {order_id, revenue, direct_costs, profit} dicts."""
    orders = Order.query.filter(
        Order.status.in_(["order_received", "baking_in_progress", "cake_ready", "delivered"])
    ).all()

    result = []
    for order in orders:
        revenue = db.session.query(
            func.coalesce(func.sum(Payment.amount), 0)
        ).filter_by(order_id=order.id, status="completed").scalar()

        direct_costs = db.session.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter_by(order_id=order.id, type="direct").scalar()

        result.append({
            "order_id":     order.id,
            "revenue":      float(revenue),
            "direct_costs": float(direct_costs),
            "profit":       float(revenue) - float(direct_costs),
        })
    return result


@analytics_bp.route("/finance", methods=["GET"])
@admin_required
def finance():
    year = int(request.args.get("year", datetime.utcnow().year))

    revenue_rows = (
        db.session.query(
            extract("month", Payment.created_at).label("month"),
            func.sum(Payment.amount).label("total"),
        )
        .filter(
            Payment.status == "completed",
            extract("year", Payment.created_at) == year,
        )
        .group_by("month")
        .all()
    )

    expense_rows = (
        db.session.query(
            extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("total"),
        )
        .filter(extract("year", Expense.date) == year)
        .group_by("month")
        .all()
    )

    def _build_monthly(rows):
        mapping = {int(r.month): float(r.total) for r in rows}
        return [
            {"month": month_abbr[m], "amount": mapping.get(m, 0.0)}
            for m in range(1, 13)
        ]

    return success_response({
        "year":     year,
        "revenue":  _build_monthly(revenue_rows),
        "expenses": _build_monthly(expense_rows),
        "profit":   [
            {
                "month":  r["month"],
                "amount": r["amount"] - e["amount"],
            }
            for r, e in zip(
                _build_monthly(revenue_rows),
                _build_monthly(expense_rows),
            )
        ],
    })
