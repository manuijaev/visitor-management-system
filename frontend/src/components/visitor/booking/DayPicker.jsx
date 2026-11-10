import { isAwayOn } from "./hosts";
import { SCROLL_ROW } from "./scrollRow";

const DAY =
  "flex w-[72px] flex-[0_0_auto] snap-start flex-col items-center gap-px rounded-[18px] border-[1.5px] px-0 pb-[9px] pt-2.5 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:opacity-45 motion-safe:[transition:background_0.15s_ease,border-color_0.15s_ease]";

export default function DayPicker({ days, dayKey, host, hostFirst, onPick }) {
  return (
    <div
      className={`${SCROLL_ROW} snap-x snap-mandatory scroll-px-(--gp-pad) min-[760px]:[mask-image:linear-gradient(to_right,#000_calc(100%-48px),transparent)]`}
    >
      {days.map((day) => {
        const away = isAwayOn(host, day.key);
        const on = dayKey === day.key;
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={on}
            disabled={away}
            title={away ? `${hostFirst} is away this day` : undefined}
            className={`${DAY} ${on ? "border-solid border-ink bg-ink" : "border-solid border-line bg-surface hover:border-line-strong"}`}
            onClick={() => onPick(day.key)}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${on ? "text-white" : "text-ink-light"}`}
            >
              {day.label}
            </span>
            <strong
              className={`font-['Cormorant_Garamond',serif] text-[25px] font-semibold leading-[1.05] ${on ? "text-white" : ""}`}
            >
              {day.date}
            </strong>
            <small
              className={`text-[11.5px] ${on ? "text-gold-mid" : "text-ink-faint"}`}
            >
              {day.month}
            </small>
          </button>
        );
      })}
    </div>
  );
}
