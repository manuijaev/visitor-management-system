import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RequestCard from "./RequestCard";

const visit = (overrides = {}) => ({
  id: 3,
  visitor_name: "Ann Lee",
  visitor_email: "ann@example.com",
  status: "Pending",
  appointment_date: new Date(Date.now() + 3600 * 1000).toISOString(),
  ...overrides,
});

const responseState = (overrides = {}) => ({
  actions: {},
  notes: {},
  rescheduleTo: {},
  openAreas: {},
  openResponseArea: vi.fn(),
  closeResponseArea: vi.fn(),
  requestStatusUpdate: vi.fn(),
  setNote: vi.fn(),
  setRescheduleTime: vi.fn(),
  ...overrides,
});

describe("RequestCard", () => {
  it("opens the response area for the chosen action", () => {
    const response = responseState();
    render(
      <RequestCard visit={visit()} response={response} onOpenVisit={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Reschedule"));

    expect(response.openResponseArea).toHaveBeenCalledWith(3, "Rescheduled");
  });

  it("sends the chosen response and blocks an invalid reschedule", () => {
    const response = responseState({
      openAreas: { 3: true },
      actions: { 3: "Rescheduled" },
    });
    render(
      <RequestCard visit={visit()} response={response} onOpenVisit={vi.fn()} />,
    );

    expect(screen.getByText("Send & Rescheduled").disabled).toBe(true);
  });

  it("sends an accept response", () => {
    const response = responseState({ openAreas: { 3: true } });
    render(
      <RequestCard visit={visit()} response={response} onOpenVisit={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Send & Accept"));

    expect(response.requestStatusUpdate).toHaveBeenCalledWith(
      3,
      "Ann Lee",
      "Accepted",
    );
  });

  it("shows details for answered requests", () => {
    const onOpenVisit = vi.fn();
    const answered = visit({ status: "Accepted" });
    render(
      <RequestCard
        visit={answered}
        response={responseState()}
        onOpenVisit={onOpenVisit}
      />,
    );

    fireEvent.click(screen.getByText("View Details"));

    expect(onOpenVisit).toHaveBeenCalledWith(answered);
    expect(screen.queryByText("Accept")).toBeNull();
  });
});
