import { describe, expect, it } from "vitest";
import {
  asList,
  buildNotifications,
  computeStats,
  filterPeople,
  filterVisits,
  newestFirst,
  plural,
  reassignCandidates,
  studentLabel,
  visitsToCsv,
} from "./helpers";

const NOW = Date.parse("2026-11-09T09:00:00Z");
const minutesAgo = (minutes) => new Date(NOW - minutes * 60000).toISOString();

describe("small helpers", () => {
  it("asList falls back to an empty array", () => {
    expect(asList(null)).toEqual([]);
    expect(asList([1])).toEqual([1]);
  });

  it("plural picks the right form", () => {
    expect(plural(1, "division")).toBe("division");
    expect(plural(2, "division")).toBe("divisions");
    expect(plural(0, "person", "people")).toBe("people");
  });

  it("studentLabel joins name and class", () => {
    expect(studentLabel({ student_name: " Ann ", student_class: "4B" })).toBe(
      "Ann (4B)",
    );
    expect(studentLabel({})).toBe("");
  });
});

describe("buildNotifications", () => {
  it("marks overdue pending requests as urgent and adds responses", () => {
    const items = buildNotifications(
      [
        {
          id: 1,
          visitor_name: "Ann",
          status: "Pending",
          created_at: minutesAgo(45),
        },
        {
          id: 2,
          visitor_name: "Bo",
          staff_name: "Kim",
          status: "Declined",
          created_at: minutesAgo(5),
          response_note: " Busy ",
        },
      ],
      NOW,
    );
    expect(items.map((item) => item.id)).toEqual([
      "request-2",
      "response-2-Declined",
      "request-1",
    ]);
    expect(items[2]).toMatchObject({
      urgent: true,
      tone: "red",
      title: "Ann is still waiting on Staff",
    });
    expect(items[1]).toMatchObject({
      icon: "x",
      tone: "red",
      message: "Busy",
      title: "Kim declined Bo's visit",
    });
  });

  it("skips visits without a valid date", () => {
    expect(buildNotifications([{ id: 1, status: "Pending" }], NOW)).toEqual([]);
  });
});

describe("computeStats", () => {
  it("counts pending, overdue, active and invited", () => {
    const stats = computeStats(
      [
        { status: "Pending", created_at: minutesAgo(40) },
        { status: "Pending", created_at: minutesAgo(5) },
        { status: "Accepted", created_at: minutesAgo(90) },
      ],
      [
        { is_active: true, invite_pending: false },
        { is_active: true, invite_pending: true },
        { is_active: false, invite_pending: true },
      ],
      NOW,
    );
    expect(stats).toEqual({
      total: 3,
      pending: 2,
      overdue: 1,
      active: 1,
      invited: 1,
    });
  });
});

describe("filters", () => {
  const staff = [
    { id: 1, full_name: "Ann Lee", email: "ann@x.io", department: 3 },
    {
      id: 2,
      full_name: "Bo Kim",
      email: "bo@x.io",
      department: 4,
      department_name: "Science",
    },
  ];

  it("filterPeople matches department and search", () => {
    expect(filterPeople(staff, { search: "", departmentId: "4" })).toEqual([
      staff[1],
    ]);
    expect(
      filterPeople(staff, { search: "SCIENCE", departmentId: "" }),
    ).toEqual([staff[1]]);
  });

  it("filterVisits applies status and search", () => {
    const visits = [
      {
        id: 1,
        visitor_name: "Ann",
        status: "Pending",
        appointment_date: minutesAgo(1),
      },
      {
        id: 2,
        visitor_name: "Bo",
        status: "Declined",
        appointment_date: minutesAgo(1),
        student_name: "Zed",
      },
    ];
    expect(filterVisits(visits, { search: "", status: "pending" })).toEqual([
      visits[0],
    ]);
    expect(filterVisits(visits, { search: "zed", status: "all" })).toEqual([
      visits[1],
    ]);
  });

  it("newestFirst sorts by id without mutating", () => {
    expect(newestFirst(staff, 1)).toEqual([staff[1]]);
    expect(staff[0].id).toBe(1);
  });

  it("reassignCandidates excludes inactive, unplaced and current staff", () => {
    const people = [
      { id: 1, is_active: true, department: 1, division: 1 },
      { id: 2, is_active: true, department: 1, division: 1 },
      { id: 3, is_active: false, department: 1, division: 1 },
      { id: 4, is_active: true, department: 1, division: null },
    ];
    expect(reassignCandidates(people, { staff_member: 1 })).toEqual([
      people[1],
    ]);
  });
});

describe("visitsToCsv", () => {
  it("quotes cells and escapes quotes", () => {
    const csv = visitsToCsv([
      { id: 7, visitor_name: 'Ann "A"', status: "Pending" },
    ]);
    expect(csv.split("\n")[1]).toBe('"7","Ann ""A""","","","","Pending",""');
  });
});
