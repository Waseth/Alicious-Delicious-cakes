from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from extensions import db, bcrypt
from models.user import User
from utils.validators import validate_email, validate_phone
from utils.helpers import success_response, error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def _is_valid_admin(email: str, phone: str, name: str, app_config) -> bool:
    whitelist = app_config.get("ADMIN_WHITELIST", {})
    entry = whitelist.get(email.lower())
    if not entry:
        return False

    def _norm(p):
        p = p.strip().replace(" ", "")
        if p.startswith("0"):
            p = "254" + p[1:]
        elif p.startswith("+"):
            p = p[1:]
        return p

    if _norm(phone) != _norm(entry["phone"]):
        return False

    allowed = [n.lower() for n in entry["allowed_names"]]
    return name.strip().lower() in allowed


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name  = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone_number") or "").strip()
    password = data.get("password", "")
    role  = (data.get("role") or "customer").strip().lower()

    errors = {}
    if not name:
        errors["name"] = "Name is required."
    if not validate_email(email):
        errors["email"] = "Invalid email address."
    if not validate_phone(phone):
        errors["phone_number"] = "Invalid phone number (e.g. 0712345678)."
    if len(password) < 6:
        errors["password"] = "Password must be at least 6 characters."
    if role not in ("customer", "admin"):
        errors["role"] = "Role must be 'customer' or 'admin'."

    if errors:
        return error_response("Validation failed.", 422, errors)

    if role == "admin":
        from flask import current_app
        if not _is_valid_admin(email, phone, name, current_app.config):
            return error_response(
                "You are not authorised to register as admin.", 403
            )

    if User.query.filter_by(email=email).first():
        return error_response("An account with this email already exists.", 409)

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(
        name=name,
        email=email,
        password_hash=pw_hash,
        phone_number=phone,
        role=role,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )

    return success_response(
        {"user": user.to_dict(), "token": token},
        "Registration successful.",
        201,
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data  = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return error_response("Email and password are required.", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return error_response("Invalid email or password.", 401)

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )

    return success_response(
        {"user": user.to_dict(), "token": token},
        "Login successful.",
    )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()         
    user = User.query.get(int(user_id))
    if not user:
        return error_response("User not found.", 404)
    return success_response(user.to_dict())