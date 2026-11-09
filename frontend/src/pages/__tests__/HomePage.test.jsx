import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import { loadSavedVisits } from "../../services/visitorDevice";
import HomePage from "../HomePage";

vi.mock("../../services/api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

const staff = [
  {
    id: 1,
    full_name: "Mary Wanjiru",
    department: 3,
    department_name: "Science",
    division: 4,
    division_name: "Upper",
    is_available: true,
  },
  {
    id: 2,
    full_name: "John Otieno",
    department: 3,
    department_name: "Science",
    division: null,
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe("HomePage", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === "/staff/") {
        return Promise.resolve({ data: staff });
      }
      if (url === "/departments/") {
        return Promise.resolve({ data: [{ id: 3, name: "Science" }] });
      }
      return Promise.reject(new Error("offline"));
    });
    api.post.mockResolvedValue({ data: { data: { id: 12 } } });
  });

  it("walks a walk-in visitor through to the visit pass", async () => {
    renderPage();

    expect(screen.getByText("When are you visiting?")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /I'm here now/ }));

    expect(screen.getByText("Who are you here to see?")).toBeTruthy();
    const unready = await screen.findByRole("radio", { name: /John Otieno/ });
    expect(unready.disabled).toBe(true);
    expect(screen.getByText("Not set up for visits yet")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("Who are you here to see?")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: /Mary Wanjiru/ }));
    expect(await screen.findByText("Your details")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("Please enter a full name.")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("e.g. Sarah Kiprono"), {
      target: { value: "Sarah Kiprono" },
    });
    fireEvent.change(screen.getByPlaceholderText("0712 345 678"), {
      target: { value: "0712 345 678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Fees / bursar" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByText("Review and send")).toBeTruthy();
    expect(screen.getByText("Right now · at reception")).toBeTruthy();
    expect(screen.getByText("Purpose: Fees / bursar")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Alert Mary now/ }));

    expect(await screen.findByText("Take a seat, Sarah.")).toBeTruthy();
    expect(screen.getByText("GP-00012")).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith(
      "/appointments/create/",
      expect.objectContaining({
        visitor_name: "Sarah Kiprono",
        visitor_phone: "0712 345 678",
        staff_member: 1,
        department: 3,
        division: 4,
        is_scheduled: false,
        message: "Purpose: Fees / bursar",
      }),
    );
    expect(loadSavedVisits()[0].reference).toBe("GP-00012");
  });

  it("shows the server's error on the review step", async () => {
    api.post.mockRejectedValue({
      response: { data: { visitor_phone: ["Invalid number."] } },
    });
    renderPage();

    fireEvent.click(screen.getByRole("radio", { name: /I'm here now/ }));
    fireEvent.click(await screen.findByRole("radio", { name: /Mary Wanjiru/ }));
    await screen.findByText("Your details");
    fireEvent.change(screen.getByPlaceholderText("e.g. Sarah Kiprono"), {
      target: { value: "Sarah Kiprono" },
    });
    fireEvent.change(screen.getByPlaceholderText("0712 345 678"), {
      target: { value: "0712345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /Alert Mary now/ }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Visitor phone: Invalid number.",
    );
  });

  it("opens on the reception desk when reception mode is on", () => {
    localStorage.setItem("gp_reception_mode", "1");
    renderPage();

    expect(screen.getByText("Reception desk")).toBeTruthy();
    expect(screen.getByText("When is the visit?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Turn off" }));

    expect(screen.getByText("Book a visit")).toBeTruthy();
    expect(screen.getByText("Reception mode off")).toBeTruthy();
    expect(localStorage.getItem("gp_reception_mode")).toBe("0");
  });
});
