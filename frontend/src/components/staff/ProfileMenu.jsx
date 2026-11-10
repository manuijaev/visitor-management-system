import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { getInitials } from "./utils";

export default function ProfileMenu({ user, onOpenSettings, onLogout }) {
  const displayName = user?.full_name || "Staff member";
  const initials = getInitials(user?.full_name);

  return (
    <div className="relative">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className="flex size-9 flex-none cursor-pointer items-center justify-center rounded-[10px] [border:none] bg-gold p-0 text-[12px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label={`Account: ${displayName}`}
        >
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} className="w-[260px]">
          <div className="mb-1 flex items-center gap-3 border-b border-line px-2.5 pt-2.5 pb-3">
            <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-gold-strong text-[13px] font-semibold text-white">
              {initials}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <strong className="text-[14px] text-ink">{displayName}</strong>
              <small className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-ink-light">
                {user?.department_name || "No department"}
                {user?.division_name && ` / ${user.division_name}`}
              </small>
              {user?.email && (
                <small className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-ink-light">
                  {user.email}
                </small>
              )}
            </span>
          </div>
          <DropdownMenuItem look="profile" onSelect={onOpenSettings}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem look="profile" tone="danger" onSelect={onLogout}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
