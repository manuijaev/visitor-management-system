import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GateBoard from "./GateBoard";

vi.mock("../../services/api", () => ({ default: { post: vi.fn() } }));


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
