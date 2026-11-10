import {
  getDeferredPrompt,
  isContinueInAppDismissed,
  isInstallSnoozed,
  isMarkedInstalled,
  isStandalone,
} from "../../services/pwa";

const IOS_HINT =
  "Add it to your Home Screen for one-tap access, full screen, with visitor alerts.";

export function continueSteps(platform) {
  if (platform.os === "android") {
    return 'Tap ⋮ in Chrome and choose "Open in Gatepass", or tap the Gatepass icon on your home screen.';
  }
  return 'Click the "Open in app" icon at the right end of the address bar, or open Gatepass from your Start menu, Dock or app launcher.';
}

export function manualHint(platform) {
  if (platform.macSafariCanInstall) {
    return "In Safari, choose File › Add to Dock to install Gatepass.";
  }
  if (platform.os === "android" && platform.browser === "firefox") {
    return "Tap ⋮ in Firefox and choose Install to add Gatepass to your home screen.";
  }
  return null;
}

export function installHint(mode, platform) {
  if (mode === "manual") {
    return manualHint(platform);
  }
  if (mode === "ios") {
    return IOS_HINT;
  }
  return null;
}

export function installSnapshot() {
  return `${Boolean(getDeferredPrompt())}|${isMarkedInstalled()}|${isInstallSnoozed()}|${isContinueInAppDismissed()}`;
}

export function pickMode(platform) {
  if (isStandalone()) {
    return null;
  }
  if (getDeferredPrompt() && !isInstallSnoozed()) {
    return "install";
  }
  if (isMarkedInstalled()) {
    const hideContinue = isContinueInAppDismissed() || platform.os === "ios";
    return hideContinue ? null : "continue";
  }
  if (isInstallSnoozed()) {
    return null;
  }
  if (platform.os === "ios") {
    return "ios";
  }
  if (manualHint(platform)) {
    return "manual";
  }
  return null;
}
