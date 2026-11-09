import { describe, expect, it } from "vitest";
import { GATE_TABS, gateActionMessage, groupGateVisits } from "./gateVisits";

const TODAY = "2026-11-09";

describe("groupGateVisits", () => {
  const visits = [
    {
      id: 1,
      visitor_name: "Ann",
      status: "Accepted",
      appointment_date: "2026-11-09T08:00:00Z",
    },
    {
      id: 2,
      visitor_name: "Bo",
      status: "Pending",
      appointment_date: "2026-11-09T06:00:00Z",
    },
    {
      id: 3,
      visitor_name: "Cy",
      status: "Cancelled",
      appointment_date: "2026-11-09T06:00:00Z",
    },
    {
      id: 4,
      visitor_name: "Di",
      status: "Accepted",
      appointment_date: "2026-11-09T06:00:00Z",
      checked_in_at: "2026-11-09T06:10:00Z",
    },
    {
      id: 5,
      visitor_name: "Ed",
      status: "Accepted",
      appointment_date: "2026-11-09T05:00:00Z",
      checked_in_at: "2026-11-09T05:00:00Z",
      checked_out_at: "2026-11-09T05:30:00Z",
    },
    {
      id: 6,
      visitor_name: "Fa",
      status: "Accepted",
      appointment_date: "2026-11-09T05:00:00Z",
      checked_in_at: "2026-11-09T05:00:00Z",
      checked_out_at: "2026-11-09T06:30:00Z",
    },
  ];

  it("splits visits into expected, on site and left", () => {
    const groups = groupGateVisits(visits, "", TODAY);
    expect(groups.expected.map((visit) => visit.id)).toEqual([2, 1]);
    expect(groups.onsite.map((visit) => visit.id)).toEqual([4]);
    expect(groups.left.map((visit) => visit.id)).toEqual([6, 5]);
  });

  it("filters by a trimmed, case-insensitive query", () => {
    const groups = groupGateVisits(visits, "  ANN ", TODAY);
    expect(groups.expected.map((visit) => visit.id)).toEqual([1]);
    expect(groups.onsite).toEqual([]);
  });
});

describe("gate tabs", () => {
  it("only offers actions before a visitor leaves", () => {
    expect(GATE_TABS.map((tab) => tab.action)).toEqual([
      "check-in",
      "check-out",
      undefined,
    ]);
  });

  it("describes check-in and check-out", () => {
    expect(gateActionMessage({ visitor_name: "Ann" }, "check-in")).toBe(
      "Ann has arrived. Their host has been told.",
    );
    expect(gateActionMessage({ visitor_name: "Ann" }, "check-out")).toBe(
      "Ann has left.",
    );
  });
});
