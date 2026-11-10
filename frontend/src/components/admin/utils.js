export const EAT_TIMEZONE = "Africa/Nairobi";

export function eatDateKey(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EAT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatApiError(
  err,
  fallback = "Something went wrong. Please try again.",
) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.join(" ");
  const messages = Object.values(data)
    .flat()
    .filter((value) => typeof value === "string");
  return messages.length ? messages.join(" ") : fallback;
}

export function getInitials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function firstName(name) {
  return (name || "").trim().split(" ")[0] || "them";
}

export function staffStatus(member) {
  if (!member.is_active) return { label: "Inactive", tone: "muted" };
  if (member.invite_pending) return { label: "Invite pending", tone: "gold" };
  return { label: "Active", tone: "green" };
}

export function getRelativeTimeLabel(value) {
  if (!value) return "just now";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "just now";
  const diffSeconds = Math.max(Math.floor((Date.now() - timestamp) / 1000), 0);
  if (diffSeconds < 60) return "just now";
  const units = [
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  const unit = units.find((u) => diffSeconds >= u.seconds);
  const count = Math.floor(diffSeconds / unit.seconds);
  return `${count} ${unit.label}${count > 1 ? "s" : ""} ago`;
}

export function formatVisitDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: EAT_TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTopbarDateTime(value = new Date()) {
  const date = new Date(value).toLocaleDateString("en-GB", {
    timeZone: EAT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${date} - ${formatClockTime(value)} EAT`;
}

export function formatClockTime(value = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", {
    timeZone: EAT_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function orderVisitsForReview(visits, now = Date.now()) {
  const rank = (visit) => {
    if (visit.status === "Pending") return 0;
    return new Date(visit.appointment_date).getTime() >= now ? 1 : 2;
  };
  return [...visits].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const aTime = new Date(a.appointment_date).getTime();
    const bTime = new Date(b.appointment_date).getTime();
    return rank(a) === 2 ? bTime - aTime : aTime - bTime;
  });
}

export const VISIT_FILTERS = [
  { id: "pending", label: "Pending", statuses: new Set(["Pending"]) },
  {
    id: "accepted",
    label: "Accepted",
    statuses: new Set(["Accepted", "Rescheduled"]),
  },
  {
    id: "declined",
    label: "Declined",
    statuses: new Set(["Declined", "Cancelled", "Expired"]),
  },
  { id: "all", label: "All", statuses: null },
];

export function matchesVisitFilter(visit, filterId) {
  const statuses = VISIT_FILTERS.find(
    (filter) => filter.id === filterId,
  )?.statuses;
  return !statuses || statuses.has(visit.status);
}
