import os
import sys
import logging
from flask import Flask

# Simple logging
logging.basicConfig(level=logging.DEBUG, handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

logger.info("=" * 50)
logger.info("SIMPLE TEST APP STARTING")
logger.info("=" * 50)
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Files here: {os.listdir('.')}")

app = Flask(__name__)

@app.route('/')
@app.route('/health')
def health():
    logger.info("Health check called!")
    return {"status": "ok", "message": "Test app working"}

logger.info("✓ Test app created successfully")
logger.info(f"PORT from env: {os.getenv('PORT', 'not set')}")
