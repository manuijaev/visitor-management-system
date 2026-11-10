export const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "visitors", label: "Visitors", icon: "visitors" },
  { id: "gate", label: "Arrivals", icon: "arrivals" },
  { id: "hours", label: "Visiting hours", icon: "clock" },
  { id: "team", label: "Team", icon: "team" },
  { id: "departments", label: "Departments", icon: "building" },
];

const TAB_IDS = new Set(["overview", "visitors", "gate"]);

export const TAB_ITEMS = NAV_ITEMS.filter((item) => TAB_IDS.has(item.id));

export const PAGE_TITLES = {
  overview: "Overview",
  visitors: "Visitors",
  gate: "Arrivals",
  hours: "Visiting hours",
  team: "Team",
  departments: "Departments",
  settings: "Settings",
};

export const STATUS_TONE = {
  Pending: "gold",
  Accepted: "green",
  Approved: "green",
  Declined: "red",
  Rejected: "red",
  Rescheduled: "purple",
  Cancelled: "muted",
  Expired: "muted",
};

export const OVERDUE_MS = 30 * 60 * 1000;

export const REFRESH_INTERVAL_MS = 15000;
