import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/DropdownMenu";
import { getInitials } from "../utils";

const DETAIL =
  "overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-ink-light";

export default function ProfileMenu({ user, onSettings, onLogout }) {
  const fullName = user?.full_name || "Administrator";
  const initials = getInitials(user?.full_name || "Admin");

  return (
    <div className="relative">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className="grid size-[38px] flex-none cursor-pointer place-items-center rounded-[10px] border-none bg-gold-strong p-0 text-[13px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          aria-label={`Account: ${fullName}`}
        >
          {initials}
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} className="z-[120] w-[260px]">
          <div className="mb-1 flex items-center gap-3 border-b border-line px-2.5 pt-2.5 pb-3">
            <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-gold-strong text-[13px] font-semibold text-white">
              {initials}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <strong className="text-[14px] text-ink">{fullName}</strong>
              <small className={DETAIL}>Administrator</small>
              {user?.email && <small className={DETAIL}>{user.email}</small>}
            </span>
          </div>
          <DropdownMenuItem
            look="profile"
            className="[font-weight:inherit]"
            onSelect={onSettings}
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            look="profile"
            className="[font-weight:inherit]"
            tone="danger"
            onSelect={onLogout}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
