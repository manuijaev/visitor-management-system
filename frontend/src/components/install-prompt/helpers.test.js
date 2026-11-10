import { beforeEach, describe, expect, it, vi } from "vitest";
import * as pwa from "../../services/pwa";
import { installHint, manualHint, pickMode } from "./helpers";

vi.mock("../../services/pwa", () => ({
  getDeferredPrompt: vi.fn(),
  isContinueInAppDismissed: vi.fn(),
  isInstallSnoozed: vi.fn(),
  isMarkedInstalled: vi.fn(),
  isStandalone: vi.fn(),
}));

const desktop = { os: "windows", browser: "chrome" };
const iphone = { os: "ios", browser: "safari" };

function setPwaState({
  standalone = false,
  deferred = null,
  snoozed = false,
  installed = false,
  continueDismissed = false,
} = {}) {
  pwa.isStandalone.mockReturnValue(standalone);
  pwa.getDeferredPrompt.mockReturnValue(deferred);
  pwa.isInstallSnoozed.mockReturnValue(snoozed);
  pwa.isMarkedInstalled.mockReturnValue(installed);
  pwa.isContinueInAppDismissed.mockReturnValue(continueDismissed);
}

describe("pickMode", () => {
  beforeEach(() => setPwaState());

  it("hides everything when running standalone", () => {
    setPwaState({ standalone: true, deferred: {} });
    expect(pickMode(desktop)).toBeNull();
  });

  it("offers install when a deferred prompt exists and is not snoozed", () => {
    setPwaState({ deferred: {} });
    expect(pickMode(desktop)).toBe("install");
  });

  it("offers continue for installed non-iOS devices until dismissed", () => {
    setPwaState({ installed: true });
    expect(pickMode(desktop)).toBe("continue");
    expect(pickMode(iphone)).toBeNull();
    setPwaState({ installed: true, continueDismissed: true });
    expect(pickMode(desktop)).toBeNull();
  });

  it("respects snoozing", () => {
    setPwaState({ deferred: {}, snoozed: true });
    expect(pickMode(iphone)).toBeNull();
  });

  it("falls back to the iOS guide, manual hint or nothing", () => {
    expect(pickMode(iphone)).toBe("ios");
    expect(pickMode({ os: "android", browser: "firefox" })).toBe("manual");
    expect(pickMode({ os: "macos", macSafariCanInstall: true })).toBe("manual");
    expect(pickMode(desktop)).toBeNull();
  });
});

describe("hints", () => {
  it("chooses the hint by mode", () => {
    expect(manualHint(desktop)).toBeNull();
    expect(installHint("install", desktop)).toBeNull();
    expect(installHint("ios", iphone)).toMatch(/Home Screen/);
    expect(installHint("manual", { macSafariCanInstall: true })).toMatch(
      /Add to Dock/,
    );
  });
});
