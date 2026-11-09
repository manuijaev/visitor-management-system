import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import useDismissOnOutside from "./useDismissOnOutside";

function Panel({ open, onClose }) {
  const ref = useRef(null);
  useDismissOnOutside(ref, open, onClose);
  return (
    <>
      <p>Outside</p>
      <div ref={ref}>
        <p>Inside</p>
      </div>
    </>
  );
}

describe("useDismissOnOutside", () => {
  it("closes on an outside press or Escape, not on an inside press", () => {
    const onClose = vi.fn();
    render(<Panel open onClose={onClose} />);

    fireEvent.mouseDown(screen.getByText("Inside"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByText("Outside"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does nothing while closed", () => {
    const onClose = vi.fn();
    render(<Panel open={false} onClose={onClose} />);
    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
