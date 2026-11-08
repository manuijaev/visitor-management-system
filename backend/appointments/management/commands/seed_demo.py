import random
from datetime import datetime, time, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from appointments.models import Appointment
from departments.models import Department, Division
from users.models import StaffUnavailableDay, User

DEMO_DOMAIN = 'demo.gatepass.school'

DEPARTMENTS = {
    'Academics': ['Lower Primary', 'Upper Primary', 'Junior Secondary'],
    'Administration': ['Admissions', 'Finance & Bursar'],
    'Student Welfare': ['Counselling', 'Sick Bay'],
}

# (full name, department, division, role)
STAFF = [
    ('Grace Achieng', 'Administration', 'Admissions', User.Role.ADMIN),
    ('Mary Wanjiru', 'Academics', 'Lower Primary', User.Role.STAFF),
    ('Peter Otieno', 'Academics', 'Lower Primary', User.Role.STAFF),
    ('Faith Njeri', 'Academics', 'Upper Primary', User.Role.STAFF),
    ('David Kiprop', 'Academics', 'Upper Primary', User.Role.STAFF),
    ('Lucy Mutua', 'Academics', 'Junior Secondary', User.Role.STAFF),
    ('James Mwangi', 'Academics', 'Junior Secondary', User.Role.STAFF),
    ('Esther Wambui', 'Administration', 'Finance & Bursar', User.Role.STAFF),
    ('Samuel Kamau', 'Administration', 'Admissions', User.Role.STAFF),
    ('Ruth Chebet', 'Student Welfare', 'Counselling', User.Role.STAFF),
    ('Nurse Agnes Moraa', 'Student Welfare', 'Sick Bay', User.Role.STAFF),
]

PARENTS = [
    'Amina Hassan', 'Brian Odhiambo', 'Cynthia Wairimu', 'Daniel Kipchoge', 'Eunice Atieno', 'Francis Mutiso',
    'Gladys Nyambura', 'Hassan Abdi', 'Irene Jepkosgei', 'John Kariuki', 'Kevin Omondi', 'Lilian Wangari',
    'Moses Kiplagat', 'Nancy Akinyi', 'Oscar Ndegwa', 'Purity Chepkemoi', 'Rose Muthoni', 'Stephen Ouma',
]
CHILDREN = ['Zawadi', 'Baraka', 'Imani', 'Neema', 'Tumaini', 'Jabari', 'Amani', 'Nia', 'Kito', 'Wanjiku', 'Kamau', 'Achieng']

CLASS_BY_DIVISION = {
    'Lower Primary': ['Grade 1 Blue', 'Grade 2 Red', 'Grade 3 Green'],
    'Upper Primary': ['Grade 4 Blue', 'Grade 5 Red', 'Grade 6 Green'],
    'Junior Secondary': ['Grade 7 East', 'Grade 8 West', 'Grade 9 North'],
}

MESSAGES_BY_DIVISION = {
    'Admissions': ['Admissions enquiry for next term', 'School tour and admission requirements', 'Transfer from another school'],
    'Finance & Bursar': ['Fees / bursar: fee balance', 'Payment plan for Term 3 fees', 'Bus fee and lunch programme'],
    'Counselling': ['Counselling follow-up', 'Settling-in concerns'],
    'Sick Bay': ['Student pickup: unwell', 'Medication handover'],
}
TEACHER_MESSAGES = [
    'Parent–teacher meeting: end-of-term report', 'Parent–teacher meeting: maths progress', 'Student pickup: early dismissal',
    'Discuss homework and reading at home', 'Parent–teacher meeting: CBC project', 'Sports day permission',
]

RESPONSES = {
    Appointment.Status.ACCEPTED: ['See you then. Please report to the front office.', 'Confirmed. Come to the staffroom.'],
    Appointment.Status.DECLINED: ['Sorry, I am on a school trip that day.', 'Please see the class teacher instead.'],
    Appointment.Status.RESCHEDULED: ['I have a staff meeting then. Moved to this time.', 'Exams that morning, moved to afternoon.'],
}


