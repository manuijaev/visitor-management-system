import logging
import os
import re

import requests

logger = logging.getLogger(__name__)

AT_USERNAME = os.getenv("AT_USERNAME")
AT_API_KEY = os.getenv("AT_API_KEY")
AT_SENDER_ID = os.getenv("AT_SENDER_ID")

UMS_API_KEY = os.getenv("UMS_API_KEY")
UMS_APP_ID = os.getenv("UMS_APP_ID")
UMS_URL = "https://comms.umeskiasoftwares.com/api/v1/sms/send"
SENDER_ID = os.getenv("UMS_SENDER_ID", "UMS_SMS")
SMS_MAX_LENGTH = 160

if AT_USERNAME and AT_API_KEY:
    SMS_PROVIDER = "africastalking"
elif UMS_API_KEY and UMS_APP_ID:
    SMS_PROVIDER = "ums"
else:
    SMS_PROVIDER = None

print(f"SMS SERVICE INIT — provider: {SMS_PROVIDER or 'none configured'}")


def normalize_phone(number):
    """Return the number in 2547XXXXXXXX form, assuming Kenya when no country code is given."""
    if not number:
        return None
    digits = re.sub(r"\D", "", str(number))
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "17":
        digits = "254" + digits
    if not 9 <= len(digits) <= 15:
        return None
    return digits


def _fit(message):
    if len(message) <= SMS_MAX_LENGTH:
        return message
    return message[:SMS_MAX_LENGTH - 3].rstrip() + "..."


def _send_africastalking(normalized, message):
    host = "api.sandbox.africastalking.com" if AT_USERNAME == "sandbox" else "api.africastalking.com"
    data = {"username": AT_USERNAME, "to": f"+{normalized}", "message": message}
    if AT_SENDER_ID:
        data["from"] = AT_SENDER_ID
    response = requests.post(
        f"https://{host}/version1/messaging",
        data=data,
        headers={"apiKey": AT_API_KEY, "Accept": "application/json"},
        timeout=10,
    )
    try:
        result = response.json()
    except ValueError:
        print(f"SMS RESPONSE — HTTP {response.status_code}: {response.text[:200]}")
        return False
    print(f"SMS RESPONSE — {result}")
    recipients = result.get("SMSMessageData", {}).get("Recipients", [])
    return any(r.get("statusCode") in (100, 101, 102) for r in recipients)


def _send_ums(normalized, message):
    payload = {
        "api_key": UMS_API_KEY,
        "app_id": UMS_APP_ID,
        "sender_id": SENDER_ID,
        "message": message,
        "phone": normalized,
    }
    result = requests.post(UMS_URL, json=payload, timeout=10).json()
    print(f"SMS RESPONSE — {result}")
    return result.get("status") == "complete"


def send_sms(phone_number, message):
    """Send one SMS through whichever provider is configured."""
    normalized = normalize_phone(phone_number)
    if not normalized:
        print("SMS ABORTED — phone number empty or invalid")
        return False

    if not SMS_PROVIDER:
        print("SMS ABORTED — no SMS provider configured (set AT_USERNAME/AT_API_KEY or UMS_API_KEY/UMS_APP_ID)")
        return False

    try:
        print(f"SMS SENDING — via {SMS_PROVIDER} to: {normalized}")
        sender = _send_africastalking if SMS_PROVIDER == "africastalking" else _send_ums
        sent = sender(normalized, message)
        if sent:
            logger.info("SMS sent successfully to %s", normalized)
        else:
            logger.error("SMS not accepted by %s for %s", SMS_PROVIDER, normalized)
        return sent
    except Exception as e:
        logger.error("SMS exception: %s", str(e))
        return False


def _first_name(name):
    return (name or "").strip().split(" ")[0] or "there"


def send_visitor_received_sms(phone_number, visitor_name, staff_name, visit_time):
    """Confirm to the visitor that their request reached the host."""
    message = (
        f"Hi {_first_name(visitor_name)}, your visit request to see {staff_name} "
        f"on {visit_time} has been received. We'll text you once they respond. - Gatepass"
    )
    return send_sms(phone_number, _fit(message))


def send_visitor_sms(phone_number, visitor_name, staff_name, status, response_note, visit_time=""):
    """Send response notification to visitor."""
    print(f"SMS ATTEMPT — phone: {phone_number}, visitor: {visitor_name}, status: {status}")

    first = _first_name(visitor_name)
    note = (response_note or "").strip()
    when = f" for {visit_time}" if visit_time else ""

    if status == "Accepted":
        message = f"Hi {first}, {staff_name} ACCEPTED your visit{when}. They are expecting you."
        if note:
            message += f' Note: "{note}"'
    elif status == "Declined":
        message = f"Hi {first}, {staff_name} DECLINED your visit request{when}."
        if note:
            message += f' Reason: "{note}"'
    elif status == "Rescheduled":
        message = f"Hi {first}, {staff_name} RESCHEDULED your visit{when}."
        if note:
            message += f' Note: "{note}"'
    else:
        message = f"Hi {first}, your visit with {staff_name} is now {status}."

    return send_sms(phone_number, _fit(message + " - Gatepass"))


def send_staff_sms(phone_number, staff_name, message):
    """Send alert to staff when a visitor checks in."""
    print(f"Staff SMS CALLED — phone: {phone_number}, staff: {staff_name}")

    return send_sms(phone_number, _fit(f"Hi {_first_name(staff_name)}, {message} - Gatepass"))
