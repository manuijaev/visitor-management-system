import logging

from rest_framework import generics, permissions, status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from notifications.services import send_fcm_push_notification
from notifications.email_templates import visit_request_email, visit_response_email
from notifications.emailjs_service import (
    REQUEST_TEMPLATE_ID,
    RESPONSE_TEMPLATE_ID,
    send_emailjs,
)
from notifications.sms_service import (
    send_staff_arrival_sms,
    send_staff_sms,
    send_visitor_reassigned_sms,
    send_visitor_received_sms,
    send_visitor_sms,
)
from users.models import UserDeviceToken

from departments.permissions import IsAdminRole

from .models import Appointment, OfficeHours
from .serializers import (
    OfficeHoursSerializer,
    AppointmentCreateSerializer,
    AppointmentListSerializer,
    AppointmentReassignSerializer,
    AppointmentUpdateSerializer,
    VisitLookupSerializer,
    VisitStatusSerializer,
)

logger = logging.getLogger(__name__)


def _format_local_time(dt):
    return timezone.localtime(dt).strftime("%b %d, %Y at %I:%M %p")


def _student_label(appointment):
    """Return "Name (Class)" for the student the visit is about, or an empty string."""
    name = (appointment.student_name or '').strip()
    student_class = (appointment.student_class or '').strip()
    if name and student_class:
        return f"{name} ({student_class})"
    return name or student_class


def _get_visit_message(appointment):
    student = _student_label(appointment)
    about = f" About: {student}." if student else ""
    return _visit_message_base(appointment) + about


def _visit_message_base(appointment):
    now = timezone.now()
    diff = appointment.appointment_date - now
    minutes = diff.total_seconds() / 60

    if minutes <= 5:
        return (
            f"{appointment.visitor_name} is at reception RIGHT NOW waiting to see you."
        )

    if minutes <= 65:
        eta = max(1, int(minutes))
        return (
            f"{appointment.visitor_name} is on their way and will arrive in approximately {eta} minute"
            f"{'s' if eta != 1 else ''}."
        )

    formatted = _format_local_time(appointment.appointment_date)
    return f"{appointment.visitor_name} has a scheduled visit on {formatted}."


def _visit_request_params(appointment):
    staff = appointment.staff_member
    staff_name = staff.full_name or staff.first_name or "Staff"
    params = {
        "to_email": staff.email,
        "to_name": staff_name,
        "from_name": appointment.visitor_name,
        "reply_to": appointment.visitor_email,
        "visitor_name": appointment.visitor_name,
        "visitor_email": appointment.visitor_email,
        "department_name": appointment.department.name if appointment.department else "",
        "division_name": appointment.division.name if appointment.division else "",
        "appointment_date": _format_local_time(appointment.appointment_date),
        "message": appointment.message or "",
        "staff_name": staff_name,
    }
    params.update(visit_request_email(
        staff_name=staff_name,
        visitor_name=params["visitor_name"],
        visitor_email=params["visitor_email"],
        visitor_phone=appointment.visitor_phone or "",
        appointment_date=params["appointment_date"],
        department_name=params["department_name"],
        division_name=params["division_name"],
        message=params["message"],
        student=_student_label(appointment),
    ))
    return params


def _notify_new_appointment(appointment):
    logger.info(f'Starting notification for appointment_id={appointment.id}, staff_member={appointment.staff_member}')
    body = _get_visit_message(appointment)
    
    try:
        staff_email = appointment.staff_member.email
        logger.info(f'Sending email to staff: {staff_email}')
        send_emailjs(REQUEST_TEMPLATE_ID, _visit_request_params(appointment))
        logger.info(f'EmailJS request email queued for staff {staff_email}')
    except Exception as e:
        logger.exception('Failed to send appointment request email for appointment_id=%s: %s', appointment.id, str(e))

    try:
        token_set = set(
            UserDeviceToken.objects.filter(user=appointment.staff_member, is_active=True).values_list('token', flat=True)
        )
        if appointment.staff_member.fcm_token:
            token_set.add(appointment.staff_member.fcm_token)

        if not token_set:
            logger.info('Push skipped for appointment_id=%s reason=no_registered_device_tokens', appointment.id)
            return

        sent_count = 0
        failed_count = 0
        for token in token_set:
            local_appt_time = timezone.localtime(appointment.appointment_date).strftime('%b %d, %Y at %I:%M %p')
            push_result = send_fcm_push_notification(
                fcm_token=token,
                title='Visitor Waiting',
                body=body,
            )
            if push_result.get('sent'):
                sent_count += 1
            else:
                failed_count += 1
            if push_result.get('invalid_token'):
                UserDeviceToken.objects.filter(token=token).update(is_active=False)
                if token == appointment.staff_member.fcm_token:
                    appointment.staff_member.fcm_token = ''
                    appointment.staff_member.save(update_fields=['fcm_token'])
                logger.warning(
                    'Deactivated stale FCM token for staff_id=%s appointment_id=%s',
                    appointment.staff_member_id,
                    appointment.id,
                )
            logger.info(
                'Push dispatch result appointment_id=%s staff_id=%s token_prefix=%s result=%s',
                appointment.id,
                appointment.staff_member_id,
                token[:12],
                push_result,
            )
        logger.info(
            'Push fanout summary appointment_id=%s sent=%s failed=%s total_tokens=%s',
            appointment.id,
            sent_count,
            failed_count,
            len(token_set),
        )
    except Exception:
        logger.exception('Failed to send FCM push for appointment_id=%s', appointment.id)


