import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppointments } from "../../context/AppointmentContext";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { sendVisitorResponseEmail } from "../../services/emailjs";
import StaffDashboardPage from "../StaffDashboardPage";

vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../context/AppointmentContext", () => ({
  useAppointments: vi.fn(),
}));
vi.mock("../../context/NotificationContext", () => ({
  useNotification: vi.fn(),
}));
vi.mock("../../services/emailjs", () => ({
  sendVisitorResponseEmail: vi.fn(),
}));
vi.mock("../../services/api", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../components/DaysOffPanel", () => ({ default: () => null }));

const pendingVisit = {
  id: 1,
  visitor_name: "Ann Lee",
  visitor_email: "ann@example.com",
  status: "Pending",
  created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  appointment_date: new Date(Date.now() + 3600 * 1000).toISOString(),
};

let updateAppointment;

beforeEach(() => {
  updateAppointment = vi.fn().mockResolvedValue(undefined);
  useAuth.mockReturnValue({
    user: { full_name: "Sam Staff", is_available: true },
    logout: vi.fn(),
    updateUser: vi.fn(),
  });
  useAppointments.mockReturnValue({
    appointments: [pendingVisit],
    loadMyAppointments: vi.fn().mockResolvedValue(undefined),
    updateAppointment,
  });
  useNotification.mockReturnValue({ subscribeToForegroundMessages: null });
  sendVisitorResponseEmail.mockResolvedValue({ sent: true });
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <StaffDashboardPage />
    </MemoryRouter>,
  );

describe("StaffDashboardPage", () => {
  it("announces overdue requests on the home tab", () => {
    renderPage();

    expect(screen.getByText(/1 request needs a reply/)).toBeTruthy();
    expect(screen.getByText("1 waiting for your reply →")).toBeTruthy();
  });

  it("accepts a request through the confirmation dialog", async () => {
    renderPage();

    fireEvent.click(screen.getByText("1 waiting for your reply →"));
    fireEvent.click(screen.getByText("Accept"));
    fireEvent.click(screen.getByText("Send & Accepted"));
    expect(
      screen.getByText('Update Ann Lee\'s visit request to "Accepted"?'),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Yes, Update"));

    await waitFor(() =>
      expect(updateAppointment).toHaveBeenCalledWith(1, {
        status: "Accepted",
        response_note: "Ann Lee status set to Accepted.",
      }),
    );
    expect(
      await screen.findByText("Visitor notified — they've been paged"),
    ).toBeTruthy();
  });

  it("opens the overdue request in the preview", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Open now →" }));

    const preview = screen.getByRole("dialog", { name: "Appointment Details" });
    expect(preview.getAttribute("data-state")).toBe("open");
    expect(screen.queryByText(/1 request needs a reply/)).toBeNull();
  });
});
