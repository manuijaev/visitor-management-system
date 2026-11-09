import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminDashboardPage from "./AdminDashboardPage";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

const RESPONSES = {
  "/departments/": [{ id: 1, name: "Science" }],
  "/divisions/": [{ id: 2, name: "Labs", department: 1 }],
  "/staff/?include_inactive=1": [
    {
      id: 10,
      full_name: "Ada Admin",
      email: "ada@x.io",
      role: "Admin",
      is_active: true,
    },
    {
      id: 11,
      full_name: "Sam Staff",
      email: "sam@x.io",
      role: "Staff",
      is_active: true,
      invite_pending: true,
    },
  ],
  "/appointments/my/": [
    {
      id: 5,
      visitor_name: "Vic Visitor",
      staff_name: "Sam Staff",
      status: "Pending",
      appointment_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  );

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { id: 10, full_name: "Ada Admin" },
      logout: vi.fn(),
    });
    api.get.mockImplementation((url) =>
      Promise.resolve({ data: RESPONSES[url] }),
    );
  });

  it("loads data into the overview and navigates to visitors", async () => {
    renderPage();
    expect(
      await screen.findByText("1 visit request is awaiting a response"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByRole("heading", { name: "Visitors" })).toBeTruthy();
    const pendingTab = screen.getByRole("tab", { name: /Pending/ });
    expect(pendingTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Reassign Vic Visitor" }),
    ).toBeTruthy();
  });

  it("shows team counts and opens settings from the profile menu", async () => {
    renderPage();
    await screen.findByText("Vic Visitor");
    const nav = document.querySelector("aside nav");
    fireEvent.click(within(nav).getByRole("button", { name: /Team/ }));
    expect(screen.getByText("2 people across 1 department")).toBeTruthy();

    fireEvent.keyDown(
      screen.getByRole("button", { name: "Account: Ada Admin" }),
      {
        key: "Enter",
      },
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
    expect(screen.getByText("1 active · 1 invited")).toBeTruthy();
  });
});
