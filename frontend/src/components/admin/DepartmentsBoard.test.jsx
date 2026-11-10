import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../services/api";
import DepartmentsBoard from "./DepartmentsBoard";

vi.mock("../../services/api", () => ({
  default: { patch: vi.fn(), delete: vi.fn(), post: vi.fn() },
}));

const props = () => ({
  departments: [{ id: 1, name: "Finance" }],
  divisions: [{ id: 10, department: 1, name: "Payroll" }],
  staff: [],
  onChange: vi.fn().mockResolvedValue(),
  notify: vi.fn(),
  confirm: vi.fn(),
  onAddStaff: vi.fn(),
});

describe("DepartmentsBoard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("focuses the rename field only after choosing to rename", () => {
    render(<DepartmentsBoard {...props()} />);
    expect(
      screen.queryByRole("textbox", { name: "Department name" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Rename Finance" }));

    const field = screen.getByRole("textbox", { name: "Department name" });
    expect(field.value).toBe("Finance");
    expect(document.activeElement).toBe(field);
  });

  it("renames a division within its department", async () => {
    api.patch.mockResolvedValue({});
    const p = props();
    render(<DepartmentsBoard {...p} />);

    fireEvent.click(screen.getByRole("button", { name: "Rename Payroll" }));
    const field = screen.getByRole("textbox", { name: "Division name" });
    fireEvent.change(field, { target: { value: "Salaries" } });
    fireEvent.submit(field.closest("form"));

    expect(api.patch).toHaveBeenCalledWith("/divisions/10/", {
      name: "Salaries",
      department: 1,
    });
    await waitFor(() =>
      expect(p.notify).toHaveBeenCalledWith("Division renamed"),
    );
    expect(screen.queryByRole("textbox", { name: "Division name" })).toBeNull();
  });

  it("asks before deleting a department and deletes on confirm", async () => {
    api.delete.mockResolvedValue({});
    const p = props();
    render(<DepartmentsBoard {...p} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Finance" }));
    const request = p.confirm.mock.calls[0][0];
    expect(request).toMatchObject({ title: "Delete Finance?", tone: "danger" });
    expect(api.delete).not.toHaveBeenCalled();

    await act(() => request.action());
    expect(api.delete).toHaveBeenCalledWith("/departments/1/");
    expect(p.notify).toHaveBeenCalledWith("Finance deleted");
  });

  it("deletes a division on confirm", async () => {
    api.delete.mockResolvedValue({});
    const p = props();
    render(<DepartmentsBoard {...p} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Payroll" }));
    await act(() => p.confirm.mock.calls[0][0].action());
    expect(api.delete).toHaveBeenCalledWith("/divisions/10/");
  });
});
