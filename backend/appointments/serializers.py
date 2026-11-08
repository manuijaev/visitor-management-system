import re

from django.utils import timezone
from rest_framework import serializers

from notifications.sms_service import normalize_phone

from .models import Appointment


class AppointmentCreateSerializer(serializers.ModelSerializer):
    is_scheduled = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text='True for a planned time slot. Walk-ins and "on my way" visits are never blocked by other bookings.',
    )

    def validate_visitor_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('A phone number is required so we can text you updates.')
        if not normalize_phone(value):
            raise serializers.ValidationError('Enter a valid phone number, e.g. 0712 345 678.')
        return value.strip()

    def validate(self, attrs):
        department = attrs.get('department')
        division = attrs.get('division')
        staff = attrs.get('staff_member')

        if not division:
            raise serializers.ValidationError({'division': 'Division is required.'})
        if division and department and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        if staff and department and staff.department_id != department.id:
            raise serializers.ValidationError({'staff_member': 'Selected staff does not belong to this department.'})
        if staff and division and staff.division_id != division.id:
            raise serializers.ValidationError({'staff_member': 'Selected staff does not belong to this division.'})

        is_scheduled = attrs.pop('is_scheduled', False)
        visit_time = attrs.get('appointment_date')
        if staff and visit_time and staff.unavailable_days.filter(date=timezone.localtime(visit_time).date()).exists():
            name = (staff.full_name or 'This staff member').split()[0]
            raise serializers.ValidationError({'appointment_date': f'{name} is not available on that day. Please pick another day.'})
        if is_scheduled and staff and visit_time and Appointment.active_for_staff_near(staff, visit_time).exists():
            name = (staff.full_name or 'This staff member').split()[0]
            raise serializers.ValidationError(
                {'appointment_date': f'{name} already has a visit at that time. Please pick another slot.'}
            )
        return attrs

    class Meta:
        model = Appointment
        fields = [
            'id',
            'is_scheduled',
            'visitor_name',
            'visitor_email',
            'visitor_phone',
            'student_name',
            'student_class',
            'department',
            'division',
            'staff_member',
            'appointment_date',
            'message',
            'status',
            'response_note',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'response_note', 'created_at']
        extra_kwargs = {'visitor_phone': {'required': True, 'allow_blank': True, 'allow_null': True}}


class AppointmentListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    staff_name = serializers.CharField(source='staff_member.full_name', read_only=True)
    staff_email = serializers.CharField(source='staff_member.email', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'visitor_name',
            'visitor_phone',
            'visitor_email',
            'student_name',
            'student_class',
            'department',
            'department_name',
            'division',
            'division_name',
            'staff_member',
            'staff_name',
            'staff_email',
            'appointment_date',
            'message',
            'status',
            'response_note',
            'created_at',
        ]


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        status = attrs.get('status', getattr(self.instance, 'status', None))
        response_note = attrs.get('response_note', getattr(self.instance, 'response_note', ''))
        if status in ('Accepted', 'Rescheduled', 'Declined') and not str(response_note or '').strip():
            raise serializers.ValidationError({'response_note': 'Response note is required when updating appointment status.'})
        if attrs.get('status') == 'Rescheduled':
            self._validate_new_time(attrs.get('appointment_date'))
        return attrs

    def _validate_new_time(self, new_time):
        """A reschedule must move the visit to a different time in the future."""
        if not new_time:
            raise serializers.ValidationError({'appointment_date': 'Pick a new date and time for the visit.'})
        if new_time <= timezone.now():
            raise serializers.ValidationError({'appointment_date': 'The new time must be in the future.'})
        if self.instance and new_time == self.instance.appointment_date:
            raise serializers.ValidationError({'appointment_date': 'Pick a time different from the original one.'})

    class Meta:
        model = Appointment
        fields = ['status', 'response_note', 'appointment_date']


class AppointmentReassignSerializer(serializers.ModelSerializer):
    """Serializer for admin to reassign appointments to different staff."""

    def validate_staff_member(self, staff):
        if self.instance and staff.id == self.instance.staff_member_id:
            raise serializers.ValidationError('This visit is already with that staff member.')
        if not staff.is_active:
            raise serializers.ValidationError('That staff member is deactivated.')
        if not staff.department_id or not staff.division_id:
            raise serializers.ValidationError('That staff member has no department or division yet.')
        return staff

    def update(self, instance, validated_data):
        staff = validated_data['staff_member']
        instance.staff_member = staff
        instance.department_id = staff.department_id
        instance.division_id = staff.division_id
        instance.status = Appointment.Status.PENDING
        instance.response_note = ''
        instance.save(update_fields=['staff_member', 'department', 'division', 'status', 'response_note'])
        return instance

    class Meta:
        model = Appointment
        fields = ['staff_member']


REFERENCE_RE = re.compile(r'^\s*(?:GP)?[\s-]*0*(\d{1,9})\s*$', re.IGNORECASE)
CANCELLABLE_STATUSES = (
    Appointment.Status.PENDING,
    Appointment.Status.ACCEPTED,
    Appointment.Status.RESCHEDULED,
)


class VisitLookupSerializer(serializers.Serializer):
    """Finds a visit from the reference on the visitor's pass plus the phone number they booked with."""

    NOT_FOUND = 'We could not find a visit with that reference and phone number.'

    reference = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=20)

    def validate(self, attrs):
        match = REFERENCE_RE.match(attrs['reference'])
        phone = normalize_phone(attrs['phone'])
        if not match or not phone:
            raise serializers.ValidationError({'detail': self.NOT_FOUND})
        appointment = (
            Appointment.objects.select_related('staff_member', 'department')
            .filter(id=int(match.group(1)))
            .first()
        )
        if not appointment or normalize_phone(appointment.visitor_phone) != phone:
            raise serializers.ValidationError({'detail': self.NOT_FOUND})
        attrs['appointment'] = appointment
        return attrs


class VisitStatusSerializer(serializers.ModelSerializer):
    """What a visitor may see about their own visit. Deliberately excludes other visitors and staff contact details."""

    staff_name = serializers.CharField(source='staff_member.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'reference',
            'visitor_name',
            'staff_name',
            'department_name',
            'appointment_date',
            'status',
            'response_note',
            'can_cancel',
        ]

    def get_can_cancel(self, obj) -> bool:
        return obj.status in CANCELLABLE_STATUSES and obj.appointment_date > timezone.now()
