"""
Expense routes
POST /admin/expenses
GET  /admin/expenses
"""
from datetime import date
from flask import Blueprint, request

from extensions import db
from models.expense import Expense
from utils.decorators import admin_required
from utils.helpers import success_response, error_response

expenses_bp = Blueprint("expenses", __name__, url_prefix="/admin/expenses")


@expenses_bp.route("", methods=["POST"])
@admin_required
def log_expense():
    data = request.get_json(silent=True) or {}

    title    = (data.get("title") or "").strip()
    exp_type = data.get("type", "")
    amount   = data.get("amount")
    order_id = data.get("order_id")

    errors = {}
    if not title:
        errors["title"] = "Title is required."
    if exp_type not in ("direct", "overhead"):
        errors["type"] = "Type must be 'direct' or 'overhead'."
    if amount is None:
        errors["amount"] = "Amount is required."
    else:
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except (ValueError, TypeError):
            errors["amount"] = "Amount must be a positive number."

    if exp_type == "direct" and not order_id:
        errors["order_id"] = "order_id is required for direct expenses."

    if errors:
        return error_response("Validation failed.", 422, errors)

    expense_date = data.get("date")
    try:
        parsed_date = date.fromisoformat(expense_date) if expense_date else date.today()
    except ValueError:
        return error_response("Invalid date format. Use YYYY-MM-DD.", 400)

    expense = Expense(
        order_id=order_id if exp_type == "direct" else None,
        type=exp_type,
        title=title,
        amount=amount,
        notes=data.get("notes", ""),
        date=parsed_date,
    )
    db.session.add(expense)
    db.session.commit()

    return success_response(expense.to_dict(), "Expense logged.", 201)


@expenses_bp.route("", methods=["GET"])
@admin_required
def list_expenses():
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    exp_type = request.args.get("type", "").strip()
    order_id = request.args.get("order_id")

    query = Expense.query
    if exp_type in ("direct", "overhead"):
        query = query.filter_by(type=exp_type)
    if order_id:
        query = query.filter_by(order_id=int(order_id))

    query = query.order_by(Expense.date.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response({
        "expenses": [e.to_dict() for e in pagination.items],
        "total":    pagination.total,
        "pages":    pagination.pages,
        "current_page": page,
    })
