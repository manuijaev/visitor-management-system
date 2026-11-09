from datetime import datetime, timedelta
from unittest import mock

from django.core.cache import cache
from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from departments.models import Department, Division
from notifications.sms_service import normalize_phone
from users.models import StaffUnavailableDay, User

from .models import Appointment, OfficeHours


def next_weekday_at(hour, minute=0, days_ahead=2):
    """A local (EAT) time at least `days_ahead` days out that falls on a weekday."""
    day = timezone.localtime() + timedelta(days=days_ahead)
    while day.weekday() >= 5:
        day += timedelta(days=1)
    return day.replace(hour=hour, minute=minute, second=0, microsecond=0)


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

    def test_walk_in_can_book_without_email(self, send_sms, email):
        response = self.client.post(
            '/api/appointments/create/',
            self._payload(visitor_email='', appointment_date=timezone.now().isoformat()),
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['sms'], {'staff': True, 'visitor': True})
        staff_text = next(c.args[1] for c in send_sms.call_args_list if c.args[0] == '0711000111')
        self.assertIn('RIGHT NOW', staff_text)
        params = email.call_args.args[1]
        self.assertIn('0722 333 444', params['html_body'])
        self.assertNotIn('mailto:', params['html_body'])

    def test_response_skips_email_when_visitor_gave_none(self, send_sms, email):
        appointment = Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_email='', visitor_phone='0722333444',
            department=self.department, division=self.division, staff_member=self.staff,
            appointment_date=timezone.now() + timedelta(hours=3),
        )
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f'/api/appointments/update/{appointment.id}/',
            {'status': 'Accepted', 'response_note': 'Come up to floor 3'},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        email.assert_not_called()
        self.assertIn('ACCEPTED', send_sms.call_args.args[1])

    def test_booking_saves_student_and_tells_staff(self, send_sms, email):
        response = self.client.post(
            '/api/appointments/create/',
            self._payload(student_name='Brian Otieno', student_class='Grade 5', appointment_date=timezone.now().isoformat()),
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        appointment = Appointment.objects.get(id=response.data['data']['id'])
        self.assertEqual(appointment.student_name, 'Brian Otieno')
        self.assertEqual(appointment.student_class, 'Grade 5')
        staff_text = next(c.args[1] for c in send_sms.call_args_list if c.args[0] == '0711000111')
        self.assertIn('Brian Otieno (Grade 5)', staff_text)
        self.assertLessEqual(len(staff_text), 160)
        self.assertIn('Brian Otieno (Grade 5)', email.call_args.args[1]['html_body'])

    def test_student_details_are_optional(self, send_sms, email):
        response = self.client.post('/api/appointments/create/', self._payload(), format='json')

        self.assertEqual(response.status_code, 201, response.data)
        appointment = Appointment.objects.get(id=response.data['data']['id'])
        self.assertEqual(appointment.student_name, '')
        staff_text = next(c.args[1] for c in send_sms.call_args_list if c.args[0] == '0711000111')
        self.assertNotIn('About:', staff_text)
        self.assertNotIn('>Student</td>', email.call_args.args[1]['html_body'])

    def test_staff_list_includes_student_details(self, _send_sms, _email):
        Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_phone='0722333444', student_name='Brian Otieno', student_class='Grade 5',
            department=self.department, division=self.division, staff_member=self.staff,
            appointment_date=timezone.now() + timedelta(hours=3),
        )
        self.client.force_authenticate(self.staff)

        response = self.client.get('/api/appointments/my/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['student_name'], 'Brian Otieno')
        self.assertEqual(response.data[0]['student_class'], 'Grade 5')

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

    def _pending_visit(self):
        return Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_email='amina@example.com', visitor_phone='0722333444',
            department=self.department, division=self.division, staff_member=self.staff,
            appointment_date=timezone.now() + timedelta(hours=3),
        )

    def test_reschedule_saves_new_time_and_texts_it(self, send_sms, email):
        appointment = self._pending_visit()
        new_time = next_weekday_at(11, 30)
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f'/api/appointments/update/{appointment.id}/',
            {'status': 'Rescheduled', 'response_note': 'I have a staff meeting', 'appointment_date': new_time.isoformat()},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'Rescheduled')
        self.assertEqual(appointment.appointment_date, new_time)
        new_time_text = timezone.localtime(new_time).strftime('%b %d, %Y at %I:%M %p')
        text = send_sms.call_args.args[1]
        self.assertIn(f'RESCHEDULED your visit to {new_time_text}', text)
        self.assertLessEqual(len(text), 160)
        html = email.call_args.args[1]['html_body']
        self.assertIn('New time', html)
        self.assertIn(new_time_text, html)

    def test_reschedule_requires_new_time(self, send_sms, _email):
        appointment = self._pending_visit()
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f'/api/appointments/update/{appointment.id}/',
            {'status': 'Rescheduled', 'response_note': 'Busy then'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('appointment_date', response.data)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'Pending')
        send_sms.assert_not_called()

    def test_reschedule_rejects_past_time(self, send_sms, _email):
        appointment = self._pending_visit()
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f'/api/appointments/update/{appointment.id}/',
            {
                'status': 'Rescheduled',
                'response_note': 'Busy then',
                'appointment_date': (timezone.now() - timedelta(hours=1)).isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('appointment_date', response.data)
        send_sms.assert_not_called()

    def test_reschedule_rejects_same_time(self, send_sms, _email):
        appointment = self._pending_visit()
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f'/api/appointments/update/{appointment.id}/',
            {
                'status': 'Rescheduled',
                'response_note': 'Busy then',
                'appointment_date': appointment.appointment_date.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('appointment_date', response.data)
        send_sms.assert_not_called()


class AfricasTalkingTests(TestCase):
    @mock.patch.multiple('notifications.sms_service', SMS_PROVIDERS=['africastalking'],
                         AT_USERNAME='gatepass', AT_API_KEY='key123', AT_SENDER_ID=None)
    @mock.patch('notifications.sms_service.requests.post')
    def test_sends_in_africastalking_format(self, post):
        from notifications.sms_service import send_sms
        post.return_value.json.return_value = {
            'SMSMessageData': {'Recipients': [{'statusCode': 101, 'status': 'Success'}]}
        }

        self.assertTrue(send_sms('0705 171 018', 'Hello'))

        url = post.call_args.args[0]
        self.assertEqual(url, 'https://api.africastalking.com/version1/messaging')
        self.assertEqual(post.call_args.kwargs['data'], {'username': 'gatepass', 'to': '+254705171018', 'message': 'Hello'})
        self.assertEqual(post.call_args.kwargs['headers']['apiKey'], 'key123')

    @mock.patch.multiple('notifications.sms_service', SMS_PROVIDERS=['africastalking'],
                         AT_USERNAME='gatepass', AT_API_KEY='key123', AT_SENDER_ID=None)
    @mock.patch('notifications.sms_service.requests.post')
    def test_reports_rejected_number(self, post):
        from notifications.sms_service import send_sms
        post.return_value.json.return_value = {
            'SMSMessageData': {'Recipients': [{'statusCode': 405, 'status': 'InsufficientBalance'}]}
        }

        self.assertFalse(send_sms('0705171018', 'Hello'))


class SmsProviderChainTests(TestCase):
    @mock.patch.multiple('notifications.sms_service', SMS_PROVIDERS=['talksasa'],
                         TALKSASA_API_TOKEN='tok', TALKSASA_SENDER_ID='TALKSASA')
    @mock.patch('notifications.sms_service.requests.post')
    def test_talksasa_format(self, post):
        from notifications.sms_service import send_sms
        post.return_value.ok = True
        post.return_value.json.return_value = {'status': 'success', 'data': {}}

        self.assertTrue(send_sms('0705171018', 'Hello'))

        self.assertEqual(post.call_args.args[0], 'https://bulksms.talksasa.com/api/v3/sms/send')
        self.assertEqual(post.call_args.kwargs['json'], {
            'recipient': '254705171018', 'sender_id': 'TALKSASA', 'type': 'plain', 'message': 'Hello',
        })
        self.assertEqual(post.call_args.kwargs['headers']['Authorization'], 'Bearer tok')

    @mock.patch.multiple('notifications.sms_service', SMS_PROVIDERS=['textbee'],
                         TEXTBEE_API_KEY='tb-key', TEXTBEE_DEVICE_ID='dev1')
    @mock.patch('notifications.sms_service.requests.post')
    def test_textbee_format(self, post):
        from notifications.sms_service import send_sms
        post.return_value.ok = True

        self.assertTrue(send_sms('0705171018', 'Hello'))

        self.assertEqual(post.call_args.args[0], 'https://api.textbee.dev/api/v1/gateway/devices/dev1/send-sms')
        self.assertEqual(post.call_args.kwargs['json'], {'recipients': ['+254705171018'], 'message': 'Hello'})
        self.assertEqual(post.call_args.kwargs['headers'], {'x-api-key': 'tb-key'})

    @mock.patch.multiple('notifications.sms_service', SMS_PROVIDERS=['talksasa', 'textbee'],
                         TALKSASA_API_TOKEN='tok', TEXTBEE_API_KEY='tb-key', TEXTBEE_DEVICE_ID=None)
    @mock.patch('notifications.sms_service.requests.post')
    def test_falls_back_to_next_provider(self, post):
        from notifications.sms_service import send_sms
        talksasa_reply = mock.Mock(ok=False, status_code=402)
        talksasa_reply.json.return_value = {'status': 'error', 'message': 'Insufficient balance'}
        post.side_effect = [talksasa_reply, mock.Mock(ok=True, status_code=200, text='{}')]

        self.assertTrue(send_sms('0705171018', 'Hello'))

        self.assertEqual(post.call_count, 2)
        self.assertEqual(post.call_args.args[0], 'https://api.textbee.dev/api/v1/gateway/send-sms')

    @mock.patch.multiple('notifications.sms_service', SMS_PROVIDERS=[])
    def test_no_provider_configured(self):
        from notifications.sms_service import send_sms
        self.assertFalse(send_sms('0705171018', 'Hello'))


class NormalizePhoneTests(TestCase):
    def test_kenyan_formats(self):
        for raw in ['0712345678', '+254712345678', '254 712 345 678', '712345678', '0712-345-678']:
            self.assertEqual(normalize_phone(raw), '254712345678', raw)

    def test_invalid(self):
        for raw in ['', None, '12ab', '1234']:
            self.assertIsNone(normalize_phone(raw), raw)


@mock.patch('appointments.views.send_emailjs', return_value=True)
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class DoubleBookingTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.staff = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self.slot = next_weekday_at(10)
        self.client = APIClient()

    def _book(self, when, is_scheduled=True, **overrides):
        payload = {
            'visitor_name': 'Amina Hassan',
            'visitor_phone': '0722 333 444',
            'department': self.department.id,
            'division': self.division.id,
            'staff_member': self.staff.id,
            'appointment_date': when.isoformat(),
            'is_scheduled': is_scheduled,
        }
        payload.update(overrides)
        return self.client.post('/api/appointments/create/', payload, format='json')

    def _existing(self, when, status='Pending'):
        return Appointment.objects.create(
            visitor_name='Brian Otieno', visitor_phone='0711222333', department=self.department,
            division=self.division, staff_member=self.staff, appointment_date=when, status=status,
        )

    def test_rejects_a_taken_slot(self, _sms, _email):
        self._existing(self.slot)

        response = self._book(self.slot)

        self.assertEqual(response.status_code, 400)
        self.assertIn('Jane already has a visit at that time', response.data['appointment_date'][0])
        self.assertEqual(Appointment.objects.count(), 1)

    def test_rejects_an_overlapping_time(self, _sms, _email):
        self._existing(self.slot)

        response = self._book(self.slot + timedelta(minutes=15))

        self.assertEqual(response.status_code, 400)

    def test_next_slot_is_free(self, _sms, _email):
        self._existing(self.slot)

        response = self._book(self.slot + timedelta(minutes=30))

        self.assertEqual(response.status_code, 201, response.data)

    def test_declined_visit_frees_the_slot(self, _sms, _email):
        self._existing(self.slot, status='Declined')

        response = self._book(self.slot)

        self.assertEqual(response.status_code, 201, response.data)

    def test_cancelled_visit_frees_the_slot(self, _sms, _email):
        self._existing(self.slot, status='Cancelled')

        response = self._book(self.slot)

        self.assertEqual(response.status_code, 201, response.data)

    def test_accepted_and_rescheduled_visits_hold_the_slot(self, _sms, _email):
        for status in ('Accepted', 'Rescheduled'):
            with self.subTest(status=status):
                Appointment.objects.all().delete()
                self._existing(self.slot, status=status)

                self.assertEqual(self._book(self.slot).status_code, 400)

    def test_other_staff_can_take_the_same_slot(self, _sms, _email):
        other = User.objects.create_user(
            email='otieno@example.com', full_name='Peter Otieno', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self._existing(self.slot)

        response = self._book(self.slot, staff_member=other.id)

        self.assertEqual(response.status_code, 201, response.data)

    def test_walk_ins_are_never_blocked(self, _sms, _email):
        now = timezone.now()
        self._existing(now)

        response = self._book(now, is_scheduled=False)

        self.assertEqual(response.status_code, 201, response.data)

    def test_staff_list_shows_upcoming_booked_times_without_visitor_details(self, _sms, _email):
        self._existing(self.slot)
        self._existing(self.slot + timedelta(hours=1), status='Declined')
        self._existing(timezone.now() - timedelta(days=1))

        response = self.client.get('/api/staff/')

        self.assertEqual(response.status_code, 200)
        member = response.data[0]
        self.assertEqual(len(member['booked_times']), 1)
        self.assertEqual(datetime.fromisoformat(member['booked_times'][0]), self.slot)
        self.assertNotIn('Brian', str(member))


@mock.patch('appointments.views.send_fcm_push_notification', return_value={'sent': True})
@mock.patch('appointments.views.send_emailjs', return_value=True)
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class ReassignTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.other_department = Department.objects.create(name='Finance')
        self.other_division = Division.objects.create(name='Bursar', department=self.other_department)
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Ada Admin', password='AdminPass123!', role=User.Role.ADMIN
        )
        self.jane = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division, phone='0711000111',
        )
        self.peter = User.objects.create_user(
            email='peter@example.com', full_name='Peter Otieno', password='StaffPass123!',
            department=self.other_department, division=self.other_division, phone='0733000222',
            fcm_token='peter-device',
        )
        self.visit = Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_phone='0722333444', department=self.department,
            division=self.division, staff_member=self.jane, status='Accepted', response_note='See you',
            appointment_date=timezone.now() + timedelta(days=1),
        )
        self.client = APIClient()

    def _reassign(self, staff_id, user=None):
        self.client.force_authenticate(user or self.admin)
        return self.client.patch(f'/api/appointments/reassign/{self.visit.id}/', {'staff_member': staff_id}, format='json')

    def test_reassign_moves_visit_and_resets_it_to_pending(self, _sms, _email, _push):
        response = self._reassign(self.peter.id)

        self.assertEqual(response.status_code, 200, response.data)
        self.visit.refresh_from_db()
        self.assertEqual(self.visit.staff_member, self.peter)
        self.assertEqual(self.visit.department, self.other_department)
        self.assertEqual(self.visit.division, self.other_division)
        self.assertEqual(self.visit.status, 'Pending')
        self.assertEqual(self.visit.response_note, '')

    def test_reassign_alerts_new_staff_and_tells_visitor(self, send_sms, email, push):
        self._reassign(self.peter.id)

        texts = {call.args[0]: call.args[1] for call in send_sms.call_args_list}
        self.assertIn('reassigned to you', texts['0733000222'])
        self.assertIn('Amina Hassan', texts['0733000222'])
        self.assertIn('is now with Peter Otieno', texts['0722333444'])
        self.assertNotIn('0711000111', texts)
        self.assertLessEqual(max(len(text) for text in texts.values()), 160)
        self.assertEqual(email.call_args.args[1]['to_email'], 'peter@example.com')
        self.assertEqual(push.call_args.kwargs['fcm_token'], 'peter-device')

    def test_rejects_same_staff_member(self, send_sms, _email, _push):
        response = self._reassign(self.jane.id)

        self.assertEqual(response.status_code, 400)
        self.assertIn('staff_member', response.data)
        send_sms.assert_not_called()

    def test_rejects_deactivated_staff(self, send_sms, _email, _push):
        self.peter.is_active = False
        self.peter.save()

        response = self._reassign(self.peter.id)

        self.assertEqual(response.status_code, 400)
        send_sms.assert_not_called()

    def test_rejects_staff_without_department(self, _sms, _email, _push):
        unplaced = User.objects.create_user(email='new@example.com', full_name='New Teacher', password='StaffPass123!')

        response = self._reassign(unplaced.id)

        self.assertEqual(response.status_code, 400)

    def test_staff_cannot_use_reassign(self, send_sms, _email, _push):
        response = self._reassign(self.peter.id, user=self.jane)

        self.assertEqual(response.status_code, 404)
        self.visit.refresh_from_db()
        self.assertEqual(self.visit.staff_member, self.jane)

    def test_staff_cannot_reassign_through_update_endpoint(self, _sms, _email, _push):
        self.client.force_authenticate(self.jane)

        self.client.patch(
            f'/api/appointments/update/{self.visit.id}/',
            {'status': 'Declined', 'response_note': 'Not mine', 'staff_member': self.peter.id},
            format='json',
        )

        self.visit.refresh_from_db()
        self.assertEqual(self.visit.staff_member, self.jane)


