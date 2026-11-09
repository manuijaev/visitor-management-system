export const LOGIN_PATH = "/staff";
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please log in again.";

const EXPIRY_SKEW_SECONDS = 30;

function tokenExpiry(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const exp = tokenExpiry(token);
  if (exp === null) return true;
  return exp - EXPIRY_SKEW_SECONDS <= Date.now() / 1000;
}

const ROLES = new Set(["Admin", "Staff"]);

export function isValidUser(user) {
  return Boolean(
    user &&
    typeof user === "object" &&
    user.id != null &&
    ROLES.has(user.role),
  );
}

function readRawUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function hasStoredUser() {
  return localStorage.getItem("user") !== null;
}

export function readStoredUser() {
  const user = readRawUser();
  return isValidUser(user) ? user : null;
}

export function hasUsableSession() {
  return (
    Boolean(readStoredUser()) &&
    !isTokenExpired(localStorage.getItem("refresh_token"))
  );
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function flashSessionExpired() {
  sessionStorage.setItem("app_toast", SESSION_EXPIRED_MESSAGE);
}

export function expireSession() {
  clearSession();
  flashSessionExpired();
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
}
