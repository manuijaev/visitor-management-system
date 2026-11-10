import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import StaffLoginPage from "../StaffLoginPage";

vi.mock("../../services/api", () => ({
  default: { get: vi.fn() },
}));
vi.mock("../../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../context/NotificationContext", () => ({
  useNotification: vi.fn(),
}));

const login = vi.fn();
const acceptInvite = vi.fn();

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/staff" element={<StaffLoginPage />} />
      </Routes>
    </MemoryRouter>,
  );

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("StaffLoginPage", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ login, acceptInvite });
    useNotification.mockReturnValue({
      registerDevice: vi.fn().mockResolvedValue(),
    });
  });

  it("welcomes the user after a successful login", async () => {
    login.mockResolvedValue({ full_name: "Jane Doe", role: "staff" });
    renderAt("/staff");
    fill("Email", "jane@example.com");
    fill("Password", "secret123");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Welcome back, Jane Doe!")).toBeTruthy();
    expect(login).toHaveBeenCalledWith("jane@example.com", "secret123");
  });

  it("shows the server error when login fails", async () => {
    login.mockRejectedValue({ response: { data: { detail: "Bad login" } } });
    renderAt("/staff");
    fill("Email", "jane@example.com");
    fill("Password", "wrong");
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Bad login")).toBeTruthy();
  });

  it("lets an invited user set a password", async () => {
    api.get.mockResolvedValue({
      data: { full_name: "Sam Otieno", email: "sam@example.com" },
    });
    acceptInvite.mockResolvedValue({ full_name: "Sam Otieno", role: "staff" });
    renderAt("/staff?uid=u1&token=t1");

    expect(screen.getByText("Checking your invite link...")).toBeTruthy();
    expect(await screen.findByText("Set your password")).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith("/staff/invite/", {
      params: { uid: "u1", token: "t1" },
    });

    fill("New password", "longpassword");
    fill("Confirm password", "longpassword");
    fireEvent.click(screen.getByRole("button", { name: "Confirm & sign in" }));

    expect(await screen.findByText("You're all set, Sam!")).toBeTruthy();
    expect(acceptInvite).toHaveBeenCalledWith("u1", "t1", "longpassword");
  });

  it("rejects mismatched passwords without calling the API", async () => {
    api.get.mockResolvedValue({
      data: { full_name: "Sam Otieno", email: "sam@example.com" },
    });
    renderAt("/staff?uid=u1&token=t1");
    await screen.findByText("Set your password");

    fill("New password", "longpassword");
    fill("Confirm password", "different1");
    fireEvent.click(screen.getByRole("button", { name: "Confirm & sign in" }));

    expect(screen.getByText("The passwords do not match.")).toBeTruthy();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it("explains an expired invite and returns to sign in", async () => {
    api.get.mockRejectedValue({ response: { data: { detail: "Expired." } } });
    renderAt("/staff?uid=u1&token=t1");

    expect(await screen.findByText("Link expired")).toBeTruthy();
    expect(screen.getByText("Expired.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to sign in" }));
    expect(await screen.findByText("Staff Access")).toBeTruthy();
  });
});
