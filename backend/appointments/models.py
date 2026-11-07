from datetime import timedelta

from django.db import models

VISIT_LENGTH = timedelta(minutes=30)


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        ACCEPTED = 'Accepted', 'Accepted'
        RESCHEDULED = 'Rescheduled', 'Rescheduled'
        DECLINED = 'Declined', 'Declined'

    visitor_name = models.CharField(max_length=120)
    visitor_phone = models.CharField(max_length=20, blank=True, null=True)
    visitor_email = models.EmailField(blank=True)
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.visitor_name} -> {self.staff_member.full_name} ({self.status})'

    @classmethod
    def active_for_staff_near(cls, staff, when):
        """Visits for this staff member that still hold a slot overlapping a 30-minute visit at `when`."""
        return cls.objects.filter(
            staff_member=staff,
            appointment_date__gt=when - VISIT_LENGTH,
            appointment_date__lt=when + VISIT_LENGTH,
        ).exclude(status=cls.Status.DECLINED)
