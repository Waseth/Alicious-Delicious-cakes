import os
import sys
import logging
import time
from dotenv import load_dotenv
from flask import Flask, jsonify
from config import config_map
from extensions import db, jwt, bcrypt, cors
from sqlalchemy.exc import OperationalError

# Configure logging FIRST - before anything else
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Force output to stdout for Railway
        logging.FileHandler('app.log')      # Also save to file for debugging
    ]
)

logger = logging.getLogger(__name__)

# Log startup information
logger.info("=" * 50)
logger.info("STARTING ALICIOUS DELICIOUS CAKES API")
logger.info("=" * 50)
logger.info(f"Python version: {sys.version}")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Files in current directory: {os.listdir('.')}")
logger.info(f"Environment variables loaded: {list(os.environ.keys())}")

# Load environment variables
load_dotenv()
logger.info("Loaded .env file")

def create_app(config_name=None):
    logger.info("=" * 50)
    logger.info("CREATE APP FUNCTION CALLED")
    logger.info("=" * 50)

    # Determine configuration
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "production")
        logger.info(f"Config name from env: {config_name}")
    else:
        logger.info(f"Config name provided: {config_name}")

    # Create Flask app
    logger.info("Creating Flask app instance...")
    app = Flask(__name__)
    logger.info("✓ Flask app instance created")

    # Load configuration
    logger.info(f"Loading config from: {config_name}")
    app.config.from_object(config_map[config_name])
    logger.info("✓ Configuration loaded")
    logger.info(f"Debug mode: {app.config.get('DEBUG', False)}")
    logger.info(f"Database URI: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')}")

    # Initialize extensions
    logger.info("Initializing extensions...")

    logger.info("Initializing db...")
    db.init_app(app)
    logger.info("✓ db initialized")

    logger.info("Initializing jwt...")
    jwt.init_app(app)
    logger.info("✓ jwt initialized")

    logger.info("Initializing bcrypt...")
    bcrypt.init_app(app)
    logger.info("✓ bcrypt initialized")

    logger.info("Initializing cors...")
    cors.init_app(app, resources={r"/*": {"origins": "*"}})
    logger.info("✓ cors initialized")

    # Import and register blueprints
    logger.info("Importing blueprints...")

    from routes.auth import auth_bp
    logger.info("✓ auth_bp imported")
    from routes.cakes import cakes_bp, admin_cakes_bp
    logger.info("✓ cakes blueprints imported")
    from routes.orders import orders_bp
    logger.info("✓ orders_bp imported")
    from routes.payments import payments_bp
    logger.info("✓ payments_bp imported")
    from routes.admin_orders import admin_orders_bp
    logger.info("✓ admin_orders_bp imported")
    from routes.reviews import reviews_bp
    logger.info("✓ reviews_bp imported")
    from routes.expenses import expenses_bp
    logger.info("✓ expenses_bp imported")
    from routes.analytics import analytics_bp
    logger.info("✓ analytics_bp imported")

    logger.info("Registering blueprints...")
    app.register_blueprint(auth_bp)
    app.register_blueprint(cakes_bp)
    app.register_blueprint(admin_cakes_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(admin_orders_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(analytics_bp)
    logger.info("✓ All blueprints registered")

    # Create database tables with retry logic
    logger.info("Setting up database tables...")
    with app.app_context():
        max_retries = 5
        retry_count = 0
        while retry_count < max_retries:
            try:
                logger.info(f"Attempting to create database tables (attempt {retry_count + 1}/{max_retries})...")
                db.create_all()
                logger.info("✓ Database tables created/verified successfully")
                break
            except OperationalError as e:
                retry_count += 1
                wait_time = retry_count * 2
                logger.warning(f"Database connection failed: {e}")
                logger.warning(f"Retrying in {wait_time} seconds... (attempt {retry_count}/{max_retries})")
                time.sleep(wait_time)
                if retry_count == max_retries:
                    logger.error("Failed to connect to database after multiple attempts")
                    # Don't raise - let the app continue and hope DB becomes available later

    # Define routes
    logger.info("Defining routes...")

    @app.route("/health", methods=["GET"])
    def health():
        logger.debug("Health check endpoint called")
        return jsonify({"status": "ok", "service": "Alicious Delicious Cakes API"}), 200

    @app.route("/", methods=["GET"])
    def home():
        logger.debug("Home endpoint called")
        return jsonify({
            "status": "ok",
            "service": "Alicious Delicious Cakes API",
            "message": "Welcome to Alicious Delicious Cakes API"
        }), 200

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_payload):
        logger.debug("Expired token handler called")
        return jsonify({"success": False, "error": "Token has expired."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        logger.debug(f"Invalid token handler called: {reason}")
        return jsonify({"success": False, "error": f"Invalid token: {reason}"}), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        logger.debug("Missing token handler called")
        return jsonify({"success": False, "error": "Authorization token required."}), 401

    # Error handlers
    @app.errorhandler(404)
    def not_found(_e):
        logger.debug("404 handler called")
        return jsonify({"success": False, "error": "Resource not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        logger.debug("405 handler called")
        return jsonify({"success": False, "error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def internal_error(_e):
        logger.debug("500 handler called")
        return jsonify({"success": False, "error": "Internal server error."}), 500

    logger.info("✓ All routes and handlers defined")
    logger.info("=" * 50)
    logger.info("APP CREATION COMPLETE - READY TO START")
    logger.info("=" * 50)

    return app


# CREATE THE GLOBAL APP INSTANCE FOR GUNICORN (THIS IS THE FIX!)
app = create_app()

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("RUNNING APP DIRECTLY (not through gunicorn)")
    logger.info("=" * 50)

    # Get port from environment (Railway provides PORT env var)
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting development server on port {port}")
    logger.info(f"Health check will be available at: http://0.0.0.0:{port}/health")

    # Run the app
    app.run(host="0.0.0.0", port=port, debug=False)