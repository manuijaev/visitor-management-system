import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalDialog from "./ModalDialog";

describe("ModalDialog", () => {
  it("renders an open modal dialog named by its label", () => {
    render(
      <ModalDialog aria-label="Example" onClose={() => {}}>
        <p>Body</p>
      </ModalDialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Example" });
    expect(dialog.getAttribute("data-state")).toBe("open");
    expect(screen.getByText("Body")).toBeTruthy();
  });

  it("uses an existing heading when given aria-labelledby", () => {
    render(
      <ModalDialog aria-labelledby="modal-heading" onClose={() => {}}>
        <h2 id="modal-heading">Edit staff</h2>
      </ModalDialog>,
    );
    expect(screen.getByRole("dialog", { name: "Edit staff" })).toBeTruthy();
  });

  it("closes on Escape when dismissible", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog aria-label="Example" onClose={onClose}>
        Body
      </ModalDialog>,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape while not dismissible", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog aria-label="Example" onClose={onClose} dismissible={false}>
        Body
      </ModalDialog>,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("keeps the legacy class for dashboard modals", () => {
    render(
      <ModalDialog className="ad-modal" aria-label="Example" onClose={() => {}}>
        Body
      </ModalDialog>,
    );
    expect(screen.getByRole("dialog").classList.contains("ad-modal")).toBe(
      true,
    );
  });
});