@mock.patch('appointments.views.send_fcm_push_notification', return_value={'sent': True})
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class VisitLookupTests(TestCase):
    def setUp(self):
        cache.clear()
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.staff = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division, phone='0711000111', fcm_token='jane-device',
        )
        self.visit = Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_phone='0722 333 444', visitor_email='amina@example.com',
            department=self.department, division=self.division, staff_member=self.staff,
            appointment_date=timezone.now() + timedelta(days=1), status='Accepted', response_note='Come to Block B',
        )
        self.reference = f'GP-{self.visit.id:05d}'
        self.client = APIClient()

    def _lookup(self, reference=None, phone='0722333444'):
        return self.client.post(
            '/api/visits/lookup/', {'reference': reference or self.reference, 'phone': phone}, format='json'
        )

    def _cancel(self, reference=None, phone='0722333444'):
        return self.client.post(
            '/api/visits/cancel/', {'reference': reference or self.reference, 'phone': phone}, format='json'
        )

    def test_lookup_returns_visit_status(self, _sms, _push):
        response = self._lookup()

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['reference'], self.reference)
        self.assertEqual(response.data['status'], 'Accepted')
        self.assertEqual(response.data['staff_name'], 'Jane Wanjiru')
        self.assertEqual(response.data['response_note'], 'Come to Block B')
        self.assertTrue(response.data['can_cancel'])

    def test_lookup_hides_contact_details(self, _sms, _push):
        response = self._lookup()

        body = str(response.data)
        self.assertNotIn('0711000111', body)
        self.assertNotIn('jane@example.com', body)
        self.assertNotIn('amina@example.com', body)

    def test_lookup_accepts_reference_and_phone_in_other_formats(self, _sms, _push):
        for reference, phone in [
            (f'gp{self.visit.id}', '+254 722 333 444'),
            (str(self.visit.id), '254722333444'),
            (f' GP {self.visit.id:05d} ', '0722-333-444'),
        ]:
            with self.subTest(reference=reference, phone=phone):
                self.assertEqual(self._lookup(reference, phone).status_code, 200)

    def test_lookup_rejects_wrong_phone_without_revealing_the_visit(self, _sms, _push):
        wrong_phone = self._lookup(phone='0799999999')
        unknown_reference = self._lookup(reference='GP-99999')

        self.assertEqual(wrong_phone.status_code, 404)
        self.assertEqual(wrong_phone.data, unknown_reference.data)
        self.assertEqual(wrong_phone.data, {'detail': 'We could not find a visit with that reference and phone number.'})
        self.assertNotIn('Amina', str(wrong_phone.data))

    def test_lookup_is_rate_limited(self, _sms, _push):
        for _ in range(20):
            self._lookup(phone='0799999999')

        response = self._lookup()

        self.assertEqual(response.status_code, 429)

    def test_cancel_marks_visit_cancelled_and_alerts_staff(self, send_sms, push):
        response = self._cancel()

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['status'], 'Cancelled')
        self.assertFalse(response.data['can_cancel'])
        self.visit.refresh_from_db()
        self.assertEqual(self.visit.status, 'Cancelled')
        phone, text = send_sms.call_args.args
        self.assertEqual(phone, '0711000111')
        self.assertIn('Amina Hassan cancelled', text)
        self.assertLessEqual(len(text), 160)
        self.assertEqual(push.call_args.kwargs['fcm_token'], 'jane-device')

    def test_cannot_cancel_with_wrong_phone(self, send_sms, _push):
        response = self._cancel(phone='0799999999')

        self.assertEqual(response.status_code, 404)
        self.visit.refresh_from_db()
        self.assertEqual(self.visit.status, 'Accepted')
        send_sms.assert_not_called()

    def test_cannot_cancel_a_past_or_closed_visit(self, send_sms, _push):
        for visit_status, when in [
            ('Declined', timezone.now() + timedelta(days=1)),
            ('Cancelled', timezone.now() + timedelta(days=1)),
            ('Accepted', timezone.now() - timedelta(hours=1)),
        ]:
            with self.subTest(status=visit_status, when=when):
                Appointment.objects.filter(id=self.visit.id).update(status=visit_status, appointment_date=when)

                response = self._cancel()

                self.assertEqual(response.status_code, 400)
        send_sms.assert_not_called()


