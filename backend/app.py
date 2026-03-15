import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from config import config_map
from extensions import db, jwt, bcrypt, cors

load_dotenv()


def create_app(config_name: str | None = None) -> Flask:
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    from routes.auth         import auth_bp
    from routes.cakes        import cakes_bp, admin_cakes_bp
    from routes.orders       import orders_bp
    from routes.payments     import payments_bp
    from routes.admin_orders import admin_orders_bp
    from routes.reviews      import reviews_bp
    from routes.expenses     import expenses_bp
    from routes.analytics    import analytics_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(cakes_bp)
    app.register_blueprint(admin_cakes_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(admin_orders_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(analytics_bp)

    with app.app_context():
        db.create_all()

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "Alicious Delicious Cakes API"}), 200

    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        return jsonify({"success": False, "error": "Token has expired."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"success": False, "error": f"Invalid token: {reason}"}), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"success": False, "error": "Authorization token required."}), 401

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"success": False, "error": "Resource not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return jsonify({"success": False, "error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def internal_error(_e):
        return jsonify({"success": False, "error": "Internal server error."}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
