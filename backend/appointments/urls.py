from django.urls import path

from .views import (
    AppointmentCreateView,
    AppointmentDeleteView,
    AppointmentReassignView,
    AppointmentUpdateView,
    AppointmentCheckInView,
    AppointmentCheckOutView,
    MyAppointmentsView,
)

urlpatterns = [
    path('appointments/create/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('appointments/my/', MyAppointmentsView.as_view(), name='my-appointments'),
    path('appointments/update/<int:id>/', AppointmentUpdateView.as_view(), name='appointment-update'),
    path('appointments/reassign/<int:id>/', AppointmentReassignView.as_view(), name='appointment-reassign'),
    path('appointments/delete/<int:id>/', AppointmentDeleteView.as_view(), name='appointment-delete'),
    path('appointments/<int:id>/check-in/', AppointmentCheckInView.as_view(), name='appointment-check-in'),
    path('appointments/<int:id>/check-out/', AppointmentCheckOutView.as_view(), name='appointment-check-out'),
]
