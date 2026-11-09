import NotificationsMenu from "../NotificationsMenu";
import { formatClockTime, formatTopbarDateTime } from "../admin/utils";
import AvailabilityToggle from "./AvailabilityToggle";
import ProfileMenu from "./ProfileMenu";
import { MOTION_ALL } from "./classes";
import { ICONS } from "./icons";
import { TAB_TITLES } from "./utils";

const toMenuItem = (notification) => ({
  id: notification.id,
  text: notification.message,
  time: notification.time || formatClockTime(notification.timestamp),
  unread: !notification.read,
});

export default function StaffTopbar({
  activeTab,
  currentTime,
  user,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  availability,
  notifications,
  onRefresh,
  onOpenSettings,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-surface px-6 max-[768px]:px-4 max-[768px]:py-3 max-[760px]:gap-2">
      <div className="flex items-center gap-4 max-[760px]:min-w-0 max-[760px]:flex-[1_1_auto]">
        <button
          className="hidden size-10 cursor-pointer rounded-lg [border:none] bg-transparent text-ink max-[992px]:flex max-[760px]:hidden"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          {ICONS.menu}
        </button>
        <span className="hidden max-[760px]:block max-[760px]:font-['Cormorant_Garamond',serif] max-[760px]:text-[22px] max-[760px]:font-bold max-[760px]:text-ink max-[760px]:overflow-hidden max-[760px]:text-ellipsis max-[760px]:whitespace-nowrap">
          {TAB_TITLES[activeTab] || "Dashboard"}
        </span>
        <div className="flex w-80 items-center gap-2.5 rounded-[10px] border border-line bg-surface-2 px-4 py-2 max-[768px]:hidden [&>svg]:size-[18px] [&>svg]:text-ink-faint">
          {ICONS.search}
          <input
            type="text"
            className="w-full [border:none] bg-transparent p-0 text-[14px] text-ink outline-none [box-shadow:none] placeholder:text-ink-faint"
            placeholder="Search visitor requests..."
            aria-label="Search visitor requests"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 max-[768px]:gap-2 max-[760px]:flex-none">
        <div className="text-[13px] whitespace-nowrap text-ink-mid [font-variant-numeric:lining-nums_tabular-nums] max-[768px]:hidden">
          {formatTopbarDateTime(currentTime)}
        </div>
        <AvailabilityToggle
          isAvailable={availability.isAvailable}
          isSaving={availability.isSaving}
          onToggle={availability.toggleAvailability}
        />
        <NotificationsMenu
          items={notifications.notifications.map(toMenuItem)}
          onOpenItem={(item) => notifications.markRead(item.id)}
          onDismiss={notifications.dismiss}
          action={{ label: "Clear all", onClick: notifications.clearAll }}
        />
        <button
          className={`flex size-9 cursor-pointer items-center justify-center rounded-lg [border:none] bg-transparent text-ink-mid hover:bg-surface-2 hover:text-ink max-[400px]:hidden [&_svg]:size-5 max-[768px]:[&_svg]:size-[18px] ${MOTION_ALL}`}
          onClick={onRefresh}
          aria-label="Refresh"
        >
          {ICONS.refresh}
        </button>
        <ProfileMenu
          user={user}
          onOpenSettings={onOpenSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
