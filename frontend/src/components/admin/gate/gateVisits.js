import { eatDateKey, formatClockTime } from "../utils";

const CLOSED_STATUSES = new Set(["Declined", "Cancelled", "Expired"]);

const byTime =
  (field, direction = 1) =>
  (a, b) =>
    direction * (new Date(a[field]) - new Date(b[field]));

export const matchesGateQuery = (visit, query) =>
  !query ||
  [
    visit.visitor_name,
    visit.visitor_phone,
    visit.staff_name,
    visit.department_name,
  ].some((value) => value?.toLowerCase().includes(query));

export function groupGateVisits(appointments, query, today = eatDateKey()) {
  const search = query.trim().toLowerCase();
  const visible = appointments.filter((visit) =>
    matchesGateQuery(visit, search),
  );
  return {
    expected: visible
      .filter(
        (visit) =>
          !visit.checked_in_at &&
          !CLOSED_STATUSES.has(visit.status) &&
          eatDateKey(visit.appointment_date) === today,
      )
      .sort(byTime("appointment_date")),
    onsite: visible
      .filter((visit) => visit.checked_in_at && !visit.checked_out_at)
      .sort(byTime("checked_in_at")),
    left: visible
      .filter(
        (visit) =>
          visit.checked_out_at && eatDateKey(visit.checked_out_at) === today,
      )
      .sort(byTime("checked_out_at", -1)),
  };
}

export const GATE_TABS = [
  {
    id: "expected",
    label: "Expected",
    empty: "No more visitors expected today.",
    time: (visit) => formatClockTime(visit.appointment_date),
    action: "check-in",
    actionLabel: "Mark arrived",
    variant: "solid-sm",
  },
  {
    id: "onsite",
    label: "Here now",
    empty: "No visitors are here right now.",
    time: (visit) => `Arrived ${formatClockTime(visit.checked_in_at)}`,
    action: "check-out",
    actionLabel: "Mark left",
    variant: "outline-sm",
  },
  {
    id: "left",
    label: "Left",
    empty: "Nobody has left yet today.",
    time: (visit) =>
      `${formatClockTime(visit.checked_in_at)} – ${formatClockTime(visit.checked_out_at)}`,
  },
];

export const gateActionMessage = (visit, action) =>
  action === "check-in"
    ? `${visit.visitor_name} has arrived. ${visit.staff_name || "Their host"} has been told.`
    : `${visit.visitor_name} has left.`;
