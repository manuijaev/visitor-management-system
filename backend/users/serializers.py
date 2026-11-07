from django.contrib.auth.password_validation import validate_password as run_password_validators
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import secrets

from departments.models import Department, Division

from .models import StaffUnavailableDay, User


def build_auth_payload(user):
    refresh = StaffLoginSerializer.get_token(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': session_user_payload(user),
    }


def session_user_payload(user):
    return {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'department': user.department_id,
        'department_name': user.department.name if user.department else '',
        'division': user.division_id,
        'division_name': user.division.name if user.division else '',
        'is_available': user.is_available,
        'availability_reason': user.availability_reason,
    }


class StaffListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    invite_pending = serializers.SerializerMethodField()
    unavailable_dates = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'department', 'department_name', 'division', 'division_name', 'role', 'is_active', 'is_available', 'availability_reason', 'invite_pending', 'unavailable_dates']

    def get_invite_pending(self, obj):
        return not obj.has_usable_password()

    def get_unavailable_dates(self, obj) -> list[str]:
        today = timezone.localdate()
        return [day.date.isoformat() for day in obj.unavailable_days.all() if day.date >= today]


class StaffUnavailableDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffUnavailableDay
        fields = ['date']

    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError('Pick today or a future date.')
        return value



class StaffAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_available', 'availability_reason']


class StaffRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'department', 'division', 'role', 'password', 'fcm_token']
        read_only_fields = ['id']

    def validate(self, attrs):
        department = attrs.get('department')
        division = attrs.get('division')
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        
        # Only allow admin registration if no admin exists yet
        role = attrs.get('role', User.Role.STAFF)
        if role == User.Role.ADMIN and User.objects.filter(role=User.Role.ADMIN).exists():
            raise serializers.ValidationError({'role': 'Admin registration is disabled. An admin account already exists.'})
        
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', User.Role.STAFF)
        is_staff_flag = role == User.Role.ADMIN
        return User.objects.create_user(password=password, is_staff=is_staff_flag, **validated_data)


class StaffManageSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'department',
            'department_name',
            'division',
            'division_name',
            'role',
            'is_active',
            'is_available',
            'availability_reason',
            'password',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        department = attrs.get('department', getattr(self.instance, 'department', None))
        division = attrs.get('division', getattr(self.instance, 'division', None))
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        return attrs

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user


class StaffCreateSerializer(serializers.ModelSerializer):
    """
    Admin creates a staff account and places it in a department/division.
    A department or division can be picked by id or created on the fly by name.
    The account has no usable password until the staff member accepts the invite.
    """
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    division = serializers.PrimaryKeyRelatedField(queryset=Division.objects.all(), required=False, allow_null=True)
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=120)
    division_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=120)

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'department',
            'division',
            'department_name',
            'division_name',
            'role',
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        department = attrs.get('department')
        division = attrs.get('division')
        department_name = (attrs.get('department_name') or '').strip()
        division_name = (attrs.get('division_name') or '').strip()

        if not department and not department_name:
            raise serializers.ValidationError({'department': 'Choose a department or enter a new one.'})
        if not division and not division_name:
            raise serializers.ValidationError({'division': 'Choose a division or enter a new one.'})
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        if division and not department:
            raise serializers.ValidationError({'division': 'A new department cannot use an existing division.'})

        attrs['department_name'] = department_name
        attrs['division_name'] = division_name
        return attrs

    def create(self, validated_data):
        department_name = validated_data.pop('department_name', '')
        division_name = validated_data.pop('division_name', '')
        department = validated_data.pop('department', None)
        division = validated_data.pop('division', None)

        if not department:
            department = Department.objects.filter(name__iexact=department_name).first() \
                or Department.objects.create(name=department_name)
        if not division:
            division = Division.objects.filter(department=department, name__iexact=division_name).first() \
                or Division.objects.create(department=department, name=division_name)

        role = validated_data.get('role', User.Role.STAFF)
        return User.objects.create_user(
            password=None,
            is_staff=role == User.Role.ADMIN,
            department=department,
            division=division,
            **validated_data,
        )


class InviteAcceptSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        from .invites import resolve_invite

        user = resolve_invite(attrs['uid'], attrs['token'])
        if user is None:
            raise serializers.ValidationError({'detail': 'This link is invalid or has already been used. Ask your administrator for a new one.'})
        try:
            run_password_validators(attrs['password'], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        attrs['user'] = user
        return attrs


class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for admin to reset staff password.
    Generates a new temporary password.
    """
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        fields = ['password']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._temp_password = None

    def get_temp_password(self):
        return self._temp_password

    def validate(self, attrs):
        if not attrs.get('password'):
            self._temp_password = self._generate_temp_password()
            attrs['password'] = self._temp_password
        return attrs

    def _generate_temp_password(self):
        """Generate a secure temporary password."""
        chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
        return ''.join(secrets.choice(chars) for _ in range(10))

    def save(self):
        user = self.instance
        user.set_password(self._temp_password)
        user.save(update_fields=['password'])
        return user


class StaffLoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            email = str(attrs.get(self.username_field, '')).strip()
            pending = User.objects.filter(email__iexact=email, is_active=True).first()
            if pending and not pending.has_usable_password():
                raise AuthenticationFailed(
                    'Your account is not set up yet. Open the invite link in your email to set a password.'
                )
            raise
        data['user'] = session_user_payload(self.user)
        return data


class FCMTokenUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['fcm_token']
