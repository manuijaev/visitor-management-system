import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DepartmentCard from "./DepartmentCard";

const renderCard = (overrides = {}) => {
  const props = {
    department: { id: 1, name: "Finance" },
    divisions: [{ id: 10, department: 1, name: "Payroll" }],
    headcount: 1,
    divisionHeadcount: new Map([[10, 3]]),
    editing: null,
    setEditing: vi.fn(),
    onRenameDepartment: vi.fn(),
    onRenameDivision: vi.fn(),
    onDeleteDepartment: vi.fn(),
    onDeleteDivision: vi.fn(),
    onCreateDivision: vi.fn().mockResolvedValue(true),
    onAddStaff: vi.fn(),
    ...overrides,
  };
  render(<DepartmentCard {...props} />);
  return props;
};

describe("DepartmentCard", () => {
  it("shows singular and plural counts", () => {
    renderCard();
    expect(screen.getByText(/1 person · 1 division/)).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("creates a trimmed division and clears the field on success", async () => {
    const props = renderCard();
    const field = screen.getByRole("textbox", {
      name: "Add a division to Finance",
    });
    fireEvent.change(field, { target: { value: " Audit " } });
    fireEvent.submit(field.closest("form"));
    expect(props.onCreateDivision).toHaveBeenCalledWith("Audit", 1);
    await waitFor(() => expect(field.value).toBe(""));
  });

  it("ignores blank division names", () => {
    const props = renderCard();
    const field = screen.getByRole("textbox", {
      name: "Add a division to Finance",
    });
    fireEvent.submit(field.closest("form"));
    expect(props.onCreateDivision).not.toHaveBeenCalled();
  });
});
