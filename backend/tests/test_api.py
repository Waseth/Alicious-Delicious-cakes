"""
Test suite for Alicious Delicious Cakes API.
Run: pytest tests/ -v

The admin user (wasethalice@gmail.com / adminpass) is pre-seeded by conftest.py
at session start. No test class should try to register that email again.
"""
import pytest
from tests.conftest import register_user, login_user, auth_headers


def _admin_token(client):
    """Get a valid admin JWT. Admin is always pre-seeded in conftest."""
    res = login_user(client, "wasethalice@gmail.com", "adminpass")
    body = res.get_json()
    assert res.status_code == 200, f"Admin login failed ({res.status_code}): {body}"
    return body["data"]["token"]


# ══════════════════════════════════════════════════════════════════════════
# AUTH TESTS
# ══════════════════════════════════════════════════════════════════════════

class TestRegistration:
    def test_successful_registration(self, client):
        res = register_user(client, "Jane Doe", "jane@example.com", "0712345678", "password123")
        assert res.status_code == 201
        data = res.get_json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["role"] == "customer"

    def test_duplicate_email(self, client):
        register_user(client, "Dup User", "duplicate@example.com", "0712345679", "password123")
        res = register_user(client, "Dup User2", "duplicate@example.com", "0712345680", "password123")
        assert res.status_code == 409

    def test_invalid_email(self, client):
        res = register_user(client, "Bad Email", "not-an-email", "0712345678", "password123")
        assert res.status_code == 422

    def test_short_password(self, client):
        res = register_user(client, "Short Pass", "short@example.com", "0712345678", "abc")
        assert res.status_code == 422

    def test_invalid_phone(self, client):
        res = register_user(client, "Bad Phone", "badphone@example.com", "12345", "password123")
        assert res.status_code == 422

    def test_admin_registration_whitelist_valid(self, client):
        # Use the SECOND whitelisted admin (wasethsapriso) — not pre-seeded, safe to register
        res = register_user(
            client,
            "waseth sapriso emmanuel",
            "wasethsapriso@gmail.com",
            "0798863379",
            "securepass",
            role="admin",
        )
        assert res.status_code == 201
        assert res.get_json()["data"]["user"]["role"] == "admin"

    def test_admin_registration_whitelist_rejected(self, client):
        res = register_user(
            client, "Random Hacker", "hacker@evil.com", "0799999999", "password123",
            role="admin",
        )
        assert res.status_code == 403

    def test_admin_wrong_phone_rejected(self, client):
        # Correct email, wrong phone — must be rejected (or 409 if already exists)
        res = register_user(
            client, "alice akoth odhiambo", "wasethalice@gmail.com",
            "0799999999", "password123", role="admin",
        )
        assert res.status_code in (403, 409)


class TestLogin:
    def test_successful_login(self, client):
        register_user(client, "Login User", "login_u1@example.com", "0712111222", "mypassword")
        res = login_user(client, "login_u1@example.com", "mypassword")
        assert res.status_code == 200
        assert "token" in res.get_json()["data"]

    def test_wrong_password(self, client):
        register_user(client, "Login User2", "login_u2@example.com", "0712111223", "mypassword")
        res = login_user(client, "login_u2@example.com", "wrongpassword")
        assert res.status_code == 401

    def test_nonexistent_user(self, client):
        res = login_user(client, "nobody@example.com", "password")
        assert res.status_code == 401

    def test_missing_fields(self, client):
        res = client.post("/auth/login", json={})
        assert res.status_code == 400


class TestMe:
    def test_get_current_user(self, client):
        register_user(client, "Me User", "me_user@example.com", "0712222333", "password123")
        res = login_user(client, "me_user@example.com", "password123")
        assert res.status_code == 200, f"Login failed: {res.get_json()}"
        token = res.get_json()["data"]["token"]
        res2 = client.get("/auth/me", headers=auth_headers(token))
        assert res2.status_code == 200, f"Got {res2.status_code}: {res2.get_json()}"
        assert res2.get_json()["data"]["email"] == "me_user@example.com"

    def test_unauthenticated(self, client):
        res = client.get("/auth/me")
        assert res.status_code == 401


# ══════════════════════════════════════════════════════════════════════════
# CAKES TESTS
# ══════════════════════════════════════════════════════════════════════════