def _notify_appointment_response(appointment, staff_name=None):
    print("=== RESPONSE NOTIFICATION TRIGGERED ===")
    print(f"=== appointment_id: {appointment.id}, status: {appointment.status} ===")
    formatted_date = _format_local_time(appointment.appointment_date)
    resolved_staff_name = staff_name or appointment.staff_member.full_name or "Staff"

    try:
        if not appointment.visitor_email:
            logger.info("Response email skipped for appointment_id=%s: no visitor email", appointment.id)
        else:
            _send_response_email(appointment, resolved_staff_name, formatted_date)
    except Exception:
        logger.exception("Failed to send response email for appointment_id=%s", appointment.id)

    try:
        print(f"SMS ATTEMPT — phone: {appointment.visitor_phone}, visitor: {appointment.visitor_name}, status: {appointment.status}")
        if not appointment.visitor_phone:
            print("SMS SKIPPED — visitor_phone is empty on this appointment")
        send_visitor_sms(
            phone_number=appointment.visitor_phone,
            visitor_name=appointment.visitor_name,
            staff_name=resolved_staff_name,
            status=appointment.status,
            response_note=appointment.response_note or '',
            visit_time=formatted_date,
        )
        logger.info("SMS dispatched for appointment_id=%s", appointment.id)
    except Exception:
        logger.exception("Failed to send SMS for appointment_id=%s", appointment.id)


def _send_response_email(appointment, resolved_staff_name, formatted_date):
    staff_email = appointment.staff_member.email
    send_emailjs(
        RESPONSE_TEMPLATE_ID,
        {
            "to_email": appointment.visitor_email,
            "from_name": resolved_staff_name,
            "reply_to": staff_email,
            "staff_email": staff_email,
            "visitor_name": appointment.visitor_name,
            "visitor_email": appointment.visitor_email,
            "status": appointment.status,
            "response_note": appointment.response_note or "",
            "appointment_date": formatted_date,
            "staff_name": resolved_staff_name,
            **visit_response_email(
                visitor_name=appointment.visitor_name,
                staff_name=resolved_staff_name,
                status=appointment.status,
                appointment_date=formatted_date,
                response_note=appointment.response_note or "",
            ),
        },
    )
    logger.info("Response email sent for appointment_id=%s", appointment.id)


def _notify_reassignment(appointment):
    """Alert the newly assigned staff member (email, push, SMS) and tell the visitor who they will now see."""
    _notify_new_appointment(appointment)

    staff = appointment.staff_member
    staff_name = staff.full_name or staff.email
    try:
        if staff.phone:
            send_staff_sms(
                phone_number=staff.phone,
                staff_name=staff_name,
                message=f"a visit was reassigned to you. {_get_visit_message(appointment)}",
            )
    except Exception:
        logger.exception('Failed to send reassignment SMS to staff for appointment_id=%s', appointment.id)

    try:
        if appointment.visitor_phone:
            send_visitor_reassigned_sms(
                phone_number=appointment.visitor_phone,
                visitor_name=appointment.visitor_name,
                staff_name=staff.full_name or 'a new host',
                visit_time=_format_local_time(appointment.appointment_date),
            )
    except Exception:
        logger.exception('Failed to send reassignment SMS to visitor for appointment_id=%s', appointment.id)


