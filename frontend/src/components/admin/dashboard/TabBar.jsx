import Icon from "../Icon";
import { TAB_ITEMS } from "./constants";

const TAB =
  "max-[760px]:m-0 max-[760px]:flex max-[760px]:flex-col max-[760px]:items-center max-[760px]:justify-center max-[760px]:gap-1 max-[760px]:font-['Outfit',sans-serif] max-[760px]:text-[11.5px] max-[760px]:font-semibold";

const TAB_ICON =
  "max-[760px]:relative max-[760px]:grid max-[760px]:size-6 max-[760px]:place-items-center";

function Tab({ active, onClick, icon, label, badge, ...props }) {
  return (
    <button
      type="button"
      className={`${TAB} ${active ? "max-[760px]:text-ink" : "max-[760px]:text-ink-faint"}`}
      onClick={onClick}
      {...props}
    >
      <span
        className={`${TAB_ICON} ${active ? "max-[760px]:text-gold-dark" : ""}`}
      >
        <Icon name={icon} size={22} />
        {badge > 0 && (
          <span className="max-[760px]:absolute max-[760px]:-top-[5px] max-[760px]:-right-[11px] max-[760px]:h-[17px] max-[760px]:min-w-[17px] max-[760px]:rounded-[999px] max-[760px]:bg-red max-[760px]:px-1 max-[760px]:text-center max-[760px]:text-[10px] max-[760px]:font-bold max-[760px]:leading-[17px] max-[760px]:text-white">
            {badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function TabBar({
  view,
  pending,
  navOpen,
  onNavigate,
  onOpenNav,
}) {
  return (
    <nav
      className="hidden max-[760px]:fixed max-[760px]:inset-x-0 max-[760px]:bottom-0 max-[760px]:z-[800] max-[760px]:grid max-[760px]:h-[calc(62px+env(safe-area-inset-bottom))] max-[760px]:grid-cols-4 max-[760px]:border-t max-[760px]:border-line max-[760px]:bg-[rgba(255,255,255,0.95)] max-[760px]:pb-[env(safe-area-inset-bottom)] max-[760px]:backdrop-blur-[14px] max-[760px]:backdrop-saturate-[1.4]"
      aria-label="Main"
    >
      {TAB_ITEMS.map((item) => (
        <Tab
          key={item.id}
          active={view === item.id}
          aria-current={view === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
          icon={item.icon}
          label={item.label}
          badge={item.id === "visitors" ? pending : 0}
        />
      ))}
      <Tab active={navOpen} onClick={onOpenNav} icon="more" label="More" />
    </nav>
  );
}
