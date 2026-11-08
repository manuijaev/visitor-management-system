"""HTML emails styled like the Gatepass web app.

The EmailJS templates only contain ``{{subject}}`` and ``{{{html_body}}}``, so
every email's look and copy lives here. Markup sticks to tables and inline
styles because Gmail and Outlook ignore most CSS.
"""
import os

from django.conf import settings
from django.utils.html import escape, linebreaks

BG = '#f9f7f4'
SURFACE = '#ffffff'
SOFT = '#f3f0ec'
LINE = '#e8e2d9'
INK = '#1a1714'
INK_MID = '#3d3832'
INK_LIGHT = '#6b6560'
INK_FAINT = '#a39d96'
GOLD = '#c9922a'
GOLD_LIGHT = '#fdf3e3'
GOLD_DARK = '#8a6018'

SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif"
SANS = "'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif"

STATUS_STYLES = {
    'Accepted': ('#e7f3ea', '#2f6b45'),
    'Declined': ('#fbeaea', '#a33a2c'),
    'Rescheduled': (GOLD_LIGHT, GOLD_DARK),
    'Pending': (GOLD_LIGHT, GOLD_DARK),
}

STATUS_HEADLINES = {
    'Accepted': 'Your visit is confirmed',
    'Declined': 'Your visit request was declined',
    'Rescheduled': 'Your visit has been rescheduled',
    'Pending': 'Your visit request is pending',
}


def frontend_base_url(request=None):
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


def _details(rows):
    rows = [(label, value) for label, value in rows if value]
    cells = ''.join(
        f'<tr><td style="padding:12px 0;{border}font:600 11px/1.4 {SANS};'
        f'letter-spacing:.08em;text-transform:uppercase;color:{INK_LIGHT};width:120px;vertical-align:top;">'
        f'{escape(label)}</td>'
        f'<td style="padding:12px 0;{border}font:500 15px/1.5 {SANS};color:{INK};">'
        f'{value}</td></tr>'
        for index, (label, value) in enumerate(rows)
        for border in [f'border-top:1px solid {LINE};' if index else '']
    )
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'style="background:{BG};border:1px solid {LINE};border-radius:14px;margin:24px 0 0;">'
        f'<tr><td style="padding:4px 20px;"><table role="presentation" width="100%" '
        f'cellpadding="0" cellspacing="0" style="border-collapse:collapse;">{cells}</table></td></tr></table>'
    )


def _note(label, text):
    return (
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">'
        f'<tr><td style="background:{GOLD_LIGHT};border-left:3px solid {GOLD};border-radius:0 12px 12px 0;'
        f'padding:16px 20px;">'
        f'<div style="font:600 11px/1.4 {SANS};letter-spacing:.08em;text-transform:uppercase;'
        f'color:{GOLD_DARK};margin-bottom:6px;">{escape(label)}</div>'
        f'<div style="font:400 15px/1.6 {SANS};color:{INK_MID};">{linebreaks(escape(text))}</div>'
        f'</td></tr></table>'
    )


def _button(label, url):
    return (
        f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">'
        f'<tr><td style="background:{INK};border-radius:12px;">'
        f'<a href="{escape(url)}" style="display:inline-block;padding:14px 28px;font:600 15px/1 {SANS};'
        f'color:#ffffff;text-decoration:none;border-radius:12px;">{escape(label)} &rarr;</a>'
        f'</td></tr></table>'
    )


def _pill(status):
    bg, fg = STATUS_STYLES.get(status, (SOFT, INK_MID))
    return (
        f'<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:{bg};'
        f'color:{fg};font:600 13px/1.4 {SANS};">{escape(status)}</span>'
    )


def _layout(*, preheader, eyebrow, title, intro, body='', footer):
    return f"""<div style="margin:0;padding:0;background:{BG};">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BG};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 8px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:36px;height:36px;background:{GOLD};border-radius:10px;text-align:center;vertical-align:middle;font:600 20px/36px {SERIF};color:#ffffff;">G</td>
<td style="padding-left:12px;"><div style="font:600 22px/1 {SERIF};color:{INK};">Gatepass</div>
<div style="font:600 10px/1.6 {SANS};letter-spacing:.16em;text-transform:uppercase;color:{GOLD};">Visitor management</div></td>
</tr></table>
</td></tr>
<tr><td style="background:{SURFACE};border:1px solid {LINE};border-radius:20px;padding:36px 32px;">
<div style="font:600 11px/1.4 {SANS};letter-spacing:.14em;text-transform:uppercase;color:{GOLD};">{escape(eyebrow)}</div>
<h1 style="margin:8px 0 0;font:600 30px/1.2 {SERIF};color:{INK};">{escape(title)}</h1>
<p style="margin:14px 0 0;font:400 15px/1.65 {SANS};color:{INK_MID};">{intro}</p>
{body}
</td></tr>
<tr><td style="padding:20px 8px 0;font:400 12px/1.6 {SANS};color:{INK_FAINT};text-align:center;">{footer}</td></tr>
</table>
</td></tr>
</table>
</div>"""


