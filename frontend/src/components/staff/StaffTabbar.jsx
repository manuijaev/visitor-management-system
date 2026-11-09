import { ICONS } from "./icons";

const TABS = [
  { id: "dashboard", label: "Home", icon: ICONS.dashboard },
  { id: "appointments", label: "Requests", icon: ICONS.calendar },
  { id: "schedule", label: "Schedule", icon: ICONS.clock },
];

const TAB =
  "max-[760px]:m-0 max-[760px]:flex max-[760px]:w-auto max-[760px]:cursor-pointer max-[760px]:flex-col max-[760px]:items-center max-[760px]:justify-center max-[760px]:gap-1 max-[760px]:rounded-none max-[760px]:[border:0] max-[760px]:bg-transparent max-[760px]:p-0 max-[760px]:font-['Outfit',sans-serif] max-[760px]:text-[11.5px] max-[760px]:font-semibold max-[760px]:[box-shadow:none] max-[760px]:[transform:none] motion-safe:transition-none";

const tabClass = (isActive) =>
  `${TAB} ${isActive ? "max-[760px]:text-ink" : "max-[760px]:text-ink-faint"}`;

const iconClass = (isActive) =>
  `max-[760px]:relative max-[760px]:grid max-[760px]:size-6 max-[760px]:place-items-center max-[760px]:[&>svg]:size-[22px] ${
    isActive ? "max-[760px]:text-gold-dark" : ""
  }`;

export default function StaffTabbar({
  activeTab,
  pendingCount,
  isSidebarOpen,
  onNavigate,
  onOpenRequests,
  onOpenSidebar,
}) {
  return (
    <nav
      className="hidden max-[760px]:fixed max-[760px]:inset-x-0 max-[760px]:bottom-0 max-[760px]:z-[800] max-[760px]:grid max-[760px]:h-[calc(62px+env(safe-area-inset-bottom))] max-[760px]:grid-cols-[repeat(4,minmax(0,1fr))] max-[760px]:border-t max-[760px]:border-line max-[760px]:bg-[rgba(255,255,255,0.95)] max-[760px]:pb-[env(safe-area-inset-bottom)] max-[760px]:backdrop-blur-[14px] max-[760px]:backdrop-saturate-[1.4]"
      aria-label="Main"
      data-gp-tabbar=""
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isRequests = tab.id === "appointments";
        return (
          <button
            key={tab.id}
            type="button"
            className={tabClass(isActive)}
            aria-current={isActive ? "page" : undefined}
            onClick={isRequests ? onOpenRequests : () => onNavigate(tab.id)}
          >
            <span className={iconClass(isActive)}>
              {tab.icon}
              {isRequests && pendingCount > 0 && (
                <span className="max-[760px]:absolute max-[760px]:-top-[5px] max-[760px]:-right-[11px] max-[760px]:h-[17px] max-[760px]:min-w-[17px] max-[760px]:rounded-[999px] max-[760px]:bg-red max-[760px]:px-1 max-[760px]:text-center max-[760px]:text-[10px] max-[760px]:leading-[17px] max-[760px]:font-bold max-[760px]:text-white">
                  {pendingCount}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={tabClass(isSidebarOpen)}
        onClick={onOpenSidebar}
      >
        <span className={iconClass(isSidebarOpen)}>{ICONS.menu}</span>
        <span>More</span>
      </button>
    </nav>
  );
}
