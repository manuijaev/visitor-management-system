import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import VisitStatusPage from "../VisitStatusPage";

vi.mock("../../services/api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

const visit = {
  reference: "GP-00012",
  status: "Accepted",
  staff_name: "Mary Wanjiru",
  visitor_name: "Sarah Kiprono",
  appointment_date: "2026-11-10T09:00:00+03:00",
  can_cancel: true,
};

const renderPage = (entry = "/visit") =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <VisitStatusPage />
    </MemoryRouter>,
  );

describe("VisitStatusPage", () => {
  beforeEach(() => {
    api.post.mockResolvedValue({ data: visit });
  });

  it("looks up a visit and cancels it", async () => {
    renderPage("/visit?ref=GP-00012");

    fireEvent.change(screen.getByPlaceholderText("0712 345 678"), {
      target: { value: " 0712345678 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check my visit" }));

    expect(await screen.findByText("Visit confirmed")).toBeTruthy();
    expect(screen.getByText("Mary Wanjiru is expecting you.")).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith("/visits/lookup/", {
      reference: "GP-00012",
      phone: "0712345678",
    });

    api.post.mockResolvedValue({
      data: { ...visit, status: "Cancelled", can_cancel: false },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel visit" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));

    expect(await screen.findByText("Visit cancelled")).toBeTruthy();
    expect(api.post).toHaveBeenLastCalledWith("/visits/cancel/", {
      reference: "GP-00012",
      phone: "0712345678",
    });
  });

  it("explains rate limiting", async () => {
    api.post.mockRejectedValue({ response: { status: 429 } });
    renderPage("/visit?ref=GP-1");

    fireEvent.change(screen.getByPlaceholderText("0712 345 678"), {
      target: { value: "0712345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check my visit" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Too many attempts. Please wait a while and try again.",
    );
  });
});
