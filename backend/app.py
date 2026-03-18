import os
import sys
import logging
import time
from dotenv import load_dotenv
from flask import Flask, jsonify
from sqlalchemy.exc import OperationalError

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "production")

    from config import config_map
    from extensions import db, jwt, bcrypt, cors

    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    from routes.auth import auth_bp
    from routes.cakes import cakes_bp, admin_cakes_bp
    from routes.orders import orders_bp
    from routes.payments import payments_bp
    from routes.admin_orders import admin_orders_bp
    from routes.reviews import reviews_bp
    from routes.expenses import expenses_bp
    from routes.analytics import analytics_bp

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
        max_retries = 5
        for attempt in range(1, max_retries + 1):
            try:
                db.create_all()
                logger.info("Database tables ready.")
                break
            except OperationalError as e:
                wait = attempt * 2
                logger.warning("DB connection failed (attempt %d/%d): %s. Retrying in %ds...", attempt, max_retries, e, wait)
                time.sleep(wait)
                if attempt == max_retries:
                    logger.error("Could not connect to database after %d attempts. Continuing anyway.", max_retries)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "Alicious Delicious Cakes API"}), 200

    @app.route("/debug-db", methods=["GET"])
    def debug_db():
        import os
        raw = os.getenv("DATABASE_URL", "NOT SET")
        return jsonify({
            "DATABASE_URL_prefix": raw[:30] if raw else "EMPTY",
            "SQLALCHEMY_URI_prefix": app.config.get("SQLALCHEMY_DATABASE_URI", "")[:30],
        }), 200

    @app.route("/", methods=["GET"])
    def home():
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


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)