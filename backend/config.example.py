"""
Configuration template for Alicious Delicious Cakes.

DO NOT commit real secrets to Git!
Copy this file to config.py and set your actual values in .env file.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY")  # No default - must be set in .env
    DEBUG = False
    TESTING = False

    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_NAME = os.getenv("DB_NAME")  # No default - must be set
    DB_USER = os.getenv("DB_USER")  # No default - must be set
    DB_PASSWORD = os.getenv("DB_PASSWORD")  # No default - must be set
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")  # No default - must be set
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # Africa's Talking SMS
    AT_USERNAME = os.getenv("AT_USERNAME", "sandbox")
    AT_API_KEY = os.getenv("AT_API_KEY")  # No default - must be set
    AT_SENDER_ID = os.getenv("AT_SENDER_ID", "ADelicious")

    # M-Pesa
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")  # No default - must be set
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")  # No default - must be set
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "174379")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY")  # No default - must be set
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "https://yourdomain.com/api/payments/mpesa-callback")

    # Admin whitelist - replace with environment variables or remove
    ADMIN_WHITELIST = {
        "admin1@example.com": {
            "phone": "254700000000",
            "allowed_names": ["admin one"],
        },
        "admin2@example.com": {
            "phone": "254711111111",
            "allowed_names": ["admin two"],
        },
    }


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    JWT_SECRET_KEY = "testing-secret-key"  # Only for testing, not production


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}