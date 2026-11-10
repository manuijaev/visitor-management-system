import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NotificationsMenu from "./NotificationsMenu";

const items = [
  { id: 1, text: "Jane Doe requested a visit", time: "2:00 pm", unread: true },
  { id: 2, text: "Hassan Abdi was accepted", time: "1:00 pm", unread: false },
];

describe("NotificationsMenu", () => {
  it("shows the unread count on the bell and opens the list", () => {
    render(<NotificationsMenu items={items} onOpenItem={() => {}} />);

    const bell = screen.getByRole("button", {
      name: "Notifications, 1 unread",
    });
    expect(bell.textContent).toContain("1");
    expect(screen.queryByText("Jane Doe requested a visit")).toBeNull();

    fireEvent.click(bell);
    expect(screen.getByText("Jane Doe requested a visit")).toBeTruthy();
    expect(screen.getByText("1 unread")).toBeTruthy();
  });

  it("opens an item and closes the panel", () => {
    const onOpenItem = vi.fn();
    render(<NotificationsMenu items={items} onOpenItem={onOpenItem} />);

    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    fireEvent.click(screen.getByText("Hassan Abdi was accepted"));

    expect(onOpenItem).toHaveBeenCalledWith(items[1]);
    expect(screen.queryByText("Hassan Abdi was accepted")).toBeNull();
  });

  it("dismisses one item without opening it, and runs the header action", () => {
    const onOpenItem = vi.fn();
    const onDismiss = vi.fn();
    const markAll = vi.fn();
    render(
      <NotificationsMenu
        items={items}
        onOpenItem={onOpenItem}
        onDismiss={onDismiss}
        action={{ label: "Mark all read", onClick: markAll }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Dismiss notification" })[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    expect(onDismiss).toHaveBeenCalledWith(1);
    expect(onOpenItem).not.toHaveBeenCalled();
    expect(markAll).toHaveBeenCalled();
  });

  it("closes on Escape and says when there is nothing new", () => {
    render(<NotificationsMenu items={[]} onOpenItem={() => {}} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Notifications, 0 unread" }),
    );
    expect(screen.getByText("You're all caught up.")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("You're all caught up.")).toBeNull();
  });

  it("opens as a native dialog named Notifications", () => {
    render(<NotificationsMenu items={items} onOpenItem={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));

    const panel = screen.getByRole("dialog", { name: "Notifications" });
    expect(panel.tagName).toBe("DIALOG");
    expect(panel.open).toBe(true);
  });

  it("makes each notification a real button, separate from its dismiss button", () => {
    const onOpenItem = vi.fn();
    const onDismiss = vi.fn();
    render(
      <NotificationsMenu
        items={items}
        onOpenItem={onOpenItem}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    const open = screen.getByRole("button", {
      name: /Jane Doe requested a visit/,
    });
    expect(open.tagName).toBe("BUTTON");
    expect(open.querySelector("button")).toBeNull();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Dismiss notification" })[0],
    );
    expect(onDismiss).toHaveBeenCalledWith(1);
    expect(onOpenItem).not.toHaveBeenCalled();

    fireEvent.click(open);
    expect(onOpenItem).toHaveBeenCalledWith(items[0]);
  });
});
