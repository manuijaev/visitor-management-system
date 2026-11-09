import { loadVisitorDetails } from "../../../services/visitorDevice";
import { firstName } from "./hosts";
import { formatDayLong, formatInTz, formatTime } from "./schedule";

const emptyVisitor = {
  name: "",
  phone: "",
  email: "",
  studentName: "",
  studentClass: "",
  purpose: "",
  message: "",
};

export const isValidPhone = (value) =>
  /^\+?\d{9,15}$/.test((value || "").replaceAll(/[\s()-]/g, ""));

export const startingVisitor = (receptionMode) => {
  const saved = receptionMode ? null : loadVisitorDetails();
  if (!saved) return emptyVisitor;
  return {
    ...emptyVisitor,
    name: saved.name,
    phone: saved.phone,
    email: saved.email || "",
  };
};

export const studentLabel = (visitor) => {
  const studentClass = visitor.studentClass.trim();
  return [visitor.studentName.trim(), studentClass && `(${studentClass})`]
    .filter(Boolean)
    .join(" ");
};

export const visitNote = (visitor) =>
  [visitor.purpose && `Purpose: ${visitor.purpose}`, visitor.message.trim()]
    .filter(Boolean)
    .join(" · ");

export function arrivalTime({ mode, eta, slot }) {
  if (mode === "now") return new Date();
  if (mode === "onway") return new Date(Date.now() + eta * 60 * 1000);
  return new Date(slot);
}

export const visitReference = (id) =>
  id
    ? `GP-${String(id).padStart(5, "0")}`
    : `GP-${String(Date.now()).slice(-6)}`;

export const appointmentPayload = ({ visitor, host, mode, arrival }) => ({
  visitor_name: visitor.name.trim(),
  visitor_phone: visitor.phone.trim(),
  visitor_email: visitor.email.trim(),
  student_name: visitor.studentName.trim(),
  student_class: visitor.studentClass.trim(),
  department: host.departmentId,
  division: host.divisionId,
  staff_member: host.id,
  appointment_date: arrival.toISOString(),
  is_scheduled: mode === "later",
  message: visitNote(visitor),
});

export function describeError(error) {
  const detail = error?.response?.data;
  if (detail && typeof detail === "object") {
    const [field, first] = Object.entries(detail)[0] || [];
    const text = Array.isArray(first) ? first[0] : first;
    if (typeof text === "string") {
      if (!field || field === "detail" || field === "non_field_errors") {
        return text;
      }
      const label = field.replaceAll("_", " ");
      return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${text}`;
    }
  }
  if (!error?.response) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return "Something went wrong while sending your request. Please try again.";
}

export function whenLabel({ mode, eta, slot }) {
  if (mode === "now") return "Right now · at reception";
  if (mode === "onway") return `In about ${eta} minutes`;
  if (mode === "later" && slot) {
    return `${formatDayLong(slot)}, ${formatTime(slot)}`;
  }
  return "Not chosen yet";
}

export function submitLabel(mode, hostFirst) {
  if (mode === "now") return `Alert ${hostFirst} now`;
  if (mode === "onway") return `Let ${hostFirst} know`;
  return "Send visit request";
}

export function passCopy(visit) {
  const visitorFirst = firstName(visit.visitor.name);
  const hostName = visit.host.name;
  const time = formatTime(visit.arrival);
  if (visit.mode === "now") {
    return {
      headline: `Take a seat, ${visitorFirst}.`,
      body: `${hostName} has been alerted that you're at reception.`,
      when: `Now, ${time}`,
    };
  }
  if (visit.mode === "onway") {
    return {
      headline: `See you soon, ${visitorFirst}.`,
      body: `${hostName} knows you're arriving in about ${visit.eta} minutes.`,
      when: `Around ${time}`,
    };
  }
  const shortDay = formatInTz(visit.arrival, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return {
    headline: `You're booked in, ${visitorFirst}.`,
    body: `${hostName} will confirm your visit for ${formatDayLong(visit.arrival)} at ${time}.`,
    when: `${shortDay}, ${time}`,
  };
}
