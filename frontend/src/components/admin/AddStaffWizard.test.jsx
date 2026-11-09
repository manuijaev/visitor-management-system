import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddStaffWizard, {
  buildPayload,
  initialPlacement,
  validateDetails,
  validatePlacement,
} from "./AddStaffWizard";

vi.mock("../../services/api", () => ({ default: { post: vi.fn() } }));

const departments = [{ id: 1, name: "Finance" }];
const divisions = [{ id: 10, department: 1, name: "Payroll" }];
const details = {
  full_name: " Jane Wanjiru ",
  email: " Jane@School.ac.ke ",
  phone: "",
  role: "Staff",
};

describe("AddStaffWizard helpers", () => {
  it("starts with a new department when none exist", () => {
    expect(initialPlacement([], null).deptMode).toBe("new");
    expect(initialPlacement(departments, 1)).toMatchObject({
      deptMode: "existing",
      departmentId: "1",
    });
  });

  it("validates the details step", () => {
    const taken = new Set(["jane@school.ac.ke"]);
    expect(validateDetails({ ...details, full_name: " " }, new Set())).toMatch(
      /full name/,
    );
    expect(validateDetails({ ...details, email: "nope" }, new Set())).toMatch(
      /valid email/,
    );
    expect(validateDetails(details, taken)).toMatch(/already on the team/);
    expect(validateDetails(details, new Set())).toBe("");
  });

  it("validates the placement step", () => {
    const base = initialPlacement(departments, null);
    expect(validatePlacement(base, false)).toMatch(/Choose a department/);
    expect(validatePlacement({ ...base, deptMode: "new" }, true)).toMatch(
      /Name the new department/,
    );
    expect(validatePlacement({ ...base, departmentId: "1" }, true)).toMatch(
      /Name the division/,
    );
    expect(validatePlacement({ ...base, departmentId: "1" }, false)).toMatch(
      /Choose a division/,
    );
    expect(
      validatePlacement(
        { ...base, departmentId: "1", divisionId: "10" },
        false,
      ),
    ).toBe("");
  });

  it("builds payloads for existing and new placements", () => {
    const existing = { ...initialPlacement(departments, 1), divisionId: "10" };
    expect(buildPayload(details, existing, false)).toEqual({
      full_name: "Jane Wanjiru",
      email: "jane@school.ac.ke",
      phone: "",
      role: "Staff",
      department: 1,
      division: 10,
    });
    const fresh = {
      ...existing,
      deptMode: "new",
      newDepartment: " Ops ",
      newDivision: " Gate ",
    };
    expect(buildPayload(details, fresh, true)).toMatchObject({
      department_name: "Ops",
      division_name: "Gate",
    });
  });
});

describe("AddStaffWizard", () => {
  const renderWizard = () =>
    render(
      <AddStaffWizard
        open
        onClose={() => {}}
        departments={departments}
        divisions={divisions}
        staff={[]}
      />,
    );

  it("renders nothing when closed", () => {
    const { container } = render(
      <AddStaffWizard
        open={false}
        onClose={() => {}}
        departments={[]}
        divisions={[]}
        staff={[]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("walks through details, placement and review", () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(
      screen.getByText("Enter the staff member's full name."),
    ).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("e.g. Jane Wanjiru"), {
      target: { value: "Jane Wanjiru" },
    });
    fireEvent.change(screen.getByPlaceholderText("jane@school.ac.ke"), {
      target: { value: "jane@school.ac.ke" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    fireEvent.click(screen.getByRole("button", { name: "Finance" }));
    fireEvent.click(screen.getByRole("button", { name: "Payroll" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(
      screen.getByText("Check the details, then send the invite."),
    ).toBeTruthy();
    expect(screen.getAllByText("jane@school.ac.ke").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Create & send invite" }),
    ).toBeTruthy();
  });

  it("moves focus to the new department name when chosen", () => {
    renderWizard();
    fireEvent.change(screen.getByPlaceholderText("e.g. Jane Wanjiru"), {
      target: { value: "Jane Wanjiru" },
    });
    fireEvent.change(screen.getByPlaceholderText("jane@school.ac.ke"), {
      target: { value: "jane@school.ac.ke" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /New department/ }));
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "New department name" }),
    );
  });
});
