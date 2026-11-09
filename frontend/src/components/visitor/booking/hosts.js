import { ALL_DEPARTMENTS } from "./constants";
import { SLOT_MINUTES } from "./schedule";

const listOrEmpty = (value) => (Array.isArray(value) ? value : []);

export const toStaff = (member) => ({
  id: member.id,
  name: (member.full_name || "").trim() || member.email || "Staff member",
  departmentId: member.department ?? null,
  departmentName: member.department_name || "",
  divisionId: member.division ?? null,
  divisionName: member.division_name || "",
  available: member.is_available !== false,
  reason: (member.availability_reason || "").trim(),
  unavailableDates: listOrEmpty(member.unavailable_dates),
  bookedTimes: listOrEmpty(member.booked_times).map((value) =>
    new Date(value).getTime(),
  ),
});

export const isSlotTaken = (host, slotValue) => {
  if (!host || !slotValue) return false;
  const start = new Date(slotValue).getTime();
  return host.bookedTimes.some(
    (booked) => Math.abs(booked - start) < SLOT_MINUTES * 60 * 1000,
  );
};

export const isAwayOn = (host, dayKey) =>
  Boolean(host?.unavailableDates.includes(dayKey));

const words = (name) => (name || "").trim().split(/\s+/);

export const firstName = (name) => words(name)[0] || "";

export const initials = (name) =>
  words(name)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

export const placement = (host) =>
  [host.departmentName, host.divisionName].filter(Boolean).join(" · ");

const matchesQuery = (host, query) =>
  !query ||
  `${host.name} ${host.departmentName} ${host.divisionName}`
    .toLowerCase()
    .includes(query);

function hostBlockReason(host, mode, dayKey) {
  if (!host.departmentId || !host.divisionId) {
    return "Not set up for visits yet";
  }
  if (mode === "later") {
    return isAwayOn(host, dayKey) ? "Unavailable on that day" : null;
  }
  if (!host.available) return host.reason || "Unavailable right now";
  return null;
}

export function blockReason(host, { mode, dayKey, slot }) {
  const later = mode === "later";
  const reason = hostBlockReason(host, mode, later ? dayKey : null);
  if (reason) return reason;
  return later && isSlotTaken(host, slot)
    ? "Already booked at that time"
    : null;
}

export function listHosts(staff, { department, query, blockFor }) {
  const needle = query.trim().toLowerCase();
  return staff
    .filter(
      (member) =>
        department === ALL_DEPARTMENTS ||
        String(member.departmentId) === department,
    )
    .filter((member) => matchesQuery(member, needle))
    .map((member) => ({ member, block: blockFor(member) }))
    .sort(
      (a, b) =>
        Number(Boolean(a.block)) - Number(Boolean(b.block)) ||
        a.member.name.localeCompare(b.member.name),
    );
}
