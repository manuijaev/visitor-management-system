from datetime import timedelta
from unittest import mock
from urllib.parse import parse_qs, urlparse

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from departments.models import Department, Division
from notifications.email_templates import visit_request_email

from .models import StaffUnavailableDay, User


class StaffInviteFlowTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Ada Admin', password='AdminPass123!', role=User.Role.ADMIN
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def _invite_params(self, response):
        self.assertEqual(urlparse(response.data['invite']['invite_url']).path, '/staff')
        query = parse_qs(urlparse(response.data['invite']['invite_url']).query)
        return query['uid'][0], query['token'][0]

    def test_create_with_new_department_and_division(self):
        response = self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'Jane@Example.com',
            'department_name': 'Finance',
            'division_name': 'Payroll',
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(email='jane@example.com')
        self.assertEqual(user.department.name, 'Finance')
        self.assertEqual(user.division.name, 'Payroll')
        self.assertFalse(user.has_usable_password())
        self.assertTrue(response.data['staff']['invite_pending'])

    def test_reuses_existing_department_case_insensitively(self):
        dept = Department.objects.create(name='Finance')
        response = self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'department_name': 'finance',
            'division_name': 'Payroll',
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Department.objects.count(), 1)
        self.assertEqual(User.objects.get(email='jane@example.com').department, dept)

    def test_rejects_division_from_another_department(self):
        finance = Department.objects.create(name='Finance')
        it = Department.objects.create(name='IT')
        helpdesk = Division.objects.create(name='Helpdesk', department=it)
        response = self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'department': finance.id,
            'division': helpdesk.id,
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email='jane@example.com').exists())

    def test_accept_invite_sets_password_and_signs_in_once(self):
        created = self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'department_name': 'Finance',
            'division_name': 'Payroll',
        }, format='json')
        uid, token = self._invite_params(created)
        public = APIClient()

        lookup = public.get('/api/staff/invite/', {'uid': uid, 'token': token})
        self.assertEqual(lookup.status_code, 200)
        self.assertEqual(lookup.data['email'], 'jane@example.com')

        accepted = public.post('/api/staff/invite/accept/', {
            'uid': uid, 'token': token, 'password': 'Sunrise-Ledger-42',
        }, format='json')
        self.assertEqual(accepted.status_code, 200, accepted.data)
        self.assertIn('access', accepted.data)
        self.assertEqual(accepted.data['user']['email'], 'jane@example.com')

        reused = public.post('/api/staff/invite/accept/', {
            'uid': uid, 'token': token, 'password': 'Another-Ledger-42',
        }, format='json')
        self.assertEqual(reused.status_code, 400)

        login = public.post('/api/staff/login/', {
            'email': 'jane@example.com', 'password': 'Sunrise-Ledger-42',
        }, format='json')
        self.assertEqual(login.status_code, 200)

    def test_accept_rejects_weak_password(self):
        created = self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'department_name': 'Finance',
            'division_name': 'Payroll',
        }, format='json')
        uid, token = self._invite_params(created)

        response = APIClient().post('/api/staff/invite/accept/', {
            'uid': uid, 'token': token, 'password': '12345678',
        }, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)

    def test_login_before_accepting_explains_next_step(self):
        self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'department_name': 'Finance',
            'division_name': 'Payroll',
        }, format='json')

        response = APIClient().post('/api/staff/login/', {
            'email': 'jane@example.com', 'password': 'whatever123',
        }, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('invite link', str(response.data['detail']))

    def test_invite_endpoints_ignore_stale_auth_header(self):
        response = APIClient(HTTP_AUTHORIZATION='Bearer expired.token.value').get(
            '/api/staff/invite/', {'uid': 'bad', 'token': 'bad'}
        )
        self.assertEqual(response.status_code, 400)

    def test_non_admin_cannot_create_staff(self):
        staff = User.objects.create_user(email='s@example.com', full_name='Sam', password='StaffPass123!')
        client = APIClient()
        client.force_authenticate(staff)
        response = client.post('/api/staff/create/', {
            'full_name': 'Jane Doe', 'email': 'jane@example.com',
            'department_name': 'Finance', 'division_name': 'Payroll',
        }, format='json')
        self.assertEqual(response.status_code, 403)


class InviteEmailTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Ada Admin', password='AdminPass123!', role=User.Role.ADMIN
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    @mock.patch('users.invites.INVITE_TEMPLATE_ID', 'template_shared')
    @mock.patch('users.invites.send_emailjs', return_value=True)
    def test_invite_uses_shared_template_with_rendered_html(self, send):
        response = self.client.post('/api/staff/create/', {
            'full_name': 'Jane Doe',
            'email': 'jane@example.com',
            'department_name': 'Finance',
            'division_name': 'Payroll',
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data['invite']['email_sent'])
        template_id, params = send.call_args.args
        self.assertEqual(template_id, 'template_shared')
        self.assertEqual(params['to_email'], 'jane@example.com')
        self.assertEqual(params['subject'], 'Set up your Gatepass account')
        self.assertIn(response.data['invite']['invite_url'].replace('&', '&amp;'), params['html_body'])
        self.assertIn('Finance / Payroll', params['html_body'])


class EmailTemplateTests(TestCase):
    def test_user_text_is_escaped(self):
        email = visit_request_email(
            staff_name='Jane', visitor_name='<b>Eve</b>', visitor_email='eve@example.com',
            appointment_date='Nov 06, 2026 at 10:30 AM', message='<script>alert(1)</script>',
        )
        self.assertNotIn('<script>', email['html_body'])
        self.assertNotIn('<b>Eve</b>', email['html_body'])
        self.assertIn('&lt;b&gt;Eve&lt;/b&gt;', email['html_body'])


class StaffUnavailableDayTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Academics')
        self.division = Division.objects.create(name='Grade 5', department=self.department)
        self.staff = User.objects.create_user(
            email='jane@example.com', full_name='Jane Wanjiru', password='StaffPass123!',
            department=self.department, division=self.division,
        )
        self.client = APIClient()
        self.today = timezone.localdate()

    def test_staff_can_add_list_and_remove_days_off(self):
        self.client.force_authenticate(self.staff)
        day = (self.today + timedelta(days=3)).isoformat()

        created = self.client.post('/api/staff/me/unavailable-days/', {'date': day}, format='json')
        repeated = self.client.post('/api/staff/me/unavailable-days/', {'date': day}, format='json')
        listed = self.client.get('/api/staff/me/unavailable-days/')

        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(listed.data, [{'date': day}])

        removed = self.client.delete(f'/api/staff/me/unavailable-days/{day}/')

        self.assertEqual(removed.status_code, 204)
        self.assertFalse(StaffUnavailableDay.objects.exists())

    def test_rejects_past_days(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            '/api/staff/me/unavailable-days/', {'date': (self.today - timedelta(days=1)).isoformat()}, format='json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('date', response.data)

    def test_rejects_malformed_date_on_delete(self):
        self.client.force_authenticate(self.staff)

        response = self.client.delete('/api/staff/me/unavailable-days/not-a-date/')

        self.assertEqual(response.status_code, 400)

    def test_requires_login(self):
        response = self.client.get('/api/staff/me/unavailable-days/')

        self.assertEqual(response.status_code, 401)

    def test_staff_cannot_remove_someone_elses_day(self):
        other = User.objects.create_user(email='otieno@example.com', full_name='Otieno', password='StaffPass123!')
        day = self.today + timedelta(days=2)
        StaffUnavailableDay.objects.create(user=other, date=day)
        self.client.force_authenticate(self.staff)

        self.client.delete(f'/api/staff/me/unavailable-days/{day.isoformat()}/')

        self.assertTrue(StaffUnavailableDay.objects.filter(user=other, date=day).exists())

    def test_public_staff_list_shows_only_upcoming_days_off(self):
        StaffUnavailableDay.objects.create(user=self.staff, date=self.today - timedelta(days=1))
        StaffUnavailableDay.objects.create(user=self.staff, date=self.today + timedelta(days=1))

        response = self.client.get('/api/staff/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['unavailable_dates'], [(self.today + timedelta(days=1)).isoformat()])

    @mock.patch('appointments.views.send_emailjs', return_value=True)
    @mock.patch('notifications.sms_service.send_sms', return_value=True)
    def test_booking_on_a_day_off_is_rejected(self, send_sms, _email):
        visit_time = timezone.localtime() + timedelta(days=2)
        StaffUnavailableDay.objects.create(user=self.staff, date=visit_time.date())
        payload = {
            'visitor_name': 'Amina Hassan',
            'visitor_phone': '0722 333 444',
            'department': self.department.id,
            'division': self.division.id,
            'staff_member': self.staff.id,
            'appointment_date': visit_time.isoformat(),
        }

        blocked = self.client.post('/api/appointments/create/', payload, format='json')
        payload['appointment_date'] = (visit_time + timedelta(days=1)).isoformat()
        allowed = self.client.post('/api/appointments/create/', payload, format='json')

        self.assertEqual(blocked.status_code, 400)
        self.assertIn('Jane is not available on that day', blocked.data['appointment_date'][0])
        self.assertEqual(allowed.status_code, 201, allowed.data)
