import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReassignModal from "./ReassignModal";

const staff = [
  {
    id: 1,
    full_name: "Current Host",
    is_active: true,
    department: 1,
    division: 1,
    department_name: "Sci",
  },
  {
    id: 2,
    full_name: "New Host",
    is_active: true,
    department: 1,
    division: 1,
    department_name: "Sci",
  },
  {
    id: 3,
    full_name: "Gone Host",
    is_active: false,
    department: 1,
    division: 1,
  },
];

describe("ReassignModal", () => {
  it("offers eligible staff and reassigns to the chosen one", () => {
    const onReassign = vi.fn().mockResolvedValue();
    const visit = {
      id: 9,
      visitor_name: "Ann",
      staff_member: 1,
      staff_name: "Current Host",
    };
    render(
      <ReassignModal
        visit={visit}
        staff={staff}
        onClose={vi.fn()}
        onReassign={onReassign}
      />,
    );

    const submit = screen.getByRole("button", { name: "Reassign" });
    expect(submit.disabled).toBe(true);
    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Choose staff", "New Host · Sci"]);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    fireEvent.click(submit);
    expect(onReassign).toHaveBeenCalledWith(visit, staff[1]);
  });
});
