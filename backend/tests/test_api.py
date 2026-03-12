"""
Test suite for Alicious Delicious Cakes API.
Run: pytest tests/ -v
"""
import pytest
from tests.conftest import register_user, login_user, auth_headers


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
        register_user(client, "Jane Doe", "duplicate@example.com", "0712345679", "password123")
        res = register_user(client, "Jane Doe 2", "duplicate@example.com", "0712345680", "password123")
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
        res = register_user(
            client,
            "alice akoth odhiambo",
            "wasethalice@gmail.com",
            "0723619572",
            "securepass",
            role="admin",
        )
        assert res.status_code == 201
        assert res.get_json()["data"]["user"]["role"] == "admin"

    def test_admin_registration_whitelist_rejected(self, client):
        res = register_user(
            client,
            "Random Hacker",
            "hacker@evil.com",
            "0799999999",
            "password123",
            role="admin",
        )
        assert res.status_code == 403

    def test_admin_wrong_phone_rejected(self, client):
        res = register_user(
            client,
            "alice akoth odhiambo",
            "wasethalice@gmail.com",
            "0799999999",
            "password123",
            role="admin",
        )
        assert res.status_code == 403


class TestLogin:
    def test_successful_login(self, client):
        register_user(client, "Login User", "login@example.com", "0712111222", "mypassword")
        res = login_user(client, "login@example.com", "mypassword")
        assert res.status_code == 200
        data = res.get_json()
        assert "token" in data["data"]

    def test_wrong_password(self, client):
        register_user(client, "Login User2", "login2@example.com", "0712111223", "mypassword")
        res = login_user(client, "login2@example.com", "wrongpassword")
        assert res.status_code == 401

    def test_nonexistent_user(self, client):
        res = login_user(client, "nobody@example.com", "password")
        assert res.status_code == 401

    def test_missing_fields(self, client):
        res = client.post("/auth/login", json={})
        assert res.status_code == 400


