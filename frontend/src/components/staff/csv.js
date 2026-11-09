import { eatDateKey } from "../admin/utils";
import { studentLabel } from "./utils";

const HEADERS = [
  "ID",
  "Visitor Name",
  "Visitor Email",
  "Student",
  "Date/Time Sent",
  "Date/Time",
  "Status",
  "Visitor Message",
  "Staff Response",
];

const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const toRow = (visit) =>
  [
    visit.id,
    quote(visit.visitor_name),
    quote(visit.visitor_email),
    quote(studentLabel(visit)),
    quote(
      visit.appointment_date
        ? new Date(visit.appointment_date).toLocaleString("en-GB")
        : "",
    ),
    quote(visit.date && visit.time ? `${visit.date} ${visit.time}` : ""),
    visit.status,
    quote(visit.message),
    quote(visit.response_note),
  ].join(",");

export const buildRequestsCsv = (visits) =>
  [HEADERS.join(","), ...visits.map(toRow)].join("\n");

export function downloadRequestsCsv(visits) {
  const blob = new Blob([buildRequestsCsv(visits)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `visit_requests_${eatDateKey()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
