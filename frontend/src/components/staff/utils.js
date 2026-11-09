import {
  eatDateKey,
  matchesVisitFilter,
  orderVisitsForReview,
} from "../admin/utils";

const UPCOMING_STATUSES = new Set(["Accepted", "Rescheduled"]);
const OVERDUE_AFTER_MS = 30 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const TAB_TITLES = {
  dashboard: "Home",
  appointments: "Requests",
  schedule: "Schedule",
  settings: "Settings",
};

export const studentLabel = (visit) =>
  [
    visit?.student_name?.trim(),
    visit?.student_class?.trim() && `(${visit.student_class.trim()})`,
  ]
    .filter(Boolean)
    .join(" ");

const pad2 = (value) => String(value).padStart(2, "0");

export const toLocalInputValue = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export function rescheduleTimeError(value, appointment) {
  if (!value) return "Pick a new date and time.";
  const proposed = new Date(value).getTime();
  if (Number.isNaN(proposed)) return "Pick a new date and time.";
  if (proposed <= Date.now()) return "The new time must be in the future.";
  if (
    appointment &&
    proposed === new Date(appointment.appointment_date).getTime()
  ) {
    return "Pick a time different from the original one.";
  }
  return "";
}

export const formatRescheduleTime = (value) =>
  new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export function getInitials(name) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const TONES = {
  gold: { background: "var(--gold-light)", color: "var(--gold-dark)" },
  green: { background: "var(--green-light)", color: "var(--green-dark)" },
  red: { background: "var(--red-light)", color: "var(--red-dark)" },
};

export const UPCOMING_TONE = TONES.green;

export function statusTone(status) {
  if (status === "Pending") return TONES.gold;
  if (status === "Accepted") return TONES.green;
  return TONES.red;
}

export function requestCardTone(status, isUrgent) {
  if (isUrgent || status === "Declined") return TONES.red;
  if (status === "Accepted") return TONES.green;
  return TONES.gold;
}

export const hoursSince = (value, now = Date.now()) =>
  Math.floor((now - new Date(value).getTime()) / HOUR_MS);

const sentAt = (visit) =>
  new Date(visit.created_at || visit.appointment_date).getTime();

const byAppointmentDate = (a, b) =>
  new Date(a.appointment_date) - new Date(b.appointment_date);

function matchesSearch(visit, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return [
    visit.visitor_name,
    visit.visitor_email,
    studentLabel(visit),
    visit.service?.name,
  ].some((value) => value?.toLowerCase().includes(needle));
}

export function filterRequests(
  appointments,
  { requestFilter, todayOnly, searchQuery },
  today = eatDateKey(),
) {
  return orderVisitsForReview(
    appointments.filter(
      (visit) =>
        matchesVisitFilter(visit, requestFilter) &&
        (!todayOnly || eatDateKey(visit.appointment_date) === today) &&
        matchesSearch(visit, searchQuery),
    ),
  );
}

export function summarizeRequests(appointments, now = Date.now()) {
  const today = eatDateKey(now);
  const summary = {
    pending: 0,
    accepted: 0,
    upcoming: [],
    overdue: [],
    todays: [],
  };
  for (const visit of appointments) {
    if (visit.status === "Accepted") summary.accepted += 1;
    if (visit.status === "Pending") {
      summary.pending += 1;
      const sent = sentAt(visit);
      if (!Number.isNaN(sent) && now - sent >= OVERDUE_AFTER_MS) {
        summary.overdue.push(visit);
      }
    }
    if (eatDateKey(visit.appointment_date) === today)
      summary.todays.push(visit);
    if (
      UPCOMING_STATUSES.has(visit.status) &&
      new Date(visit.appointment_date).getTime() > now
    ) {
      summary.upcoming.push(visit);
    }
  }
  summary.upcoming.sort(byAppointmentDate);
  summary.todays.sort(byAppointmentDate);
  summary.overdue.sort((a, b) => sentAt(a) - sentAt(b));
  return summary;
}

export const recentRequests = (appointments, limit = 3) =>
  [...appointments]
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
    .slice(0, limit);

export const defaultRequestFilter = (pendingCount) =>
  pendingCount > 0 ? "pending" : "all";

export function confirmMessage(pending) {
  if (!pending) return "";
  if (pending.newTime) {
    return `Move ${pending.visitorName}'s visit to ${formatRescheduleTime(pending.newTime)}? They will be notified by SMS.`;
  }
  return `Update ${pending.visitorName}'s visit request to "${pending.status}"?`;
}

export const statusUpdateError = (err) =>
  err?.response?.data?.response_note?.[0] ||
  err?.response?.data?.appointment_date?.[0] ||
  err?.response?.data?.detail ||
  "Unable to update appointment or send email.";
