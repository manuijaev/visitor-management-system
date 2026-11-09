import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOURS,
  buildDays,
  buildSlots,
  isOfficeOpen,
  toHours,
} from "./schedule";

const monday9am = new Date("2026-11-09T09:00:00+03:00");

describe("schedule", () => {
  it("falls back to default hours for invalid data", () => {
    expect(toHours(null)).toBe(DEFAULT_HOURS);
    expect(
      toHours({ opens_at: "17:00", closes_at: "08:00", open_days: [0] }),
    ).toBe(DEFAULT_HOURS);
    expect(
      toHours({ opens_at: "07:30", closes_at: "12:00", open_days: [5] }),
    ).toEqual({
      opens: 450,
      closes: 720,
      days: [5],
      summary: DEFAULT_HOURS.summary,
    });
  });

  it("knows when the office is open", () => {
    expect(isOfficeOpen(monday9am, DEFAULT_HOURS)).toBe(true);
    expect(
      isOfficeOpen(new Date("2026-11-08T09:00:00+03:00"), DEFAULT_HOURS),
    ).toBe(false);
  });

  it("builds half-hour slots with a lead time", () => {
    const slots = buildSlots("2026-11-09", monday9am, DEFAULT_HOURS);
    expect(slots).toHaveLength(18);
    expect(slots[0]).toEqual({
      value: "2026-11-09T08:00:00+03:00",
      label: "8:00 AM",
      afternoon: false,
      available: false,
    });
    expect(slots.find((slot) => slot.available).label).toBe("10:00 AM");
  });

  it("lists bookable weekdays with relative labels", () => {
    const days = buildDays(monday9am, DEFAULT_HOURS);
    expect(days).toHaveLength(10);
    expect(days.slice(0, 3).map((day) => day.label)).toEqual([
      "Today",
      "Tmrw",
      "Wed",
    ]);
    expect(days[5]).toMatchObject({ key: "2026-11-16", label: "Mon" });
  });
});
