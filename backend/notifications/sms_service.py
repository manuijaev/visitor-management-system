import logging
import os
import re

import requests

logger = logging.getLogger(__name__)

TALKSASA_API_TOKEN = os.getenv("TALKSASA_API_TOKEN")
TALKSASA_SENDER_ID = os.getenv("TALKSASA_SENDER_ID", "TALK-SASA")
TALKSASA_URL = "https://bulksms.talksasa.com/api/v3/sms/send"

TEXTBEE_API_KEY = os.getenv("TEXTBEE_API_KEY")
TEXTBEE_DEVICE_ID = os.getenv("TEXTBEE_DEVICE_ID")
TEXTBEE_BASE_URL = "https://api.textbee.dev/api/v1/gateway"

AT_USERNAME = os.getenv("AT_USERNAME")
AT_API_KEY = os.getenv("AT_API_KEY")
AT_SENDER_ID = os.getenv("AT_SENDER_ID")

UMS_API_KEY = os.getenv("UMS_API_KEY")
UMS_APP_ID = os.getenv("UMS_APP_ID")
UMS_URL = "https://comms.umeskiasoftwares.com/api/v1/sms/send"
SENDER_ID = os.getenv("UMS_SENDER_ID", "UMS_SMS")
SMS_MAX_LENGTH = 160

# Tried in this order; a failed send falls through to the next configured provider.
SMS_PROVIDERS = [
    name for name, configured in (
        ("talksasa", bool(TALKSASA_API_TOKEN)),
        ("textbee", bool(TEXTBEE_API_KEY)),
        ("africastalking", bool(AT_USERNAME and AT_API_KEY)),
        ("ums", bool(UMS_API_KEY and UMS_APP_ID)),
    ) if configured
]

print(f"SMS SERVICE INIT — providers: {', '.join(SMS_PROVIDERS) or 'none configured'}")


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


def _send_talksasa(normalized, message):
    response = requests.post(
        TALKSASA_URL,
        json={"recipient": normalized, "sender_id": TALKSASA_SENDER_ID, "type": "plain", "message": message},
        headers={"Authorization": f"Bearer {TALKSASA_API_TOKEN}", "Accept": "application/json"},
        timeout=10,
    )
    try:
        result = response.json()
    except ValueError:
        print(f"SMS RESPONSE — HTTP {response.status_code}: {response.text[:200]}")
        return False
    print(f"SMS RESPONSE — {result}")
    return response.ok and result.get("status") == "success"


def _send_textbee(normalized, message):
    url = (
        f"{TEXTBEE_BASE_URL}/devices/{TEXTBEE_DEVICE_ID}/send-sms"
        if TEXTBEE_DEVICE_ID else f"{TEXTBEE_BASE_URL}/send-sms"
    )
    response = requests.post(
        url,
        json={"recipients": [f"+{normalized}"], "message": message},
        headers={"x-api-key": TEXTBEE_API_KEY},
        timeout=10,
    )
    print(f"SMS RESPONSE — HTTP {response.status_code}: {response.text[:200]}")
    return response.ok


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


SENDERS = {
    "talksasa": _send_talksasa,
    "textbee": _send_textbee,
    "africastalking": _send_africastalking,
    "ums": _send_ums,
}


def send_sms(phone_number, message):
    """Send one SMS, trying each configured provider in order until one accepts it."""
    normalized = normalize_phone(phone_number)
    if not normalized:
        print("SMS ABORTED — phone number empty or invalid")
        return False

    if not SMS_PROVIDERS:
        print("SMS ABORTED — no SMS provider configured "
              "(set TALKSASA_API_TOKEN, TEXTBEE_API_KEY, AT_USERNAME/AT_API_KEY or UMS_API_KEY/UMS_APP_ID)")
        return False

    for provider in SMS_PROVIDERS:
        try:
            print(f"SMS SENDING — via {provider} to: {normalized}")
            if SENDERS[provider](normalized, message):
                logger.info("SMS sent via %s to %s", provider, normalized)
                return True
            logger.error("SMS not accepted by %s for %s", provider, normalized)
        except Exception as e:
            logger.error("SMS exception via %s: %s", provider, str(e))
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


def send_visitor_reassigned_sms(phone_number, visitor_name, staff_name, visit_time):
    """Tell the visitor their visit has moved to a different staff member."""
    message = (
        f"Hi {_first_name(visitor_name)}, your visit on {visit_time} is now with {staff_name}. "
        f"We'll text you once they respond. - Gatepass"
    )
    return send_sms(phone_number, _fit(message))


def send_staff_arrival_sms(phone_number, staff_name, visitor_name):
    """Tell the host their visitor has arrived at reception."""
    message = f"Hi {_first_name(staff_name)}, {visitor_name} has arrived at reception. - Gatepass"
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
        new_time = f" to {visit_time}" if visit_time else ""
        message = f"Hi {first}, {staff_name} RESCHEDULED your visit{new_time}."
        if note:
            message += f' Note: "{note}"'
    else:
        message = f"Hi {first}, your visit with {staff_name} is now {status}."

    return send_sms(phone_number, _fit(message + " - Gatepass"))


def send_staff_sms(phone_number, staff_name, message):
    """Send alert to staff when a visitor checks in."""
    print(f"Staff SMS CALLED — phone: {phone_number}, staff: {staff_name}")

    return send_sms(phone_number, _fit(f"Hi {_first_name(staff_name)}, {message} - Gatepass"))
