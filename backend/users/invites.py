import logging
import os
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import get_connection, send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from notifications.emailjs_service import send_emailjs

from .models import User

logger = logging.getLogger(__name__)

INVITE_TEMPLATE_ID = os.getenv('EMAILJS_INVITE_TEMPLATE_ID')


def invite_expiry_hours():
    return int(settings.PASSWORD_RESET_TIMEOUT // 3600)


def _frontend_base_url(request):
    configured = os.getenv('FRONTEND_URL', '').strip()
    if configured:
        return configured.rstrip('/')

    origin = (request.headers.get('Origin') or '').strip() if request else ''
    if origin and (settings.DEBUG or origin in settings.CORS_ALLOWED_ORIGINS):
        return origin.rstrip('/')

    railway_frontend = os.getenv('RAILWAY_SERVICE_FRONTEND_URL', '').strip()
    if railway_frontend:
        return f'https://{railway_frontend}'

    return 'http://localhost:5173'


def build_invite_url(user, request):
    params = urlencode({
        'uid': urlsafe_base64_encode(force_bytes(user.pk)),
        'token': default_token_generator.make_token(user),
    })
    return f'{_frontend_base_url(request)}/staff/login?{params}'


def resolve_invite(uid, token):
    """Return the user for a valid, unused invite link, otherwise None."""
    try:
        user_id = force_str(urlsafe_base64_decode(uid or ''))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None
    if not default_token_generator.check_token(user, token or ''):
        return None
    return user


def _send_via_smtp(user, invite_url, invited_by, placement):
    if not (settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD):
        return False
    body = (
        f'Hello {user.full_name},\n\n'
        f'{invited_by} has created your Gatepass staff account{placement}.\n\n'
        'Open the link below to set your password. You will be signed in straight away:\n'
        f'{invite_url}\n\n'
        f'This link expires in {invite_expiry_hours()} hours and can only be used once.\n'
    )
    try:
        send_mail(
            'Set up your Gatepass account',
            body,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            connection=get_connection(timeout=settings.EMAIL_TIMEOUT),
        )
        return True
    except Exception as exc:
        logger.error('Invite email via SMTP failed for %s: %s', user.email, exc)
        return False


def send_staff_invite(user, request, invited_by=None):
    invite_url = build_invite_url(user, request)
    invited_by_name = getattr(invited_by, 'full_name', '') or 'Your administrator'
    department_name = user.department.name if user.department else ''
    division_name = user.division.name if user.division else ''
    placement = f' in {division_name}, {department_name}' if department_name and division_name else ''

    channel = None
    if INVITE_TEMPLATE_ID and send_emailjs(INVITE_TEMPLATE_ID, {
        'to_email': user.email,
        'to_name': user.full_name,
        'invite_url': invite_url,
        'invited_by': invited_by_name,
        'role': user.role,
        'department_name': department_name,
        'division_name': division_name,
        'expires_in_hours': invite_expiry_hours(),
    }):
        channel = 'emailjs'
    elif _send_via_smtp(user, invite_url, invited_by_name, placement):
        channel = 'smtp'

    return {
        'email_sent': channel is not None,
        'channel': channel,
        'invite_url': invite_url,
        'expires_in_hours': invite_expiry_hours(),
    }
