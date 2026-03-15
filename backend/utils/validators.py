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
    """
    Convert phone number to format Safaricom expects (254XXXXXXXXX)
    Examples:
        0798863379 -> 254798863379
        798863379  -> 254798863379
        254798863379 -> 254798863379
    """
    if not phone:
        return phone


    phone = ''.join(filter(str.isdigit, phone))


    if phone.startswith('0'):
        phone = '254' + phone[1:]
    
    elif len(phone) == 9 and phone.startswith('7'):
        phone = '254' + phone

    return phone
