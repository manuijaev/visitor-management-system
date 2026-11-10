import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppShell from "./AppShell";

const renderAt = (path, props = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell title="Book a visit" {...props}>
        <p>Screen content</p>
      </AppShell>
    </MemoryRouter>,
  );

describe("AppShell", () => {
  it("shows the screen with the three tabs", () => {
    renderAt("/");

    expect(screen.getByText("Screen content")).toBeTruthy();
    const tabs = screen
      .getAllByRole("link")
      .filter((link) => link.closest("nav"));
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Book",
      "My visits",
      "Help",
    ]);
  });

  it("marks the current tab, including My visits on the single-visit page", () => {
    renderAt("/visit");

    expect(
      screen
        .getByRole("link", { name: "My visits" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Book" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("hides the tabs on a reception desk", () => {
    renderAt("/", { hideTabs: true });

    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
  });

  it("shows a back button only when the screen asks for one", () => {
    renderAt("/visit", { back: { to: "/visits", label: "Back to my visits" } });

    expect(
      screen
        .getByRole("link", { name: "Back to my visits" })
        .getAttribute("href"),
    ).toBe("/visits");
  });

  it("has no back button by default", () => {
    renderAt("/visits");

    expect(screen.queryByRole("link", { name: /back/i })).toBeNull();
  });
});
