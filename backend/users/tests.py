from urllib.parse import parse_qs, urlparse

from django.test import TestCase
from rest_framework.test import APIClient

from departments.models import Department, Division

from .models import User


class StaffInviteFlowTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Ada Admin', password='AdminPass123!', role=User.Role.ADMIN
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def _invite_params(self, response):
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
