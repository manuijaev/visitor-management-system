const DETAILS_KEY = "gp_visitor_details";
const VISITS_KEY = "gp_visitor_visits";
const MAX_VISITS = 20;

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** @returns {{name: string, phone: string, email: string} | null} */
export function loadVisitorDetails() {
  const details = read(DETAILS_KEY, null);
  return typeof details?.name === "string" &&
    typeof details.phone === "string"
    ? details
    : null;
}

export function saveVisitorDetails({ name, phone, email }) {
  write(DETAILS_KEY, {
    name: name.trim(),
    phone: phone.trim(),
    email: (email || "").trim(),
  });
}

/** @returns {Array<{reference: string, phone: string, hostName: string, arrival: string, mode: string}>} */
export function loadSavedVisits() {
  const visits = read(VISITS_KEY, []);
  return Array.isArray(visits)
    ? visits.filter((visit) => visit?.reference && visit.phone)
    : [];
}

export function saveVisit(visit) {
  const others = loadSavedVisits().filter(
    (item) => item.reference !== visit.reference,
  );
  write(VISITS_KEY, [visit, ...others].slice(0, MAX_VISITS));
}

export function forgetVisitor() {
  try {
    localStorage.removeItem(DETAILS_KEY);
    localStorage.removeItem(VISITS_KEY);
  } catch {}
}

const RECEPTION_KEY = "gp_reception_mode";

export function isReceptionMode() {
  try {
    return localStorage.getItem(RECEPTION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setReceptionMode(on) {
  try {
    localStorage.setItem(RECEPTION_KEY, on ? "1" : "0");
  } catch {}
}
