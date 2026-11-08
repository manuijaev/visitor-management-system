const INSTALLED_KEY = 'gp_app_installed';
const INSTALL_SNOOZE_KEY = 'gp_install_snooze_until';
const CONTINUE_SNOOZE_KEY = 'gp_continue_in_app_dismissed';
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
  } catch {
    /* storage can be unavailable in private modes */
  }
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true
  );
}

export function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const iosMatch = ua.match(/OS (\d+)[_.](\d+)/);
  const iosVersion = isIOS && iosMatch ? Number(iosMatch[1]) + Number(iosMatch[2]) / 100 : null;

  let browser = 'other';
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp|Snapchat|Twitter|LinkedInApp|GSA\//i.test(ua)) browser = 'inapp';
  else if (/CriOS/i.test(ua)) browser = 'chrome';
  else if (/FxiOS|Firefox/i.test(ua)) browser = 'firefox';
  else if (/EdgiOS|EdgA|Edg\//i.test(ua)) browser = 'edge';
  else if (/SamsungBrowser/i.test(ua)) browser = 'samsung';
  else if (/OPiOS|OPR\//i.test(ua)) browser = 'opera';
  else if (/Chrome|Chromium/i.test(ua)) browser = 'chrome';
  else if (/Safari/i.test(ua)) browser = 'safari';

  const os = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  const isMacSafari = os === 'desktop' && browser === 'safari' && /Macintosh/.test(ua);
  const safariVersion = Number((ua.match(/Version\/(\d+)/) || [])[1] || 0);

  return {
    os,
    device: isIOS && !/iPhone|iPod/.test(ua) ? 'iPad' : 'iPhone',
    browser,
    iosVersion,
    // iOS 16.4 added "Add to Home Screen" to browsers other than Safari.
    iosCanInstallHere: isIOS && (browser === 'safari' || (browser !== 'inapp' && iosVersion >= 16.4)),
    macSafariCanInstall: isMacSafari && safariVersion >= 17,
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
  if (!deferredPrompt) return 'unavailable';
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  notify();
  promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  if (outcome === 'accepted') markInstalled();
  else snoozeInstall();
  return outcome;
}

export function markInstalled() {
  writeLocal(INSTALLED_KEY, '1');
  notify();
}

export function isMarkedInstalled() {
  return readLocal(INSTALLED_KEY) === '1';
}

export function snoozeInstall(days = INSTALL_SNOOZE_DAYS) {
  writeLocal(INSTALL_SNOOZE_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
  notify();
}

export function isInstallSnoozed() {
  return Number(readLocal(INSTALL_SNOOZE_KEY) || 0) > Date.now();
}

export function dismissContinueInApp() {
  try {
    sessionStorage.setItem(CONTINUE_SNOOZE_KEY, '1');
  } catch {
    /* ignore */
  }
  notify();
}

export function isContinueInAppDismissed() {
  try {
    return sessionStorage.getItem(CONTINUE_SNOOZE_KEY) === '1';
  } catch {
    return false;
  }
}

export function initPwa() {
  if (typeof window === 'undefined') return;

  if (isStandalone()) writeLocal(INSTALLED_KEY, '1');

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    // Chrome only offers installation when the app is not installed, so an old "installed" flag is stale.
    writeLocal(INSTALLED_KEY, null);
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    markInstalled();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