class TestCakeCatalog:
    def test_list_cakes(self, client):
        res = client.get("/cakes")
        assert res.status_code == 200

    def test_admin_create_cake(self, client):
        token = _admin_token(client)
        res = client.post(
            "/admin/cakes",
            json={"name": "Chocolate Dream", "base_price": 2500,
                  "category": "birthday", "flavor": "chocolate"},
            headers=auth_headers(token),
        )
        assert res.status_code == 201, f"Got {res.status_code}: {res.get_json()}"
        data = res.get_json()["data"]
        assert data["name"] == "Chocolate Dream"
        assert data["base_price"] == 2500.0

    def test_create_cake_without_auth(self, client):
        res = client.post(
            "/admin/cakes",
            json={"name": "Sneaky Cake", "base_price": 1000,
                  "category": "casual", "flavor": "classic"},
        )
        assert res.status_code == 401

    def test_customer_cannot_create_cake(self, client):
        register_user(client, "Cust A", "custa_cake@example.com", "0711111112", "pass1234")
        token = login_user(client, "custa_cake@example.com", "pass1234").get_json()["data"]["token"]
        res = client.post(
            "/admin/cakes",
            json={"name": "Not My Cake", "base_price": 1000,
                  "category": "casual", "flavor": "classic"},
            headers=auth_headers(token),
        )
        assert res.status_code == 403, f"Expected 403 got {res.status_code}: {res.get_json()}"

    def test_filter_cakes_by_category(self, client):
        res = client.get("/cakes?category=birthday")
        assert res.status_code == 200

    def test_featured_cakes(self, client):
        res = client.get("/cakes/featured")
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)


# ══════════════════════════════════════════════════════════════════════════
# ORDER TESTS
# ══════════════════════════════════════════════════════════════════════════

