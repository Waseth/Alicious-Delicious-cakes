"""
Pytest configuration and shared fixtures.
"""
import pytest
from app import create_app
from extensions import db as _db


@pytest.fixture(scope="session")
def app():
    """Create application with in-memory SQLite for testing."""
    application = create_app("testing")

    # ── Sanity-check the JWT key length at test-session start ─────────────
    jwt_key = application.config.get("JWT_SECRET_KEY", "")
    assert len(jwt_key) >= 32, (
        f"JWT_SECRET_KEY is only {len(jwt_key)} bytes — must be ≥32. "
        f"Current value: {repr(jwt_key)}"
    )

    with application.app_context():
        _db.create_all()
        _seed_admin(application)
        yield application
        _db.session.remove()
        _db.drop_all()


def _seed_admin(application):
    """Pre-create the whitelisted admin so every test class can log in."""
    from extensions import bcrypt
    from models.user import User
    with application.app_context():
        if not User.query.filter_by(email="wasethalice@gmail.com").first():
            admin = User(
                name="alice akoth odhiambo",
                email="wasethalice@gmail.com",
                password_hash=bcrypt.generate_password_hash("adminpass").decode("utf-8"),
                phone_number="0723619572",
                role="admin",
            )
            _db.session.add(admin)
            _db.session.commit()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def db(app):
    """Provide a clean DB session per test (rollback after each)."""
    connection = _db.engine.connect()
    transaction = connection.begin()
    yield _db
    _db.session.remove()
    transaction.rollback()
    connection.close()


# ── Helpers ────────────────────────────────────────────────────────────────
def register_user(client, name, email, phone, password, role="customer"):
    return client.post(
        "/auth/register",
        json={"name": name, "email": email, "phone_number": phone,
              "password": password, "role": role},
    )


def login_user(client, email, password):
    return client.post("/auth/login", json={"email": email, "password": password})


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}