class TestMe:
    def test_get_current_user(self, client):
        register_user(client, "Me User", "me@example.com", "0712222333", "password123")
        token = login_user(client, "me@example.com", "password123").get_json()["data"]["token"]
        res = client.get("/auth/me", headers=auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["data"]["email"] == "me@example.com"

    def test_unauthenticated(self, client):
        res = client.get("/auth/me")
        assert res.status_code == 401

class TestCakeCatalog:
    def _admin_token(self, client):
        try:
            register_user(
                client, "alice akoth odhiambo", "wasethalice@gmail.com",
                "0723619572", "adminpass", role="admin",
            )
        except Exception:
            pass
        return login_user(client, "wasethalice@gmail.com", "adminpass").get_json()["data"]["token"]

    def test_list_cakes_empty(self, client):
        res = client.get("/cakes")
        assert res.status_code == 200

    def test_admin_create_cake(self, client):
        token = self._admin_token(client)
        res = client.post(
            "/admin/cakes",
            json={"name": "Chocolate Dream", "base_price": 2500, "category": "birthday",
                  "flavor": "chocolate"},
            headers=auth_headers(token),
        )
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["name"] == "Chocolate Dream"
        assert data["base_price"] == 2500.0

    def test_create_cake_without_auth(self, client):
        res = client.post(
            "/admin/cakes",
            json={"name": "Sneaky Cake", "base_price": 1000, "category": "casual",
                  "flavor": "classic"},
        )
        assert res.status_code == 401

    def test_customer_cannot_create_cake(self, client):
        register_user(client, "Cust A", "custa@example.com", "0711111111", "pass1234")
        token = login_user(client, "custa@example.com", "pass1234").get_json()["data"]["token"]
        res = client.post(
            "/admin/cakes",
            json={"name": "Not My Cake", "base_price": 1000, "category": "casual",
                  "flavor": "classic"},
            headers=auth_headers(token),
        )
        assert res.status_code == 403

    def test_filter_cakes_by_category(self, client):
        res = client.get("/cakes?category=birthday")
        assert res.status_code == 200

    def test_featured_cakes(self, client):
        res = client.get("/cakes/featured")
        assert res.status_code == 200
        assert isinstance(res.get_json()["data"], list)

class TestOrders:
    def _setup(self, client):
        """Register customer + admin, create a cake, return tokens & cake_id."""

        try:
            register_user(
                client, "alice akoth odhiambo", "wasethalice@gmail.com",
                "0723619572", "adminpass", role="admin",
            )
        except Exception:
            pass
        admin_token = login_user(client, "wasethalice@gmail.com", "adminpass").get_json()["data"]["token"]

        cake_res = client.post(
            "/admin/cakes",
            json={"name": "Test Cake", "base_price": 3000, "category": "wedding",
                  "flavor": "classic"},
            headers=auth_headers(admin_token),
        )
        cake_id = cake_res.get_json()["data"]["id"]

        register_user(client, "Order User", "orderer@example.com", "0744444444", "pass1234")
        cust_token = login_user(client, "orderer@example.com", "pass1234").get_json()["data"]["token"]

        return cust_token, admin_token, cake_id

    def test_create_order(self, client):
        cust_token, _, cake_id = self._setup(client)
        res = client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 201
        data = res.get_json()["data"]
        assert data["total_price"] == 3000.0
        assert data["deposit_required"] == 1500.0   # 50 %

    def test_price_calculated_on_backend(self, client):
        """Frontend price is ignored; backend always calculates."""
        cust_token, _, cake_id = self._setup(client)
        res = client.post(
            "/orders",
            json={
                "items": [{"cake_id": cake_id, "quantity": 2, "price": 1}],
            },
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 201
        assert res.get_json()["data"]["total_price"] == 6000.0

    def test_order_requires_login(self, client):
        res = client.post("/orders", json={"items": [{"cake_id": 1, "quantity": 1}]})
        assert res.status_code == 401

    def test_empty_cart_rejected(self, client):
        cust_token, _, _ = self._setup(client)
        res = client.post("/orders", json={"items": []}, headers=auth_headers(cust_token))
        assert res.status_code == 400

    def test_invalid_cake_id(self, client):
        cust_token, _, _ = self._setup(client)
        res = client.post(
            "/orders",
            json={"items": [{"cake_id": 99999, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 404

    def test_my_orders(self, client):
        cust_token, _, cake_id = self._setup(client)
        client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        res = client.get("/orders/my-orders", headers=auth_headers(cust_token))
        assert res.status_code == 200
        assert len(res.get_json()["data"]["orders"]) >= 1

    def test_cancel_order(self, client):
        cust_token, _, cake_id = self._setup(client)
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

class TestDepositPayment:
    def _create_order(self, client):
        try:
            register_user(
                client, "alice akoth odhiambo", "wasethalice@gmail.com",
                "0723619572", "adminpass", role="admin",
            )
        except Exception:
            pass
        admin_token = login_user(client, "wasethalice@gmail.com", "adminpass").get_json()["data"]["token"]
        cake_res = client.post(
            "/admin/cakes",
            json={"name": "Deposit Cake", "base_price": 4000, "category": "graduation",
                  "flavor": "fruity"},
            headers=auth_headers(admin_token),
        )
        cake_id = cake_res.get_json()["data"]["id"]

        try:
            register_user(client, "Deposit User", "depositor@example.com", "0755555555", "pass1234")
        except Exception:
            pass
        cust_token = login_user(client, "depositor@example.com", "pass1234").get_json()["data"]["token"]

        order_res = client.post(
            "/orders",
            json={"items": [{"cake_id": cake_id, "quantity": 1}]},
            headers=auth_headers(cust_token),
        )
        return cust_token, admin_token, order_res.get_json()["data"]["id"]

    def test_deposit_stk_push_initiated(self, client):
        cust_token, _, order_id = self._create_order(client)
        res = client.post(
            "/payments/deposit",
            json={"order_id": order_id, "phone_number": "0755555555"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert "checkout_request_id" in data

    def test_cannot_pay_deposit_twice(self, client):
        cust_token, admin_token, order_id = self._create_order(client)

        pay_res = client.post(
            "/payments/deposit",
            json={"order_id": order_id, "phone_number": "0755555555"},
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
            json={"order_id": order_id, "phone_number": "0755555555"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 400

    def test_cannot_pay_balance_before_deposit(self, client):
        cust_token, _, order_id = self._create_order(client)
        res = client.post(
            "/payments/balance",
            json={"order_id": order_id, "phone_number": "0755555555"},
            headers=auth_headers(cust_token),
        )
        assert res.status_code == 400


class TestAdminAuthorization:
    def test_customer_cannot_access_admin_orders(self, client):
        register_user(client, "Regular Joe", "joe@example.com", "0766666666", "pass1234")
        token = login_user(client, "joe@example.com", "pass1234").get_json()["data"]["token"]
        res = client.get("/admin/orders", headers=auth_headers(token))
        assert res.status_code == 403

    def test_customer_cannot_access_dashboard(self, client):
        register_user(client, "Regular Jane", "jane2@example.com", "0777777777", "pass1234")
        token = login_user(client, "jane2@example.com", "pass1234").get_json()["data"]["token"]
        res = client.get("/admin/dashboard", headers=auth_headers(token))
        assert res.status_code == 403

    def test_unauthenticated_cannot_access_admin(self, client):
        res = client.get("/admin/dashboard")
        assert res.status_code == 401

    def test_admin_can_access_dashboard(self, client):
        try:
            register_user(
                client, "alice akoth odhiambo", "wasethalice@gmail.com",
                "0723619572", "adminpass", role="admin",
            )
        except Exception:
            pass
        token = login_user(client, "wasethalice@gmail.com", "adminpass").get_json()["data"]["token"]
        res = client.get("/admin/dashboard", headers=auth_headers(token))
        assert res.status_code == 200


class TestReviews:
    def test_submit_review(self, client):
        register_user(client, "Reviewer", "reviewer@example.com", "0788888888", "pass1234")
        token = login_user(client, "reviewer@example.com", "pass1234").get_json()["data"]["token"]
        res = client.post(
            "/reviews",
            json={"rating": 5, "review_text": "Amazing cakes!"},
            headers=auth_headers(token),
        )
        assert res.status_code == 201

    def test_invalid_rating(self, client):
        register_user(client, "Reviewer2", "reviewer2@example.com", "0799998888", "pass1234")
        token = login_user(client, "reviewer2@example.com", "pass1234").get_json()["data"]["token"]
        res = client.post(
            "/reviews",
            json={"rating": 10},
            headers=auth_headers(token),
        )
        assert res.status_code == 422

    def test_latest_reviews(self, client):
        res = client.get("/reviews/latest")
        assert res.status_code == 200
        assert len(res.get_json()["data"]) <= 4