def visit_request_email(*, staff_name, visitor_name, visitor_email, appointment_date,
                        department_name='', division_name='', message='', visitor_phone='', student=''):
    placement = ' / '.join(filter(None, [department_name, division_name]))
    rows = [('Visitor', escape(visitor_name))]
    if visitor_phone:
        rows.append(('Phone', f'<a href="tel:{escape(visitor_phone)}" style="color:{GOLD_DARK};text-decoration:none;">'
                              f'{escape(visitor_phone)}</a>'))
    if visitor_email:
        rows.append(('Email', f'<a href="mailto:{escape(visitor_email)}" style="color:{GOLD_DARK};text-decoration:none;">'
                              f'{escape(visitor_email)}</a>'))
    if student:
        rows.append(('Student', escape(student)))
    rows += [('Arrival', escape(appointment_date)), ('Department', escape(placement))]
    body = _details(rows)
    if message:
        body += _note('Purpose of visit', message)
    body += _button('Respond in dashboard', f'{frontend_base_url()}/staff')
    return {
        'subject': f'Visitor alert: {visitor_name} is here to see you',
        'html_body': _layout(
            preheader=f'{visitor_name} requested a visit for {appointment_date}.',
            eyebrow='New visit request',
            title=f'{visitor_name} is here to see you',
            intro=f'Hello {escape(staff_name)}, you have a visitor waiting. '
                  'Accept, reschedule or decline the request from your dashboard.',
            body=body,
            footer='Sent automatically by Gatepass. Replies go to the visitor.',
        ),
    }


def visit_response_email(*, visitor_name, staff_name, status, appointment_date, response_note=''):
    body = _details([
        ('Status', _pill(status)),
        ('Host', escape(staff_name)),
        ('New time' if status == 'Rescheduled' else 'Arrival', escape(appointment_date)),
    ])
    if response_note:
        body += _note(f'Message from {staff_name}', response_note)
    return {
        'subject': f'Visit update: your request was {status.lower()} by {staff_name}',
        'html_body': _layout(
            preheader=f'{staff_name} has {status.lower()} your visit request.',
            eyebrow='Visit update',
            title=STATUS_HEADLINES.get(status, 'Your visit has been updated'),
            intro=f'Hello {escape(visitor_name)}, {escape(staff_name)} has reviewed your visit request.',
            body=body,
            footer=f'Questions? Reply to this email and {escape(staff_name)} will receive it.',
        ),
    }


def staff_invite_email(*, full_name, invited_by, invite_url, role, expires_in_hours,
                       department_name='', division_name=''):
    first = (full_name or '').split(' ')[0] or 'there'
    placement = ' / '.join(filter(None, [department_name, division_name]))
    body = _details([
        ('Department', escape(placement)),
        ('Access', escape(role)),
    ])
    body += _button('Set your password', invite_url)
    body += (
        f'<p style="margin:20px 0 0;font:400 13px/1.6 {SANS};color:{INK_LIGHT};">'
        f'This link works once and expires in {expires_in_hours} hours. If the button does not work, '
        f'copy this address into your browser:<br>'
        f'<a href="{escape(invite_url)}" style="color:{GOLD_DARK};word-break:break-all;">{escape(invite_url)}</a></p>'
    )
    return {
        'subject': 'Set up your Gatepass account',
        'html_body': _layout(
            preheader=f'{invited_by} created your Gatepass account. Set a password to get started.',
            eyebrow='Welcome aboard',
            title=f'Welcome to Gatepass, {first}',
            intro=f'{escape(invited_by)} has created your staff account. Choose a password and '
                  'you will be signed straight in to your visitor dashboard.',
            body=body,
            footer="Didn't expect this email? You can safely ignore it.",
        ),
    }
