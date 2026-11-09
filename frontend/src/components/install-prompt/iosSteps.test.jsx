import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { iosSteps } from "./iosSteps";

const textOf = (step) => render(<p>{step.text}</p>).container.textContent;

describe("iosSteps", () => {
  it("sends in-app browsers to Safari with a copy link", () => {
    const guide = iosSteps({ browser: "inapp", iosCanInstallHere: false });
    expect(guide.intro).toMatch(/inside another app/);
    expect(guide.showCopyLink).toBe(true);
    expect(guide.steps.map((step) => step.id)).toEqual([
      "open-in-safari",
      "share-from-safari",
    ]);
  });

  it("explains older iOS versions need Safari", () => {
    const guide = iosSteps({ browser: "chrome", iosCanInstallHere: false });
    expect(guide.intro).toMatch(/iOS version only allows/);
  });

  it("tailors the share step to the browser", () => {
    const chrome = iosSteps({ browser: "chrome", iosCanInstallHere: true });
    expect(chrome.showCopyLink).toBe(false);
    expect(chrome.steps).toHaveLength(4);
    expect(textOf(chrome.steps[0])).toMatch(/Chrome's address bar/);
    const other = iosSteps({ browser: "opera", iosCanInstallHere: true });
    expect(textOf(other.steps[0])).toBe(
      "Open your browser's menu and tap Share.",
    );
  });

  it("mentions Open as Web App from iOS 26", () => {
    const modern = iosSteps({
      browser: "safari",
      iosVersion: 26,
      iosCanInstallHere: true,
    });
    const older = iosSteps({
      browser: "safari",
      iosVersion: 17,
      iosCanInstallHere: true,
    });
    expect(textOf(modern.steps[2])).toMatch(/Open as Web App/);
    expect(textOf(older.steps[2])).toBe("Tap Add in the top-right corner.");
  });
});
