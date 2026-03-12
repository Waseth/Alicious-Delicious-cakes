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
    with application.app_context():
        _db.create_all()
        yield application
        _db.session.remove()
        _db.drop_all()


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
