import {
  EAT_TIMEZONE,
  matchesVisitFilter,
  orderVisitsForReview,
} from "../utils";
import { OVERDUE_MS, STATUS_TONE } from "./constants";

export const asList = (data) => (Array.isArray(data) ? data : []);

export const plural = (count, singular, pluralForm = `${singular}s`) =>
  count === 1 ? singular : pluralForm;

export const requestedAt = (visit) =>
  new Date(visit.created_at || visit.appointment_date).getTime();

export const isOverdue = (visit, now = Date.now()) =>
  visit.status === "Pending" && now - requestedAt(visit) >= OVERDUE_MS;

export const studentLabel = (visit) =>
  [
    visit?.student_name?.trim(),
    visit?.student_class?.trim() && `(${visit.student_class.trim()})`,
  ]
    .filter(Boolean)
    .join(" ");

function requestNotification(visit, staffName, created, overdue) {
  return {
    id: `request-${visit.id}`,
    tone: overdue ? "red" : "gold",
    icon: overdue ? "alert" : "visitors",
    title: overdue
      ? `${visit.visitor_name} is still waiting on ${staffName}`
      : `${visit.visitor_name} requested a visit with ${staffName}`,
    message:
      visit.message?.trim() ||
      [visit.department_name, visit.division_name].filter(Boolean).join(" · "),
    timestamp: created,
    urgent: overdue,
  };
}

function responseNotification(visit, staffName, created) {
  return {
    id: `response-${visit.id}-${visit.status}`,
    tone: STATUS_TONE[visit.status] || "muted",
    icon: visit.status === "Declined" ? "x" : "check",
    title: `${staffName} ${visit.status.toLowerCase()} ${visit.visitor_name}'s visit`,
    message: visit.response_note?.trim() || "",
    timestamp: created,
    urgent: false,
  };
}

export function buildNotifications(appointments, now = Date.now()) {
  const items = [];
  appointments.forEach((visit) => {
    const created = requestedAt(visit);
    if (Number.isNaN(created)) return;
    const staffName = visit.staff_name || "Staff";
    const overdue = visit.status === "Pending" && now - created >= OVERDUE_MS;
    items.push(requestNotification(visit, staffName, created, overdue));
    if (visit.status !== "Pending") {
      items.push(responseNotification(visit, staffName, created));
    }
  });
  return items.sort((x, y) => y.timestamp - x.timestamp).slice(0, 40);
}

export function greeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: EAT_TIMEZONE,
    }).format(date),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function computeStats(appointments, staff, now = Date.now()) {
  const pending = appointments.filter((visit) => visit.status === "Pending");
  return {
    total: appointments.length,
    pending: pending.length,
    overdue: pending.filter((visit) => isOverdue(visit, now)).length,
    active: staff.filter((member) => member.is_active && !member.invite_pending)
      .length,
    invited: staff.filter((member) => member.is_active && member.invite_pending)
      .length,
  };
}

const includesQuery = (values, query) =>
  values.some((value) => value?.toLowerCase().includes(query));

export function filterPeople(staff, { search, departmentId }) {
  const query = search.toLowerCase();
  return staff.filter((member) => {
    if (departmentId && String(member.department) !== departmentId) {
      return false;
    }
    return (
      !query ||
      includesQuery(
        [
          member.full_name,
          member.email,
          member.department_name,
          member.division_name,
        ],
        query,
      )
    );
  });
}

export function filterVisits(appointments, { search, status }) {
  const query = search.toLowerCase();
  return orderVisitsForReview(
    appointments.filter(
      (visit) =>
        matchesVisitFilter(visit, status) &&
        (!query ||
          includesQuery(
            [
              visit.visitor_name,
              visit.visitor_email,
              studentLabel(visit),
              visit.staff_name,
              visit.department_name,
            ],
            query,
          )),
    ),
  );
}

export const newestFirst = (staff, limit) =>
  [...staff].sort((x, y) => y.id - x.id).slice(0, limit);

export const reassignCandidates = (staff, visit) =>
  staff.filter(
    (member) =>
      member.is_active &&
      member.department &&
      member.division &&
      member.id !== visit.staff_member,
  );

const csvCell = (cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`;

export function visitsToCsv(appointments) {
  const rows = [
    [
      "ID",
      "Visitor",
      "Visitor email",
      "Staff",
      "Department",
      "Status",
      "Visit date",
    ],
    ...appointments.map((visit) => [
      visit.id,
      visit.visitor_name,
      visit.visitor_email,
      visit.staff_name,
      visit.department_name,
      visit.status,
      visit.appointment_date,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadCsv(csv, filename) {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
