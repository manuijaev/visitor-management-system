import { describe, expect, it } from "vitest";
import {
  blockReason,
  firstName,
  initials,
  listHosts,
  placement,
  toStaff,
} from "./hosts";

const mary = toStaff({
  id: 1,
  full_name: " Mary  Wanjiru ",
  department: 3,
  department_name: "Science",
  division: 4,
  division_name: "Upper",
  unavailable_dates: ["2026-11-10"],
  booked_times: ["2026-11-11T10:00:00+03:00"],
});
const away = toStaff({
  id: 2,
  full_name: "Ann Away",
  department: 5,
  division: 6,
  is_available: false,
  availability_reason: "In class",
});
const unready = toStaff({ id: 3, email: "x@school.ke" });

describe("hosts", () => {
  it("normalises staff records", () => {
    expect(mary.name).toBe("Mary  Wanjiru");
    expect(unready.name).toBe("x@school.ke");
    expect(firstName(mary.name)).toBe("Mary");
    expect(initials(mary.name)).toBe("MW");
    expect(placement(mary)).toBe("Science · Upper");
  });

  it("explains why a host cannot be booked", () => {
    expect(blockReason(unready, { mode: "now" })).toBe(
      "Not set up for visits yet",
    );
    expect(blockReason(away, { mode: "now" })).toBe("In class");
    expect(blockReason(away, { mode: "later", dayKey: "2026-11-10" })).toBe(
      null,
    );
    expect(blockReason(mary, { mode: "later", dayKey: "2026-11-10" })).toBe(
      "Unavailable on that day",
    );
    expect(
      blockReason(mary, {
        mode: "later",
        dayKey: "2026-11-11",
        slot: "2026-11-11T10:00:00+03:00",
      }),
    ).toBe("Already booked at that time");
  });

  it("filters and sorts bookable hosts first", () => {
    const blockFor = (member) => blockReason(member, { mode: "now" });
    const all = listHosts([unready, away, mary], {
      department: "all",
      query: "",
      blockFor,
    });
    expect(all.map(({ member }) => member.id)).toEqual([1, 2, 3]);
    expect(
      listHosts([unready, away, mary], {
        department: "3",
        query: " SCIENCE ",
        blockFor,
      }).map(({ member }) => member.id),
    ).toEqual([1]);
  });
});