@mock.patch('appointments.views.send_fcm_push_notification', return_value={'sent': True})
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class GateSignInOutTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Ada Admin', password='AdminPass123!', role=User.Role.ADMIN
        )
        self.jane = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division, phone='0711000111', fcm_token='jane-device',
        )
        self.peter = User.objects.create_user(
            email='peter@example.com', full_name='Peter Otieno', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self.visit = Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_phone='0722333444', department=self.department,
            division=self.division, staff_member=self.jane, status='Accepted',
            appointment_date=timezone.now() + timedelta(minutes=10),
        )
        self.client = APIClient()

    def _post(self, action, user=None):
        self.client.force_authenticate(user or self.admin)
        return self.client.post(f'/api/appointments/{self.visit.id}/{action}/')

    def test_sign_in_records_time_and_alerts_host(self, send_sms, push):
        response = self._post('check-in')

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsNotNone(response.data['checked_in_at'])
        self.visit.refresh_from_db()
        self.assertIsNotNone(self.visit.checked_in_at)
        phone, text = send_sms.call_args.args
        self.assertEqual(phone, '0711000111')
        self.assertIn('Amina Hassan has arrived', text)
        self.assertLessEqual(len(text), 160)
        self.assertEqual(push.call_args.kwargs['fcm_token'], 'jane-device')

    def test_sign_out_records_time(self, _sms, _push):
        self._post('check-in')

        response = self._post('check-out')

        self.assertEqual(response.status_code, 200, response.data)
        self.visit.refresh_from_db()
        self.assertIsNotNone(self.visit.checked_out_at)
        self.assertGreaterEqual(self.visit.checked_out_at, self.visit.checked_in_at)

    def test_cannot_sign_in_twice(self, send_sms, _push):
        self._post('check-in')
        send_sms.reset_mock()

        response = self._post('check-in')

        self.assertEqual(response.status_code, 400)
        send_sms.assert_not_called()

    def test_cannot_sign_out_before_sign_in_or_twice(self, _sms, _push):
        self.assertEqual(self._post('check-out').status_code, 400)
        self._post('check-in')
        self._post('check-out')

        self.assertEqual(self._post('check-out').status_code, 400)

    def test_cannot_sign_in_a_declined_visit(self, send_sms, _push):
        Appointment.objects.filter(id=self.visit.id).update(status='Declined')

        response = self._post('check-in')

        self.assertEqual(response.status_code, 400)
        send_sms.assert_not_called()

    def test_cannot_sign_in_a_cancelled_visit(self, send_sms, _push):
        Appointment.objects.filter(id=self.visit.id).update(status='Cancelled')

        response = self._post('check-in')

        self.assertEqual(response.status_code, 400)
        self.assertIn('cancelled', response.data['detail'])
        send_sms.assert_not_called()

    def test_host_can_sign_in_their_own_visitor(self, _sms, _push):
        response = self._post('check-in', user=self.jane)

        self.assertEqual(response.status_code, 200, response.data)

    def test_other_staff_cannot_sign_in_someone_elses_visitor(self, _sms, _push):
        response = self._post('check-in', user=self.peter)

        self.assertEqual(response.status_code, 404)
        self.visit.refresh_from_db()
        self.assertIsNone(self.visit.checked_in_at)

    def test_requires_login(self, _sms, _push):
        response = self.client.post(f'/api/appointments/{self.visit.id}/check-in/')

        self.assertEqual(response.status_code, 401)

    def test_visit_list_includes_gate_times(self, _sms, _push):
        self._post('check-in')

        response = self.client.get('/api/appointments/my/')

        self.assertIsNotNone(response.data[0]['checked_in_at'])
        self.assertIsNone(response.data[0]['checked_out_at'])


