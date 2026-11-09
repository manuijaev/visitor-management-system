const INSTALLED_KEY = "gp_app_installed";
const INSTALL_SNOOZE_KEY = "gp_install_snooze_until";
const CONTINUE_SNOOZE_KEY = "gp_continue_in_app_dismissed";
const INSTALL_SNOOZE_DAYS = 7;

let deferredPrompt = null;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

function readLocal(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: window-controls-overlay)").matches ||
    window.navigator.standalone === true
  );
}

const BROWSERS = [
  [
    "inapp",
    /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Snapchat|Twitter|LinkedInApp|GSA\//i,
  ],
  ["chrome", /CriOS/i],
  ["firefox", /FxiOS|Firefox/i],
  ["edge", /EdgiOS|EdgA|Edg\//i],
  ["samsung", /SamsungBrowser/i],
  ["opera", /OPiOS|OPR\//i],
  ["chrome", /Chrome|Chromium/i],
  ["safari", /Safari/i],
];

const IOS_ANY_BROWSER_INSTALL = 16.04;

function detectBrowser(ua) {
  return BROWSERS.find(([, pattern]) => pattern.test(ua))?.[0] || "other";
}

function iosVersionOf(ua) {
  const match = ua.match(/OS (\d+)[_.](\d+)/);
  return match ? Number(match[1]) + Number(match[2]) / 100 : null;
}

function detectOs(ua) {
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
    return "ios";
  return /Android/i.test(ua) ? "android" : "desktop";
}

function canInstallOnIos(browser, iosVersion) {
  if (browser === "safari") return true;
  return browser !== "inapp" && iosVersion >= IOS_ANY_BROWSER_INSTALL;
}

function canInstallOnMacSafari(os, browser, ua) {
  if (os !== "desktop" || browser !== "safari" || !/Macintosh/.test(ua))
    return false;
  return Number(ua.match(/Version\/(\d+)/)?.[1] || 0) >= 17;
}

export function detectPlatform() {
  const ua = navigator.userAgent || "";
  const os = detectOs(ua);
  const isIOS = os === "ios";
  const browser = detectBrowser(ua);
  const iosVersion = isIOS ? iosVersionOf(ua) : null;

  return {
    os,
    device: isIOS && !/iPhone|iPod/.test(ua) ? "iPad" : "iPhone",
    browser,
    iosVersion,
    iosCanInstallHere: isIOS && canInstallOnIos(browser, iosVersion),
    macSafariCanInstall: canInstallOnMacSafari(os, browser, ua),
  };
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function promptInstall() {
  if (!deferredPrompt) return "unavailable";
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();
  promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  if (outcome === "accepted") markInstalled();
  else snoozeInstall();
  return outcome;
}

function markInstalled() {
  writeLocal(INSTALLED_KEY, "1");
  notify();
}

export function isMarkedInstalled() {
  return readLocal(INSTALLED_KEY) === "1";
}

export function snoozeInstall(days = INSTALL_SNOOZE_DAYS) {
  writeLocal(
    INSTALL_SNOOZE_KEY,
    String(Date.now() + days * 24 * 60 * 60 * 1000),
  );
  notify();
}

export function isInstallSnoozed() {
  return Number(readLocal(INSTALL_SNOOZE_KEY) || 0) > Date.now();
}

export function dismissContinueInApp() {
  try {
    sessionStorage.setItem(CONTINUE_SNOOZE_KEY, "1");
  } catch {}
  notify();
}

export function isContinueInAppDismissed() {
  try {
    return sessionStorage.getItem(CONTINUE_SNOOZE_KEY) === "1";
  } catch {
    return false;
  }
}

export function initPwa() {
  if (typeof window === "undefined") return;

  if (isStandalone()) writeLocal(INSTALLED_KEY, "1");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    writeLocal(INSTALLED_KEY, null);
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    markInstalled();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
