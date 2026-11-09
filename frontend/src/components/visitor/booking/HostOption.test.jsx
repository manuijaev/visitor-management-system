import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import HostOption from "./HostOption";

const member = {
  id: 7,
  name: "Mary Wanjiru",
  departmentName: "",
  divisionName: "",
  available: false,
};

describe("HostOption", () => {
  it("shows a soft note for away hosts when planning ahead", () => {
    const onPick = vi.fn();
    render(
      <HostOption member={member} block={null} mode="later" onPick={onPick} />,
    );

    expect(screen.getByText("Away today, but you can book")).toBeTruthy();
    expect(screen.getByText("Staff")).toBeTruthy();
    expect(screen.getByText("MW").className).toContain("bg-[#e8f5ee]");
    fireEvent.click(screen.getByRole("radio"));
    expect(onPick).toHaveBeenCalledWith(member);
  });

  it("disables blocked hosts and shows why", () => {
    render(<HostOption member={member} block="In class" mode="now" />);

    expect(screen.getByText("In class")).toBeTruthy();
    expect(screen.getByRole("radio").disabled).toBe(true);
  });
});
