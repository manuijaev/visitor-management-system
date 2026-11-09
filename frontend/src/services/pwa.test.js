import { afterEach, describe, expect, it, vi } from "vitest";
import { detectPlatform } from "./pwa";

const UA = {
  iphoneSafari16_4:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
  iphoneChrome16_4:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
  iphoneChrome15:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/109.0 Mobile/15E148 Safari/604.1",
  iphoneInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 307.0.0.34.111",
  ipadOs:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  androidSamsung:
    "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
  androidFirefox:
    "Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  windowsOpera:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/105.0.0.0",
  macSafari17:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  macSafari16:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
  unknown: "SomeBot/1.0",
};

function detectWith(
  userAgent,
  { platform = "Win32", maxTouchPoints = 0 } = {},
) {
  vi.stubGlobal("navigator", { userAgent, platform, maxTouchPoints });
  return detectPlatform();
}

afterEach(() => vi.unstubAllGlobals());

describe("detectPlatform", () => {
  it("lets Safari and modern iOS browsers install, but not older iOS or in-app browsers", () => {
    expect(detectWith(UA.iphoneSafari16_4)).toEqual({
      os: "ios",
      device: "iPhone",
      browser: "safari",
      iosVersion: 16.04,
      iosCanInstallHere: true,
      macSafariCanInstall: false,
    });
    expect(detectWith(UA.iphoneChrome16_4)).toMatchObject({
      browser: "chrome",
      iosCanInstallHere: true,
    });
    expect(detectWith(UA.iphoneChrome15)).toMatchObject({
      browser: "chrome",
      iosVersion: 15.07,
      iosCanInstallHere: false,
    });
    expect(detectWith(UA.iphoneInstagram)).toMatchObject({
      browser: "inapp",
      iosCanInstallHere: false,
    });
  });

  it("treats a touch Mac as an iPad", () => {
    expect(
      detectWith(UA.ipadOs, { platform: "MacIntel", maxTouchPoints: 5 }),
    ).toMatchObject({
      os: "ios",
      device: "iPad",
      browser: "safari",
      iosCanInstallHere: true,
      macSafariCanInstall: false,
    });
  });

  it("names Android and desktop browsers, checking specific ones before Chrome", () => {
    expect(detectWith(UA.androidChrome)).toMatchObject({
      os: "android",
      browser: "chrome",
      iosVersion: null,
      iosCanInstallHere: false,
    });
    expect(detectWith(UA.androidSamsung)).toMatchObject({
      os: "android",
      browser: "samsung",
    });
    expect(detectWith(UA.androidFirefox)).toMatchObject({
      os: "android",
      browser: "firefox",
    });
    expect(detectWith(UA.windowsEdge)).toMatchObject({
      os: "desktop",
      browser: "edge",
    });
    expect(detectWith(UA.windowsOpera)).toMatchObject({
      os: "desktop",
      browser: "opera",
    });
    expect(detectWith(UA.unknown)).toMatchObject({
      os: "desktop",
      browser: "other",
    });
  });

  it("lets Safari 17 and later on a Mac add to the Dock", () => {
    expect(detectWith(UA.macSafari17, { platform: "MacIntel" })).toMatchObject({
      os: "desktop",
      browser: "safari",
      macSafariCanInstall: true,
    });
    expect(detectWith(UA.macSafari16, { platform: "MacIntel" })).toMatchObject({
      macSafariCanInstall: false,
    });
  });
});