@override_settings(DEBUG=True)
class SeedDemoTests(TestCase):
    def _seed(self, *args):
        call_command('seed_demo', *args, stdout=mock.Mock())

    def test_builds_a_demo_school(self):
        self._seed()

        self.assertEqual(Department.objects.count(), 3)
        self.assertEqual(User.objects.filter(role=User.Role.ADMIN).count(), 1)
        self.assertGreaterEqual(User.objects.filter(role=User.Role.STAFF).count(), 10)
        self.assertGreaterEqual(Appointment.objects.count(), 40)
        statuses = set(Appointment.objects.values_list('status', flat=True))
        self.assertTrue({'Pending', 'Accepted', 'Declined', 'Rescheduled', 'Cancelled'} <= statuses)
        self.assertTrue(Appointment.objects.filter(checked_out_at__isnull=False).exists())
        self.assertFalse(Appointment.objects.exclude(visitor_phone=None).exists())

    def test_demo_accounts_can_log_in(self):
        self._seed('--password', 'Show-time-1')

        admin = User.objects.get(role=User.Role.ADMIN)
        self.assertTrue(admin.check_password('Show-time-1'))

    def test_phone_option_routes_visitor_sms_to_presenter(self):
        self._seed('--phone', '0705171018')

        self.assertEqual(set(Appointment.objects.values_list('visitor_phone', flat=True)), {'0705171018'})

    def test_refuses_to_run_twice_without_reset(self):
        self._seed()

        with self.assertRaises(CommandError):
            self._seed()

    def test_reset_replaces_demo_data_and_keeps_real_data(self):
        real_department = Department.objects.create(name='Real Department')
        real_user = User.objects.create_user(email='head@school.ac.ke', full_name='Real Head', password='x')
        self._seed()
        first_count = Appointment.objects.count()

        self._seed('--reset')

        self.assertEqual(Appointment.objects.count(), first_count)
        self.assertTrue(User.objects.filter(pk=real_user.pk).exists())
        self.assertTrue(Department.objects.filter(pk=real_department.pk).exists())

    @override_settings(DEBUG=False)
    def test_refuses_on_a_live_database_without_force(self):
        with self.assertRaises(CommandError):
            self._seed()
        self.assertFalse(User.objects.exists())


