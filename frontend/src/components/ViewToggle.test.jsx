import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ViewToggle from "./ViewToggle";

describe("ViewToggle", () => {
  it("marks the current layout and switches on click", () => {
    const onChange = vi.fn();
    render(<ViewToggle value="list" onChange={onChange} />);

    expect(
      screen
        .getByRole("radio", { name: "List view" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("radio", { name: "Card view" })
        .getAttribute("aria-checked"),
    ).toBe("false");

    fireEvent.click(screen.getByRole("radio", { name: "Card view" }));
    expect(onChange).toHaveBeenCalledWith("grid");
  });

  it("ignores a click on the layout that is already selected", () => {
    const onChange = vi.fn();
    render(<ViewToggle value="list" onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: "List view" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("is announced as a group named Layout", () => {
    render(<ViewToggle value="grid" onChange={() => {}} />);

    const group = screen.getByRole("group", { name: "Layout" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group.querySelectorAll("button")).toHaveLength(2);
  });
});
