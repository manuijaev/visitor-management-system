import { sendVisitorResponseEmail } from "../../services/emailjs";

const confirmationFor = (status, visitorName) =>
  status === "Accepted"
    ? "Visitor notified — they've been paged"
    : `Response submitted to ${visitorName}.`;

export default async function respondToVisit({
  appointment,
  appointmentId,
  status,
  note,
  rescheduleValue,
  updateAppointment,
}) {
  const responseNote =
    note.trim() ||
    `${appointment?.visitor_name || "Visitor"} status set to ${status}.`;
  const newTime =
    status === "Rescheduled" ? new Date(rescheduleValue).toISOString() : null;

  await updateAppointment(appointmentId, {
    status,
    response_note: responseNote,
    ...(newTime ? { appointment_date: newTime } : {}),
  });

  if (!appointment) return "";
  const confirmation = confirmationFor(status, appointment.visitor_name);
  if (!appointment.visitor_email) return confirmation;

  const emailResult = await sendVisitorResponseEmail({
    visitor_name: appointment.visitor_name,
    visitor_email: appointment.visitor_email,
    status,
    response_note: responseNote,
    appointment_date: newTime || appointment.appointment_date,
    staff_name: appointment.staff_name || "Staff",
    staff_email: appointment.staff_email || "",
  });
  return emailResult?.sent
    ? confirmation
    : `${confirmation} The email could not be sent.`;
}
