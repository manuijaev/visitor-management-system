import { useRef } from "react";
import useDismissOnOutside from "../../../hooks/useDismissOnOutside";
import Icon from "../Icon";
import { SERIF } from "../styles";
import { NAV_ITEMS } from "./constants";

const COUNT =
  "ml-auto min-w-[22px] rounded-[999px] px-[7px] py-0.5 text-center text-[11px] font-bold lining-nums tabular-nums";

const NAV_ITEM =
  "flex w-full items-center gap-3 rounded-[12px] px-3.5 py-[11px] text-left text-[14px] font-medium motion-safe:transition-[background,color] motion-safe:duration-150";

function NavCount({ id, counts }) {
  if (id === "visitors") {
    return counts.pending > 0 ? (
      <span className={`${COUNT} bg-gold-strong text-white`}>
        {counts.pending}
      </span>
    ) : null;
  }
  if (id === "team" || id === "departments") {
    return (
      <span
        className={`${COUNT} bg-[rgba(255,255,255,0.08)] text-chrome-muted`}
      >
        {counts[id]}
      </span>
    );
  }
  return null;
}

export default function Sidebar({
  view,
  counts,
  isOpen,
  onClose,
  onNavigate,
  onAddStaff,
}) {
  const sidebarRef = useRef(null);
  useDismissOnOutside(sidebarRef, isOpen, onClose);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col gap-5 overflow-y-auto bg-chrome px-4 pt-6 pb-[18px] text-chrome-text max-[1023px]:fixed max-[1023px]:inset-y-0 max-[1023px]:left-0 max-[1023px]:z-[900] max-[1023px]:w-[280px] max-[1023px]:rounded-r-[24px] max-[1023px]:motion-safe:transition-transform max-[1023px]:motion-safe:duration-[250ms] ${isOpen ? "max-[1023px]:[box-shadow:var(--shadow-float)] max-[1023px]:[transform:translateX(0)]" : "max-[1023px]:[transform:translateX(-100%)]"}`}
      ref={sidebarRef}
    >
      <div className="flex items-center gap-3 px-2 pb-1">
        <span className="relative size-9 shrink-0 rounded-[11px] bg-[linear-gradient(135deg,var(--color-gold),var(--color-gold-mid))] [box-shadow:0_6px_16px_rgba(201,146,42,0.3)] after:absolute after:inset-[11px] after:rounded-[4px] after:border-2 after:border-chrome after:content-['']" />
        <div>
          <div
            className={`${SERIF} text-[23px] font-bold leading-none text-chrome-text`}
          >
            Gatepass
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-mid">
            Admin console
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`${NAV_ITEM} ${view === item.id ? "bg-chrome-active text-gold-mid" : "bg-chrome text-[#d4cdc3] hover:bg-chrome-hover hover:text-white"}`}
            onClick={() => onNavigate(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
            <NavCount id={item.id} counts={counts} />
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2.5 rounded-[12px] bg-gold-strong px-3.5 py-3 text-[14px] font-semibold text-white hover:bg-gold-dark motion-safe:transition-[background] motion-safe:duration-150"
        onClick={onAddStaff}
      >
        <Icon name="userPlus" size={16} />
        Add staff member
      </button>
    </aside>
  );
}
