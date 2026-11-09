import { describe, expect, it } from "vitest";
import {
  eatDateKey,
  formatApiError,
  formatClockTime,
  formatTopbarDateTime,
  getInitials,
  orderVisitsForReview,
} from "./utils";

describe("eatDateKey", () => {
  it("uses the school day in Nairobi, not UTC", () => {
    expect(eatDateKey("2026-11-09T22:30:00Z")).toBe("2026-11-10");
    expect(eatDateKey("2026-11-09T20:59:00Z")).toBe("2026-11-09");
  });

  it("returns an empty string for an invalid date", () => {
    expect(eatDateKey("not a date")).toBe("");
  });
});

describe("formatApiError", () => {
  it("prefers the detail message", () => {
    expect(
      formatApiError({ response: { data: { detail: "Not allowed." } } }),
    ).toBe("Not allowed.");
  });

  it("joins field errors", () => {
    const err = {
      response: {
        data: {
          appointment_date: ["Pick a new time."],
          response_note: ["Add a note."],
        },
      },
    };
    expect(formatApiError(err)).toBe("Pick a new time. Add a note.");
  });

  it("falls back when there is no usable message", () => {
    expect(formatApiError({}, "Offline")).toBe("Offline");
    expect(
      formatApiError({ response: { data: "<html>500</html>" } }, "Offline"),
    ).toBe("Offline");
  });
});

describe("getInitials", () => {
  it("uses up to two initials", () => {
    expect(getInitials("Mary Wanjiru Kamau")).toBe("MW");
    expect(getInitials("")).toBe("?");
  });
});

describe("orderVisitsForReview", () => {
  const now = new Date("2026-11-10T09:00:00Z").getTime();
  const visit = (id, status, when) => ({ id, status, appointment_date: when });

  it("puts pending first, then upcoming soonest first, then past newest first", () => {
    const visits = [
      visit("old", "Accepted", "2026-11-01T09:00:00Z"),
      visit("later", "Accepted", "2026-11-20T09:00:00Z"),
      visit("pending-late", "Pending", "2026-11-15T09:00:00Z"),
      visit("recent", "Declined", "2026-11-08T09:00:00Z"),
      visit("soon", "Rescheduled", "2026-11-11T09:00:00Z"),
      visit("pending-overdue", "Pending", "2026-11-09T09:00:00Z"),
    ];

    expect(orderVisitsForReview(visits, now).map((v) => v.id)).toEqual([
      "pending-overdue",
      "pending-late",
      "soon",
      "later",
      "recent",
      "old",
    ]);
  });

  it("does not change the list it was given", () => {
    const visits = [
      visit("a", "Accepted", "2026-11-20T09:00:00Z"),
      visit("b", "Pending", "2026-11-21T09:00:00Z"),
    ];
    orderVisitsForReview(visits, now);
    expect(visits[0].id).toBe("a");
  });
});

describe("formatClockTime", () => {
  it("uses the 12-hour clock in Nairobi time", () => {
    expect(formatClockTime("2026-11-10T11:00:00Z")).toBe("2:00 pm");
    expect(formatClockTime("2026-11-10T05:30:00Z")).toBe("8:30 am");
  });

  it("returns an empty string for a missing or invalid time", () => {
    expect(formatClockTime(null)).toBe("");
    expect(formatClockTime("not a time")).toBe("");
  });
});

describe("formatTopbarDateTime", () => {
  it("shows the Nairobi date and 12-hour time", () => {
    expect(formatTopbarDateTime("2026-11-08T21:30:00Z")).toBe(
      "Monday, 9 November 2026 - 12:30 am EAT",
    );
  });
});
