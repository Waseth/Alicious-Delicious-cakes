-- =============================================================
-- Alicious Delicious Cakes — MySQL Database Setup
-- Run once before starting the server
-- =============================================================

CREATE DATABASE IF NOT EXISTS alicious_delicious_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE alicious_delicious_db;

-- Tables are created automatically by SQLAlchemy (db.create_all())
-- when the Flask app starts. This script is just for DB creation.

-- Optional: create a dedicated DB user
-- CREATE USER IF NOT EXISTS 'alicious_user'@'localhost' IDENTIFIED BY 'strongpassword';
-- GRANT ALL PRIVILEGES ON alicious_delicious_db.* TO 'alicious_user'@'localhost';
-- FLUSH PRIVILEGES;
