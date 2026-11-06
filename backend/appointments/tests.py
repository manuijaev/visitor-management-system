from datetime import timedelta
from unittest import mock

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from departments.models import Department, Division
from notifications.sms_service import normalize_phone
from users.models import User

from .models import Appointment


@mock.patch('appointments.views.send_emailjs', return_value=True)
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class AppointmentSmsTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Finance')
        self.division = Division.objects.create(name='Payroll', department=self.department)
        self.staff = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division, phone='0711000111',
        )
        self.client = APIClient()

    def _payload(self, **overrides):
        payload = {
            'visitor_name': 'Amina Hassan',
            'visitor_email': 'amina@example.com',
            'visitor_phone': '0722 333 444',
            'department': self.department.id,
            'division': self.division.id,
            'staff_member': self.staff.id,
            'appointment_date': (timezone.now() + timedelta(hours=3)).isoformat(),
            'message': 'Invoice review',
        }
        payload.update(overrides)
        return payload

    def test_booking_texts_both_staff_and_visitor(self, send_sms, _email):
        response = self.client.post('/api/appointments/create/', self._payload(), format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['sms'], {'staff': True, 'visitor': True})
        recipients = {call.args[0] for call in send_sms.call_args_list}
        self.assertEqual(recipients, {'0711000111', '0722 333 444'})
        visitor_text = next(c.args[1] for c in send_sms.call_args_list if c.args[0] == '0722 333 444')
        self.assertIn('Jane Wanjiru', visitor_text)
        self.assertIn('received', visitor_text)
        self.assertLessEqual(len(visitor_text), 160)

    def test_phone_is_required(self, send_sms, _email):
        response = self.client.post('/api/appointments/create/', self._payload(visitor_phone=''), format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('visitor_phone', response.data)
        send_sms.assert_not_called()

    def test_rejects_invalid_phone(self, send_sms, _email):
        response = self.client.post('/api/appointments/create/', self._payload(visitor_phone='12ab'), format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('visitor_phone', response.data)

    def test_response_texts_visitor_with_status_and_time(self, send_sms, _email):
        appointment = Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_email='amina@example.com', visitor_phone='0722333444',
            department=self.department, division=self.division, staff_member=self.staff,
            appointment_date=timezone.now() + timedelta(hours=3),
        )
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f'/api/appointments/update/{appointment.id}/',
            {'status': 'Accepted', 'response_note': 'See you at reception'},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        phone, text = send_sms.call_args.args
        self.assertEqual(phone, '0722333444')
        self.assertIn('ACCEPTED', text)
        self.assertIn('See you at reception', text)
        self.assertLessEqual(len(text), 160)


class NormalizePhoneTests(TestCase):
    def test_kenyan_formats(self):
        for raw in ['0712345678', '+254712345678', '254 712 345 678', '712345678', '0712-345-678']:
            self.assertEqual(normalize_phone(raw), '254712345678', raw)

    def test_invalid(self):
        for raw in ['', None, '12ab', '1234']:
            self.assertIsNone(normalize_phone(raw), raw)
