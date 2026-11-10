import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import AdminSignupPage from "./AdminSignupPage";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminSignupPage />
    </MemoryRouter>,
  );

describe("AdminSignupPage", () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: [] });
  });

  it("shows the signup form when no admin exists", async () => {
    renderPage();
    expect(screen.getByText("Checking system status...")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Create Admin Account" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Full Name")).toBeTruthy();
  });

  it("closes registration when an admin already exists", async () => {
    api.get.mockResolvedValue({ data: [{ role: "Admin" }] });
    renderPage();
    expect(await screen.findByText("Admin Registration Closed")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Create Admin Account" }),
    ).toBeNull();
  });
});
