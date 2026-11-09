import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import api from "../../../services/api";
import GateBoard from "./GateBoard";

vi.mock("../../../services/api", () => ({ default: { post: vi.fn() } }));

const visit = (id, visitor_name, status) => ({
  id,
  visitor_name,
  status,
  staff_name: "Host",
  appointment_date: new Date().toISOString(),
  checked_in_at: null,
  checked_out_at: null,
});

describe("GateBoard", () => {
  it("lists only open visits as expected today", () => {
    render(
      <GateBoard
        appointments={[
          visit(1, "Alice Open", "Accepted"),
          visit(2, "Bob Pending", "Pending"),
          visit(3, "Cara Declined", "Declined"),
          visit(4, "Dan Cancelled", "Cancelled"),
          visit(5, "Eve Expired", "Expired"),
        ]}
        onChanged={vi.fn()}
        notify={vi.fn()}
      />,
    );

    expect(screen.getByText("Alice Open")).toBeTruthy();
    expect(screen.getByText("Bob Pending")).toBeTruthy();
    expect(screen.queryByText("Cara Declined")).toBeNull();
    expect(screen.queryByText("Dan Cancelled")).toBeNull();
    expect(screen.queryByText("Eve Expired")).toBeNull();
  });
});

describe("GateBoard actions", () => {
  it("checks a visitor in and reports it", async () => {
    api.post.mockResolvedValue({});
    const onChanged = vi.fn().mockResolvedValue();
    const notify = vi.fn();
    render(
      <GateBoard
        appointments={[visit(1, "Alice Open", "Accepted")]}
        onChanged={onChanged}
        notify={notify}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark arrived" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.post).toHaveBeenCalledWith("/appointments/1/check-in/");
    expect(notify).toHaveBeenCalledWith(
      "Alice Open has arrived. Host has been told.",
    );
  });
});
