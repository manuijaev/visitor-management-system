import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import api from "../../services/api";
import OfficeHoursBoard from "./OfficeHoursBoard";

vi.mock("../../services/api", () => ({ default: { get: vi.fn() } }));

describe("OfficeHoursBoard", () => {
  it("groups the open-day toggles in a labelled fieldset", async () => {
    api.get.mockResolvedValue({
      data: {
        opens_at: "08:00:00",
        closes_at: "17:00:00",
        open_days: [0, 1, 2, 3, 4],
        summary: "Mon–Fri",
      },
    });
    render(<OfficeHoursBoard notify={vi.fn()} />);
    const group = await screen.findByRole("group", { name: "Open days" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group.hasAttribute("role")).toBe(false);

    const saturday = screen.getByRole("button", { name: "Sat" });
    expect(saturday.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(saturday);
    expect(saturday.getAttribute("aria-pressed")).toBe("true");
  });
});