@mock.patch('appointments.views.send_emailjs', return_value=True)
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class OfficeHoursTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.staff = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Office Admin', password='AdminPass123!', role=User.Role.ADMIN,
        )
        self.client = APIClient()

    def _book(self, when, is_scheduled=True):
        return self.client.post('/api/appointments/create/', {
            'visitor_name': 'Amina Hassan',
            'visitor_phone': '0722 333 444',
            'department': self.department.id,
            'division': self.division.id,
            'staff_member': self.staff.id,
            'appointment_date': when.isoformat(),
            'is_scheduled': is_scheduled,
        }, format='json')

    def test_anyone_can_read_default_hours(self, _sms, _email):
        response = self.client.get('/api/office-hours/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['opens_at'], '08:00:00')
        self.assertEqual(response.data['closes_at'], '17:00:00')
        self.assertEqual(response.data['open_days'], [0, 1, 2, 3, 4])
        self.assertEqual(response.data['summary'], 'Mon–Fri, 8:00 AM to 5:00 PM')

    def test_admin_can_change_hours(self, _sms, _email):
        self.client.force_authenticate(self.admin)

        response = self.client.patch('/api/office-hours/', {
            'opens_at': '07:30', 'closes_at': '13:00', 'open_days': [5, 0, 1, 1],
        }, format='json')

        self.assertEqual(response.status_code, 200, response.data)
        hours = OfficeHours.load()
        self.assertEqual(hours.open_days, '0,1,5')
        self.assertEqual(response.data['summary'], 'Mon, Tue, Sat, 7:30 AM to 1:00 PM')

    def test_staff_and_visitors_cannot_change_hours(self, _sms, _email):
        self.assertEqual(self.client.patch('/api/office-hours/', {'opens_at': '06:00'}, format='json').status_code, 401)
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.patch('/api/office-hours/', {'opens_at': '06:00'}, format='json').status_code, 403)
        self.assertEqual(OfficeHours.load().opens_at.hour, 8)

    def test_rejects_closing_before_opening(self, _sms, _email):
        self.client.force_authenticate(self.admin)

        response = self.client.patch('/api/office-hours/', {'opens_at': '16:00', 'closes_at': '09:00'}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('closes_at', response.data)

    def test_rejects_no_open_days_and_bad_days(self, _sms, _email):
        self.client.force_authenticate(self.admin)

        self.assertEqual(self.client.patch('/api/office-hours/', {'open_days': []}, format='json').status_code, 400)
        self.assertEqual(self.client.patch('/api/office-hours/', {'open_days': [7]}, format='json').status_code, 400)

    def test_rejects_a_planned_visit_outside_hours(self, _sms, _email):
        response = self._book(next_weekday_at(18))

        self.assertEqual(response.status_code, 400)
        self.assertIn('Visiting hours are Mon–Fri, 8:00 AM to 5:00 PM', response.data['appointment_date'][0])
        self.assertFalse(Appointment.objects.exists())

    def test_rejects_a_planned_visit_on_a_closed_day(self, _sms, _email):
        saturday = next_weekday_at(10)
        saturday += timedelta(days=5 - saturday.weekday())

        response = self._book(saturday)

        self.assertEqual(response.status_code, 400)

    def test_closing_time_itself_is_not_bookable(self, _sms, _email):
        self.assertEqual(self._book(next_weekday_at(17)).status_code, 400)
        self.assertEqual(self._book(next_weekday_at(16, 30)).status_code, 201)

    def test_follows_hours_set_by_admin(self, _sms, _email):
        hours = OfficeHours.load()
        hours.opens_at = hours.opens_at.replace(hour=6)
        hours.save()

        self.assertEqual(self._book(next_weekday_at(6, 30)).status_code, 201)

    def test_walk_ins_are_never_blocked_by_hours(self, _sms, _email):
        self.assertEqual(self._book(next_weekday_at(19), is_scheduled=False).status_code, 201)


@mock.patch('appointments.views.send_emailjs', return_value=True)
@mock.patch('notifications.sms_service.send_sms', return_value=True)
class RescheduleClashTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.staff = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self.visit = self._visit(next_weekday_at(9))
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    def _visit(self, when, status='Pending', staff=None):
        return Appointment.objects.create(
            visitor_name='Amina Hassan', visitor_phone='0722333444', department=self.department,
            division=self.division, staff_member=staff or self.staff, appointment_date=when, status=status,
        )

    def _reschedule(self, when):
        return self.client.patch(
            f'/api/appointments/update/{self.visit.id}/',
            {'status': 'Rescheduled', 'response_note': 'Clashes with assembly', 'appointment_date': when.isoformat()},
            format='json',
        )

    def _assert_rejected(self, response, message):
        self.assertEqual(response.status_code, 400)
        self.assertIn(message, response.data['appointment_date'][0])
        self.visit.refresh_from_db()
        self.assertEqual(self.visit.status, 'Pending')

    def test_rejects_a_time_already_booked(self, send_sms, _email):
        self._visit(next_weekday_at(11), status='Accepted')

        self._assert_rejected(self._reschedule(next_weekday_at(11, 15)), 'You already have a visit at that time')
        send_sms.assert_not_called()

    def test_allows_a_free_time(self, _sms, _email):
        self._visit(next_weekday_at(11), status='Accepted')

        self.assertEqual(self._reschedule(next_weekday_at(11, 30)).status_code, 200)

    def test_moving_a_visit_a_few_minutes_does_not_clash_with_itself(self, _sms, _email):
        self.assertEqual(self._reschedule(next_weekday_at(9, 15)).status_code, 200)

    def test_declined_and_cancelled_visits_do_not_block(self, _sms, _email):
        self._visit(next_weekday_at(11), status='Declined')
        self._visit(next_weekday_at(11), status='Cancelled')

        self.assertEqual(self._reschedule(next_weekday_at(11)).status_code, 200)

    def test_another_teachers_visit_does_not_block(self, _sms, _email):
        colleague = User.objects.create_user(
            email='brian@example.com', full_name='Brian Otieno', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self._visit(next_weekday_at(11), status='Accepted', staff=colleague)

        self.assertEqual(self._reschedule(next_weekday_at(11)).status_code, 200)

    def test_rejects_a_time_outside_visiting_hours(self, _sms, _email):
        self._assert_rejected(self._reschedule(next_weekday_at(18)), 'Visiting hours are Mon–Fri, 8:00 AM to 5:00 PM')

    def test_rejects_a_closed_day(self, _sms, _email):
        saturday = next_weekday_at(10)
        saturday += timedelta(days=5 - saturday.weekday())

        self._assert_rejected(self._reschedule(saturday), 'The school is closed then')

    def test_rejects_the_teachers_day_off(self, _sms, _email):
        new_time = next_weekday_at(10, days_ahead=3)
        StaffUnavailableDay.objects.create(user=self.staff, date=new_time.date())

        self._assert_rejected(self._reschedule(new_time), 'You marked that day as a day off')