class AppointmentCreateView(generics.CreateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': 'Appointment request created',
            'data': response.data,
            'push': getattr(self, '_push_result', {'sent': False, 'reason': 'unknown'}),
            'email': getattr(self, '_email_result', {'sent': False, 'reason': 'unknown'}),
            'sms': getattr(self, '_sms_result', {'staff': False, 'visitor': False}),
        }
        return response

    def perform_create(self, serializer):
        appointment = serializer.save()
        # Send email and push synchronously to ensure delivery
        logger.info(
            "AppointmentCreateView.perform_create saved visitor_phone=%s appointment_id=%s",
            appointment.visitor_phone,
            appointment.id,
        )
        self._email_result = {'sent': False, 'reason': 'unknown'}
        self._push_result = {'sent': False, 'reason': 'unknown'}
        
        # Send email immediately (synchronously)
        try:
            success = send_emailjs(REQUEST_TEMPLATE_ID, _visit_request_params(appointment))
            self._email_result = {'sent': success, 'reason': 'sent' if success else 'failed'}
        except Exception as e:
            logger.exception('Failed to send appointment email: %s', str(e))
            self._email_result = {'sent': False, 'reason': str(e)[:100]}
        
        notification_message = _get_visit_message(appointment)
        # Send push notification
        try:
            token_set = set(
                UserDeviceToken.objects.filter(user=appointment.staff_member, is_active=True).values_list('token', flat=True)
            )
            if appointment.staff_member.fcm_token:
                token_set.add(appointment.staff_member.fcm_token)

            if token_set:
                push_result = send_fcm_push_notification(
                    fcm_token=list(token_set)[0],  # Send to first token
                    title='Visitor Waiting',
                    body=notification_message,
                )
                self._push_result = push_result
        except Exception as e:
            logger.exception('Failed to send push notification: %s', str(e))
            self._push_result = {'sent': False, 'reason': str(e)[:100]}

        self._sms_result = {'staff': False, 'visitor': False}
        try:
            staff_phone = appointment.staff_member.phone
            if staff_phone:
                self._sms_result['staff'] = send_staff_sms(
                    phone_number=staff_phone,
                    staff_name=appointment.staff_member.full_name or appointment.staff_member.email,
                    message=notification_message,
                )
        except Exception:
            logger.exception('Failed to send staff SMS for appointment_id=%s', appointment.id)

        try:
            if appointment.visitor_phone:
                self._sms_result['visitor'] = send_visitor_received_sms(
                    phone_number=appointment.visitor_phone,
                    visitor_name=appointment.visitor_name,
                    staff_name=appointment.staff_member.full_name or 'your host',
                    visit_time=_format_local_time(appointment.appointment_date),
                )
        except Exception:
            logger.exception('Failed to send visitor confirmation SMS for appointment_id=%s', appointment.id)


class MyAppointmentsView(generics.ListAPIView):
    serializer_class = AppointmentListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.select_related('department', 'division', 'staff_member').all()
        return Appointment.objects.select_related('department', 'division', 'staff_member').filter(staff_member=user)


