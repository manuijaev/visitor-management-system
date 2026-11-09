import { useRef } from "react";
import useDismissOnOutside from "../../hooks/useDismissOnOutside";
import { ICONS } from "./icons";

const NAV_ITEM =
  "relative flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-l-2 border-transparent px-3.5 py-[11px] text-left text-[14px] font-medium [box-shadow:none] hover:[transform:none] [&_svg]:size-[18px] [&_svg]:shrink-0 motion-safe:transition-[background,color,border-color] motion-safe:duration-150";

const navClass = (isActive) =>
  `${NAV_ITEM} ${
    isActive
      ? "border-l-gold-mid bg-chrome-active text-gold-mid"
      : "bg-chrome text-[#d4cdc3] hover:border-transparent hover:bg-chrome-hover hover:text-white"
  }`;

const SECTION =
  "mt-2 mb-1 text-[10px] font-semibold tracking-[0.22em] text-chrome-muted uppercase";

const LABEL = "flex-1 text-left";

export default function StaffSidebar({
  isOpen,
  activeTab,
  pendingCount,
  onNavigate,
  onOpenRequests,
  onExport,
  onClose,
}) {
  const sidebarRef = useRef(null);
  useDismissOnOutside(sidebarRef, isOpen, onClose);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-[rgba(15,23,37,0.5)] backdrop-blur-[10px] motion-safe:transition-opacity motion-safe:duration-300"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[102] flex h-screen w-[min(320px,90vw)] max-w-[320px] flex-col gap-3 overflow-x-hidden overflow-y-auto border-r border-r-[rgba(255,255,255,0.08)] bg-chrome px-5 pt-[26px] pb-[30px] text-chrome-text [box-shadow:8px_0_40px_rgba(26,23,20,0.12)] motion-safe:transition-[transform,box-shadow] motion-safe:duration-400 ${
          isOpen
            ? "max-[992px]:[transform:translateX(0)]"
            : "max-[992px]:[transform:translateX(-100%)]"
        }`}
        ref={sidebarRef}
      >
        <div className="border-b border-b-[rgba(255,255,255,0.08)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[10px] bg-gold-strong text-white [&_svg]:size-5">
              {ICONS.calendar}
            </div>
            <div>
              <div className="font-['Cormorant_Garamond',serif] text-[22px] leading-[1.1] font-bold text-chrome-text">
                Gatepass
              </div>
              <div className="text-[10px] font-semibold tracking-[0.16em] text-gold-mid uppercase">
                Staff Portal
              </div>
            </div>
          </div>
        </div>

        <nav className="relative m-0 flex flex-1 flex-col gap-2.5 overflow-y-auto border-none bg-transparent p-0">
          <div className={SECTION}>MAIN</div>
          <button
            className={navClass(activeTab === "dashboard")}
            onClick={() => onNavigate("dashboard")}
          >
            {ICONS.dashboard}
            <span className={LABEL}>Home</span>
          </button>
          <button
            className={navClass(activeTab === "appointments")}
            onClick={onOpenRequests}
          >
            {ICONS.calendar}
            <span className={LABEL}>Requests</span>
            {pendingCount > 0 && (
              <span className="ml-auto inline-flex h-[18px] w-auto min-w-[22px] flex-none items-center justify-center rounded-lg bg-gold px-[7px] text-left text-[11px] leading-none font-semibold tracking-[0] text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            className={navClass(activeTab === "schedule")}
            onClick={() => onNavigate("schedule")}
          >
            {ICONS.clock}
            <span className={LABEL}>Schedule</span>
          </button>

          <div className={SECTION}>MORE</div>
          <button
            className={navClass(false)}
            onClick={() => {
              onExport();
              onClose();
            }}
          >
            {ICONS.download}
            <span className={LABEL}>Export requests</span>
          </button>
          <button
            className={navClass(activeTab === "settings")}
            onClick={() => onNavigate("settings")}
          >
            {ICONS.settings}
            <span className={LABEL}>Settings</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