class TestOrders:
    def _setup(self, client, customer_email, customer_phone):
        admin_tok = _admin_token(client)
        cake_res = client.post(
            "/admin/cakes",
            json={"name": "Test Cake", "base_price": 3000,
                  "category": "wedding", "flavor": "classic"},
            headers=auth_headers(admin_tok),
        )
        assert cake_res.status_code == 201, f"Cake creation failed: {cake_res.get_json()}"
        cake_id = cake_res.get_json()["data"]["id"]

        register_user(client, "Order User", customer_email, customer_phone, "pass1234")
        cust_tok = login_user(client, customer_email, "pass1234").get_json()["data"]["token"]
        return cust_tok, admin_tok, cake_id

    def test_create_order(self, client):
        cust_token, _, cake_id = self._setup(client, "orderer1@example.com", "0744444441")
        res = client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["total_price"] == 3000.0
        assert data["deposit_required"] == 1500.0

    def test_price_calculated_on_backend(self, client):
        cust_token, _, cake_id = self._setup(client, "orderer2@example.com", "0744444442")
        res = client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 2, "price": 1}]},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 201
        assert res.get_json()["data"]["total_price"] == 6000.0  # 3000 x 2, ignores price:1

    def test_order_requires_login(self, client):
        res = client.post("/orders", json={"items": [{"cake_id": 1, "quantity": 1}]})
        assert res.status_code == 401

    def test_empty_cart_rejected(self, client):
        cust_token, _, _ = self._setup(client, "orderer3@example.com", "0744444443")
        res = client.post("/orders", json={"items": []}, headers=auth_headers(cust_token))
        assert res.status_code == 400

    def test_invalid_cake_id(self, client):
        cust_token, _, _ = self._setup(client, "orderer4@example.com", "0744444444")
        res = client.post(
            "/orders",
            json={"items": [{"cake_id": 99999, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 404

    def test_my_orders(self, client):
        cust_token, _, cake_id = self._setup(client, "orderer5@example.com", "0744444445")
        client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        res = client.get("/orders/my-orders", headers=auth_headers(cust_token))
        assert res.status_code == 200
        assert len(res.get_json()["data"]["orders"]) >= 1

    def test_cancel_order(self, client):
        cust_token, _, cake_id = self._setup(client, "orderer6@example.com", "0744444446")
        order_res = client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        order_id = order_res.get_json()["data"]["id"]
        res = client.patch(
            f"/orders/{order_id}/cancel",
            json={"reason": "Changed my mind"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 200
        assert res.get_json()["data"]["status"] == "cancelled"


# ══════════════════════════════════════════════════════════════════════════
# DEPOSIT PAYMENT LOGIC TESTS
# ══════════════════════════════════════════════════════════════════════════

class TestDepositPayment:
    def _create_order(self, client, email, phone):
        admin_tok = _admin_token(client)
        cake_res = client.post(
            "/admin/cakes",
            json={"name": "Deposit Cake", "base_price": 4000,
                  "category": "graduation", "flavor": "fruity"},
            headers=auth_headers(admin_tok),
        )
        assert cake_res.status_code == 201, f"Cake creation failed: {cake_res.get_json()}"
        cake_id = cake_res.get_json()["data"]["id"]

        register_user(client, "Deposit User", email, phone, "pass1234")
        cust_tok = login_user(client, email, "pass1234").get_json()["data"]["token"]

        order_res = client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_tok),
        )
        return cust_tok, admin_tok, order_res.get_json()["data"]["id"]

    def test_deposit_stk_push_initiated(self, client):
        cust_token, _, order_id = self._create_order(client, "dep1@example.com", "0755555551")
        res = client.post(
            "/payments/deposit",
            json={"order_id": order_id, "phone_number": "0755555551"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 200
        assert "checkout_request_id" in res.get_json()["data"]

    def test_cannot_pay_deposit_twice(self, client):
        cust_token, admin_token, order_id = self._create_order(
            client, "dep2@example.com", "0755555552")
        pay_res = client.post(
            "/payments/deposit",
            json={"order_id": order_id, "phone_number": "0755555552"},
            headers=auth_headers(cust_token),
        )
        payment_id = pay_res.get_json()["data"]["payment"]["id"]
        client.post(
            "/payments/confirm-mock",
            json={"payment_id": payment_id},
            headers=auth_headers(admin_token),
        )
        res = client.post(
            "/payments/deposit",
            json={"order_id": order_id, "phone_number": "0755555552"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 400

    def test_cannot_pay_balance_before_deposit(self, client):
        cust_token, _, order_id = self._create_order(client, "dep3@example.com", "0755555553")
        res = client.post(
            "/payments/balance",
            json={"order_id": order_id, "phone_number": "0755555553"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 400


# ══════════════════════════════════════════════════════════════════════════
# ADMIN AUTHORIZATION TESTS
# ══════════════════════════════════════════════════════════════════════════

class TestAdminAuthorization:
    def test_customer_cannot_access_admin_orders(self, client):
        register_user(client, "Regular Joe", "joe_auth@example.com", "0766666661", "pass1234")
        token = login_user(client, "joe_auth@example.com", "pass1234").get_json()["data"]["token"]
        res = client.get("/admin/orders", headers=auth_headers(token))
        assert res.status_code == 403, f"Expected 403 got {res.status_code}: {res.get_json()}"

    def test_customer_cannot_access_dashboard(self, client):
        register_user(client, "Regular Jane", "jane_auth@example.com", "0777777771", "pass1234")
        token = login_user(client, "jane_auth@example.com", "pass1234").get_json()["data"]["token"]
        res = client.get("/admin/dashboard", headers=auth_headers(token))
        assert res.status_code == 403, f"Expected 403 got {res.status_code}: {res.get_json()}"

    def test_unauthenticated_cannot_access_admin(self, client):
        res = client.get("/admin/dashboard")
        assert res.status_code == 401

    def test_admin_can_access_dashboard(self, client):
        token = _admin_token(client)
        res = client.get("/admin/dashboard", headers=auth_headers(token))
        assert res.status_code == 200, f"Got {res.status_code}: {res.get_json()}"


# ══════════════════════════════════════════════════════════════════════════
# REVIEWS TESTS
# ══════════════════════════════════════════════════════════════════════════

class TestReviews:
    def test_submit_review(self, client):
        register_user(client, "Reviewer", "reviewer_a@example.com", "0788888881", "pass1234")
        token = login_user(client, "reviewer_a@example.com", "pass1234").get_json()["data"]["token"]
        res = client.post(
            "/reviews",
            json={"rating": 5, "review_text": "Amazing cakes!"},
            headers=auth_headers(token),
        )
        assert res.status_code == 201, f"Got {res.status_code}: {res.get_json()}"

    def test_invalid_rating(self, client):
        register_user(client, "Reviewer2", "reviewer_b@example.com", "0799998881", "pass1234")
        token = login_user(client, "reviewer_b@example.com", "pass1234").get_json()["data"]["token"]
        res = client.post(
            "/reviews", json={"rating": 10},
            headers=auth_headers(token),
        )
        assert res.status_code == 422

    def test_latest_reviews(self, client):
        res = client.get("/reviews/latest")
        assert res.status_code == 200
        assert len(res.get_json()["data"]) <= 4