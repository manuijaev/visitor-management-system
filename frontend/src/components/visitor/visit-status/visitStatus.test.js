import { describe, expect, it } from "vitest";
import {
  errorMessage,
  formatWhen,
  hostNameOf,
  statusCopyFor,
} from "./visitStatus";

describe("visitStatus", () => {
  it("falls back to pending copy and a generic host", () => {
    expect(statusCopyFor("Unknown").title).toBe("Waiting for a reply");
    expect(statusCopyFor("Declined").tone).toBe("stop");
    expect(hostNameOf({})).toBe("Your host");
  });

  it("formats the visit time in Nairobi", () => {
    expect(formatWhen("2026-11-10T06:30:00Z")).toBe(
      "Tuesday 10 November at 9:30 am",
    );
  });

  it("maps errors to messages", () => {
    expect(errorMessage({ response: { status: 429 } })).toMatch(/Too many/);
    expect(errorMessage(new Error("x"))).toMatch(/couldn't reach/);
    expect(errorMessage({ response: { data: { detail: "No match" } } })).toBe(
      "No match",
    );
  });
});
