import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LogoLoader from "./LogoLoader";

describe("LogoLoader", () => {
  it("announces loading through an output element", () => {
    render(<LogoLoader label="Loading your dashboard" />);

    const status = screen.getByRole("status");
    expect(status.tagName).toBe("OUTPUT");
    expect(status.textContent).toBe("Loading your dashboard");
  });

  it("uses a default label", () => {
    render(<LogoLoader />);

    expect(screen.getByRole("status").textContent).toBe("Loading Gatepass");
  });
});
