import ViewToggle from "../ViewToggle";
import { VISIT_FILTERS } from "../admin/utils";
import { MOTION_ALL } from "./classes";
import { ICONS } from "./icons";

const countFor = (filter, appointments) =>
  filter.statuses
    ? appointments.filter((visit) => filter.statuses.has(visit.status)).length
    : appointments.length;

const TAB =
  "relative inline-flex w-auto flex-none cursor-pointer items-center gap-1.5 overflow-hidden rounded-xl border border-transparent px-[18px] py-2.5 text-[13px] font-semibold whitespace-nowrap hover:border-ink hover:[transform:translateY(-2px)] after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.45),transparent_65%)] after:opacity-0 after:content-[''] hover:after:opacity-100 max-[768px]:flex-col max-[768px]:justify-center max-[768px]:gap-0.5 max-[768px]:px-0.5 max-[768px]:py-[7px] max-[768px]:text-[12.5px] motion-safe:transition-[transform,box-shadow,background] motion-safe:duration-300 motion-safe:after:transition-opacity motion-safe:after:duration-[350ms]";

const tabClass = (isActive) =>
  `${TAB} ${
    isActive
      ? "bg-transparent bg-[linear-gradient(135deg,rgba(201,146,42,0.22),rgba(201,146,42,0.1))] text-gold-dark [box-shadow:0_6px_16px_rgba(201,146,42,0.18)]"
      : "bg-[rgba(26,23,20,0.04)] text-ink-mid hover:bg-[rgba(26,23,20,0.08)] hover:[box-shadow:0_12px_22px_rgba(10,34,26,0.15)]"
  }`;

const countClass = (isActive) =>
  `min-w-5 rounded-[999px] px-1.5 py-px text-center text-[11px] font-semibold max-[768px]:py-0 max-[768px]:text-[10.5px] ${
    isActive ? "bg-[rgba(201,146,42,0.25)]" : "bg-[rgba(26,23,20,0.07)]"
  }`;

export default function RequestFilterBar({
  appointments,
  searchQuery,
  onSearchChange,
  requestFilter,
  onFilterChange,
  todayOnly,
  onTodayOnlyChange,
  viewMode,
  onViewModeChange,
  onExport,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-[14px] border border-line bg-surface px-4 py-2 max-[768px]:flex-col max-[768px]:items-stretch">
      <div className="hidden max-[768px]:flex max-[768px]:h-[42px] max-[768px]:w-full max-[768px]:items-center max-[768px]:gap-2 max-[768px]:rounded-xl max-[768px]:border max-[768px]:border-line max-[768px]:bg-surface-2 max-[768px]:px-3 max-[768px]:text-ink-light max-[768px]:[&>svg]:size-4 max-[768px]:[&>svg]:flex-none">
        {ICONS.search}
        <input
          type="search"
          className="max-[768px]:min-w-0 max-[768px]:flex-1 max-[768px]:[border:none] max-[768px]:bg-transparent max-[768px]:text-[15px] max-[768px]:text-ink max-[768px]:outline-none"
          placeholder="Search visitor or student"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search visitor requests"
        />
      </div>
      <div
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] max-[768px]:grid max-[768px]:w-full max-[768px]:grid-cols-[repeat(4,minmax(0,1fr))] max-[768px]:overflow-visible [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Request status"
      >
        {VISIT_FILTERS.map((filter) => {
          const isActive = requestFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={tabClass(isActive)}
              onClick={() => onFilterChange(filter.id)}
            >
              {filter.label}
              <span className={countClass(isActive)}>
                {countFor(filter, appointments)}
              </span>
            </button>
          );
        })}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium whitespace-nowrap text-ink-mid">
        <input
          type="checkbox"
          className="size-4 accent-gold"
          checked={todayOnly}
          onChange={(e) => onTodayOnlyChange(e.target.checked)}
        />
        <span>Today only</span>
      </label>
      <div className="flex items-center gap-3 max-[768px]:justify-between">
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
        <button
          className={`flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-transparent px-4 py-2 text-[13px] font-medium text-ink-mid hover:border-gold hover:bg-surface-2 hover:text-gold [&_svg]:size-4 ${MOTION_ALL}`}
          onClick={onExport}
        >
          {ICONS.download} Export
        </button>
      </div>
    </div>
  );
}
