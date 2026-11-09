import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PersonRow from "./PersonRow";

const member = {
  id: 4,
  full_name: "Ann Lee",
  email: "ann@x.io",
  role: "Staff",
  is_active: true,
  invite_pending: true,
};

describe("PersonRow", () => {
  it("opens the row menu and runs the chosen action", () => {
    const actions = {
      sendInvite: vi.fn(),
      toggleActive: vi.fn(),
      confirmRemoveMember: vi.fn(),
    };
    render(
      <PersonRow
        member={member}
        isSelf={false}
        onEdit={vi.fn()}
        actions={actions}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "More actions" }), {
      key: "Enter",
    });
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Resend invite", "Deactivate", "Remove"]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Resend invite" }));
    expect(actions.sendInvite).toHaveBeenCalledWith(member);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("hides the menu for the signed-in admin and in compact mode", () => {
    const { rerender } = render(
      <PersonRow member={member} isSelf onEdit={vi.fn()} actions={{}} />,
    );
    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
    rerender(<PersonRow member={member} isSelf={false} layout="compact" />);
    expect(screen.queryByRole("button", { name: "Edit Ann Lee" })).toBeNull();
  });
});