class AppointmentUpdateView(generics.UpdateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.all()
        return Appointment.objects.filter(staff_member=user)

    def perform_update(self, serializer):
        appointment = serializer.save()
        print("=== PERFORM UPDATE CALLED ===")
        print(f"=== phone: {appointment.visitor_phone}, status: {appointment.status} ===")
        _notify_appointment_response(
            appointment,
            getattr(self.request.user, 'full_name', None)
        )

    def update(self, request, *args, **kwargs):
        logger.info(
            "AppointmentUpdateView.update called staff=%s appointment_id=%s data=%s",
            request.user.id if request.user.is_authenticated else None,
            kwargs.get('id'),
            request.data,
        )
        response = super().update(request, *args, **kwargs)
        return Response({
            'message': 'Appointment updated',
            'data': response.data
        })


class AppointmentDeleteView(generics.DestroyAPIView):
    queryset = Appointment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.all()
        return Appointment.objects.filter(staff_member=user)


class AppointmentReassignView(generics.UpdateAPIView):
    """
    Admin-only endpoint to reassign appointments to different staff members.
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentReassignSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.all()
        return Appointment.objects.none()

    def update(self, request, *args, **kwargs):
        appointment = self.get_object()
        old_staff = appointment.staff_member
        response = super().update(request, *args, **kwargs)
        appointment.refresh_from_db()
        new_staff = appointment.staff_member
        _notify_reassignment(appointment)
        return Response({
            'message': f'Appointment reassigned from {old_staff.full_name} to {new_staff.full_name}',
            'data': response.data
        })


def _notify_staff_of_cancellation(appointment):
    """Tell the host by SMS and push that the visitor cancelled."""
    staff = appointment.staff_member
    body = f"{appointment.visitor_name} cancelled their visit on {_format_local_time(appointment.appointment_date)}."
    try:
        if staff.phone:
            send_staff_sms(phone_number=staff.phone, staff_name=staff.full_name or staff.email, message=body)
    except Exception:
        logger.exception('Failed to send cancellation SMS for appointment_id=%s', appointment.id)

    try:
        tokens = set(UserDeviceToken.objects.filter(user=staff, is_active=True).values_list('token', flat=True))
        if staff.fcm_token:
            tokens.add(staff.fcm_token)
        for token in tokens:
            send_fcm_push_notification(fcm_token=token, title='Visit cancelled', body=body)
    except Exception:
        logger.exception('Failed to send cancellation push for appointment_id=%s', appointment.id)


class VisitLookupView(APIView):
    """Public: a visitor checks their visit with the reference from their pass and their phone number."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'visit-lookup'

    def post(self, request):
        lookup = VisitLookupSerializer(data=request.data)
        if not lookup.is_valid():
            return Response({'detail': VisitLookupSerializer.NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        return Response(VisitStatusSerializer(lookup.validated_data['appointment']).data)


class VisitCancelView(VisitLookupView):
    """Public: a visitor cancels their own upcoming visit."""

    def post(self, request):
        lookup = VisitLookupSerializer(data=request.data)
        if not lookup.is_valid():
            return Response({'detail': VisitLookupSerializer.NOT_FOUND}, status=status.HTTP_404_NOT_FOUND)
        appointment = lookup.validated_data['appointment']
        if not VisitStatusSerializer().get_can_cancel(appointment):
            return Response(
                {'detail': 'This visit can no longer be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = Appointment.Status.CANCELLED
        appointment.save(update_fields=['status'])
        _notify_staff_of_cancellation(appointment)
        return Response(VisitStatusSerializer(appointment).data)


def _notify_host_of_arrival(appointment):
    """SMS and push the host that their visitor is at the gate."""
    staff = appointment.staff_member
    try:
        if staff.phone:
            send_staff_arrival_sms(staff.phone, staff.full_name or staff.email, appointment.visitor_name)
    except Exception:
        logger.exception('Failed to send arrival SMS for appointment_id=%s', appointment.id)

    try:
        tokens = set(UserDeviceToken.objects.filter(user=staff, is_active=True).values_list('token', flat=True))
        if staff.fcm_token:
            tokens.add(staff.fcm_token)
        for token in tokens:
            send_fcm_push_notification(
                fcm_token=token,
                title='Visitor arrived',
                body=f'{appointment.visitor_name} has been signed in at the gate.',
            )
    except Exception:
        logger.exception('Failed to send arrival push for appointment_id=%s', appointment.id)


class _GateActionView(APIView):
    """Shared lookup for sign-in/sign-out: admins can act on any visit, staff only on their own."""

    permission_classes = [permissions.IsAuthenticated]

    def get_appointment(self, request, id):
        visits = Appointment.objects.select_related('staff_member', 'department', 'division')
        if getattr(request.user, 'role', None) != 'Admin':
            visits = visits.filter(staff_member=request.user)
        return visits.filter(id=id).first()

    def respond(self, appointment):
        return Response(AppointmentListSerializer(appointment).data)


class AppointmentCheckInView(_GateActionView):
    def post(self, request, id):
        appointment = self.get_appointment(request, id)
        if not appointment:
            return Response({'detail': 'Visit not found.'}, status=status.HTTP_404_NOT_FOUND)
        if appointment.status in Appointment.CLOSED_STATUSES:
            return Response(
                {'detail': f'This visit was {appointment.status.lower()}, so it cannot be signed in.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if appointment.checked_in_at:
            return Response({'detail': 'This visitor is already signed in.'}, status=status.HTTP_400_BAD_REQUEST)
        appointment.checked_in_at = timezone.now()
        appointment.save(update_fields=['checked_in_at'])
        _notify_host_of_arrival(appointment)
        return self.respond(appointment)


class AppointmentCheckOutView(_GateActionView):
    def post(self, request, id):
        appointment = self.get_appointment(request, id)
        if not appointment:
            return Response({'detail': 'Visit not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not appointment.checked_in_at:
            return Response({'detail': 'This visitor has not been signed in yet.'}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.checked_out_at:
            return Response({'detail': 'This visitor has already signed out.'}, status=status.HTTP_400_BAD_REQUEST)
        appointment.checked_out_at = timezone.now()
        appointment.save(update_fields=['checked_out_at'])
        return self.respond(appointment)


class OfficeHoursView(generics.RetrieveUpdateAPIView):
    """Anyone can read the visiting hours; only admins can change them."""
    serializer_class = OfficeHoursSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminRole()]

    def get_object(self):
        return OfficeHours.load()
