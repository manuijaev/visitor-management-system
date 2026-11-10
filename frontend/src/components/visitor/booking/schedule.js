const TZ = "Africa/Nairobi";
const TZ_OFFSET = "+03:00";
const WEEKDAY_INDEX = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};
const DAY_MS = 86400000;
const LEAD_MINUTES = 30;
const BOOKABLE_DAYS = 10;
const SEARCH_DAYS = 21;
const RELATIVE_DAY_LABELS = ["Today", "Tmrw"];

export const SLOT_MINUTES = 30;

export const DEFAULT_HOURS = {
  opens: 8 * 60,
  closes: 17 * 60,
  days: [0, 1, 2, 3, 4],
  summary: "Mon–Fri, 8:00 AM to 5:00 PM",
};

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

export function zonedParts(date) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday,
  };
}

const toMinutes = (clock) => {
  const [hh, mm] = String(clock || "")
    .split(":")
    .map(Number);
  return Number.isFinite(hh) && Number.isFinite(mm) ? hh * 60 + mm : null;
};

export const toHours = (data) => {
  const opens = toMinutes(data?.opens_at);
  const closes = toMinutes(data?.closes_at);
  const days = Array.isArray(data?.open_days) ? data.open_days : null;
  if (opens === null || closes === null || closes <= opens || !days?.length) {
    return DEFAULT_HOURS;
  }
  return {
    opens,
    closes,
    days,
    summary: data.summary || DEFAULT_HOURS.summary,
  };
};

const isOpenDay = (hours, weekday) =>
  hours.days.includes(WEEKDAY_INDEX[weekday]);

export const formatInTz = (value, options, locale = "en-GB") =>
  new Intl.DateTimeFormat(locale, { timeZone: TZ, ...options }).format(
    new Date(value),
  );

export const formatTime = (value) =>
  formatInTz(value, { hour: "numeric", minute: "2-digit" }, "en-US");

export const formatDayLong = (value) =>
  formatInTz(value, { weekday: "long", day: "numeric", month: "long" });

export function isOfficeOpen(now, hours) {
  const { hour, minute, weekday } = zonedParts(now);
  const minutes = hour * 60 + minute;
  return (
    isOpenDay(hours, weekday) &&
    minutes >= hours.opens &&
    minutes < hours.closes
  );
}

const pad = (value) => String(value).padStart(2, "0");

export function buildSlots(dateKey, now, hours) {
  const earliest = now.getTime() + LEAD_MINUTES * 60 * 1000;
  const slots = [];
  for (
    let minutes = hours.opens;
    minutes < hours.closes;
    minutes += SLOT_MINUTES
  ) {
    const value = `${dateKey}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00${TZ_OFFSET}`;
    slots.push({
      value,
      label: formatTime(value),
      afternoon: minutes >= 12 * 60,
      available: new Date(value).getTime() > earliest,
    });
  }
  return slots;
}

export const hasOpenSlot = (dateKey, now, hours) =>
  buildSlots(dateKey, now, hours).some((slot) => slot.available);

export function buildDays(now, hours) {
  const days = [];
  for (
    let offset = 0;
    days.length < BOOKABLE_DAYS && offset < SEARCH_DAYS;
    offset += 1
  ) {
    const { dateKey, weekday } = zonedParts(
      new Date(now.getTime() + offset * DAY_MS),
    );
    if (isOpenDay(hours, weekday) && hasOpenSlot(dateKey, now, hours)) {
      const noon = `${dateKey}T12:00:00${TZ_OFFSET}`;
      days.push({
        key: dateKey,
        label: RELATIVE_DAY_LABELS[offset] || weekday,
        date: formatInTz(noon, { day: "numeric" }),
        month: formatInTz(noon, { month: "short" }),
      });
    }
  }
  return days;
}
