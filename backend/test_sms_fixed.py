#!/usr/bin/env python
"""
Test script for SMS functionality with Flask factory pattern
Run with: python test_sms_fixed.py
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_sms_with_app():
    """Test SMS by creating the Flask app first"""
    
    # Import create_app function
    from app import create_app
    
    # Create the Flask app
    app = create_app('development')  # or just create_app() for default
    
    print("=" * 50)
    print("FLASK APP CREATED SUCCESSFULLY")
    print("=" * 50)
    print(f"App name: {app.name}")
    print(f"Debug mode: {app.debug}")
    print("=" * 50)
    
    # Import SMS function
    from services.sms_service import send_sms
    
    # Test phone
    phone = "254798863379"
    message = "Test from Alicious Delicious Cakes! 🎂"
    
    print(f"\n📱 Sending SMS to: {phone}")
    print(f"📝 Message: {message}")
    print("-" * 50)
    
    # Use app context
    with app.app_context():
        result = send_sms(phone, message)
        
        print("\n📊 RESULT:")
        print(f"   Success: {result.get('success')}")
        print(f"   Message ID: {result.get('message_id')}")
        print(f"   Error: {result.get('error')}")
        
        if result.get('success'):
            print("\n✅ SMS test passed!")
        else:
            print("\n❌ SMS test failed!")
            
        return result

def test_order_status_sms():
    """Test sending order status SMS"""
    
    from app import create_app
    from services.sms_service import send_order_status_sms
    
    app = create_app('development')
    
    with app.app_context():
        # You'll need to get an actual order and user from database
        # This is a placeholder - you'll need to modify this
        print("\n📦 Testing order status SMS...")
        print("   This requires an existing order and user.")
        print("   Run this after creating an order.")
        
        # Optional: Fetch a real order if you have one
        try:
            from models.order import Order
            from models.user import User
            
            # Get the most recent order for user_id=2
            order = Order.query.filter_by(user_id=2).order_by(Order.id.desc()).first()
            user = User.query.get(2)
            
            if order and user:
                print(f"   Found order #{order.id} for {user.name}")
                result = send_order_status_sms(order, user)
                print(f"   Result: {result}")
            else:
                print("   No orders found for user_id=2")
        except Exception as e:
            print(f"   Error fetching order: {e}")

def check_at_credentials():
    """Check Africa's Talking credentials"""
    
    username = os.getenv('AT_USERNAME')
    api_key = os.getenv('AT_API_KEY')
    sender = os.getenv('AT_SENDER_ID', 'ADelicious')
    
    print("\n🔐 AFRICA'S TALKING CREDENTIALS")
    print("=" * 50)
    print(f"AT_USERNAME: {username}")
    print(f"AT_API_KEY: {api_key[:10]}...{api_key[-5:] if api_key and len(api_key) > 15 else ''}")
    print(f"AT_SENDER_ID: {sender}")
    print("=" * 50)
    
    if not username or not api_key:
        print("❌ Missing credentials! Check your .env file")
        return False
    if username == "sandbox" and api_key:
        print("✅ Sandbox credentials detected")
        return True
    return True

if __name__ == "__main__":
    print("\n📱 SMS TEST SUITE")
    print("=" * 60)
    
    # Step 1: Check credentials
    creds_ok = check_at_credentials()
    
    if not creds_ok:
        print("\n❌ Please fix your .env file first")
        exit(1)
    
    # Step 2: Test direct SMS
    print("\n🔍 TEST 1: Direct SMS")
    print("=" * 60)
    result = test_sms_with_app()
    
    # Step 3: Optional - Test order status SMS
    print("\n" + "=" * 60)
    print("🔍 TEST 2: Order Status SMS (Optional)")
    print("=" * 60)
    test_order_status_sms()
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    if result and result.get('success'):
        print("✅ SMS FUNCTIONALITY IS WORKING!")
        print("   Check your Africa's Talking sandbox dashboard:")
        print("   https://account.africastalking.com/apps/sandbox/sms/inbox")
    else:
        print("❌ SMS TEST FAILED")
        print("   Error:", result.get('error') if result else "Unknown error")
