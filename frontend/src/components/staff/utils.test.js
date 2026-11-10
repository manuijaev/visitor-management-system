import { describe, expect, it } from "vitest";
import {
  confirmMessage,
  filterRequests,
  getInitials,
  requestCardTone,
  rescheduleTimeError,
  statusTone,
  studentLabel,
  summarizeRequests,
  toLocalInputValue,
} from "./utils";

const HOUR = 3600 * 1000;
const at = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();

describe("staff utils", () => {
  it("builds a student label from name and class", () => {
    expect(studentLabel({ student_name: " Amy ", student_class: " 4B " })).toBe(
      "Amy (4B)",
    );
    expect(studentLabel({ student_name: "Amy" })).toBe("Amy");
    expect(studentLabel(null)).toBe("");
  });

  it("formats local input values", () => {
    expect(toLocalInputValue(new Date(2026, 0, 5, 9, 7))).toBe(
      "2026-01-05T09:07",
    );
  });

  it("validates reschedule times", () => {
    expect(rescheduleTimeError("", null)).toBe("Pick a new date and time.");
    expect(rescheduleTimeError("nonsense", null)).toBe(
      "Pick a new date and time.",
    );
    expect(rescheduleTimeError(at(-HOUR), null)).toBe(
      "The new time must be in the future.",
    );
    const future = at(HOUR);
    expect(rescheduleTimeError(future, { appointment_date: future })).toBe(
      "Pick a time different from the original one.",
    );
    expect(
      rescheduleTimeError(at(2 * HOUR), { appointment_date: future }),
    ).toBe("");
  });

  it("builds initials", () => {
    expect(getInitials("")).toBe("??");
    expect(getInitials("jane mary doe")).toBe("JM");
  });

  it("picks tones by status", () => {
    expect(statusTone("Pending").color).toBe("var(--gold-dark)");
    expect(statusTone("Accepted").color).toBe("var(--green-dark)");
    expect(statusTone("Declined").color).toBe("var(--red-dark)");
    expect(requestCardTone("Pending", true).color).toBe("var(--red-dark)");
    expect(requestCardTone("Pending", false).color).toBe("var(--gold-dark)");
    expect(requestCardTone("Rescheduled", false).color).toBe(
      "var(--gold-dark)",
    );
  });

  it("filters requests by status, search and day", () => {
    const visits = [
      {
        id: 1,
        status: "Pending",
        visitor_name: "Ann",
        appointment_date: at(0),
      },
      {
        id: 2,
        status: "Accepted",
        visitor_name: "Ben",
        student_name: "Zed",
        appointment_date: at(48 * HOUR),
      },
    ];
    const ids = (options) =>
      filterRequests(visits, {
        requestFilter: "all",
        todayOnly: false,
        searchQuery: "",
        ...options,
      }).map((visit) => visit.id);

    expect(ids({})).toEqual([1, 2]);
    expect(ids({ requestFilter: "pending" })).toEqual([1]);
    expect(ids({ searchQuery: "zed" })).toEqual([2]);
    expect(ids({ todayOnly: true })).toEqual([1]);
  });

  it("summarizes counts, upcoming, overdue and today", () => {
    const now = Date.now();
    const summary = summarizeRequests(
      [
        {
          id: 1,
          status: "Pending",
          created_at: at(-2 * HOUR),
          appointment_date: at(0),
        },
        {
          id: 2,
          status: "Pending",
          created_at: at(-HOUR),
          appointment_date: at(0),
        },
        {
          id: 3,
          status: "Pending",
          created_at: at(-60000),
          appointment_date: at(0),
        },
        { id: 4, status: "Accepted", appointment_date: at(72 * HOUR) },
        { id: 5, status: "Rescheduled", appointment_date: at(48 * HOUR) },
        { id: 6, status: "Accepted", appointment_date: at(-72 * HOUR) },
      ],
      now,
    );

    expect(summary.pending).toBe(3);
    expect(summary.accepted).toBe(2);
    expect(summary.overdue.map((visit) => visit.id)).toEqual([1, 2]);
    expect(summary.upcoming.map((visit) => visit.id)).toEqual([5, 4]);
    expect(summary.todays.map((visit) => visit.id)).toEqual([1, 2, 3]);
  });

  it("describes the pending confirmation", () => {
    expect(confirmMessage(null)).toBe("");
    expect(
      confirmMessage({ visitorName: "Ann", status: "Declined", newTime: null }),
    ).toBe('Update Ann\'s visit request to "Declined"?');
    expect(
      confirmMessage({
        visitorName: "Ann",
        status: "Rescheduled",
        newTime: "2026-01-05T09:00",
      }),
    ).toMatch(/^Move Ann's visit to .+\? They will be notified by SMS\.$/);
  });
});
