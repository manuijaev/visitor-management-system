const VISIT_MS = 30 * 60 * 1000;

const icsText = (value) => value.replaceAll(/[\\,;]/g, (match) => `\\${match}`);

const icsStamp = (date) =>
  date
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

export function calendarInvite(visit, now = new Date()) {
  const start = new Date(visit.arrival);
  const end = new Date(start.getTime() + VISIT_MS);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gatepass//Visit//EN",
    "BEGIN:VEVENT",
    `UID:${visit.reference}@gatepass`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsText(`Visit with ${visit.host.name}`)}`,
    `DESCRIPTION:${icsText(`Gatepass reference ${visit.reference}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadCalendarInvite(visit) {
  const url = URL.createObjectURL(
    new Blob([calendarInvite(visit)], { type: "text/calendar" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `gatepass-${visit.reference}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
