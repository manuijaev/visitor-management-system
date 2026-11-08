from datetime import time, timedelta

from django.db import models
from django.utils import timezone

VISIT_LENGTH = timedelta(minutes=30)


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        ACCEPTED = 'Accepted', 'Accepted'
        RESCHEDULED = 'Rescheduled', 'Rescheduled'
        DECLINED = 'Declined', 'Declined'
        CANCELLED = 'Cancelled', 'Cancelled'

    CLOSED_STATUSES = (Status.DECLINED, Status.CANCELLED)

    visitor_name = models.CharField(max_length=120)
    visitor_phone = models.CharField(max_length=20, blank=True, null=True)
    visitor_email = models.EmailField(blank=True)
    student_name = models.CharField(max_length=120, blank=True)
    student_class = models.CharField(max_length=40, blank=True)
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE, related_name='appointments')
    division = models.ForeignKey(
        'departments.Division',
        on_delete=models.SET_NULL,
        related_name='appointments',
        null=True,
        blank=True,
    )
    staff_member = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateTimeField()
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    response_note = models.TextField(blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def reference(self):
        """The code visitors see on their pass, e.g. GP-00012."""
        return f'GP-{self.id:05d}'

    def __str__(self):
        return f'{self.visitor_name} -> {self.staff_member.full_name} ({self.status})'

    @classmethod
    def active_for_staff_near(cls, staff, when):
        """Visits for this staff member that still hold a slot overlapping a 30-minute visit at `when`."""
        return cls.objects.filter(
            staff_member=staff,
            appointment_date__gt=when - VISIT_LENGTH,
            appointment_date__lt=when + VISIT_LENGTH,
        ).exclude(status__in=cls.CLOSED_STATUSES)


class OfficeHours(models.Model):
    """The school's visiting hours. A single row, edited by admins and read by the booking page."""

    DEFAULT_DAYS = '0,1,2,3,4'

    opens_at = models.TimeField(default=time(8, 0))
    closes_at = models.TimeField(default=time(17, 0))
    open_days = models.CharField(
        max_length=20, default=DEFAULT_DAYS, help_text='Comma-separated weekdays, Monday=0 to Sunday=6.'
    )

    class Meta:
        verbose_name_plural = 'office hours'

    def __str__(self):
        return f'{self.opens_at:%H:%M}–{self.closes_at:%H:%M} on days {self.open_days}'

    @classmethod
    def load(cls):
        hours, _ = cls.objects.get_or_create(pk=1)
        return hours

    @property
    def weekdays(self):
        return sorted({int(day) for day in self.open_days.split(',') if day.strip().isdigit()})

    def is_open_at(self, when):
        """True when a visit starting at `when` falls on an open day, between opening and closing time."""
        local = timezone.localtime(when)
        return local.weekday() in self.weekdays and self.opens_at <= local.time() < self.closes_at