class Command(BaseCommand):
    help = 'Fill the database with a believable demo school: departments, teachers, an admin and a fortnight of visits.'

    def add_arguments(self, parser):
        parser.add_argument('--password', default='Demo1234!', help='Password for every demo account.')
        parser.add_argument(
            '--phone', default='',
            help='Phone number for every demo visitor, so SMS from the demo reach you. Leave out to send no visitor SMS.',
        )
        parser.add_argument('--reset', action='store_true', help='Delete existing demo data first.')
        parser.add_argument('--force', action='store_true', help='Allow running when DEBUG is off.')

    def handle(self, *args, **options):
        if not settings.DEBUG and not options['force']:
            raise CommandError('DEBUG is off, so this may be a live database. Re-run with --force if you are sure.')
        if User.objects.filter(email__endswith=f'@{DEMO_DOMAIN}').exists():
            if not options['reset']:
                raise CommandError('Demo data already exists. Re-run with --reset to replace it.')
        rng = random.Random(42)
        with transaction.atomic():
            if options['reset']:
                self._delete_demo_data()
            staff = self._create_school(options['password'])
            visits = self._create_visits(staff, options['phone'], rng)
            self._create_days_off(staff, rng)
        self._report(staff, visits, options)

    def _delete_demo_data(self):
        User.objects.filter(email__endswith=f'@{DEMO_DOMAIN}').delete()
        for name in DEPARTMENTS:
            Department.objects.filter(name=name, user__isnull=True, appointments__isnull=True).delete()

    def _create_school(self, password):
        divisions = {}
        for department_name, division_names in DEPARTMENTS.items():
            department, _ = Department.objects.get_or_create(name=department_name)
            for division_name in division_names:
                divisions[division_name], _ = Division.objects.get_or_create(name=division_name, department=department)

        staff = []
        for index, (full_name, _department, division_name, role) in enumerate(STAFF):
            division = divisions[division_name]
            email_name = full_name.lower().replace('nurse ', '').replace(' ', '.')
            user = User.objects.create_user(
                email=f'{email_name}@{DEMO_DOMAIN}', full_name=full_name, password=password, role=role,
                department=division.department, division=division,
            )
            if index == 4:
                user.is_available = False
                user.availability_reason = 'Supervising exams'
                user.save(update_fields=['is_available', 'availability_reason'])
            staff.append(user)
        return staff

    def _school_time(self, day, hour, minute=0):
        return timezone.make_aware(datetime.combine(day, time(hour, minute)))

    def _weekdays(self, start, count, step):
        days, day = [], start
        while len(days) < count:
            day += timedelta(days=step)
            if day.weekday() < 5:
                days.append(day)
        return days

    def _create_visits(self, staff, phone, rng):
        now = timezone.localtime()
        today = now.date()
        hosts = [member for member in staff if member.role == User.Role.STAFF]
        taken = set()
        visits = []

        def book(host, when, status, **extra):
            key = (host.id, when)
            if key in taken:
                return None
            taken.add(key)
            division = host.division.name
            parent = rng.choice(PARENTS)
            classes = CLASS_BY_DIVISION.get(division)
            visit = Appointment.objects.create(
                visitor_name=parent,
                visitor_phone=phone or None,
                visitor_email='',
                student_name=f'{rng.choice(CHILDREN)} {parent.split()[-1]}' if classes else '',
                student_class=rng.choice(classes) if classes else '',
                department=host.department,
                division=host.division,
                staff_member=host,
                appointment_date=when,
                message=rng.choice(MESSAGES_BY_DIVISION.get(division, TEACHER_MESSAGES)),
                status=status,
                response_note=rng.choice(RESPONSES[status]) if status in RESPONSES else '',
                **extra,
            )
            created = when - timedelta(days=rng.randint(1, 4), hours=rng.randint(0, 5))
            Appointment.objects.filter(pk=visit.pk).update(created_at=min(created, timezone.now()))
            visits.append(visit)
            return visit

        # Past fortnight: answered visits, most of them signed in and out.
        for day in self._weekdays(today, 8, -1):
            for _ in range(3):
                host = rng.choice(hosts)
                when = self._school_time(day, rng.randint(8, 15), rng.choice([0, 30]))
                status = rng.choice([Appointment.Status.ACCEPTED] * 4 + [Appointment.Status.DECLINED, Appointment.Status.CANCELLED])
                extra = {}
                if status == Appointment.Status.ACCEPTED:
                    arrived = when - timedelta(minutes=rng.randint(0, 10))
                    extra = {'checked_in_at': arrived, 'checked_out_at': arrived + timedelta(minutes=rng.randint(20, 50))}
                book(host, when, status, **extra)

        # Today, if it's a school day: someone on site now, someone gone, and some still expected.
        if today.weekday() < 5:
            book(hosts[0], now - timedelta(minutes=20), Appointment.Status.ACCEPTED,
                           checked_in_at=now - timedelta(minutes=25))
            book(hosts[1], now - timedelta(hours=2), Appointment.Status.ACCEPTED,
                 checked_in_at=now - timedelta(hours=2, minutes=5), checked_out_at=now - timedelta(hours=1, minutes=20))
            for offset, status in [(1, Appointment.Status.ACCEPTED), (2, Appointment.Status.PENDING), (3, Appointment.Status.PENDING)]:
                book(rng.choice(hosts), (now + timedelta(hours=offset)).replace(minute=0, second=0, microsecond=0), status)

        # Next fortnight: mostly waiting for a reply, some confirmed or moved.
        for day in self._weekdays(today, 8, 1):
            for _ in range(3):
                host = rng.choice(hosts)
                when = self._school_time(day, rng.randint(8, 15), rng.choice([0, 30]))
                status = rng.choice([Appointment.Status.PENDING] * 3 + [Appointment.Status.ACCEPTED] * 2 + [Appointment.Status.RESCHEDULED])
                book(host, when, status)
        return visits

    def _create_days_off(self, staff, rng):
        today = timezone.localdate()
        for member, offset in [(staff[3], 3), (staff[6], 5)]:
            day = self._weekdays(today, offset, 1)[-1]
            if not Appointment.objects.filter(staff_member=member, appointment_date__date=day).exists():
                StaffUnavailableDay.objects.create(user=member, date=day)

    def _report(self, staff, visits, options):
        admin = staff[0]
        self.stdout.write(self.style.SUCCESS(
            f'Demo school ready: {len(DEPARTMENTS)} departments, {len(staff)} accounts, {len(visits)} visits.'
        ))
        self.stdout.write(f'  Admin:   {admin.email}')
        self.stdout.write(f'  Teacher: {staff[1].email}')
        self.stdout.write(f'  Password for every demo account: {options["password"]}')
        if options['phone']:
            self.stdout.write(f'  Visitor SMS will go to {options["phone"]}.')
        else:
            self.stdout.write('  Demo visitors have no phone number, so no visitor SMS will be sent.')
