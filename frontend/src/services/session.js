export const LOGIN_PATH = '/staff/login';
export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

const EXPIRY_SKEW_SECONDS = 30;

function tokenExpiry(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const exp = tokenExpiry(token);
  if (exp === null) return true;
  return exp - EXPIRY_SKEW_SECONDS <= Date.now() / 1000;
}

export function readStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && typeof user === 'object' ? user : null;
  } catch {
    return null;
  }
}

// The refresh token outlives the access token, so it decides whether the session can still be resumed.
export function hasUsableSession() {
  return Boolean(readStoredUser()) && !isTokenExpired(localStorage.getItem('refresh_token'));
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function flashSessionExpired() {
  sessionStorage.setItem('app_toast', SESSION_EXPIRED_MESSAGE);
}

export function expireSession() {
  clearSession();
  flashSessionExpired();
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.replace(LOGIN_PATH);
  }
}
