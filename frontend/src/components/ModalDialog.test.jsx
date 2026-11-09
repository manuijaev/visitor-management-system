import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalDialog from "./ModalDialog";

describe("ModalDialog", () => {
  it("renders an open native dialog", () => {
    render(
      <ModalDialog aria-label="Example" onClose={() => {}}>
        <p>Body</p>
      </ModalDialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Example" });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("closes on Escape (cancel) when dismissible", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog aria-label="Example" onClose={onClose}>
        Body
      </ModalDialog>,
    );
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape while not dismissible", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog aria-label="Example" onClose={onClose} dismissible={false}>
        Body
      </ModalDialog>,
    );
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), cancel);
    expect(onClose).not.toHaveBeenCalled();
    expect(cancel.defaultPrevented).toBe(true);
  });
});
