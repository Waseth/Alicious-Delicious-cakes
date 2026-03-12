import re


def validate_email(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Accept Kenyan formats: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX."""
    phone = phone.strip().replace(" ", "")
    pattern = r"^(\+?254|0)[17]\d{8}$"
    return bool(re.match(pattern, phone))


def validate_rating(rating) -> bool:
    try:
        r = int(rating)
        return 1 <= r <= 5
    except (ValueError, TypeError):
        return False


def normalize_phone(phone: str) -> str:
    """Convert phone to international format (+254...)."""
    phone = phone.strip().replace(" ", "")
    if phone.startswith("0"):
        return "+254" + phone[1:]
    if phone.startswith("254"):
        return "+" + phone
    return phone
