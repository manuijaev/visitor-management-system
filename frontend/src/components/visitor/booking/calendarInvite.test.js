import { describe, expect, it } from "vitest";
import { calendarInvite } from "./calendarInvite";

describe("calendarInvite", () => {
  it("builds an escaped 30 minute event", () => {
    const text = calendarInvite(
      {
        reference: "GP-00012",
        arrival: "2026-11-10T14:30:00+03:00",
        host: { name: "Wanjiru, Mary" },
      },
      new Date("2026-11-09T06:00:00Z"),
    );
    const lines = text.split("\r\n");
    expect(lines).toContain("DTSTAMP:20261109T060000Z");
    expect(lines).toContain("DTSTART:20261110T113000Z");
    expect(lines).toContain("DTEND:20261110T120000Z");
    expect(lines).toContain(String.raw`SUMMARY:Visit with Wanjiru\, Mary`);
  });
});
